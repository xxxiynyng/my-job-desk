-- 본문 항목을 행 단위로 펼친 뷰(2026-09-24): 자소서 툴·화면이 "자격 항목만" 같은 식으로 바로 조회한다.
-- kind: intro 소개 · duties 업무 · requirements 자격 · preferred 우대 · process 전형 · conditions 근무 · documents 서류 · etc 기타
create or replace view public.v_posting_sections as
select p.posting_uid, p.company, p.title, p.status, s.ord as section_no,
       s.value->>'kind' as kind, s.value->>'heading' as heading, s.value->>'text' as text
from public.v_postings p, jsonb_array_elements(p.body_sections) with ordinality as s(value, ord);
grant select on public.v_posting_sections to anon, authenticated, service_role;
