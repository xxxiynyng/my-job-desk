# My Job Desk (Pickd) — Claude 컨텍스트

취업 준비용 개인 지원 관리 앱. 현재는 백엔드 없이 localStorage만 쓰는 순수 클라이언트 앱(React + Vite).

> 📌 이 파일이 코드·작업 규칙의 **유일한 정본**이다(마스터 = 레포 루트의 이 파일). Claude Code(레포를 직접 엶)와 Cowork(레포를 작업 폴더로 지정) 모두 **같은 이 파일**을 읽는다.
> 디자인 작업공간 `~/Claude/Projects/Pickd Design/`의 CLAUDE.md는 이 파일의 **읽기 전용 미러** — 일일 헬스체크가 레포본 기준으로 단방향 동기화한다(`docs/tasks/DAILY_HEALTH_CHECK.md` §D). **미러 쪽을 직접 수정하지 않는다** — 고칠 것은 항상 레포본. 그 외 사본·수동 동기화는 만들지 않는다(2026-07-05 통합).
> 디자인·기획·온보딩 값은 Notion SSOT가 정본이며, 여기서는 링크로만 가리킨다.

## 0. 지침 지도 — 작업 전 항상 여기서 출발

| 구분 | 위치 | 관장 범위 |
|------|------|-----------|
| 작업·코드 규칙 (이 파일) | `CLAUDE.md` (레포 루트 단일 정본) | 금지사항·검증·워크플로·코드 규칙·저장소 사실 |
| 제품 기획 SSOT | Notion「PICKD MVP 기획 정리본」`38b01b3f87138145a89ec4d1fa3706be` | 비전·탭1/2/3 기획·데이터모델·플로우·로드맵·미결정 |
| 디자인 SSOT | Notion「Pickd 디자인 시스템」`38e01b3f871381daac4dc686a06c3d54` | 색·타이포 토큰·컴포넌트·테이블·탭별 규칙 |
| 온보딩 SSOT | Notion「Pickd 온보딩」`39301b3f871381478e31d3ea22b63b7b` | 온보딩 플로우 v2.2 (필수 2단계 + 선택 1단계 + 점진 수집) |
| 일일 헬스체크 | `docs/tasks/DAILY_HEALTH_CHECK.md` → 리포트 `docs/HEALTH.md` | 코드·배포·문서 정합 자동 점검 (상시 운영 문서) |

- **중복 금지(가장 중요)**: 같은 규칙을 두 곳에 적지 않는다. 코드·작업=이 파일 / 디자인 값=디자인 시스템 / 제품 결정=기획 정리본 / 온보딩=온보딩 SSOT. 각 규칙은 **한 곳에서만 최신값** 유지.
- 그 외 md는 임시 산출물: `docs/tasks/`에 모으고, 실행 완료되면 삭제한다(git 히스토리로 복원 가능). 표준으로 굳은 내용만 위 정본에 승격.

## 1. 🚫 절대 금지

