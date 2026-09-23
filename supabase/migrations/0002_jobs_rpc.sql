-- Pickd jobs RPC 초안 v1. 설계: docs/db-design.md 3~5장.
set search_path = jobs, pg_catalog;

create or replace function jobs.begin_run(p_classifier_version text, p_run_id text default null,
                                          p_started_at timestamptz default now())
returns text language plpgsql security definer set search_path = jobs, pg_catalog as $$
declare v_id text := coalesce(p_run_id, to_char(p_started_at at time zone 'UTC', 'YYYYMMDD"T"HH24MISS"Z"'));
begin
  insert into jobs.runs (run_id, started_at, classifier_version) values (v_id, p_started_at, p_classifier_version)
  on conflict (run_id) do nothing;
  return v_id;
end $$;

create or replace function jobs._validate_posting(p jsonb) returns void language plpgsql as $$
declare f text; v text;
begin
  if (p->>'schema_version')::int is distinct from 1 then
    raise exception 'INGEST_SCHEMA: schema_version % 미지원', p->>'schema_version';
  end if;
  foreach f in array array['posting_key','source_site','source_job_id','url','title','group','company',
                           'posted_at','classifier_version','collected_at'] loop
    if coalesce(p->>f, '') = '' then raise exception 'INGEST_SCHEMA: 필수 필드 없음 %', f; end if;
  end loop;
  foreach f in array array['employment_types','career_levels','job_categories','locations','tags','review_reasons'] loop
    if jsonb_typeof(p->f) is distinct from 'array' then raise exception 'INGEST_SCHEMA: % 는 배열이어야 함', f; end if;
  end loop;
  for v in select jsonb_array_elements_text(p->'employment_types') loop
    if v not in ('FULL_TIME','INTERN','CONTRACT','CONTRACT_SHORT','ETC') then raise exception 'INGEST_SCHEMA: employment_types 값 %', v; end if;
  end loop;
  for v in select jsonb_array_elements_text(p->'career_levels') loop
    if v not in ('EXP','NEW','ANY') then raise exception 'INGEST_SCHEMA: career_levels 값 %', v; end if;
  end loop;
  for v in select jsonb_array_elements_text(p->'job_categories') loop
    if v not in ('개발','기획','디자인','비즈니스','마케팅','경영지원','기타') then raise exception 'INGEST_SCHEMA: job_categories 값 %', v; end if;
  end loop;
  if p->>'body_text' is null then raise exception 'INGEST_SCHEMA: body_text 없음(빈 문자열은 허용)'; end if;
  -- body_sections(2026-09-24 결정): 필수. 원소는 {kind, heading, text}, kind는 8종, 항목 text를 줄바꿈으로 이으면 body_text와 같아야 한다.
  if jsonb_typeof(p->'body_sections') is distinct from 'array' then
    raise exception 'INGEST_SCHEMA: body_sections 는 배열이어야 함';
  end if;
  if exists (select 1 from jsonb_array_elements(p->'body_sections') s
             where jsonb_typeof(s->'text') is distinct from 'string'
                or s->>'kind' not in ('intro','duties','requirements','preferred','process','conditions','documents','etc')
                or (s->'heading' is not null and jsonb_typeof(s->'heading') not in ('string','null'))) then
    raise exception 'INGEST_SCHEMA: body_sections 원소 형식 오류(kind 8종, text 문자열)';
  end if;
  if coalesce((select string_agg(s->>'text', E'\n' order by ord) from jsonb_array_elements(p->'body_sections') with ordinality as x(s, ord)), '')
     is distinct from (p->>'body_text') then
    raise exception 'INGEST_SCHEMA: body_sections 를 이어 붙인 결과가 body_text 와 다름';
  end if;
end $$;

-- 입력: {run_id, source_id, content_hash, posting: normalized-posting-v1}
create or replace function jobs.ingest_posting(p jsonb)
returns jsonb language plpgsql security definer set search_path = jobs, pg_catalog as $$
declare
  v_run    text  := p->>'run_id';
  v_source text  := p->>'source_id';
  v_hash   text  := p->>'content_hash';
  v_post   jsonb := p->'posting';
  v_key    text;
  v_now    timestamptz := now();
  v_seen   timestamptz;
  r        jobs.postings%rowtype;
  v_uid    text;
  v_gen    int;
  v_result text;
  v_snap   bigint;
  v_ver    int;
  v_gap    int := (select (value)::int from jobs.settings where key = 'regeneration_gap_days');
