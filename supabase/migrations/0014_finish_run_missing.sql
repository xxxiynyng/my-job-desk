-- 마감(missing) 판정 수정 (2026-09-28). 수집기 점검 T-41·T-05, 결정 D-01·D-08.
--
-- 문제 1 (T-41): finish_run이 한 WITH 문 안에서 같은 행을 두 번 UPDATE했다(missed_runs 증가 → 같은 행 마감).
--   PostgreSQL은 한 문장에서 같은 행을 두 번 바꾸면 한쪽만 적용하므로 마감(missing)이 한 번도 일어나지 않았다
--   (실DB closed/missing 0건, 로컬 재현으로 확인). → 증가와 마감을 별개 문장으로 나눈다.
-- 문제 2 (T-05): 로컬 `run.py push`가 옛 output을 새 run_id로 다시 보내면 (a) 그 사이 새로 보인 공고의 missed_runs가 오르고
--   (b) 새 본문·분류가 옛 값으로 되돌아가며 스냅샷이 생겼다(09-28 라인 78건). → 이미 반영된 판정보다 오래된 결과는 거부한다.
--
-- 규칙
--   * 공고의 "마지막 판정 시각" last_checked_at = 그 공고를 보거나(ingest) 못 봤다고 센(finish_run) 수집 결과의 관측 시각 중 최신.
--   * ingest: 결과의 collected_at이 공고의 last_checked_at보다 오래되면 아무것도 바꾸지 않는다(result 'unchanged', stale true).
--     같은 시각(같은 결과를 다시 보냄)은 지금처럼 멱등 처리한다.
--   * 실행의 관측 시각 runs.observed_at = 그 실행이 보낸 결과의 collected_at 중 최댓값(ingest가 기록, 거부된 결과 포함).
--   * finish_run: 이 실행에서 그 사이트(host) 수집이 ok였고, 실행 관측 시각이 공고의 마지막 판정보다 새로우며,
--     이번에 보이지 않은(last_seen_at < observed_at) 모집중 공고만 missed_runs를 1 올린다. 2 이상이면 missing으로 마감.
--     같은 결과·옛 결과를 몇 번 다시 보내도 카운트는 한 번도 오르지 않는다. 사이트 수집이 실패(ok 아님)한 실행은 세지 않는다.
--   * 마감 공고는 지우지 않는다: status 'closed', closed_reason('missing'|'deadline'), closed_at을 남기고 posting_events에 기록.
-- 수집기와의 약속(RPC 이름·인자·반환 키)은 그대로다. ingest 반환에 'stale' 키만 늘었다(수집기는 모르는 키를 쓰지 않음).
set search_path = jobs, pg_catalog;

alter table jobs.runs add column if not exists observed_at timestamptz;
comment on column jobs.runs.observed_at is '이 실행이 보낸 수집 결과의 collected_at 최댓값(실제로 사이트를 본 시각). 옛 output 재전송이면 과거 시각이 된다';

alter table jobs.postings add column if not exists last_checked_at timestamptz;
comment on column jobs.postings.last_checked_at is '이 공고를 보거나(ingest) 못 봤다고 센(finish_run) 수집 결과의 관측 시각 중 최신. 이보다 오래된 결과는 거부';
update jobs.postings set last_checked_at = last_seen_at where last_checked_at is null;

-- ingest: 0006 본문 + (1) 실행 관측 시각 기록 (2) 오래된 결과 거부 (3) last_checked_at 갱신
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

  -- 실행의 관측 시각(finish_run의 미노출 판정 기준)
  update jobs.runs set observed_at = greatest(observed_at, v_seen) where run_id = v_run;

  -- 최신 세대 조회 (동시 실행 대비 잠금)
  select * into r from jobs.postings where posting_key = v_key order by generation desc limit 1 for update;

  -- 오래된 결과 거부(2026-09-28): 이 공고에 이미 반영된 판정보다 오래된 수집 결과는 아무것도 바꾸지 않는다
  if found and v_seen < coalesce(r.last_checked_at, r.last_seen_at) then
    return jsonb_build_object('result', 'unchanged', 'stale', true, 'posting_uid', r.posting_uid,
                              'generation', r.generation, 'snapshot_id', r.current_snapshot_id,
                              'snapshot_version', null, 'content_hash', r.content_hash);
  end if;

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
                               first_seen_at, last_seen_at, last_checked_at, last_seen_run_id, needs_review,
                               review_status)
    values (v_uid, v_key, v_gen, v_source, v_post->>'source_site', v_hash, v_seen, v_seen, v_seen, v_run,
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
    last_checked_at = greatest(last_checked_at, v_seen),
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

-- finish_run: 증가 → 마감(missing) → 마감(deadline)을 각각 별개 문장으로
create or replace function jobs.finish_run(p_run_id text, p_status text default 'ok')
returns jsonb language plpgsql security definer set search_path = jobs, pg_catalog as $$
declare
  v_missing  int := 0;
  v_deadline int := 0;
  v_today    date := (now() at time zone 'Asia/Seoul')::date;
  v_obs      timestamptz := (select observed_at from jobs.runs where run_id = p_run_id);
begin
  if v_obs is not null then
    -- 1) 미노출 카운트: 이 실행에서 그 사이트 수집이 ok였고, 이 실행이 공고의 마지막 판정보다 새 결과이며, 이번에 안 보인 모집중 공고
    update jobs.postings p
       set missed_runs = p.missed_runs + 1, last_checked_at = v_obs
     where p.status = 'open'
       and p.last_seen_at < v_obs
       and coalesce(p.last_checked_at, p.last_seen_at) < v_obs
       and exists (select 1 from jobs.source_runs sr
                    where sr.run_id = p_run_id and sr.source_id = p.source_id
                      and sr.host = p.source_site and sr.status = 'ok');

    -- 2) 마감(missing): 1)에서 이번 실행으로 센 공고 중 2회 연속 안 보인 것. 1)과 다른 문장이라 증가 결과가 보인다
    with closed as (
      update jobs.postings p set status = 'closed', closed_at = now(), closed_reason = 'missing'
       where p.status = 'open' and p.missed_runs >= 2 and p.last_checked_at = v_obs
         and p.last_seen_at < v_obs
         and exists (select 1 from jobs.source_runs sr
                      where sr.run_id = p_run_id and sr.source_id = p.source_id
                        and sr.host = p.source_site and sr.status = 'ok')
      returning p.posting_uid
    ), ev as (
      insert into jobs.posting_events (posting_uid, type, run_id, reason)
      select posting_uid, 'closed', p_run_id, 'missing' from closed returning 1
    )
    select count(*) into v_missing from ev;
  end if;

  -- 3) 마감(deadline): 모집기간 종료일 경과(R-40). 이전과 같다
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