- **백엔드 없음** — API 호출·fetch·서버 사이드 로직 금지. (예정된 예외: 파일함 저장소로 Notion API 프록시 도입 확정 — 기획 SSOT §4-6, 2026-07-12. 구현 착수 전에 이 규칙과 시크릿 취급 규칙을 먼저 개정할 것)
- **폰트 크기 하드코딩 금지** — 임의 `text-[Npx]` 금지, 토큰만 사용: `text-mini`(10, **최소**) · `text-chip`(11) · `text-xs`(12) · `text-body`(13) · `text-sm`(14) · `text-title`(15) · `text-h2`(22) · `text-heading`(26) · `text-display`(30). **정의 위치: `src/lib/designTokens.ts`의 `FONT_SIZE`(단일 출처) — `tailwind.config.ts`와 `src/lib/utils.ts`가 여기서 파생**(2026-07-13 통합). `text-xs`(12)·`text-sm`(14)은 Tailwind 기본이라 FONT_SIZE에 없음. `text-micro`(9px)는 제거됨(2026-07-06) — 재도입 금지(대응 토큰이 없어 CSS가 안 붙는다). eslint 룰이 `text-[Npx]`·raw hex를 warn으로 감지.
- **색 하드코딩 금지** — 임의 `bg-[#hex]`·`text-[#hex]` 금지. 색 값은 디자인 SSOT 2장이 정본. 파랑은 raw `blue-500`/`blue-600` 클래스 직접 사용 금지 — 역할 토큰(`action`=채움 버튼 / `brand`=표시)만 사용(디자인 SSOT §0 원칙 11, 2026-07-12).
- **⚠️ 폰트 토큰은 `src/lib/designTokens.ts`의 `FONT_SIZE` 한 곳에만 추가** — `tailwind.config.ts`(유틸 생성)와 `src/lib/utils.ts`(tailwind-merge `font-size` classGroup)가 이 객체를 `import`해 파생하므로 자동 동기화된다. 안 하면 `cn()`이 같은 호출의 색 클래스와 충돌로 보고 크기 토큰을 런타임 삭제한다(2026-07-05 사고, 부록 참조). 두 곳에 손으로 맞춰 적던 옛 구조가 그 뿌리였고, 단일 출처화로 원인 제거(2026-07-13). 파생 테스트 `src/test/design-tokens.test.ts`가 `FONT_SIZE`를 순회하며 회귀를 자동 차단.
- **토큰에 line-height 금지**(크기만). 줄간격 토큰화는 SSOT에 먼저 정의 후 별도로.
- **임의 새 디자인 값(색/굵기/간격) 발명 금지** — 어색하면 ① SSOT의 기존 토큰·규칙 확인 → ② 기존 컴포넌트 재사용 → ③ 그래도 필요하면 토큰을 먼저 정의(SSOT + `tailwind.config.ts`)하고 그 이름을 쓴다. "통일"은 한쪽을 **기존 잘 된 쪽**에 맞추는 것이지 양쪽을 새 값으로 바꾸는 게 아니다.
- **SSOT 문서 취향 수정 금지** — 실제 확정·구현된 값만 기록하고, 최신 상태값만 유지한다(구기록·이력 누적 금지).
- **추측 수정 반복 금지** — 원인은 코드에서 확인하고 짚는다. 코드 diff·tsc 결과 없이 "고쳤다"고 보고하지 않는다.
- **같은 선상의 작업에 새 md 만들기 금지** — 기존 문서를 업데이트한다. 파일이 쌓일수록 이후 세션이 스캔·중복·낡음 비용을 치른다.

## 2. 🔎 검증 사다리 — "안 바뀐다" / "고쳤다" 판정 순서

스타일·클래스 변경이 화면에 안 보이면 **이 순서대로만** 의심한다. 캐시·배포 탓 먼저 단정 금지:

1. DevTools에서 **렌더된 실제 `className`**에 그 클래스가 있는가 — 없으면 `cn()`/tailwind-merge가 삭제한 것(§1 등록 규칙 참조).
2. **Computed 값이 목표 수치인가** — 1~2px은 눈으로 판별 불가. `getComputedStyle(el).fontSize` 등 수치로 확인, 스크린샷 눈대중 금지.
3. `git rev-parse origin/main` 해시 = Vercel에 배포된 커밋 해시인가.
4. **Vercel Projects 목록**에서 이 레포에 연결된 프로젝트가 **하나뿐**인가 — 둘 이상이면 도메인 충돌 1순위(2026-07-05 사고, 부록). Deployments 탭이 아니라 Projects 목록을 볼 것.
5. 도메인 `pickd-seven.vercel.app`이 그 프로젝트에 물려 있고 최신 Production이 Ready인가. 반영 확인은 **항상 이 프로덕션 도메인**으로 — `pickd-<해시>-….vercel.app`류 배포별 URL은 스냅샷이라 안 바뀌는 게 정상.
6. **그다음에야** 브라우저 캐시(시크릿/하드리프레시).