begin
  if v_run is null or not exists (select 1 from jobs.runs where run_id = v_run and finished_at is null) then
    raise exception 'INGEST_RUN: run % 없음 또는 종료됨', v_run;
  end if;
  if not exists (select 1 from jobs.sources where source_id = v_source and enabled) then
    raise exception 'INGEST_SOURCE: source % 없음/비활성', v_source;
  end if;
  if v_hash is null or v_post is null then raise exception 'INGEST_SCHEMA: content_hash·posting 필요'; end if;
  perform jobs._validate_posting(v_post);
  v_key  := v_post->>'posting_key';
  v_seen := (v_post->>'collected_at')::timestamptz;

  -- 최신 세대 조회 (동시 실행 대비 잠금)
  select * into r from jobs.postings where posting_key = v_key order by generation desc limit 1 for update;

  if not found then
    v_uid := v_key; v_gen := 1; v_result := 'created';
  elsif r.status = 'open' then
    v_uid := r.posting_uid; v_gen := r.generation;
    v_result := case when r.content_hash = v_hash then 'unchanged' else 'changed' end;
  elsif r.closed_at >= v_now - make_interval(days => v_gap) then
    v_uid := r.posting_uid; v_gen := r.generation; v_result := 'reopened';
  else
    v_gen := r.generation + 1; v_uid := v_key || '#' || v_gen; v_result := 'regenerated';
  end if;

  if v_result in ('created','regenerated') then
    insert into jobs.postings (posting_uid, posting_key, generation, source_id, source_site, content_hash,
                               first_seen_at, last_seen_at, last_seen_run_id, needs_review,
                               review_status)
    values (v_uid, v_key, v_gen, v_source, v_post->>'source_site', v_hash, v_seen, v_seen, v_run,
            (v_post->>'needs_review')::boolean,
            case when (v_post->>'needs_review')::boolean then 'pending' else 'none' end)
    on conflict (posting_uid) do nothing;
  end if;

  -- 스냅샷: 해시가 새로울 때만
  if v_result <> 'unchanged' then
    select coalesce(max(version), 0) + 1 into v_ver from jobs.posting_snapshots where posting_uid = v_uid;
    insert into jobs.posting_snapshots (posting_uid, version, content_hash, payload, classifier_version, collected_at, run_id)
    values (v_uid, v_ver, v_hash, v_post, v_post->>'classifier_version', v_seen, v_run)
    on conflict (posting_uid, content_hash) do nothing
    returning id, version into v_snap, v_ver;
    if v_snap is null then   -- 이미 같은 해시의 스냅샷이 있음(재시도·reopen 등)
      select id, version into v_snap, v_ver from jobs.posting_snapshots where posting_uid = v_uid and content_hash = v_hash;
      if v_result = 'changed' then v_result := 'unchanged'; end if;
    end if;
  else
    select id, version into v_snap, v_ver from jobs.posting_snapshots where posting_uid = v_uid and content_hash = v_hash;
  end if;

  update jobs.postings set
    status = 'open', closed_at = null, closed_reason = null, missed_runs = 0,
    content_hash = v_hash, current_snapshot_id = v_snap, source_site = v_post->>'source_site',
    last_seen_at = greatest(last_seen_at, v_seen), last_seen_run_id = v_run,
    needs_review = (v_post->>'needs_review')::boolean,
    review_status = case when review_status = 'reviewed' then 'reviewed'
                         when (v_post->>'needs_review')::boolean then 'pending' else 'none' end
  where posting_uid = v_uid;

  if v_result <> 'unchanged' then
    insert into jobs.posting_events (posting_uid, type, run_id, changed_fields, reason)
    values (v_uid, v_result, v_run,
            case when v_result = 'changed' then
              (select array_agg(k) from jsonb_object_keys(v_post) k
                where k not in ('collected_at','classifier_version','needs_review','review_reasons','classification_source')
                  and (v_post->k) is distinct from ((select payload from jobs.posting_snapshots
                                                      where posting_uid = v_uid and version = v_ver - 1)->k))
            else '{}' end,
            null);
  end if;

  return jsonb_build_object('result', v_result, 'posting_uid', v_uid, 'generation', v_gen,
                            'snapshot_id', v_snap, 'snapshot_version', v_ver, 'content_hash', v_hash);
end $$;

-- 수집기 run 기록의 sites[] 한 항목
create or replace function jobs.report_source_run(p jsonb)
returns void language sql security definer set search_path = jobs, pg_catalog as $$
  insert into jobs.source_runs (run_id, source_id, host, status, count, previous_count, fill_rates, warnings, notes, http_stats)
  values (p->>'run_id', p->>'source_id', p->>'host', p->>'status', (p->>'count')::int, (p->>'previous_count')::int,
          coalesce(p->'fill_rates','{}'), coalesce(array(select jsonb_array_elements_text(p->'warnings')), '{}'),
          coalesce(array(select jsonb_array_elements_text(p->'notes')), '{}'), coalesce(p->'http_stats','{}'))
  on conflict (run_id, source_id, host) do update set status = excluded.status, count = excluded.count,
    previous_count = excluded.previous_count, fill_rates = excluded.fill_rates, warnings = excluded.warnings,
    notes = excluded.notes, http_stats = excluded.http_stats;
$$;

