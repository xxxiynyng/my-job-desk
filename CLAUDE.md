# My Job Desk (Pickd) — Claude 컨텍스트

취업 준비용 개인 지원 관리 앱. 백엔드 없이 localStorage만 사용하는 순수 클라이언트 앱.

> 📌 단일 출처: 코드/작업 규칙은 **이 파일(CLAUDE.md) 하나**가 기준(예전엔 별도 대화창 지침 md와 나뉘어 있었으나 통합함).
> 디자인 값(색·토큰·칩·상태·테이블 규칙)은 Notion「Pickd 디자인 시스템」(SSOT, 아래 링크)이 기준. 자동화는 `pickd-design-update.sh`.
>
> 이 파일이 **유일한 코드·작업 규칙 정본**이다. 위치는 코드 레포 루트 `/Users/xxxiynyng/Downloads/My_Job_Desk 19.25.06/CLAUDE.md` **하나뿐** — Claude Code(레포를 직접 엶)와 Cowork(레포를 작업 폴더로 지정)가 **같은 이 파일**을 읽는다. **사본을 만들지 않는다** — 예전 이중 사본(레포 + 별도 Cowork 폴더)이 손동기화·갈라짐의 원인이었고, 그래서 Cowork도 레포에서 작업하도록 통합했다(2026-07-05). 디자인·기획·온보딩 값은 노션 SSOT가 정본이며 여기선 링크로만 가리킨다(아래 지침 지도).

## 📍 지침 지도 (어디를 보나 — 단일 진입점)

작업 전 항상 여기서 출발한다. **표준 지침은 아래 4곳에만** 있고, 그 외 md는 임시 산출물이다.

| 구분 | 위치 | 관장 범위 |
|------|------|-----------|
| 작업·코드 규칙 (이 파일) | `CLAUDE.md` (레포 루트 단일 정본) | 스택·라우트·파일구조·컨벤션·디자인 토큰 규칙·작업 흐름·검수/롤백 |
| 제품 기획 SSOT | Notion「PICKD MVP 기획 정리본」`38b01b3f87138145a89ec4d1fa3706be` | 비전·탭1/2/3 기획·데이터모델·플로우·로드맵·미결정 |
| 디자인 SSOT | Notion「Pickd 디자인 시스템」`38e01b3f871381daac4dc686a06c3d54` | 색·타이포 토큰·컴포넌트·테이블·탭별 규칙 |
| 온보딩 SSOT | Notion「Pickd 온보딩 v2」`39301b3f871381478e31d3ea22b63b7b` | 온보딩 플로우(필수 2단계 + 점진 수집) |

- **중복 금지(가장 중요)**: 같은 규칙을 두 곳에 적지 않는다. 코드·작업=이 파일 / 디자인 값=디자인 시스템 / 제품 결정=기획 정리본 / 온보딩=온보딩 v2. 각 규칙은 **한 곳에서만 최신값** 유지.
- **임시 산출물(지침 아님)**: `PICKD_자율주행_프롬프트.md`·`터미널_지시_*.md`·`토큰_마이그레이션_계획.md` 등은 특정 작업용. 완료되면 폐기하고, 표준으로 굳은 내용만 위 4곳에 옮긴다.
- **정본은 하나**: 이 CLAUDE.md는 코드 레포 루트에만 둔다. Cowork도 레포를 작업 폴더로 열어 같은 파일을 읽으므로 **사본·수동 동기화가 없다**. 디자인 작업 문서는 레포 `docs/`에 두고, 세션 임시 산출물은 완료 후 폐기한다.

## 🧹 문서 위생 (일회용 md 남발 금지)

- **같은 선상의 작업이면 새 md를 만들지 말고 기존 문서를 업데이트**한다. 새 파일이 토큰을 아끼는 게 아니다 — 쓰는 비용은 비슷하고, 파일이 쌓일수록 이후 세션이 스캔·중복·낡음 비용을 계속 치른다. 통합할수록 지속 비용이 준다.
- **임시 산출물은 `docs/tasks/`에 모은다.** 터미널 지시·자율주행 프롬프트·마이그레이션 계획 등 1회성 문서 전용. 표준으로 굳은 내용만 CLAUDE.md/노션 SSOT로 승격.
- **실행 완료된 일회용 문서는 주기적으로 삭제**해 폴더를 깔끔히 유지한다. 레포 안이라 git 히스토리에 남으므로 삭제해도 내역은 보존됨(`git log`·`git show`로 복원).
- 확정된 규칙·결정은 문서 수를 늘리지 말고 **해당 SSOT의 최신값만** 갱신(구기록 누적 금지).