- "기준에 맞춰라"는 요청은 **기준값을 먼저 실측**(예: 상태 배지 실제 px). 목표값 없이 추측 조정 금지. 정렬·간격도 좌표/수치로 검증.
- 자가검증 명령: `npx tsc -p tsconfig.app.json --noEmit`(신규 에러 0) + `npm run build` + `npm test`(vitest).
- 사전 탐지: cn() sanity 테스트 구현됨 — `src/test/design-tokens.test.ts`가 `FONT_SIZE` 순회로 `cn("text-<token> text-gray-400")`에 토큰이 남는지 검증(`npm test`). 단일 출처화로 "① config에 토큰 추가했는데 `utils.ts` 미변경" 위험은 구조적으로 소멸. 남은 위험 신호: 소스엔 있는데 렌더 className엔 없는 클래스.

## 3. 작업 프로토콜

1. 요청 → 전문가 관점에서 검토하고, **결정이 필요한 부분만 질문으로 확정**한다(임의 확정 금지).
2. 확정되면 코드를 직접 읽고(추측 금지, grep으로 정확한 위치 확인) 수정한다. 코드 접근 가능한 세션에서는 직접 읽고·수정하고·검증하고·커밋까지 처리하는 게 기본.
3. §2의 자가검증 후 커밋한다.
4. 변경 후 보고: diff 요약 + tsc 결과를 함께. 마일스톤마다 캡처로 검수.
5. 확정/변경된 규칙은 해당 SSOT에 **최신 상태값만** 기록한다.

- **커밋**: `type(scope): 한국어 설명` (prefix: feat/fix/style/refactor/chore + 범위). **항목별 개별 커밋**(되돌림 단위).
- **기준점**: 세션 시작 시 `git tag pre-<날짜>`(또는 작업 브랜치). 롤백: 특정 항목만 `git revert <hash>`, 세션 전체는 `git reset --hard pre-<날짜>`.
- **터미널 프롬프트 위임은 예외 2경우만** — 자리 비우고 도는 대량/자율주행 작업, 또는 코드 폴더 접근이 끊긴 세션. 프롬프트 형식: ① 원인/목표 한 줄 → ② 정확한 위치(파일·컴포넌트·클래스)와 변경 전→후 → ③ 자가검증(tsc 신규 에러 0 + diff 요약) → ④ 커밋 메시지.
- push, git lock 정리 등 삭제 권한이 필요한 마무리만 사람이 터미널에서 한 줄 명령으로 처리.

## 4. 코드 규칙

- 컴포넌트는 named export(`export function Foo`) / 페이지 컴포넌트는 default export.
- `cn()` 유틸로 조건부 클래스 병합(`import { cn } from "@/lib/utils"`). shadcn/ui 컴포넌트는 `@/components/ui/`에서 import.
- 토스트는 sonner, **"~어요" 체 통일**(예: "저장됐어요", "복사했어요").
- **데스크톱 전용(min-width: 1280px)** — `sm:`/`md:`/`lg:` prefix가 거의 없는 것은 의도적 결정. **예외: 온보딩 화면 파일만 반응형 허용**(온보딩 SSOT §8-A, 2026-07-06 확정 — 모바일 유입 대응).
- localStorage 키는 breaking change 시 버전 suffix(`.vN`) 상향.
- 같은 스타일은 **공용 컴포넌트**로 묶어 한 곳에서 관리(`components/table/`의 ColumnDivider·DragHandle·HeaderCell 등이 탭1·탭2 공용 사례).
- 테이블 헤더 행 배경 = `bg-slate-50`(surface-header-row). 그 외 디자인 값·컴포넌트 규칙은 디자인 SSOT 참조.

## 5. 저장소 사실 (코드가 정본 — 이 절이 코드와 어긋나면 코드가 맞고, 이 절을 갱신한다)

### 스택

| 역할 | 라이브러리 |
|------|-----------|
| 프레임워크 | React 18 + TypeScript + Vite |
| 라우팅 | react-router-dom v6 |
| 스타일 | Tailwind CSS + shadcn/ui (Radix UI 기반) |
| 아이콘 | lucide-react |
| 토스트 | sonner |
| 상태 | localStorage (서버/DB 없음) |
| 날짜 | date-fns |
| 드래그 | @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities |
| 문서 내보내기 | xlsx (Excel), docx (Word). PDF는 브라우저 인쇄(라이브러리 없음) |
| 테스트 | vitest (`npm test`) |

