-- 인턴 종류(2026-09-28, R-13): INTERN(구분 없음) · INTERN_TRIAL(체험형 인턴) · INTERN_CONV(채용연계형 인턴). '채용연계형' 태그는 폐기.
create or replace function public._emp_label(code text) returns text language sql immutable as $$
  select case code when 'FULL_TIME' then '정규직' when 'INTERN' then '인턴' when 'INTERN_TRIAL' then '체험형 인턴'
                   when 'INTERN_CONV' then '채용연계형 인턴' when 'CONTRACT' then '계약직'
                   when 'CONTRACT_SHORT' then '단기계약직' when 'ETC' then '기타' end $$;

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
    if v not in ('FULL_TIME','INTERN','INTERN_TRIAL','INTERN_CONV','CONTRACT','CONTRACT_SHORT','ETC') then raise exception 'INGEST_SCHEMA: employment_types 값 %', v; end if;
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