## 스택

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

## 라우트 구조 (App.tsx)

```
/onboarding     → Onboarding.tsx      온보딩 (미완료 시 / 진입이 리다이렉트)
/               → Index.tsx          지원 대시보드 (RequireOnboarded)
/jobs/:slug     → JobDetail.tsx       공고 상세
/experiences    → Experiences.tsx     경험·스펙 DB (탭: db / basic-info / files)
/basic-info     → redirect → /experiences?tab=basic-info
/files          → redirect → /experiences?tab=files
/ai-cover       → AICover.tsx
/settings       → Settings.tsx
/calendar       → Calendar.tsx
```

## 주요 파일

```
src/
├── App.tsx                              라우터 루트
├── pages/
│   ├── Index.tsx                        대시보드 (지원 현황, 오늘 할 일)
│   ├── Experiences.tsx                  경험·스펙 DB — 가장 큰 파일(~3100줄)
│   │   └── tabs: db | basic-info | files
│   ├── experiences/                     탭2 분리 모듈 — DetailEditor(상세 편집)·CopyGenerator(복사 생성)·RepExperienceViews(대표 스펙 뷰)·fieldWidgets·tableWidgets·presets·mockData
│   ├── JobDetail.tsx                    공고 상세 + 자소서 작성
│   ├── AICover.tsx                      AI 자소서 생성
│   ├── Calendar.tsx                     일정 캘린더
│   ├── Settings.tsx                     설정
│   ├── Onboarding.tsx                   온보딩 (+ onboardingData.ts)
│   └── NotFound.tsx                     404
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
│   ├── DocumentStatusList.tsx           대시보드 서류 현황 (⚠️ 목 dday 고정값)
│   ├── CalendarMini.tsx                 대시보드 미니 캘린더
│   ├── MoodRefresh.tsx                  대시보드 기분전환 카드
│   ├── calendar/                        캘린더 페이지 모듈 — MonthlyCalendar·ListHeader·ContextPanel·CreateModal·DetailModal·ProgressRing
│   └── ds/                              디자인시스템 프리미티브 — 사용 중: StatusBadge·DdayChip / 나머지 11종(Button·Card 등)은 미사용 예비
├── components/table/
│   ├── StarToggle.tsx                   중요도 별 토글 (탭1 즐겨찾기·탭2 중요도 공용)
│   ├── ColumnDivider.tsx                컬럼 리사이즈 세로 구분선 (탭1·탭2 공용, hover 전용, 색=행 구분선과 동일)
│   ├── DragHandle.tsx                   dnd-kit 드래그 핸들 뼈대 (탭1·탭2 공용)
│   ├── HeaderCell.tsx                   헤더 셀·정렬 버튼·컬럼 메뉴(정렬/필터/숨기기) (탭1·탭2 공용)
│   ├── SortableColumnHeader.tsx         드래그 가능한 컬럼 헤더 (탭1·탭2 공용, 그립=드래그 / ∨=컬럼 메뉴)
│   ├── BatchActionBar.tsx               배치 액션 바 셸 (탭1·탭2 공용, 액션 항목은 탭별 주입)
│   ├── HeaderFilter.tsx                 컬럼 필터 본문 — 컬럼 메뉴의 필터 서브메뉴에 주입 (탭1·탭2 공용)
│   └── useTableDividers.ts              컬럼 경계 실측 훅 — 세로선 위치는 th 실측값 사용 (탭1·탭2 공용)
└── hooks/
    ├── useResizableCols.tsx             컬럼 리사이즈 훅 (min/maxWidths clamp 지원)
    └── use-mobile.tsx                   shadcn 기본 훅
```

## 데이터 지속성 (localStorage 키)