- 명령: `npm run dev` / `npm run build` / `npm test` / `npm run lint` / `npx tsc -p tsconfig.app.json --noEmit`
- 패키지 매니저: **npm**(package-lock.json). ⚠️ `bun.lock`·`bun.lockb`는 잔재 — 사용 금지(삭제 여부 미확정).

### 라우트 구조 (App.tsx)

```
/onboarding     → Onboarding.tsx      온보딩 (미완료 시 / 진입이 리다이렉트)
/               → Index.tsx           지원 대시보드 (RequireOnboarded)
/jobs/:slug     → JobDetail.tsx       공고 상세
/experiences    → Experiences.tsx     경험·스펙 DB (탭: db / basic-info / files)
/basic-info     → redirect → /experiences?tab=basic-info
/files          → redirect → /experiences?tab=files
/ai-cover       → AICover.tsx
/settings       → Settings.tsx
/calendar       → Calendar.tsx
```

### 주요 파일

```
src/
├── App.tsx                              라우터 루트
├── pages/
│   ├── Index.tsx                        대시보드 (지원 현황, 오늘 할 일)
│   ├── Experiences.tsx                  경험·스펙 DB (~1600줄)
│   │   └── tabs: db | basic-info | files
│   ├── experiences/                     탭2 분리 모듈 — DetailEditor·CopyGenerator·RepExperienceViews·fieldWidgets·tableWidgets·presets·mockData
│   ├── JobDetail.tsx                    공고 상세 + 자소서 작성
│   ├── AICover.tsx                      AI 자소서 생성
│   ├── Calendar.tsx                     일정 캘린더
│   ├── Settings.tsx                     설정
│   ├── Onboarding.tsx                   온보딩 (+ onboardingData.ts, ProfileCompletionCard 포함)
│   └── NotFound.tsx                     404
├── data/
│   ├── basicInfoFields.ts               ★ InfoKey(34종)·INFO_FIELDS·기본정보 LS 키 상수의 정본
│   └── calendarData.ts                  캘린더 데이터 소스
├── components/pickd/
│   ├── PickdSidebar.tsx                 좌측 60px 아이콘 사이드바
│   ├── BasicInfoPanel.tsx               기본정보 탭 (Experiences에서 렌더)
│   ├── FilesPanel.tsx                   파일함 탭
│   ├── DashboardHeader.tsx              대시보드 상단
│   ├── JobPostingTable.tsx              공고 목록 테이블 (탭1)
│   ├── JobRegistrationModal.tsx         공고 등록 모달
│   ├── QuickJobRegistration.tsx         공고 빠른 등록
│   ├── StatusManagementModal.tsx        상태 관리 모달 (일정·할일 포함)
│   ├── RowContextMenu.tsx               행 그립·컨텍스트 메뉴 (탭1·탭2 공용)
│   ├── TodayPanel.tsx                   대시보드 오늘 패널
│   ├── DocumentStatusList.tsx           대시보드 서류 현황 (목데이터, dday는 calcDday 실계산)
│   ├── CalendarMini.tsx                 대시보드 미니 캘린더
│   ├── MoodRefresh.tsx                  대시보드 기분전환 카드
│   ├── TrashPanel.tsx                   전역 통합 휴지통 뷰 (설정>데이터 관리에서 렌더)
│   ├── ExportModal.tsx                  내보내기 2스텝 모달 (탭2, 값→형식 Excel/Word/PDF)
│   ├── calendar/                        캘린더 페이지 모듈 — MonthlyCalendar·ListHeader·ContextPanel·CreateModal·DetailModal·ProgressRing
│   └── ds/                              디자인시스템 프리미티브 — 사용 중: StatusBadge·DdayChip / 나머지 11종은 미사용 예비
├── components/table/                    탭1·탭2 공용 테이블 부품
│   ├── StarToggle / ColumnDivider / DragHandle / HeaderCell / SortableColumnHeader
│   ├── BatchActionBar / HeaderFilter / useTableDividers
├── hooks/
│   ├── useResizableCols.tsx             컬럼 리사이즈 훅
│   └── use-mobile.tsx                   shadcn 기본 훅
├── lib/
│   ├── designTokens.ts                  ★ 폰트 크기 토큰 FONT_SIZE 단일 출처 — config·utils가 파생 (§1)
│   ├── utils.ts                         cn() + tailwind-merge (FONT_SIZE에서 파생 등록, §1 참조)
│   ├── trash.ts                         전역 통합 휴지통 스토어 (pickd.trash.v1, 소프트삭제·복원·14일 purge)
│   ├── exportExperiences.ts             내보내기 생성기 (Excel=xlsx·Word=docx·PDF=브라우저 인쇄)
│   └── csv.ts                           CSV 내보내기 (탭1 JobPostingTable 사용)
└── test/                                vitest — example.test.ts + design-tokens.test.ts(cn 폰트 토큰 보존, §2)
```

