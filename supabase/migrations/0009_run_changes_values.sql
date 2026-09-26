-- 결과 보고에 "무엇을 무엇으로" 바꿨는지(2026-09-26): 이번 실행에서 생긴 스냅샷과 그 직전 버전을 비교해
-- 바뀐 항목별 {이전, 이후} 값을 돌려준다. 본문(body_text·body_sections)은 길어서 값 대신 항목 이름만.
drop function if exists public.collector_run_changes(text);
drop function if exists jobs.run_changes(text);

create function jobs.run_changes(p_run_id text)
returns table(posting_uid text, type text, changed_fields text[], diff jsonb)
language sql stable security definer set search_path = jobs, pg_catalog as $$
  select e.posting_uid, e.type, e.changed_fields,
         coalesce((select jsonb_object_agg(f, jsonb_build_object('before', prev.payload->f, 'after', cur.payload->f))
                   from unnest(e.changed_fields) f
                   where f not in ('body_text', 'body_sections')), '{}'::jsonb)
  from jobs.posting_events e
  left join lateral (select s.payload, s.version from jobs.posting_snapshots s
                     where s.posting_uid = e.posting_uid and s.run_id = e.run_id order by s.version desc limit 1) cur on true
  left join lateral (select s.payload from jobs.posting_snapshots s
                     where s.posting_uid = e.posting_uid and s.version = cur.version - 1) prev on true
  where e.run_id = p_run_id and e.type in ('created', 'changed', 'reopened', 'regenerated')
  order by e.posting_uid
$$;

create function public.collector_run_changes(p_run_id text)
returns table(posting_uid text, type text, changed_fields text[], diff jsonb)
language sql stable security definer set search_path = jobs, pg_catalog as $$
  select * from jobs.run_changes(p_run_id)
$$;
revoke all on function jobs.run_changes(text), public.collector_run_changes(text) from public, anon, authenticated;
grant execute on function public.collector_run_changes(text) to service_role;
notify pgrst, 'reload schema';
