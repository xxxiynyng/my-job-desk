# Pickd DB 설계 — 공고(jobs)와 경험·자소서(career)의 경계

- 상태: 초안 v1 (2026-09-24). Claude(수집기)와 GPT(자소서 툴) 양쪽 검토 후 Supabase에 적용한다.
- 정본: Pickd 웹 저장소(my-job-desk)의 `supabase/migrations/`와 이 문서. 수집기 저장소(`pickd-collector`)와 자소서 툴은 배포된 RPC·뷰 규격만 따른다. (2026-09-24 C안 확정)
- 규칙 출처: Notion "Pickd 공고 수집 — IT기업 분류·표기 규칙"(R-번호), `pickd-collector/docs/pipeline-design.md`(D-번호).

## 0. 전체 구조

```
[Python 수집기 (pickd-collector)]  원문 수집 → 추출 → 분류 → posting_uid·content_hash → normalized-posting-v1
        │  public.collector_begin_run / collector_ingest_posting / collector_report_source_run / collector_finish_run
        │  (service_role 키, 서버 환경변수에만 보관. jobs.* 함수는 이 래퍼 안에서만 실행)
        ▼
[jobs 스키마]   companies · sources · runs · source_runs · postings · posting_snapshots · posting_events · classification_overrides
        │  public.v_postings (검수값 우선 합성, status 포함)   ← 웹·자소서 툴은 이 뷰만 읽음
        ▼
[career 스키마]  application_targets.source_snapshot_id → jobs.posting_snapshots.id (FK, ON DELETE RESTRICT)
                 experiences · stories · cover_letters … (GPT 툴 소유, RLS user_id = auth.uid())
```

| 영역 | 소유 | 쓰기 | 읽기 |
|---|---|---|---|
| `jobs` | 수집기 | `public.collector_*` 래퍼(service_role)만 | service_role 조회, 뷰 정의 (PostgREST에 노출하지 않음) |
| `public.v_postings` | 이 저장소 | 없음(뷰) | anon·authenticated SELECT |
| `career` | 자소서 툴 | 사용자 본인(RLS) | 사용자 본인(RLS) |
| `auth` | Supabase | Supabase | Supabase |

Supabase 프로젝트는 1개. `career` → `jobs` 방향으로만 FK를 둔다(2026-09-24 확정, 7장). `jobs`는 `career`를 참조하지 않는다.

## 1. 입력 규격 `normalized-posting-v1`

수집기의 `output/{source}.json` 레코드 1건 = RPC 입력 1건. 현재 표본 829건 전부 이 규격이다.