```
specs.info.visibleKeys.v4    표시할 기본정보 필드 목록 (InfoKey[])
specs.info.values.v2         기본정보 필드 값 (Record<string, string>)
specs.info.hiddenValueKeys.v1 값 마스킹된 필드 목록
specs.basicPhoto.shown       증명사진 표시 여부
specs.basicPhoto.id          대표 증명사진 ID
specs.files.v1               제출파일함 파일 목록
specs.info.langExams.v1      공인외국어시험 목록 (LangExam[])
specs.rep.ids                대표 스펙 ID 목록
specs.rep.cardFields.v1      대표 스펙 카드별 표시 필드
specs.rep.view.v1            대표 스펙 뷰 모드 (card | list)
pickd.jobs.colWidths         탭1 컬럼 너비
pickd.jobs.visibleCols       탭1 표시 컬럼
pickd.jobs.colOrder          탭1 컬럼 순서(드래그로 변경)
pickd.jobs.rowOrder          탭1 행 커스텀 순서(행 그립 드래그)
pickd.jobs.sortMode          탭1 정렬 모드("custom" | 없음)
pickd.experiences.items      탭2 경험 목록(Item[], 공유 키)
pickd.experiences.visibleCols.v2  탭2 표시 컬럼
pickd.experiences.colWidths.v2  탭2 컬럼 너비
pickd.experiences.colOrder   탭2 tail 컬럼 순서(드래그로 변경, 유형·항목명 고정)
pickd.experiences.sortMode   탭2 정렬 모드("custom" | 없음)
```

## BasicInfoPanel 구조 (경험·스펙 DB > 기본정보 탭)

- **렌더 경로**: `/experiences?tab=basic-info` → Experiences.tsx → `<BasicInfoPanel />`
- **InfoKey 타입**: name, hanjaName, engName, birth, email, phone, address, school, major, grade, military, veteran, disability, national, driverLicense, portfolioUrl, github, linkedin, blog, enrollYear, gradYear, gpa, minor, transfer, gender, nationality, hsSchool, hsLocation, hsEnroll, hsGrad, hsGradStatus (총 30개)
- **공인외국어시험**: InfoKey 방식 아님 — `LangExam[]` 별도 리스트 (`specs.info.langExams.v1`). 필드: id, lang, examName, score, date, expiry
- **FIELD_GROUPS (뷰 모드)**: 인적사항 / 연락처 / 학력 / 고등학교 / 온라인 프로필 / 병역·면허 (+ 공인외국어시험 별도 렌더)
- **편집**: 뷰 모드에서 필드별 인라인 편집(hover 연필) + 전체 편집 모달(편집 버튼)

## 코딩 컨벤션

- 컴포넌트는 named export (`export function Foo`)
- 페이지 컴포넌트는 default export
- cn() 유틸로 조건부 클래스 병합 (`import { cn } from "@/lib/utils"`)
- shadcn/ui 컴포넌트는 `@/components/ui/`에서 import
- 커밋 메시지: `type(scope): 한국어 설명` (prefix: feat/fix/style/refactor/chore + 범위). **항목별 개별 커밋**(되돌림 단위).

## 반응형 범위

**데스크톱 전용 (min-width: 1280px).** 모바일·태블릿 대응은 현재 스코프 외.
Tailwind `sm:`/`md:`/`lg:` prefix가 거의 없는 것은 의도적 결정. 모바일 대응이 필요하다면 별도 작업으로 처리.

## 토스트 톤 컨벤션

**`어요` 체 통일** — `"저장됐어요"`, `"복사했어요"`, `"삭제했어요"` 형식 사용.
예외 없음 — 전 파일 sonner 통일 완료.

## 주의사항

- 백엔드 없음 — API 호출, fetch, 서버 사이드 로직 없음
- `Specs.tsx`는 삭제됨 (미연결 dead code였음, 2025-06 제거)
- localStorage 키 버전 suffix(`.v2`, `.v4`)는 breaking change 시 올릴 것

## 🚀 배포 (Vercel) — "안 반영" 재발 방지 (2026-07-05)

**정본 토폴로지: 한 레포 = Vercel 프로젝트 하나.** 현재 정본은 프로젝트 **"pickd"** 하나 · 도메인 **`pickd-seven.vercel.app`** · Production Branch = `main`. 같은 GitHub 레포에 **Vercel 프로젝트를 두 개 이상 만들지 않는다**(실험도 새 프로젝트 말고 브랜치/프리뷰로).

