-- 해시 정의가 바뀌어 '변경'으로 판정됐지만 payload가 같은 경우 changed_fields가 NULL이 되어 NOT NULL 위반(2026-09-24 발견). 빈 배열로 처리.
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
              coalesce((select array_agg(k) from jsonb_object_keys(v_post) k
                where k not in ('collected_at','classifier_version','needs_review','review_reasons','classification_source')
                  and (v_post->k) is distinct from ((select payload from jobs.posting_snapshots
                                                      where posting_uid = v_uid and version = v_ver - 1)->k)), '{}')
            else '{}' end,
            null);
  end if;

  return jsonb_build_object('result', v_result, 'posting_uid', v_uid, 'generation', v_gen,
                            'snapshot_id', v_snap, 'snapshot_version', v_ver, 'content_hash', v_hash);
end $$;