| 필드 | 형 | 필수 | 값·비고 |
|---|---|---|---|
| schema_version | int | ✓ | 1 |
| posting_key | text | ✓ | `{platform}:{site_job_id}` 예 `naver:30005448`, `kakao:P-14531`. 사이트가 준 ID 기반, 결정적 |
| source_site | text | ✓ | 호스트명 예 `recruit.navercorp.com` |
| source_job_id | text | ✓ | 사이트의 공고 ID |
| url | text | ✓ | 원문 URL (최대 2048) |
| title | text | ✓ | 공고명 |
| group | text | ✓ | 회사 그룹: 네이버·카카오·토스·라인·우아한형제들 (R-01) |
| company | text | ✓ | 법인명, 영문 그대로 허용 (예 `LINE Pay Taiwan`) |
| employment_types | text[] | ✓ | `FULL_TIME` `INTERN` `CONTRACT` `CONTRACT_SHORT` `ETC` 중 0개 이상 (R-13). 빈 배열 = 미분류 |
| employment_labels | text[] | ✓ | 위의 한글 표기 (정규직·인턴·계약직·단기계약직·기타) |
| employment_raw | text | | 사이트 원문 표기 (예 `무기계약직`) |
| show_employment_raw | bool | ✓ | 원문 표기를 화면에 그대로 보일지 (R-13) |
| career_levels | text[] | ✓ | `EXP` `NEW` `ANY` 중 0개 이상 (R-15). 빈 배열 = 경력 표시 없음 |
| career_labels | text[] | ✓ | 경력·신입·경력무관 |
| min_years | int∣null | ✓ | 최소 연차 (1~30) |
| tags | text[] | ✓ | `5년 이상` `전환검토` `임원` 등 표시용 |
| job_categories | text[] | ✓ | 대분류: 개발·기획·디자인·경영·마케팅·홍보·기타 (R-22, 2026-09-28. 옛 이름 비즈니스·경영지원·비즈니스·경영지원·마케팅은 뷰가 새 이름으로 합침). 빈 배열 = 직무 정보 없음(검수 대상) |
| job_subcategories | text[] | | '대분류/소분류'(예: 개발/백엔드). 소분류 목록 정본은 수집기 job_taxonomy.json. 기타 대분류는 소분류 없음 |
| raw_job_category | text | | 사이트 원문 직무 (예 `Engineering > Tech Management`) |
| locations | text[] | ✓ | 지역명 `서울` `판교` `여의도` … 해외는 `도시(국가)` (R-30~32) |
| is_global | bool | ✓ | 해외 근무지 포함 여부 |
| posted_at | date | ✓ | KST 날짜 `YYYY-MM-DD` |
| deadline_at | date∣null | ✓ | null = 상시/채용 시 마감 (R-55) |
| body_text | text | ✓ | 본문 전문(정리된 텍스트, R-04). 빈 문자열 허용, 표본 최대 10,479자 |
| body_sections | array | ✓ | 본문을 표준 항목으로 나눈 것(2026-09-24 결정). 원소 `{kind, heading, text}`, 원문 순서. `kind`: `intro`(소개) `duties`(업무) `requirements`(자격) `preferred`(우대) `process`(전형) `conditions`(근무) `notice`(지원 안내·유의사항) `resume_tips`(지원서 작성 안내) `team_message`(동료 한마디) `etc`(기타) — 10종(2026-09-24: 서류(documents)는 실제 내용이 지원 안내와 같아 notice로 합침. DB 검증은 documents도 허용값으로 남겨 둠). `heading`은 소제목 줄 원문(첫 소제목 앞 내용은 null), `text`는 소제목 줄을 포함한 그 항목 전체. **모든 항목의 text를 `\n`으로 이으면 body_text와 같다**(전문 보존). 빈 본문이면 `[]` |
| classification_source | object | ✓ | `{employment, career}` 각 `구조화`∣`추론`∣`미분류` |
| career_basis | text∣null | ✓ | `title` `body_years` `body_hint` 또는 null |
| review_reasons | text[] | ✓ | 검수 사유 |
| needs_review | bool | ✓ | R-44 |
| classifier_version | text | ✓ | 사전 버전+해시 예 `2026-09-23.1+b22db1df` |
| collected_at | timestamptz | ✓ | UTC |

수집기가 RPC 호출 시 추가로 넣는 값(레코드 밖, 봉투):

| 필드 | 설명 |
|---|---|
| run_id | `jobs.begin_run`이 돌려준 실행 ID |
| source_id | `config/sites.json`의 소스 키 (naver·greetinghr·kakao·kakaobank·ninehire·toss·line·woowa) |
| content_hash | 아래 3장의 규칙으로 수집기가 계산한 sha256 hex 16자 |

규격 변경은 `schema_version`을 올리고 이 표를 갱신한다. RPC는 지원하지 않는 버전을 거부한다.

## 2. `jobs` 테이블