**왜 이 규칙이 생겼나(2026-07-05 사고):** 한 레포에 프로젝트가 3개(pickd / pickd-seven / my-job-desk) 붙어 있었다. Vercel은 프로젝트마다 `<프로젝트명>.vercel.app`을 자동 배정하므로, 이름이 같은 "pickd-seven" 프로젝트(프로덕션 배포 없음)와 실제 배포가 도는 "pickd" 프로젝트가 `pickd-seven.vercel.app` 도메인을 두고 충돌했다. 그 결과 **정상 URL을 하드리프레시·시크릿으로 열어도 낡은(빈) 프로젝트가 서빙**되어 "push해도 안 반영"으로 보였다(하루 소모). 잉여 프로젝트 2개 삭제 후 즉시 정상화.

**"배포가 안 반영" 진단 순서 (캐시는 맨 마지막에):**
1. `git rev-parse origin/main` 해시 = Vercel에 배포된 커밋 해시인가.
2. **Vercel Projects 목록에서 이 레포에 연결된 프로젝트가 하나뿐인가** — 둘 이상이면 도메인 충돌 1순위 의심(오늘의 원인). Deployments 탭이 아니라 **Projects** 목록을 볼 것.
3. 도메인 `pickd-seven.vercel.app`이 그 하나의 프로젝트에 물려 있고 최신 Production이 Ready인가.
4. **그다음에야** 브라우저 캐시(시크릿/하드리프레시) 의심.

**확인용 URL 규칙:** 반영 확인은 항상 프로덕션 도메인 `pickd-seven.vercel.app`으로. `pickd-<해시>-….vercel.app`류 배포별 URL은 스냅샷이라 안 바뀌는 게 정상.

**시각 변화 확인:** 1~2px 폰트 변경은 눈으로 판별 불가 → 스크린샷 눈대중 금지, DevTools **Computed `font-size` 수치**로 확인.

---

## 작업 방식 — 이 채팅 vs 터미널

- **코드 폴더에 접근 가능하면 이 채팅(또는 터미널 세션)에서 직접 읽고·수정하고·tsc/build로 검증하고·커밋까지 처리하는 게 기본.**
  터미널에 프롬프트만 던지고 결과를 전해 듣는 왕복 방식은 실제 코드를 못 본 채 스크린샷·설명만으로 프롬프트를 짐작해서 쓰게 되어 원인 오진단·설계 의도 유실이 반복된다 — 지양한다.
- 코드 폴더 접근이 없는 세션에서는 파일 **삭제**가 안 되는 경우가 있다(권한 제한). git lock 정리, push 등 삭제 권한이 필요한 마무리만 사람이 터미널에서 한 줄 명령으로 처리.
- 터미널에 프롬프트를 따로 만들어 넘기는 방식은 다음 경우에만 예외적으로 쓴다: 자리 비우고 도는 대량/자율주행 작업, 또는 코드 폴더 접근이 끊긴 세션.
  이때 프롬프트 형식: ① 원인/목표 한 줄 → ② 정확한 위치(파일·컴포넌트·클래스)와 변경 전→후 → ③ 자가검증(`npx tsc -p tsconfig.app.json --noEmit` 신규 에러 0 + diff 요약) → ④ 커밋 메시지.
- 코드 diff·tsc 결과 없이 "고쳤다"고 보고하지 않는다 — 직접 검증 가능하면 반드시 검증하고 결과를 함께 보고한다.

## 한눈에 — 무엇을 어디서

| 상황 | 어디서 | 방법 |
|------|--------|------|
| 색·간격·글자·클래스 수정, 버그 픽스, 판단 필요한 UI 작업 | **코드 접근 가능한 세션에서 직접** | 코드 읽고 원인 확인 → 수정 → tsc/build 검증 → 커밋까지 한 번에 |
| 감사·마이그레이션·구조 변경 | 직접 | 기획·결정 → 코드까지 직접 반영 |
| 규칙/토큰 확정·변경 | 직접 | 결정 후 SSOT에 최신값만 기록 |
| 커밋 push, git lock 등 삭제 권한 필요한 정리 | 터미널(한 줄) | 안내받은 명령어만 붙여넣기 |
| 자리 비우고 대량 작업 | 터미널(자율주행) | 권한 승인 → 끝나면 보고 |

