-- Pickd jobs 스키마 초안 v1 (2026-09-24). 설계: docs/db-design.md 2장.
create schema if not exists jobs;

create table jobs.companies (
  id          bigserial primary key,
  "group"     text not null,
  name        text not null,
  name_ko     text,
  aliases     text[] not null default '{}',
  unique ("group", name)
);

create table jobs.sources (
  source_id         text primary key,          -- naver, greetinghr, kakao, ...
  "group"           text not null,
  platform          text not null,
  hosts             text[] not null,
  role              text not null default 'main' check (role in ('main','subsidiary')),
  robots_exception  boolean not null default false,
  enabled           boolean not null default true
);

create table jobs.runs (
  run_id              text primary key,        -- YYYYMMDDTHHMMSSZ
  started_at          timestamptz not null default now(),
  finished_at         timestamptz,
  status              text not null default 'running' check (status in ('running','ok','partial','failed')),
  classifier_version  text
);

create table jobs.source_runs (
  run_id          text not null references jobs.runs(run_id),
  source_id       text not null references jobs.sources(source_id),
  host            text not null,
  status          text not null check (status in ('ok','판정불가','실패')),
  count           int,
  previous_count  int,
  fill_rates      jsonb not null default '{}',
  warnings        text[] not null default '{}',
  notes           text[] not null default '{}',
  http_stats      jsonb not null default '{}',
  primary key (run_id, source_id, host)
);

create table jobs.posting_snapshots (
  id                  bigserial primary key,
  posting_uid         text not null,
  version             int not null,
  content_hash        text not null,
  payload             jsonb not null,          -- normalized-posting-v1 전체
  classifier_version  text,
  collected_at        timestamptz not null,
  run_id              text references jobs.runs(run_id),
  created_at          timestamptz not null default now(),
  unique (posting_uid, content_hash),
  unique (posting_uid, version)
);

create table jobs.postings (
  posting_uid          text primary key,        -- posting_key 또는 posting_key#N
  posting_key          text not null,
  generation           int not null default 1,
  source_id            text not null references jobs.sources(source_id),
  source_site          text not null,
  status               text not null default 'open' check (status in ('open','closed')),
  current_snapshot_id  bigint references jobs.posting_snapshots(id),
  content_hash         text not null,
  first_seen_at        timestamptz not null,
  last_seen_at         timestamptz not null,
  last_seen_run_id     text references jobs.runs(run_id),
  missed_runs          int not null default 0,
  closed_at            timestamptz,
  closed_reason        text check (closed_reason in ('missing','deadline','manual')),
  needs_review         boolean not null default false,
  review_status        text not null default 'none' check (review_status in ('none','pending','reviewed')),
  unique (posting_key, generation)
);
create index on jobs.postings (status, source_id);
create index on jobs.postings (posting_key);

create table jobs.posting_events (
  id              bigserial primary key,
  posting_uid     text not null references jobs.postings(posting_uid),
  type            text not null check (type in ('created','changed','closed','reopened','regenerated','reviewed')),
  run_id          text references jobs.runs(run_id),
  changed_fields  text[] not null default '{}',
  reason          text,
  occurred_at     timestamptz not null default now()
);
create index on jobs.posting_events (posting_uid, occurred_at);

create table jobs.classification_overrides (
  posting_uid  text not null references jobs.postings(posting_uid),
  field        text not null check (field in ('employment_types','career_levels','job_categories','locations',
                                              'company','is_global','deadline_at','hidden')),
  value        jsonb not null,
  author       text,
  note         text,
  created_at   timestamptz not null default now(),
  primary key (posting_uid, field)
);

-- 설정값 (db-design.md 3장: 재게시 간격)
create table jobs.settings (key text primary key, value jsonb not null);
insert into jobs.settings values ('regeneration_gap_days', '14');

-- 초기 소스 (config/sites.json과 동기)
insert into jobs.sources (source_id, "group", platform, hosts, role, robots_exception) values
 ('naver', '네이버', 'naver_rcrt', '{recruit.navercorp.com,recruit.navercloudcorp.com,recruit.snowcorp.com,recruit.naverlabs.com,recruit.webtoonscorp.com,recruit.naverfincorp.com,recruit.naverins.com,recruit.naverz-corp.com}', 'main', false),
 ('greetinghr', '카카오', 'greetinghr', '{kakaopay.career.greetinghr.com,careers.kakaoent.com,recruit.kakaogames.com,kakaomobility.career.greetinghr.com,careers.kakaoenterprise.com,career.kakaopayinscorp.co.kr}', 'subsidiary', false),
 ('kakao', '카카오', 'kakao_careers', '{careers.kakao.com}', 'main', false),
 ('kakaobank', '카카오', 'kakaobank', '{recruit.kakaobank.com}', 'subsidiary', false),
 ('ninehire', '카카오', 'ninehire', '{career.kakaopaysec.com,recruit.kakaohealthcare.com}', 'subsidiary', false),
 ('toss', '토스', 'toss', '{toss.im}', 'main', false),
 ('line', '라인', 'line', '{careers.linecorp.com}', 'main', false),
 ('woowa', '우아한형제들', 'woowa', '{career.woowahan.com,career.woowayouths.com}', 'main', true);

-- 권한 (db-design.md 8장). Supabase 기본 역할만 쓴다: service_role(서버 전용 키), authenticated, anon.
-- 수집기·관리자는 service_role 키로 public.collector_* / public.admin_* 래퍼 함수만 호출한다(0002).
revoke all on schema jobs from public;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
end $$;
grant usage on schema jobs to service_role;
grant select on all tables in schema jobs to service_role;   -- 검수 화면(서버) 조회용
