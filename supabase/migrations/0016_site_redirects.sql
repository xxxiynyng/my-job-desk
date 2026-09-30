-- F-26(R-04·R-41, 2026-09-30): 사이트가 다른 호스트로 넘긴(리다이렉트) 사실을 기록한다.
-- 키는 (넘어가기 전 호스트, 넘어간 호스트). 넘어가는 호스트가 바뀌면 새 행이 되어 "처음 발견"으로 다시 알린다.
-- 확인 처리 기능은 두지 않는다(2026-09-30 결정): 알림은 처음 발견 때 1회, 영구 이동(301·308)이 3회 연속이면
-- 등록 주소를 바꿀 때까지 매 실행(3회 기준과 알림 여부는 수집기가 판단, 이 표는 연속 횟수만 센다).
create table jobs.site_redirects (
  id bigserial primary key,
  source_id text not null references jobs.sources(source_id),
  from_host text not null,
  to_host text not null,
  sample_from_url text not null,
  sample_to_url text not null,
  last_status int not null,                      -- 마지막 실행에서 본 응답 코드
  permanent boolean not null,                    -- 마지막 실행의 넘김이 모두 영구 이동(301·308)이었나
  consecutive_permanent int not null default 0,  -- 영구 이동으로 연속 관측된 실행 수(끊기면 다시 셈)
  target_robots_allowed boolean not null,        -- 넘어간 호스트의 robots.txt가 허용했나(막으면 그 사이트는 판정불가)
  request_count int not null,                    -- 마지막 실행에서 넘어간 요청 수
  seen_runs int not null default 1,
  first_seen_at timestamptz not null default now(),
  first_seen_run_id text references jobs.runs(run_id),
  last_seen_at timestamptz not null default now(),
  last_seen_run_id text references jobs.runs(run_id),
  unique (from_host, to_host)
);

-- 반환: {is_new, consecutive_permanent, first_seen_at}. 같은 실행에서 두 번 불러도 연속 횟수는 한 번만 센다.
create or replace function jobs.report_site_redirect(p jsonb)
returns jsonb
language plpgsql security definer set search_path = jobs, pg_catalog as $$
declare
  r jobs.site_redirects%rowtype;
  v_perm boolean := (p->>'permanent')::boolean;
  v_prev_run text;
  v_consec int;
begin
  select * into r from jobs.site_redirects
   where from_host = p->>'from_host' and to_host = p->>'to_host' for update;
  if not found then
    insert into jobs.site_redirects (source_id, from_host, to_host, sample_from_url, sample_to_url, last_status, permanent,
                                     consecutive_permanent, target_robots_allowed, request_count,
                                     first_seen_run_id, last_seen_run_id)
    values (p->>'source_id', p->>'from_host', p->>'to_host', p->>'from_url', p->>'to_url', (p->>'last_status')::int, v_perm,
            case when v_perm then 1 else 0 end, (p->>'target_robots_allowed')::boolean, (p->>'request_count')::int,
            p->>'run_id', p->>'run_id')
    returning * into r;
    return jsonb_build_object('is_new', true, 'consecutive_permanent', r.consecutive_permanent, 'first_seen_at', r.first_seen_at);
  end if;

  if r.last_seen_run_id is distinct from p->>'run_id' then
    -- 이 소스의 직전 실행(이번 실행 바로 앞)에도 영구 이동으로 봤으면 연속, 아니면 1부터
    select max(run_id) into v_prev_run from jobs.source_runs
     where source_id = p->>'source_id' and run_id < p->>'run_id';
    v_consec := case when not v_perm then 0
                     when r.permanent and r.last_seen_run_id = v_prev_run then r.consecutive_permanent + 1
                     else 1 end;
    update jobs.site_redirects
       set sample_from_url = p->>'from_url', sample_to_url = p->>'to_url', last_status = (p->>'last_status')::int,
           permanent = v_perm, consecutive_permanent = v_consec,
           target_robots_allowed = (p->>'target_robots_allowed')::boolean, request_count = (p->>'request_count')::int,
           seen_runs = r.seen_runs + 1, last_seen_at = now(), last_seen_run_id = p->>'run_id'
     where id = r.id
     returning * into r;
  end if;
  return jsonb_build_object('is_new', false, 'consecutive_permanent', r.consecutive_permanent, 'first_seen_at', r.first_seen_at);
end;
$$;

create or replace function public.collector_report_site_redirect(p jsonb)
returns jsonb
language sql security definer set search_path = jobs, pg_catalog as $$
  select jobs.report_site_redirect(p)
$$;

revoke all on function jobs.report_site_redirect(jsonb), public.collector_report_site_redirect(jsonb)
  from public, anon, authenticated;
grant execute on function public.collector_report_site_redirect(jsonb) to service_role;