## 작업 흐름

1. 요청 → 전문가 관점에서 검토하고, 결정이 필요한 부분만 질문으로 확정한다.
2. 확정되면 코드를 직접 읽고(추측 금지, grep으로 정확한 위치 확인) 수정한다.
3. `npx tsc -p tsconfig.app.json --noEmit` + build로 자가검증 후 커밋한다.
4. push나 삭제 권한이 필요한 정리가 남으면 터미널에 붙여넣을 한 줄 명령을 안내한다.
5. 적용 결과를 캡처로 공유하면 검수한다.
6. 확정/변경된 규칙은 SSOT에 **최신 상태값만** 기록한다(구기록·이력 누적하지 않음).

## ⭐ 디자인 일관성 원칙 (가장 중요)

- **기존 디자인 시스템을 유지·활용한다. 임의로 새 값(색/굵기/간격)을 만들지 않는다.**
- 어색하면: ① SSOT의 기존 토큰·규칙 확인 → ② 기존 컴포넌트(예: 탭1 공고명)를 재사용해 맞춤 → ③ 새 스타일 발명 금지.
- "통일"은 한쪽을 **기존 잘 된 쪽**에 맞추는 것이지, 양쪽 다 새 값으로 바꾸는 게 아니다.
- SSOT 문서도 취향대로 고치지 않는다 — 실제 확정·구현된 값만 기록한다.
- 가능하면 **공용 컴포넌트**로 묶어 같은 스타일이 한 곳에서 관리되게 한다(예: `components/table/ColumnDivider.tsx`, `DragHandle.tsx`는 탭1·탭2 공용).

## 디자인 토큰 규칙 (하드코딩 금지 — 재발 방지)

- **폰트 크기는 토큰만 쓴다. 임의 `text-[Npx]` 금지.** 스케일: `text-micro`(9) · `text-mini`(10) · `text-chip`(11) · `text-xs`(12) · `text-body`(13) · `text-sm`(14) · `text-title`(15) · `text-heading`(26). 정의 위치: `tailwind.config.ts`의 `theme.extend.fontSize`.
- **⚠️ 커스텀 fontSize 토큰을 추가하면 반드시 `src/lib/utils.ts`의 tailwind-merge(`extendTailwindMerge`의 `font-size` classGroup)에도 등록한다.** 안 하면 `cn()`의 tailwind-merge가 `text-mini` 등을 색 클래스로 오인해, **같은 `cn()`에 색 클래스(예: `text-gray-400`)가 있으면 크기 토큰을 런타임에 삭제**한다 → 배지·D-day 크기 변경이 화면에 전혀 반영 안 됨. **이게 2026-07-05 하루를 소모한 실제 근본 원인**이었다(배포·캐시·URL 전부 무죄). 커밋 `1ca1684`에서 등록해 해소.
- **색도 토큰만. 임의 `bg-[#hex]`·`text-[#hex]` 금지** — Notion 디자인 시스템 2장 색 토큰 또는 Tailwind 명명 색 사용. 테이블 헤더 행 배경은 `bg-slate-50`(surface-header-row).
- **토큰에 line-height를 싣지 않는다(크기만).** 튜플로 lineHeight를 지정하면 배지·D-day·카운트처럼 고정 높이 안에서 상속 줄간격에 의존하던 요소가 부풀어 보이는 회귀 발생(2026-07-05 실측). 줄간격 토큰화는 SSOT에 먼저 정의 후 별도로.
- **새 크기·색이 필요하면**: 먼저 토큰을 정의(SSOT 3장/2장 + `tailwind.config.ts`)하고 그 이름을 쓴다. 컴포넌트에 값을 직접 박지 않는다.
- 근거: 손으로 박은 `text-[13px]` 300여 곳이 흩어져 "한 곳 바꾸려면 300곳 수정" 문제를 낳았음(2026-07-05 토큰화). 재발 방지가 이 규칙의 목적.
- 상세 매핑·마이그레이션 계획은 git 히스토리 참조(`git show 847d4da:docs/tasks/토큰_마이그레이션_계획.md`) — 일회용 문서라 워킹트리에선 정리됨.