### 데이터 지속성 (localStorage 키)

```
specs.info.visibleKeys.v4          표시할 기본정보 필드 목록 (InfoKey[])
specs.info.values.v2               기본정보 필드 값
specs.info.langExams.v1            공인외국어시험 목록 (LangExam[])
specs.basicPhoto.shown / .id       증명사진 표시 여부 / 대표 증명사진 ID
specs.files.v2                     제출파일함 파일 목록
specs.settings.jobPrefs.v1         설정 > 직무 선호 (Settings.tsx)
pickd.jobs.colWidths / visibleCols / colOrder / colPinned / rowOrder / sortMode
                                   탭1 테이블 뷰 상태 (너비·표시·순서·고정·행순서·정렬모드)
pickd.experiences.items            탭2 경험 목록 (Item[])
pickd.experiences.visibleCols.v2 / colWidths.v2 / colOrder / colPinned / sortMode
                                   탭2 테이블 뷰 상태
pickd.experiences.export.fields.v1 / format.v1   내보내기 마지막 선택 (필드/형식)
pickd.trash.v1                     전역 통합 휴지통 스냅샷 (14일 보관 후 자동 purge)
pickd.onboarding.state.v1 / done.v1   온보딩 진행 상태(재개용) / 완료 플래그
pickd.profile.v1                   온보딩 프로필 (PickdProfileV1 — 온보딩 SSOT §4 데이터 계약)
cal.tasks.v1 / cal.carriedOver.v1  캘린더 할 일 / 이월 기록 (Calendar.tsx)
```

> 이 목록의 정본은 코드다. 전수 확인: `grep -rhoE '"(specs|pickd|cal)\.[A-Za-z.0-9]+"' src | sort -u`
> 소프트삭제: Item·FileItem에 `deletedAt?: number`(epoch ms) — 없으면 활성, 있으면 휴지통. 활성 뷰는 `deletedAt == null`만 노출. 공고(Job)는 목데이터(미저장)라 휴지통 제외(저장 이전 후 편입 예정).

### 기본정보 (경험·스펙 DB > 기본정보 탭)

- 렌더 경로: `/experiences?tab=basic-info` → Experiences.tsx → `<BasicInfoPanel />`
- **InfoKey 34종·필드 정의의 정본 = `src/data/basicInfoFields.ts`** (문서에 목록을 중복 기재하지 않는다)
- 공인외국어시험은 InfoKey 방식 아님 — `LangExam[]` 별도 리스트(`specs.info.langExams.v1`). 필드: id, lang, examName, score, date, expiry
- FIELD_GROUPS(뷰 모드): 인적사항 / 연락처 / 학력 / 고등학교 / 온라인 프로필 / 병역·면허 (+ 공인외국어시험 별도 렌더)
- 편집: 뷰 모드 인라인 편집(hover 연필) + 전체 편집 모달

### 도메인 용어 (처음 읽는 세션용)

탭1 = 지원 대시보드(공고 관리, Index.tsx) · 탭2 = 경험·스펙 DB(Experiences.tsx) · 탭3 = AI 자소서(기획 단계, 미구현) · 공고 = Job · 경험 = Item · 대표 스펙 = 탭2에서 카드로 뽑아 쓰는 대표 경험 · 픽 카드 = 온보딩에서 만드는 프로필 카드 · 전형 6단계 = 작성중/지원완료/서류전형/필기전형/면접전형/전형완료(+finalResult 배지)

## 6. 🚀 배포 (Vercel)