| 테이블 | 키 | 역할 |
|---|---|---|
| companies | id | group, name, name_ko, aliases. 뷰 표기 통일용 (수집기 사전 `company.json`과 동기) |
| sources | source_id | group, platform, hosts[], role(main/subsidiary), robots_exception, enabled |
| runs | run_id | 실행 1회: started_at, finished_at, status, classifier_version |
| source_runs | (run_id, source_id, host) | status(ok/판정불가/실패), count, previous_count, fill_rates, warnings, notes, http_stats (R-41·R-43) |
| postings | posting_uid | 현재 상태. posting_key, generation, source_id, status, current_snapshot_id, content_hash, first_seen_at, last_seen_at, last_seen_run_id, missed_runs, closed_at, closed_reason, needs_review, review_status |
| posting_snapshots | id | 원문 버전. posting_uid, version, content_hash, payload(normalized-posting-v1 전체), classifier_version, collected_at, run_id. **영구 보관** |
| posting_events | id | posting_uid, type(created/changed/closed/reopened/regenerated/reviewed), run_id, changed_fields[], reason, occurred_at (R-42) |
| classification_overrides | (posting_uid, field) | value(jsonb), author, note, created_at. 검수 수정 (R-44) |

제약:
- `postings UNIQUE(posting_uid)`, `postings UNIQUE(posting_key, generation)`
- `posting_snapshots UNIQUE(posting_uid, content_hash)`, `UNIQUE(posting_uid, version)`
- `postings.current_snapshot_id → posting_snapshots.id`
- 수집기는 Python에서 판정하더라도 위 제약이 최종 안전장치다(동시 실행·재시도 대비).

## 3. posting_uid · content_hash · 재게시 판정

**posting_key**는 수집기가 만든다: `{platform}:{site_job_id}`. 같은 사이트 공고 ID면 항상 같다.

**posting_uid = posting_key 또는 posting_key#N** (N = generation ≥ 2). RPC가 정한다.
1. posting_key가 처음이면 uid = key, generation 1, event `created`.
2. 이미 있고 status가 `open`이면 같은 uid. content_hash 다르면 새 스냅샷 + event `changed`.
3. 이미 있고 status가 `closed`인데 다시 나타나면
   - closed_at 이후 **14일 이내**면 같은 uid로 `reopened` (일시적 목록 누락·잠깐 내림).
   - 14일을 넘겼으면 **재게시**: 새 uid `key#N`, generation N, event `regenerated`. 이전 uid는 closed로 남는다.
   - 14일은 D-결정. 관측으로 조정할 수 있고 상수 `jobs.regeneration_gap_days`로 둔다.

**content_hash**: 수집기가 계산하고 RPC는 받은 값을 쓴다(재계산하지 않음). 대상 필드를 다음 순서로 JSON 직렬화(sort_keys, ensure_ascii=False)해 sha256 앞 16자:
`title, company, employment_types, employment_raw, career_levels, min_years, job_categories, job_subcategories, raw_job_category, locations, posted_at, deadline_at, body_text, body_sections`
- 분류 **코드**(employment_types·career_levels·job_categories·locations·company)가 바뀌면 해시가 바뀌어 새 스냅샷이 생긴다. 의도한 동작이다(그 시점의 분류 결과가 스냅샷에 남아야 함).
- 표시용 한글 라벨(`employment_labels`, `career_labels`), `tags`, `is_global`, `show_employment_raw`, `classifier_version`, `needs_review`, `review_reasons`, `classification_source`, `career_basis`, `collected_at`은 해시에 넣지 않는다. 라벨 표기만 바뀌면 스냅샷은 그대로다.

**본 것 기록**: 해시가 같아도 `last_seen_at`, `last_seen_run_id`를 갱신하고 `missed_runs = 0`.

## 4. 스냅샷 생성 조건과 상태 전이

스냅샷은 (a) 신규 (b) content_hash 변경 (c) 재게시 때만 만든다. 같은 실행에서 같은 공고를 두 번 보내도 두 번째는 `unchanged`.

상태(`postings.status`): `open` → `closed`.
- `jobs.finish_run(run_id)`: 그 실행에서 정상(ok) 처리된 source의 open 공고 중 이번에 보이지 않은 것은 `missed_runs += 1`. `missed_runs ≥ 2`면 closed, closed_reason `missing` (R-40 2회 연속). 판정불가·실패 source의 공고는 건드리지 않는다.
- `deadline_at < 오늘(KST)`이면 finish_run에서 closed, closed_reason `deadline`.
- 사이트가 마감 표시한 공고(`raw.closed`)와 인재풀 공고는 수집기가 애초에 보내지 않는다(R-04·R-12). 이미 open이던 공고가 다음 실행에 빠지면 위 규칙으로 닫힌다.