-- 마감 판정 (db-design.md 4장): 정상 처리된 source에서 2회 연속 안 보이면 closed, 마감일 경과면 closed
create or replace function jobs.finish_run(p_run_id text, p_status text default 'ok')
returns jsonb language plpgsql security definer set search_path = jobs, pg_catalog as $$
declare v_missing int := 0; v_deadline int := 0; v_today date := (now() at time zone 'Asia/Seoul')::date;
begin
  with ok_sources as (
    select source_id from jobs.source_runs where run_id = p_run_id group by source_id
    having bool_and(status = 'ok')
  ), missed as (
    update jobs.postings p set missed_runs = missed_runs + 1
    where p.status = 'open' and p.last_seen_run_id is distinct from p_run_id
      and p.source_id in (select source_id from ok_sources)
    returning p.posting_uid, p.missed_runs
  ), closed as (
    update jobs.postings p set status = 'closed', closed_at = now(), closed_reason = 'missing'
    from missed m where p.posting_uid = m.posting_uid and m.missed_runs >= 2
    returning p.posting_uid
  ), ev as (
    insert into jobs.posting_events (posting_uid, type, run_id, reason)
    select posting_uid, 'closed', p_run_id, 'missing' from closed returning 1
  )
  select count(*) into v_missing from ev;

  with closed as (
    update jobs.postings p set status = 'closed', closed_at = now(), closed_reason = 'deadline'
    from jobs.posting_snapshots s
    where p.status = 'open' and s.id = p.current_snapshot_id
      and (s.payload->>'deadline_at')::date < v_today
    returning p.posting_uid
  ), ev as (
    insert into jobs.posting_events (posting_uid, type, run_id, reason)
    select posting_uid, 'closed', p_run_id, 'deadline' from closed returning 1
  )
  select count(*) into v_deadline from ev;

  update jobs.runs set finished_at = now(), status = p_status where run_id = p_run_id;
  return jsonb_build_object('closed_missing', v_missing, 'closed_deadline', v_deadline);
end $$;

-- 검수 (관리자)
create or replace function jobs.set_override(p_posting_uid text, p_field text, p_value jsonb,
                                             p_note text default null, p_author text default current_user)
returns void language plpgsql security definer set search_path = jobs, pg_catalog as $$
begin
  insert into jobs.classification_overrides (posting_uid, field, value, author, note)
  values (p_posting_uid, p_field, p_value, p_author, p_note)
  on conflict (posting_uid, field) do update set value = excluded.value, author = excluded.author,
    note = excluded.note, created_at = now();
  update jobs.postings set review_status = 'reviewed', needs_review = false where posting_uid = p_posting_uid;
  insert into jobs.posting_events (posting_uid, type, changed_fields, reason)
  values (p_posting_uid, 'reviewed', array[p_field], p_note);
end $$;

-- 권한: jobs.* 함수는 누구도 직접 실행하지 못한다. 아래 public 래퍼만 service_role이 실행한다.
revoke all on function jobs.begin_run(text,text,timestamptz), jobs.ingest_posting(jsonb),
               jobs.report_source_run(jsonb), jobs.finish_run(text,text), jobs.set_override(text,text,jsonb,text,text),
               jobs._validate_posting(jsonb) from public;

-- 수집기 호출 경로 (db-design.md 5장·8장): PostgREST `/rest/v1/rpc/collector_*` + service_role 키(서버 환경변수에만 보관, 브라우저 금지)
create or replace function public.collector_begin_run(p_classifier_version text, p_run_id text default null)
returns text language sql security definer set search_path = jobs, pg_catalog as
$$ select jobs.begin_run(p_classifier_version, p_run_id) $$;
create or replace function public.collector_ingest_posting(p jsonb)
returns jsonb language sql security definer set search_path = jobs, pg_catalog as
$$ select jobs.ingest_posting(p) $$;
create or replace function public.collector_report_source_run(p jsonb)
returns void language sql security definer set search_path = jobs, pg_catalog as
$$ select jobs.report_source_run(p) $$;
create or replace function public.collector_finish_run(p_run_id text, p_status text default 'ok')
returns jsonb language sql security definer set search_path = jobs, pg_catalog as
$$ select jobs.finish_run(p_run_id, p_status) $$;
-- 검수(관리자, 서버에서 service_role로만)
create or replace function public.admin_set_override(p_posting_uid text, p_field text, p_value jsonb, p_note text default null)
returns void language sql security definer set search_path = jobs, pg_catalog as
$$ select jobs.set_override(p_posting_uid, p_field, p_value, p_note, 'admin') $$;

revoke all on function public.collector_begin_run(text,text), public.collector_ingest_posting(jsonb),
               public.collector_report_source_run(jsonb), public.collector_finish_run(text,text),
               public.admin_set_override(text,text,jsonb,text) from public, anon, authenticated;
grant execute on function public.collector_begin_run(text,text), public.collector_ingest_posting(jsonb),
                          public.collector_report_source_run(jsonb), public.collector_finish_run(text,text),
                          public.admin_set_override(text,text,jsonb,text) to service_role;
