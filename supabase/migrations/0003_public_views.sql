-- 공개 뷰 public-posting-v1. 설계: docs/db-design.md 6장. 검수값 있으면 검수값, 없으면 수집값.
create or replace function public._emp_label(code text) returns text language sql immutable as $$
  select case code when 'FULL_TIME' then '정규직' when 'INTERN' then '인턴' when 'CONTRACT' then '계약직'
                   when 'CONTRACT_SHORT' then '단기계약직' when 'ETC' then '기타' end $$;
create or replace function public._career_label(code text) returns text language sql immutable as $$
  select case code when 'EXP' then '경력' when 'NEW' then '신입' when 'ANY' then '경력무관' end $$;

create or replace view public.v_postings
with (security_invoker = false) as
with o as (
  select posting_uid, jsonb_object_agg(field, value) as ov from jobs.classification_overrides group by posting_uid
), base as (
  select p.posting_uid, p.posting_key, p.generation, s.id as snapshot_id, s.version as snapshot_version,
         p.content_hash, p.status, p.closed_at, p.closed_reason, p.needs_review, p.review_status,
         p.first_seen_at, p.last_seen_at, s.payload as j, coalesce(o.ov, '{}'::jsonb) as ov
  from jobs.postings p
  join jobs.posting_snapshots s on s.id = p.current_snapshot_id
  left join o on o.posting_uid = p.posting_uid
)
select posting_uid, posting_key, generation, snapshot_id, snapshot_version, content_hash,
       j->>'group'                                          as "group",
       coalesce(ov->>'company', j->>'company')              as company,
       j->>'title'                                          as title,
       (select array_agg(x) from jsonb_array_elements_text(coalesce(ov->'employment_types', j->'employment_types')) x) as employment_types,
       (select array_agg(public._emp_label(x)) from jsonb_array_elements_text(coalesce(ov->'employment_types', j->'employment_types')) x) as employment_labels,
       j->>'employment_raw'                                 as employment_raw,
       (j->>'show_employment_raw')::boolean                 as show_employment_raw,
       (select array_agg(x) from jsonb_array_elements_text(coalesce(ov->'career_levels', j->'career_levels')) x) as career_levels,
       (select array_agg(public._career_label(x)) from jsonb_array_elements_text(coalesce(ov->'career_levels', j->'career_levels')) x) as career_labels,
       (j->>'min_years')::int                               as min_years,
       (select array_agg(x) from jsonb_array_elements_text(j->'tags') x) as tags,
       (select array_agg(x) from jsonb_array_elements_text(coalesce(ov->'job_categories', j->'job_categories')) x) as job_categories,
       j->>'raw_job_category'                               as raw_job_category,
       (select array_agg(x) from jsonb_array_elements_text(coalesce(ov->'locations', j->'locations')) x) as locations,
       coalesce((ov->>'is_global')::boolean, (j->>'is_global')::boolean) as is_global,
       (j->>'posted_at')::date                              as posted_at,
       coalesce((ov->>'deadline_at')::date, (j->>'deadline_at')::date) as deadline_at,
       j->>'body_text'                                      as body_text,
       coalesce(j->'body_sections', '[]'::jsonb)          as body_sections,   -- 항목 분할(소개·업무·자격·우대·전형·근무·서류·기타)
       j->>'url'                                            as source_url,
       j->>'source_site'                                    as source_site,
       status, closed_at, closed_reason, needs_review, review_status,
       first_seen_at, last_seen_at,
       (j->>'collected_at')::timestamptz                    as fetched_at,
       j->>'classifier_version'                             as classifier_version
from base
where coalesce((ov->>'hidden')::boolean, false) = false;

-- 목록용(본문 제외)
create or replace view public.v_postings_list as
select posting_uid, posting_key, generation, snapshot_id, snapshot_version, content_hash, "group", company, title,
       employment_types, employment_labels, employment_raw, show_employment_raw, career_levels, career_labels,
       min_years, tags, job_categories, raw_job_category, locations, is_global, posted_at, deadline_at,
       source_url, source_site, status, closed_at, closed_reason, needs_review, review_status,
       first_seen_at, last_seen_at, fetched_at, classifier_version
from public.v_postings;

grant select on public.v_postings, public.v_postings_list to anon, authenticated;

-- 지원건이 참조한 스냅샷 본문 읽기는 여기서 열지 않는다. career.application_targets가 생긴 뒤
-- 0100_career_*.sql에서 본인 지원건이 참조한 스냅샷만 보이는 뷰(public.v_my_posting_snapshots)를 만든다(db-design.md 7장).
grant select on public.v_postings, public.v_postings_list to service_role;