이력은 `posting_events`에 남고 지우지 않는다.

## 5. `jobs.ingest_posting` 및 실행 RPC 규격

`jobs.*` 함수는 모두 `SECURITY DEFINER`이며 누구도 직접 실행할 수 없다. 수집기는 `public.collector_*` 래퍼(같은 시그니처)를 **service_role 키로** 호출한다. 호출 경로는 하나다: PostgREST `POST /rest/v1/rpc/collector_ingest_posting` 등. `jobs` 스키마는 REST에 노출하지 않으므로 래퍼가 필요하다. service_role 키는 수집기 서버(GitHub Actions 시크릿·로컬 `.env`)에만 두고 브라우저·프런트 코드에는 절대 넣지 않는다. (2026-09-24 확정, MVP. 이후 수집기 전용 역할/JWT로 강화 가능)

### 5.1 `jobs.begin_run(p_classifier_version text, p_run_id text default null, p_started_at timestamptz default now()) → text` (래퍼 `public.collector_begin_run(p_classifier_version, p_run_id)`)
runs에 1행 만들고 run_id(`YYYYMMDDTHHMMSSZ`) 반환. 수집기는 run_id를 로컬 run 기록과 같은 값으로 쓴다(수집기가 만든 run_id를 넘길 수 있게 `p_run_id text default null`).

### 5.2 `jobs.ingest_posting(p jsonb) → jsonb` (래퍼 `public.collector_ingest_posting`)
입력: `{run_id, source_id, content_hash, posting: <normalized-posting-v1>}`

출력:
```json
{"result": "created|changed|unchanged|reopened|regenerated",
 "posting_uid": "naver:30005448", "generation": 1,
 "snapshot_id": 123, "snapshot_version": 2, "content_hash": "…"}
```
오류(예외, SQLSTATE):
| 코드 | 상황 |
|---|---|
| `P0001` + `INGEST_SCHEMA` | schema_version 미지원, 필수 필드 없음, 열거값 범위 밖, `body_sections` 누락·형식 오류·이어 붙인 결과가 `body_text`와 다름 |
| `P0001` + `INGEST_RUN` | run_id 없음 또는 이미 finish된 run |
| `P0001` + `INGEST_SOURCE` | source_id가 sources에 없음/비활성 |
멱등: 같은 run_id·posting_key·content_hash로 재호출하면 `unchanged`. 유니크 위반은 ON CONFLICT로 흡수한다.

### 5.3 `jobs.report_source_run(p jsonb) → void` (래퍼 `public.collector_report_source_run`)
수집기의 로컬 run 기록 `sites[]` 항목(host, status, count, previous_count, fill_rates, warnings, notes)을 source_runs에 upsert.

### 5.4 `jobs.finish_run(p_run_id text, p_status text) → jsonb` (래퍼 `public.collector_finish_run`)
4장의 마감 판정을 수행하고 `{closed_missing, closed_deadline}` 건수 반환. runs.finished_at 기록.

### 5.5 검수: `jobs.set_override(p_posting_uid, p_field, p_value jsonb, p_note)`
래퍼 `public.admin_set_override`, service_role만(검수 화면은 서버에서 호출). 허용 field: `employment_types, career_levels, job_categories, job_subcategories, locations, company, is_global, deadline_at, hidden`. 저장 후 event `reviewed`, `postings.review_status = 'reviewed'`. `hidden=true`면 뷰에서 제외(잘못 수집된 공고 처리용).

## 6. 공개 뷰 `public.v_postings` 필드 계약 (`public-posting-v1`)

`jobs` 내부 테이블은 노출하지 않는다. 웹·자소서 툴은 이 뷰만 읽는다. 검수값 합성: `COALESCE(override.value, snapshot.payload->field)`.