## 진단 규칙 (반복 삽질 방지)

- **추측으로 수정 반복 금지.** 원인은 코드에서 확인하고 짚는다.
- 정렬·간격은 **눈대중 금지 → 좌표/수치로 검증**(예: 컬럼별 좌측 x를 표로 확인).
- 안 고쳐지면 새 시도 전에 "언제/어느 요소에서" 나타나는지부터 좁힌다.
- **클래스 변경이 화면에 안 나타나면 배포·캐시·URL을 의심하기 전에 먼저 DevTools에서 렌더된 실제 `className`을 확인**한다. 넣은 클래스가 빠져 있으면 `cn()`의 tailwind-merge가 삭제한 것(→ 디자인 토큰 규칙의 tailwind-merge 등록 참조). 라이브 검증은 브라우저 콘솔에서 `getComputedStyle(el).fontSize`로 수치 확인(스크린샷 눈대중·1~2px 판별 금지).

## 검수·롤백 규칙

- **항목별 개별 커밋**(되돌림 단위). 커밋 prefix: feat/fix/style/refactor/chore + 범위.
- **세션 시작 시 기준점**: 작업 전 `git tag pre-<날짜>`(또는 작업 브랜치) → 통째 롤백 쉽게.
- **변경 후 보고**: diff 요약 + tsc 결과를 함께. 마일스톤마다 캡처로 검수.
- **롤백**: 특정 항목만 `git revert <hash>`, 세션 전체는 `git reset --hard pre-<날짜>`.

## 동기화 스크립트

- **`bash 'pickd-design-update.sh' "변경 내용"`** — 코드 수정 + Notion SSOT 업데이트를 한 번에 실행하는 자동화 스크립트(구 pickd-notion-update.sh 통합됨). 첫 실행 시 코드 폴더 경로를 두 번째 인자로 등록.

## SSOT 위치

- Notion「Pickd 디자인 시스템」 — 38e01b3f871381daac4dc686a06c3d54 (단일 출처)
- 대상: 탭1(공고 관리)·탭2(경험·스펙 DB). 핵심 가치 = "경험의 데이터 자산화".

## 🔎 검증·조기탐지 방법론 (silent 실패 방지 — 2026-07-05)

**배경**: 2026-07-05 하루를 소모한 배지·필터 크기 문제는 배포·캐시·URL이 아니라 `cn()`의 tailwind-merge가 커스텀 토큰을 런타임에 삭제한 "silent 실패"였다(소스는 맞는데 화면엔 안 나오는 부류).

**반드시(MUST)**
- 스타일·className·토큰을 바꾸면 **렌더된 결과**로 확인 — 소스가 아니라 DevTools **Computed 값** 또는 `element.className`. 소스에 클래스가 있다고 적용됐다 가정하지 않는다(cn()/tailwind-merge가 삭제 가능).
- 시각 변화는 **수치로** 확인. 1~2px은 눈으로 판별 불가 — 스크린샷 눈대중 금지.
- "기준에 맞춰라"는 요청은 **기준값을 먼저 실측**(예: 상태 배지 실제 px). 목표값 없이 추측 조정 금지.

**절대 금지(NEVER)**
- "안 바뀐다"를 캐시·URL·배포 탓으로 **먼저 단정** 금지. 순서: ① 렌더 className에 그 클래스가 있나 → ② Computed 값이 목표값인가 → ③ 배포 커밋 = origin/main인가 → ④ 그다음에야 캐시.
- 코드 diff·tsc만 보고 "고쳤다" 단정 금지 — cn() 같은 런타임 변형은 빌드 산출물·렌더에서만 드러난다.

**사전 탐지 체계(권장)**
- 커스텀 토큰 sanity 단위 테스트: `cn("text-mini bg-gray-100 text-gray-400")` 결과에 `text-mini`가 남는지 상시 감시.
- 위험 신호(하나라도 보이면 tailwind-merge 삭제 의심): ① tailwind.config에 토큰 추가했는데 `utils.ts` 미변경 ② 컴포넌트가 `cn(사이즈토큰, 색클래스)` 패턴 ③ 소스엔 있는데 렌더 className엔 없는 클래스.
