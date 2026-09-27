-- 직군 대분류 이름 변경(2026-09-28): '비즈니스·경영지원' → '경영'. 뷰가 옛 이름(비즈니스·경영지원·비즈니스·경영지원)을 모두 '경영'으로 합쳐 보여 주므로 과거 스냅샷은 그대로 둔다.
create or replace function public._job_major(name text) returns text language sql immutable as $$
  select case name when '비즈니스' then '경영' when '경영지원' then '경영' when '비즈니스·경영지원' then '경영'
                   when '마케팅' then '마케팅·홍보' else name end $$;

-- ingest 검증: 허용 대분류·소분류 접두어 갱신(0010의 함수를 이름만 바꿔 다시 정의)
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
    if v not in ('개발','기획','디자인','경영','마케팅·홍보','기타') then raise exception 'INGEST_SCHEMA: job_categories 값 %', v; end if;
  end loop;
  if p ? 'job_subcategories' then
    if jsonb_typeof(p->'job_subcategories') is distinct from 'array' then raise exception 'INGEST_SCHEMA: job_subcategories 는 배열이어야 함'; end if;
    for v in select jsonb_array_elements_text(p->'job_subcategories') loop
      if split_part(v, '/', 1) not in ('개발','기획','디자인','경영','마케팅·홍보') or split_part(v, '/', 2) = '' then
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