| 필드 | 형 | 출처 |
|---|---|---|
| posting_uid | text | postings |
| posting_key, generation | text, int | postings |
| snapshot_id, snapshot_version, content_hash | int, int, text | current snapshot |
| group, company | text | 검수값 → payload |
| title | text | payload |
| employment_types, employment_labels, employment_raw, show_employment_raw | | 검수값 → payload (labels는 뷰에서 코드→한글 재계산) |
| career_levels, career_labels, min_years, tags | | 검수값 → payload |
| job_categories, raw_job_category | | 검수값 → payload |
| locations, is_global | | 검수값 → payload |
| posted_at, deadline_at | date | 검수값 → payload |
| body_text | text | payload |
| body_sections | jsonb | payload (자소서 툴의 직무 분석 입력) |
| source_url, source_site | text | payload url |
| status | text | `open` / `closed` (postings.status) |
| closed_at, closed_reason | | postings |
| needs_review, review_status | bool, text | postings |
| first_seen_at, last_seen_at, fetched_at(=collected_at) | timestamptz | postings / payload |
| classifier_version | text | payload |

- 뷰는 `anon`(비로그인)도 읽는다. 공고 페이지는 로그인 없이 누구나 볼 수 있다는 결정(노션 R-57)에 따른 것이며 본문·`body_sections`도 공개 대상이다.
- 공고 선택 화면: `status = 'open'`으로 필터. 마감 공고 검색은 필터를 풀면 된다(뷰는 closed도 포함, hidden만 제외).
- `body_text`·`body_sections`가 무거우면 목록용 `public.v_postings_list`(둘 다 제외)를 따로 둔다. 초안에는 둘 다 만든다.
- `public.v_posting_sections`(0004): 항목 분할을 행 단위로 펼친 뷰(posting_uid, section_no, kind, heading, text). "자격 항목만" 같은 조회용. 2026-09-24 적용.
- 뷰 필드 추가는 허용, 삭제·의미 변경은 `public-posting-v2` 뷰를 새로 만든다.

## 7. `career.application_targets`가 받는 값 (경계)

지원 시작 시 자소서 툴이 뷰의 한 행을 읽어 **그 시점의 스냅샷 id를 FK로 고정**한다. 원문·구조화 공고의 정본은 `jobs.posting_snapshots`이며(영구 보관, 6장·9장), 지원건에는 본문 전체를 다시 저장하지 않는다. (2026-09-24 확정: 하나의 제품·하나의 Supabase·영구 스냅샷이므로 복사본 방식 대신 FK 참조)

```
career.application_targets
├─ id, user_id (auth.uid())
├─ source_snapshot_id     bigint  not null
│     references jobs.posting_snapshots(id) on delete restrict
├─ company_at_application    text not null            -- 화면 표시·기록용 고정값
├─ title_at_application      text not null
├─ deadline_at_application   date
├─ status_at_application     text not null            -- 지원 시작 당시 뷰의 status
├─ snapshot_created_at    timestamptz not null default now()
└─ (문항·분석·초안 등 하위 산출물은 모두 이 행을 참조)
```
- `posting_uid`, `snapshot_version`, `content_hash`는 지원건에 중복 저장하지 않고 `source_snapshot_id`로 `jobs.posting_snapshots`를 조인해 읽는다(값 불일치 방지, 2026-09-24 결정).
- 자소서 툴이 공고 본문을 읽는 경로는 **본인 지원건이 참조한 스냅샷만** 보이는 뷰 하나다. `career.application_targets`가 있어야 정의할 수 있으므로 `0100_career_*.sql`에 둔다:
  ```sql
  create view public.v_my_posting_snapshots as          -- security definer(기본), 소유자 postgres
  select s.id, s.posting_uid, s.version, s.content_hash, s.payload, s.collected_at, a.id as application_target_id
  from jobs.posting_snapshots s
  join career.application_targets a on a.source_snapshot_id = s.id
  where a.user_id = auth.uid();
  grant select on public.v_my_posting_snapshots to authenticated;
  ```
  `authenticated`에게 `jobs.posting_snapshots` 직접 SELECT나 `REFERENCES`는 주지 않는다. FK는 마이그레이션을 실행하는 소유 역할이 만들므로 별도 권한이 필요 없다.
