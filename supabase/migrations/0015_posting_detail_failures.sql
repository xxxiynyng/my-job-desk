-- F-05(R-41 상세 본문 수집 실패 안전장치, 2026-09-29): 상세 본문 수집 실패를 공고 단위로 기록한다.
-- 신규 공고는 실패 시점에 아직 jobs.postings에 없을 수 있어 posting_uid FK를 걸 수 없다.
-- posting_key(텍스트)만 쓰고, 공고당 "미해결 실패"는 1건만 유지한다(부분 유니크 인덱스).
create table jobs.posting_detail_failures (
  id bigserial primary key,
  posting_key text not null,
  run_id text references jobs.runs(run_id),
  kind text not null check (kind in ('new', 'changed')),
  reason text not null,
  changed_fields text[] not null default '{}',
  occurred_at timestamptz not null default now(),
  resolved_at timestamptz
);
create unique index posting_detail_failures_open_uidx
  on jobs.posting_detail_failures (posting_key) where resolved_at is null;
create index posting_detail_failures_posting_key_idx on jobs.posting_detail_failures (posting_key);

-- 실패 보고: 같은 공고에 미해결 실패가 이미 있으면 갱신(재발), 없으면 새로 만든다.
-- 반환값(is_new)은 수집기가 "처음 실패한 순간부터" 경고를 보내는 데 쓴다(R-41: 재발은 조용히 기록만).
create or replace function jobs.report_detail_failure(p jsonb)
returns boolean
language plpgsql security definer set search_path = jobs, pg_catalog as $$
declare v_is_new boolean;
begin
  insert into jobs.posting_detail_failures (posting_key, run_id, kind, reason, changed_fields)
  values (p->>'posting_key', p->>'run_id', p->>'kind', p->>'reason',
          coalesce(array(select jsonb_array_elements_text(p->'changed_fields')), '{}'))
  on conflict (posting_key) where resolved_at is null do nothing;
  if found then
    v_is_new := true;
  else
    update jobs.posting_detail_failures
      set run_id = p->>'run_id', kind = p->>'kind', reason = p->>'reason',
          changed_fields = coalesce(array(select jsonb_array_elements_text(p->'changed_fields')), '{}'),
          occurred_at = now()
      where posting_key = p->>'posting_key' and resolved_at is null;
    v_is_new := false;
  end if;
  return v_is_new;
end;
$$;

-- 해제: 다음 수집이 성공하면 수집기가 호출한다. 미해결 실패가 없으면 아무 일도 하지 않는다.
create or replace function jobs.resolve_detail_failure(p jsonb)
returns void
language sql security definer set search_path = jobs, pg_catalog as $$
  update jobs.posting_detail_failures set resolved_at = now()
  where posting_key = p->>'posting_key' and resolved_at is null;
$$;

create or replace function public.collector_report_detail_failure(p jsonb)
returns boolean
language sql security definer set search_path = jobs, pg_catalog as $$
  select jobs.report_detail_failure(p)
$$;

create or replace function public.collector_resolve_detail_failure(p jsonb)
returns void
language sql security definer set search_path = jobs, pg_catalog as $$
  select jobs.resolve_detail_failure(p)
$$;

revoke all on function jobs.report_detail_failure(jsonb), jobs.resolve_detail_failure(jsonb),
  public.collector_report_detail_failure(jsonb), public.collector_resolve_detail_failure(jsonb)
  from public, anon, authenticated;
grant execute on function public.collector_report_detail_failure(jsonb), public.collector_resolve_detail_failure(jsonb)
  to service_role;
