-- 결과 보고용(2026-09-26): 한 수집 실행에서 신규·변경·재개·재게시된 공고와 바뀐 항목을 돌려준다.
-- 이력(posting_events)은 이미 기록되고 있으므로 읽기만 한다. service_role 전용.
create or replace function jobs.run_changes(p_run_id text)
returns table(posting_uid text, type text, changed_fields text[])
language sql stable security definer set search_path = jobs, pg_catalog as $$
  select e.posting_uid, e.type, e.changed_fields
  from jobs.posting_events e
  where e.run_id = p_run_id and e.type in ('created', 'changed', 'reopened', 'regenerated')
  order by e.posting_uid
$$;
create or replace function public.collector_run_changes(p_run_id text)
returns table(posting_uid text, type text, changed_fields text[])
language sql stable security definer set search_path = jobs, pg_catalog as $$
  select * from jobs.run_changes(p_run_id)
$$;
revoke all on function jobs.run_changes(text), public.collector_run_changes(text) from public, anon, authenticated;
grant execute on function public.collector_run_changes(text) to service_role;