- `status_at_application`은 지원 시작 당시 상태이고, 뷰의 `status`는 현재 상태다. 동기화하지 않는다.
- FK가 `ON DELETE RESTRICT`이므로 지원건이 참조하는 스냅샷은 삭제할 수 없다. 9장의 "스냅샷 영구 보관"과 함께 지원건이 깨지지 않게 하는 이중 장치다.
- 스키마 간 FK는 `career` → `jobs` 방향 하나뿐이다. `jobs` 마이그레이션은 `career`를 알지 못하며, `career` 마이그레이션(GPT 툴이 작성)이 `jobs` 다음에 적용된다.
- `career.*`의 나머지 테이블(experiences, stories, cover_letters …)은 GPT 툴이 정의한다. 이 문서는 위 경계만 고정한다.

## 8. 권한과 RLS

Supabase 기본 역할만 쓴다. 별도 DB 로그인 역할은 만들지 않는다(MVP).

| 주체 | 권한 |
|---|---|
| `service_role` (서버 전용 키: 수집기 GitHub Actions 시크릿, 검수 화면 서버) | `public.collector_*` 4개와 `public.admin_set_override` EXECUTE, `jobs` 테이블 SELECT. 브라우저에 키를 넣지 않는다 |
| `anon`, `authenticated` | `public.v_postings`, `public.v_postings_list` SELECT만 |
| `authenticated` (0100_career 이후) | `public.v_my_posting_snapshots` SELECT — 본인 지원건이 참조한 스냅샷만(7장) |
| `career.*` | RLS 활성, 모든 정책 `user_id = auth.uid()`. service_role은 우회 |

PostgREST 노출 스키마: `public`(및 `career`). `jobs`는 노출하지 않는다. `jobs.*` 함수는 직접 실행 권한을 모두 회수했고, SECURITY DEFINER 래퍼는 `search_path`를 고정한다.

## 9. 삭제·보존 정책

| 데이터 | 보존 | 삭제 |
|---|---|---|
| 수집기 로컬 raw 응답 | 14일 | 수집기 `prune` |
| 수집기 로컬 snapshots/runs | 30일 | 수집기 `prune` |
| jobs.posting_snapshots | 영구 | 없음 |
| jobs.posting_events | 영구 | 없음 |
| jobs.postings (closed 포함) | 영구 | 없음. 잘못된 공고는 `hidden` 검수값으로 숨김 |
| jobs.runs / source_runs | 2년 | 관리자 배치 |
| career.application_targets 및 하위 | 사용자가 삭제할 때까지 | 사용자 본인(RLS). 삭제해도 jobs에는 영향 없음. 반대로 참조 중인 스냅샷은 FK RESTRICT로 삭제 불가 |

## 10. 진행 순서

1. 이 문서를 GPT 쪽과 대조 → 확정
2. `supabase/migrations/0001_jobs_schema.sql`, `0002_jobs_rpc.sql`, `0003_public_views.sql` 검토 (초안 동봉)
3. Supabase 프로젝트 생성, 마이그레이션 적용, service_role 키를 수집기 시크릿에 등록 (사용자 작업)
4. 수집기에 `store/supabase.py` 추가: `collector_begin_run` → `collector_ingest_posting` × N → `collector_report_source_run` → `collector_finish_run` (PostgREST rpc, service_role 키)
5. `output/*.json` 829건으로 초기 적재 후 뷰 대조
6. career 마이그레이션은 GPT 툴 쪽에서 `0100_career_*.sql`로 이 저장소에 추가(`application_targets`의 FK는 7장 규격)

## 11. 미확인·보류

- 재게시 간격 14일은 관측값이 없어 가정이다.
- 회사명 표기(companies 테이블)와 수집기 사전의 동기 방식은 2단계에서 정한다(초안: 수집기가 사전을 seed SQL로 내보냄).
- 자소서 툴이 Supabase 클라이언트(JS)로 붙는지, 서버에서 붙는지 미확인. 뷰 규격에는 영향 없다.