- **한 레포 = Vercel 프로젝트 하나.** 정본은 프로젝트 **"pickd"** 하나 · 도메인 **`pickd-seven.vercel.app`** · Production Branch = `main`. 실험도 새 프로젝트 말고 브랜치/프리뷰로.
- **이 레포는 프로토타입.** 실서비스 도메인 **`pickd.ai.kr`은 프론트팀의 별도 Vercel** 소관(2026-07-22 확인) — 이 레포의 배포·rewrite·설문 엔드포인트는 실도메인에 영향 없음. 실도메인 랜딩 설문 연결은 `docs/tasks/랜딩설문-프론트팀-핸드오프.md`로 프론트팀에 이관.
- **랜딩페이지**: `public/landingpage.html`(마케팅·베타 설문, 앱과 별개 정적 페이지 — 디자인은 별도 "랜딩페이지 디자인 시스템" 문서). `vercel.json`에 `/` → `/landingpage.html` rewrite가 있으나 **현재 미작동**(정적 index.html 파일시스템 매치가 우선 — HEALTH.md B-1, 해소 시 이 문구 갱신). 설문 제출은 `CONFIG.formEndpoint`로 POST — 외부 폼 수신 서비스 사용은 §1 "백엔드 없음" 규칙의 예외(서버 사이드 로직 아님).
- "배포가 안 반영" 진단은 §2 검증 사다리의 3~6번 순서로.

## 7. 문서 위생·자동화

- 임시 산출물은 `docs/tasks/`에 모으고, 실행 완료되면 주기적으로 삭제(git 히스토리 보존, `git log`·`git show`로 복원).
- 확정된 규칙·결정은 문서 수를 늘리지 말고 해당 SSOT의 최신값만 갱신.
- 동기화 스크립트: `pickd-design-update.sh` — 코드 수정 + Notion SSOT 업데이트 자동화(구 pickd-notion-update.sh 통합). 위치는 레포 밖 `/Users/xxxiynyng/Claude/Projects/Pickd Design/`(디자인 SSOT §9-4). ⚠️ 통합 여부·경로가 디자인 SSOT §9-4의 2스크립트 서술과 어긋남 — 확인 후 한쪽으로 정리 필요.

## 부록 — 사고 아카이브 (배경은 여기 한 줄씩만)

- **2026-07-05 tailwind-merge**: 커스텀 폰트 토큰 미등록으로 `cn()`이 크기 토큰을 런타임 삭제 — "소스는 맞는데 화면엔 안 나옴"으로 하루 소모. 배포·캐시·URL 전부 무죄였다. 해소 커밋 `1ca1684`. → §1 등록 규칙, §2 사다리 1번.
- **2026-07-05 Vercel 도메인 충돌**: 한 레포에 프로젝트 3개(pickd/pickd-seven/my-job-desk)가 붙어 낡은 프로젝트가 정상 URL을 서빙 — "push해도 안 반영"으로 하루 소모. 잉여 2개 삭제로 해소. → §6, §2 사다리 4번.
- **2026-07-05 토큰화**: 손으로 박은 `text-[13px]` 300여 곳 → 토큰화. 계획서는 `git show 847d4da:docs/tasks/토큰_마이그레이션_계획.md`. 잔여 하드코딩 ~30곳은 기획 SSOT 기술 백로그에서 추적.
- **2026-07-06 text-micro 제거**: 9px 폐기, 최소 10px(`text-mini`)로 통일(커밋 `1b20fd6`·`da43c30`).
- **2026-07-13 폰트 토큰 단일 출처화**: `designTokens.ts`(FONT_SIZE)로 통합해 config·utils 손동기화 제거(2026-07-05 사고 원인 소멸), 하드코딩 `text-[Npx]` 30곳 토큰화(반픽셀 18곳 반올림·값동일 9곳·헤딩 3곳), `h2`(22)·`display`(30) 신설, 죽은 헤딩 CSS 변수 제거, 파생 테스트 + eslint 금지룰(warn) 추가. 커밋 `1271a0b`→`a3a6a73`(6개).
- **2025-06**: 미연결 dead code `Specs.tsx` 삭제.
