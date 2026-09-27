-- 직군 R-22 개정(2026-09-27): 대분류 6개(개발·기획·디자인·비즈니스·경영지원·마케팅·홍보·기타) + 소분류('대분류/소분류').
-- 옛 대분류 이름(비즈니스·경영지원·마케팅)은 뷰에서 새 이름으로 합쳐 보여 주므로 과거 스냅샷은 그대로 둔다.
-- 소분류 목록의 정본은 수집기 classify/dictionaries/job_taxonomy.json.
create or replace function public._job_major(name text) returns text language sql immutable as $$
  select case name when '비즈니스' then '비즈니스·경영지원' when '경영지원' then '비즈니스·경영지원'
                   when '마케팅' then '마케팅·홍보' else name end $$;

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
    if v not in ('개발','기획','디자인','비즈니스·경영지원','마케팅·홍보','기타') then raise exception 'INGEST_SCHEMA: job_categories 값 %', v; end if;
  end loop;
  if p ? 'job_subcategories' then
    if jsonb_typeof(p->'job_subcategories') is distinct from 'array' then raise exception 'INGEST_SCHEMA: job_subcategories 는 배열이어야 함'; end if;
    for v in select jsonb_array_elements_text(p->'job_subcategories') loop
      if split_part(v, '/', 1) not in ('개발','기획','디자인','비즈니스·경영지원','마케팅·홍보') or split_part(v, '/', 2) = '' then
        raise exception 'INGEST_SCHEMA: job_subcategories 값 %', v;
      end if;
    end loop;
  end if;
  if p->>'body_text' is null then raise exception 'INGEST_SCHEMA: body_text 없음(빈 문자열은 허용)'; end if;
  if jsonb_typeof(p->'body_sections') is distinct from 'array' then
    raise exception 'INGEST_SCHEMA: body_sections 는 배열이어야 함';
  end if;
  if exists (select 1 from jsonb_array_elements(p->'body_sections') s
             where jsonb_typeof(s->'text') is distinct from 'string'
                or s->>'kind' is null
                or s->>'kind' not in ('intro','duties','requirements','preferred','process','conditions','documents',
                                      'notice','resume_tips','team_message','etc')
                or (s->'heading' is not null and jsonb_typeof(s->'heading') not in ('string','null'))) then
    raise exception 'INGEST_SCHEMA: body_sections 원소 형식 오류(kind 11종, text 문자열)';
  end if;
  if coalesce((select string_agg(s->>'text', E'\n' order by ord) from jsonb_array_elements(p->'body_sections') with ordinality as x(s, ord)), '')
     is distinct from (p->>'body_text') then
    raise exception 'INGEST_SCHEMA: body_sections 를 이어 붙인 결과가 body_text 와 다름';
  end if;
end $$;

alter table jobs.classification_overrides drop constraint if exists classification_overrides_field_check;
alter table jobs.classification_overrides add constraint classification_overrides_field_check
  check (field in ('employment_types','career_levels','job_categories','job_subcategories','locations',
                   'company','is_global','deadline_at','hidden'));

-- 뷰 칸 순서(소분류를 job_categories 옆에)를 바꾸므로 뷰를 지우고 다시 만든다. v_posting_sections도 함께.
drop view if exists public.v_posting_sections;
drop view if exists public.v_postings_list;
drop view if exists public.v_postings;
create view public.v_postings
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
       (select array_agg(distinct public._job_major(x)) from jsonb_array_elements_text(coalesce(ov->'job_categories', j->'job_categories')) x) as job_categories,
       (select array_agg(x) from jsonb_array_elements_text(coalesce(ov->'job_subcategories', j->'job_subcategories', '[]'::jsonb)) x) as job_subcategories,   -- '대분류/소분류'(R-22 개정 2026-09-27)
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
create view public.v_postings_list as
select posting_uid, posting_key, generation, snapshot_id, snapshot_version, content_hash, "group", company, title,
       employment_types, employment_labels, employment_raw, show_employment_raw, career_levels, career_labels,
       min_years, tags, job_categories, job_subcategories, raw_job_category, locations, is_global, posted_at, deadline_at,
       source_url, source_site, status, closed_at, closed_reason, needs_review, review_status,
       first_seen_at, last_seen_at, fetched_at, classifier_version
from public.v_postings;


grant select on public.v_postings, public.v_postings_list to anon, authenticated, service_role;

create view public.v_posting_sections as
select p.posting_uid, p.company, p.title, p.status, s.ord as section_no,
       s.value->>'kind' as kind, s.value->>'heading' as heading, s.value->>'text' as text
from public.v_postings p, jsonb_array_elements(p.body_sections) with ordinality as s(value, ord);
comment on view public.v_posting_sections is
  'kind: intro 소개 · duties 업무 · requirements 자격 · preferred 우대 · process 전형 · conditions 근무 · documents 서류 · notice 지원 안내 · resume_tips 지원서 작성 안내 · team_message 동료 한마디 · etc 기타';
grant select on public.v_posting_sections to anon, authenticated, service_role;
