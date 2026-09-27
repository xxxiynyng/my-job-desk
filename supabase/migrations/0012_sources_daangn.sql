-- 당근 수집 소스 등록(2026-09-28, R-09-1): 당근·당근페이(Greenhouse 공개 API), 당근서비스(그리팅HR)
insert into jobs.sources (source_id, "group", platform, hosts, role, robots_exception) values
 ('daangn', '당근', 'greenhouse', '{careers.daangn.com}', 'main', false),
 ('daangnservice', '당근', 'greetinghr', '{daangnservice.career.greetinghr.com}', 'subsidiary', false)
on conflict (source_id) do nothing;
