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
  - 단서(2026-07-30): 탭2 `src/features/experiences/story/api.ts`의 `tab2Api`는 **서버 경계로 설계**돼 있으나 현재 목 구현(`api.mock.ts`)이라 이 규칙을 지킨다. 실서버(`api.server.ts`) 교체 착수 전에 이 규칙을 먼저 개정할 것.
- **폰트 크기 하드코딩 금지** — 임의 `text-[Npx]` 금지, 토큰만 사용: `text-mini`(11, **최소**) · `text-chip`(12) · `text-xs`(13) · `text-body`(14) · `text-sm`(15) · `text-title`(17) · `text-h2`(24) · `text-heading`(29) · `text-display`(33) — 전부 1.0배 스케일(10·11·12·13·14·15·22·26·30)에 ×1.1 반올림한 값이다(2026-07-30 배율 도입). **정의 위치: `src/lib/designTokens.ts`의 `FONT_SIZE`(단일 출처) — `tailwind.config.ts`와 `src/lib/utils.ts`가 여기서 파생**(2026-07-13 통합). `text-xs`·`text-sm`은 Tailwind 기본 토큰이라 `FONT_SIZE`가 아니라 같은 파일의 `TW_BASE_FONT_SIZE_OVERRIDE`에서 덮어쓴다(벤더 컴포넌트가 대량으로 써서 안 덮으면 화면이 섞인다). 여기에만 line-height를 함께 적는데, Tailwind 기본값이 원래 [크기, 줄간격] 쌍이라 크기만 덮으면 세로 리듬이 무너지기 때문 — 줄간격은 rem으로 두어 노브를 탄다. `text-micro`(9px)는 제거됨(2026-07-06) — 재도입 금지(대응 토큰이 없어 CSS가 안 붙는다). eslint 룰이 `text-[Npx]`·raw hex를 warn으로 감지.
- **색 하드코딩 금지** — 임의 `bg-[#hex]`·`text-[#hex]` 금지. 색 값은 디자인 SSOT 2장이 정본. 파랑은 raw `blue-500`/`blue-600` 클래스 직접 사용 금지 — 역할 토큰(`action`=채움 버튼 / `brand`=표시)만 사용(디자인 SSOT §0 원칙 11, 2026-07-12).
- **⚠️ 폰트 토큰은 `src/lib/designTokens.ts`의 `FONT_SIZE` 한 곳에만 추가** — `tailwind.config.ts`(유틸 생성)와 `src/lib/utils.ts`(tailwind-merge `font-size` classGroup)가 이 객체를 `import`해 파생하므로 자동 동기화된다. 안 하면 `cn()`이 같은 호출의 색 클래스와 충돌로 보고 크기 토큰을 런타임 삭제한다(2026-07-05 사고, 부록 참조). 두 곳에 손으로 맞춰 적던 옛 구조가 그 뿌리였고, 단일 출처화로 원인 제거(2026-07-13). 파생 테스트 `src/test/design-tokens.test.ts`가 `FONT_SIZE`를 순회하며 회귀를 자동 차단.
- **UI 배율은 노브 하나로만 바꾼다** — 여백·크기·라운드는 `src/index.css`의 `--ui-scale`(현재 1.1)이 루트 폰트(`font-size: calc(100% * var(--ui-scale))`)와 px CSS 변수를 함께 끌어올린다. Tailwind 기본 유틸(`p-4`·`gap-3`·`h-10`·`rounded-lg` …)은 전부 rem이라 자동으로 따라온다 — **`p-4`는 16px가 아니라 17.6px다.** TS 쪽 짝은 `designTokens.ts`의 `UI_SCALE`(localStorage px 마이그레이션용)이고, 두 값이 갈라지지 않게 `design-tokens.test.ts`가 묶어 검증한다.
- **임의 크기값은 px가 아니라 rem** — `w-[60px]`이 아니라 `w-[3.75rem]`(= px÷16). px로 적으면 노브를 못 타서 그 요소만 옛 크기로 남는다. **예외: 헤어라인·미세 오프셋(≤2px)은 px 유지**(1px 선은 1.1px가 되면 흐려진다). 아이콘은 `size={16}` 같은 px prop 대신 `className="w-4 h-4"`(rem)를 쓴다 — 기존 `size={N}` 18곳은 ×1.1 정수로 박아 두었다.
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

### 🚨 세션 병행 규칙 (2026-07-29 사고 후 신설)

**한 레포에 코드를 쓰는 세션은 하나만 둔다.** 각 세션은 자기가 마지막으로 읽은 파일 지도를 기억한다.
그 사이 다른 세션이 구조를 바꾸면, **사라진 경로에 파일을 쓰게 되고 그 작업은 앱에 연결되지 않은 채 tsc만 깬다.**

1. **구조를 바꾼 직후에는 열려 있던 다른 세션을 닫고 새로 연다.** 새 세션은 바뀐 구조를 읽고 시작한다.
2. 역할을 나눈다 — **코드는 한 세션, 기획·문서는 다른 세션.** 같은 파일을 두 세션이 쓰지 않게.
3. 코드 세션이 아닌 쪽은 **레포에 git 명령을 돌리지 않는다.** 마운트로 붙은 세션은 `.git/index.lock`을 만들고 지우지 못해 로컬 git이 막힌다.
4. 작업 시작 전 `git status`로 **모르는 미추적 파일이 없는지** 확인한다. 옛 경로(`src/pages/`·`components/pickd/`)에 파일이 있으면 다른 세션이 구식 지도로 쓴 것이다 — **지우지 말고** 3-way 머지로 현행 구조에 이식한다:
   `git merge-file -p <현행> <갈라진 지점의 원본> <옛 경로 파일>`

## 4. 코드 규칙

- 컴포넌트는 named export(`export function Foo`) / 페이지 컴포넌트는 default export. 페이지는 default 하나만 두고 **재수출 배럴로 쓰지 않는다**(정본이 페이지에 있다는 착시를 만든다). **파일 밖에서 안 쓰는 심볼에는 `export`를 붙이지 않는다** — public API인 척하는 내부 함수는 매번 grep을 부른다.
- `cn()` 유틸로 조건부 클래스 병합(`import { cn } from "@/lib/utils"`). shadcn/ui 컴포넌트는 `@/components/ui/`에서 import.
- 토스트는 sonner, **"~어요" 체 통일**(예: "저장됐어요", "복사했어요").
- **데스크톱 전용(min-width: 1280px)** — `sm:`/`md:`/`lg:` prefix가 거의 없는 것은 의도적 결정. **예외: 온보딩 화면 파일만 반응형 허용**(온보딩 SSOT §8-A, 2026-07-06 확정 — 모바일 유입 대응).
- localStorage 키는 breaking change 시 버전 suffix(`.vN`) 상향.
- 같은 스타일은 **공용 컴포넌트**로 묶어 한 곳에서 관리(`components/table/`의 ColumnDivider·DragHandle·HeaderCell 등이 탭1·탭2 공용 사례). 묶을지 둘지는 아래 통합 판정표로 정한다.
- 테이블 헤더 행 배경 = `bg-slate-50`(surface-header-row). 그 외 디자인 값·컴포넌트 규칙은 디자인 SSOT 참조.

### 통합 판정 — 무엇을 합치고 무엇을 두는가 (2026-07-29 확정)

같은 코드가 여러 곳에 있을 때, 합칠지 둘지는 이 표로 판정한다. **판정 기준은 "코드가 비슷한가"가 아니라 "결과가 같은가"다.**

| 판정 | 조건 | 처리 |
|---|---|---|
| **합친다** | 렌더 DOM·클래스·실행 결과가 **완전히 동일** | 공용화 |
| **일부만 합친다** | 공통 코어는 같고 주변이 다름 | **코어만** 뽑고 차이는 호출부에 남긴다 |
| **두고 기록한다** | 경계값·시간대·문구·이펙트 순서가 다름 | 손대지 않고 이유를 주석으로 남긴다 |

- **훅 추출은 기본적으로 "두고 기록한다"에 넣는다** — `useState`/`useEffect`가 훅 안으로 들어가면 이펙트 등록 순서와 첫 렌더 내용이 바뀔 수 있다. **순수 함수·팩토리 추출만 안전으로 본다.**
- 현행 사례(2026-07-30 실측):
  - **두고 기록한다** — `sortMode` 저장 포맷이 탭1은 JSON(`JSON.stringify("custom")`), 탭2는 생문자열(`setItem(k, "custom")`). 키가 별개라 합칠 실익이 없고, 포맷을 맞추면 기존 저장값이 깨진다.
  - **일부만 합친다** — D-day는 계산(`calcDday`)·라벨(`ddayLabel`)만 `lib/dday.ts`로 뽑고, **색 규칙은 화면마다 남겼다**(`TodayPanel.ddayColor`·`ddayCls`·`DdayChip` 3벌). 0일 표기가 `"D-Day"`/`"오늘"`로 갈리던 4벌은 2026-07-30 `daf3a36`으로 통일 완료 — 더 이상 "두고 기록한다" 사례가 아니다.
  - **합친다(단, 동작은 보존)** — 날짜 변환 3갈래는 `lib/date.ts`의 `toISODate`로 통합했다. 셋의 **결과가 같았기 때문**이며, `toISOString()`이 UTC라 KST 자정 경계에서 하루 밀리는 특성까지 그대로 뒀다. 통합은 동작을 고치는 자리가 아니다(§5 구조 규칙 6번).

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
/onboarding     → features/onboarding/OnboardingPage.tsx   (미완료 시 / 진입이 리다이렉트)
/               → features/jobs/DashboardPage.tsx          지원 대시보드 (RequireOnboarded)
/jobs/:slug     → features/jobs/JobDetailPage.tsx          공고 상세
/experiences    → features/experiences/ExperiencesPage.tsx 경험·스펙 DB (탭: db / basic-info / files)
/basic-info     → redirect → /experiences?tab=basic-info
/files          → redirect → /experiences?tab=files
/ai-cover       → features/ai-cover/AICoverPage.tsx
/settings       → features/settings/SettingsPage.tsx
/calendar       → features/calendar/CalendarPage.tsx
```

### 주요 파일

> **구조 규칙 (2026-07-29 재편, 2026-07-30 5~6번 추가 — 구 `REFACTOR_RULES.md` 흡수)**
> 1. 한 기능에서만 쓰는 파일은 `features/<기능>/` 안에 둔다. 2개 이상 기능이 쓰면 공용(`components/`·`hooks/`·`lib/`·`data/`)으로 승격한다. 승격 대상 판정: `app/`=앱 진입 셸 · `data/`=화면을 모른다 · `lib/`=React를 모른다.
> 2. 기능 폴더 내부: `<Name>Page.tsx`(라우트 진입, default export) · `components/`(기능 전용 UI) · `model/`(기능 전용 타입·상수·데이터).
> 3. 의존 방향은 `features/ → components/·lib/·data/` 단방향. 역방향(공용이 features를 import) 금지, `data/ → components/` 금지(순수 유틸은 `lib/`로).
> 4. 도메인 결합이 없는 범용 유틸은 사용처가 1곳이어도 `lib/`에 둔다(예: `csv.ts`). 도메인에 묶이면 기능 폴더로(예: `exportExperiences.ts`).
> 5. **서브도메인 폴더 허용** — 기능 폴더 안에 `components/`·`model/` 외 세 번째 폴더를 둘 수 있다(현재 유일 사례 `features/experiences/story/`). 조건: **자체 스토어·서버 경계·타입을 갖고 기능 안에서 독립적으로 유지되는 단위**일 것. `model/`·`components/`로 쪼개면 "서버 붙으면 `api.ts` 한 줄만 교체"라는 경계가 세 곳으로 흩어지므로 폴더째 유지한다.
> 6. **리팩토링 제1원칙: 기존 동작과 UI 렌더 결과의 완전한 보존.** 위 규칙보다 항상 우선한다 — 규칙을 지키려다 렌더가 1px이라도 달라지면 규칙을 어기고 현행을 유지한 뒤 보고에 기록한다. import는 파일 최상단 한 블록에만 둔다.

```
src/
├── main.tsx                             엔트리 (index.html이 참조 — 위치 고정)
├── index.css
├── app/                                 셸 (거의 안 바뀜)
│   ├── App.tsx                          라우터 루트 + RequireOnboarded
│   └── NotFoundPage.tsx
├── features/                            ★ 기능별 — 수정이 가장 잦은 영역
│   ├── jobs/                            탭1 지원 대시보드(공고)
│   │   ├── DashboardPage.tsx            대시보드 (구 pages/Index.tsx)
│   │   ├── JobDetailPage.tsx            공고 상세 + 자소서 문항
│   │   ├── components/                  DashboardHeader·MoodRefresh·JobPostingTable·DocumentStatusList
│   │   │                                ·StatusManagementModal·QuickJobRegistration·FallbackUploadModal
│   │   │                                ·TodayPanel·TodayMiniCalendar(구 CalendarMini)
│   │   └── model/                       jobTypes.ts·jobsMock.ts·jobDetailMock.ts
│   ├── experiences/                     탭2 경험·스펙 DB
│   │   ├── ExperiencesPage.tsx          탭 셸 + db 탭 (~1500줄)
│   │   ├── components/                  BasicInfoPanel·FilesPanel·ExportModal·DetailEditor
│   │   │                                ·CopyGenerator·RepExperienceViews·fieldWidgets·tableWidgets
│   │   ├── model/                       presets.ts(도메인 모델 Item·PRESETS)·mockData.ts
│   │   │                                ·basicInfoFields.ts(★InfoKey 34종 정본)·exportExperiences.ts
│   │   │                                ·files.ts(FileItem 타입·파일함 스토어)
│   │   └── story/                       ★ 소재·역량 서브도메인 (구조 규칙 5번 — 폴더째 유지)
│   │                                    model.ts(★Story·NCS 10축·NCS_SUB·커버리지 셀렉터
│   │                                      ·DEMAND_SEED·BASELINE_DEMAND)
│   │                                    store.ts(pickd.stories.v1, useSyncExternalStore)
│   │                                    api.ts(★서버 경계 tab2Api — 교체 지점)·api.mock.ts
│   │                                    useStoryFlow.ts(페이지 배선 훅)
│   │                                    entryOptions.ts(칩↔프리셋 단일 출처)·writingAids.ts
│   │                                    InterviewMode·ExtractReview·ImportFlow·CompetencyView
│   │                                    ·StorySection·StoryBits·TypingDots
│   │                                    __tests__/invariants.test.ts(불변식 8군)
│   ├── ai-cover/                        탭3 AI 자소서
│   │   ├── AICoverPage.tsx
│   │   ├── components/                  EssayEditor·JobSelectView·PipelineView·QuestionPager
│   │   │                                ·SuggestionBlock·ExpCard·PanelParts
│   │   └── model/                       aiCoverMock.ts·essayCache.ts·spellRules.ts
│   ├── calendar/                        CalendarPage.tsx + components/(MonthlyCalendar·ContextPanel
│   │                                    ·CreateModal·DetailModal·ListHeader·ProgressRing)
│   ├── onboarding/                      OnboardingPage.tsx + model/onboardingData.ts
│   └── settings/                        SettingsPage.tsx + components/TrashPanel.tsx
├── components/                          공용 UI (기능 2개 이상이 사용)
│   ├── layout/PickdSidebar.tsx          좌측 60px 아이콘 사이드바 (전 화면)
│   ├── table/                           탭1·탭2 공용 테이블 부품
│   │   ├── HeaderCell·HeaderFilter·SortableColumnHeader·ColumnDivider·DragHandle
│   │   ├── StarToggle·BatchActionBar·useTableDividers·RowContextMenu(Job/Exp 양쪽)
│   │   └── tableState.ts                ★ 컬럼 필터·정렬 setter 팩토리 (탭1·탭2 공용)
│   ├── ds/                              디자인시스템 프리미티브 (6종, 전부 사용 중)
│   │                                    StatusBadge·DdayChip·EssayStatus
│   │                                    ConfirmDialog·KeywordChip·PageTitle
│   │                                    ※ 미사용 예비 11종은 2026-07 삭제.
│   │                                      새 프리미티브가 필요하면 ui/를 먼저 확인
│   └── ui/                              shadcn/ui 벤더 (46개, 직접 수정 지양)
├── data/                                도메인 데이터·스토어 (기능 공용)
│   ├── jobStatus.ts                     ★ 전형 6단계 JobStage·JOB_STAGES·FinalResult 정본
│   │                                    + FINAL_RESULT_BADGE(결과→ds 배지 키) — 최종결과를
│   │                                      그리는 네 화면이 이 표 하나만 본다(2026-07-30 일원화)
│   ├── jobStore.ts                      담은 공고 등록 스토어 (pickd.jobs.registrations.v1)
│   ├── postings.seed.ts                 공고 시드 3건 + 검색 셀렉터 (백엔드 API 응답 계약)
│   └── calendarData.ts                  캘린더 데이터 + 등록 공고 파생 셀렉터
├── lib/                                 순수 유틸 (도메인 무관)
│   ├── designTokens.ts                  ★ 폰트 크기 토큰 FONT_SIZE 단일 출처 (§1)
│   ├── utils.ts                         cn() + tailwind-merge (FONT_SIZE에서 파생)
│   ├── storage.ts                       ★ localStorage lsGet/lsSet 단일 출처
│   ├── dday.ts                          ★ D-day 정본 — calcDday(계산)·ddayLabel("D-Day")·ddayCls
│   ├── date.ts                          toISODate("YYYY-MM-DD") — ⚠️ UTC 기준 보존(기존 동작 유지)
│   ├── setUtils.ts                      Set 토글 등 집합 헬퍼
│   ├── trash.ts                         전역 통합 휴지통 스토어 (pickd.trash.v1)
│   └── csv.ts                           CSV 내보내기
├── hooks/                               useResizableCols.tsx · use-mobile.tsx
└── test/                                vitest — setup.ts + example.test.ts + design-tokens.test.ts
                                         (기능 테스트는 해당 폴더 안: story/__tests__/)
```

### 데이터 지속성 (localStorage 키)

```
specs.info.visibleKeys.v4          표시할 기본정보 필드 목록 (InfoKey[])
specs.info.values.v2               기본정보 필드 값
specs.info.langExams.v1            공인외국어시험 목록 (LangExam[])
specs.basicPhoto.shown / .id       증명사진 표시 여부 / 대표 증명사진 ID
specs.files.v2                     제출파일함 파일 목록
specs.settings.jobPrefs.v1         설정 > 직무 선호 (Settings.tsx)
pickd.jobs.colWidths.v2 / visibleCols / colOrder / colPinned / rowOrder / sortMode
                                   탭1 테이블 뷰 상태 (너비·표시·순서·고정·행순서·정렬모드)
pickd.jobs.registrations.v1        탭1 담은 공고 (JobRegistration[] — postingId·positionId 참조, 표시값은 postings.seed에서 파생)
pickd.jobs.recentSearches.v1       탭1 검색창 최근 검색어 (string[], 최대 8)
pickd.experiences.items            탭2 경험 목록 (활동 = Item[])
pickd.stories.v1                   탭2 소재 목록 (Story[] — 활동 1개에 소재 N개, story/store.ts 단독 접근)
pickd.experiences.visibleCols.v3 / colWidths.v4 / colOrder / colPinned / sortMode
                                   탭2 테이블 뷰 상태 (소재·역량 컬럼 추가로 .v2 → .v3 상향)
pickd.experiences.export.fields.v1 / format.v1   내보내기 마지막 선택 (필드/형식)
pickd.trash.v1                     전역 통합 휴지통 스냅샷 (14일 보관 후 자동 purge)
pickd.onboarding.state.v1 / done.v1   온보딩 진행 상태(재개용) / 완료 플래그
pickd.profile.v1                   온보딩 프로필 (PickdProfileV1 — 온보딩 SSOT §4 데이터 계약)
cal.tasks.v1 / cal.carriedOver.v1  캘린더 할 일 / 이월 기록 (Calendar.tsx)
```

> 이 목록의 정본은 코드다. 전수 확인: `grep -rhoE '"(specs|pickd|cal)\.[A-Za-z.0-9]+"' src | sort -u`
> 소프트삭제: Item·FileItem에 `deletedAt?: number`(epoch ms) — 없으면 활성, 있으면 휴지통. 활성 뷰는 `deletedAt == null`만 노출. 공고(Job) 중 검색으로 담은 것은 `pickd.jobs.registrations.v1` 참조로 저장(2026-07-27 도입), 목데이터 행은 여전히 미저장 — 휴지통 제외 유지.

### 기본정보 (경험·스펙 DB > 기본정보 탭)

- 렌더 경로: `/experiences?tab=basic-info` → ExperiencesPage.tsx → `<BasicInfoPanel />`
- **InfoKey 34종·필드 정의의 정본 = `src/features/experiences/model/basicInfoFields.ts`** (문서에 목록을 중복 기재하지 않는다)
- 공인외국어시험은 InfoKey 방식 아님 — `LangExam[]` 별도 리스트(`specs.info.langExams.v1`). 필드: id, lang, examName, score, date, expiry
- FIELD_GROUPS(뷰 모드): 인적사항 / 연락처 / 학력 / 고등학교 / 온라인 프로필 / 병역·면허 (+ 공인외국어시험 별도 렌더)
- 편집: 뷰 모드 인라인 편집(hover 연필) + 전체 편집 모달

### 도메인 용어 (처음 읽는 세션용)

탭1 = 지원 대시보드(공고 관리, DashboardPage) · 탭2 = 경험·스펙 DB(ExperiencesPage) · 탭3 = AI 자소서(프론트 목업, API 미연결) · 공고 = Job · 대표 스펙 = 탭2에서 카드로 뽑아 쓰는 대표 경험 · 픽 카드 = 온보딩에서 만드는 프로필 카드 · 전형 6단계 = 작성중/지원완료/서류전형/필기전형/면접전형/전형완료(+finalResult 배지)

탭2는 2계층이다(2026-07-29 도입):

- **활동(Activity) = 코드의 `Item`** — "무엇을 했나"(공모전 참가, 인턴 근무). 13개 프리셋이 이 계층.
- **소재(Story)** — "그 활동 안에서 자소서에 쓸 한 장면"(갈등 조율, 지표 개선). 활동 1개에 소재 N개, `pickd.stories.v1` 저장.
- **역량** — 소재에 붙는 **NCS 직업기초능력 10축** 태그. 축은 국가 표준이라 발명·변형하지 않는다(정본 `story/model.ts`의 `NCS`·`NCS_SUB`).
- **커버리지 / 갭** — 확정 소재(`user_confirmed`)가 역량을 몇 개 덮었나 / 공고가 요구하는데 내 소재가 0인 역량.

## 6. 🚀 배포 (Vercel)

- **한 레포 = Vercel 프로젝트 하나.** 정본은 프로젝트 **"pickd"** 하나 · 도메인 **`pickd-seven.vercel.app`** · Production Branch = `main`. 실험도 새 프로젝트 말고 브랜치/프리뷰로.
- **이 레포는 프로토타입.** 실서비스 도메인 **`pickd.ai.kr`은 프론트팀의 별도 Vercel** 소관(2026-07-22 확인) — 이 레포의 배포·rewrite·설문 엔드포인트는 실도메인에 영향 없음. 실도메인 랜딩 설문 연결은 `docs/tasks/랜딩설문-프론트팀-핸드오프.md`로 프론트팀에 이관.
- **랜딩페이지**: `public/landingpage.html`(마케팅·베타 설문, 앱과 별개 정적 페이지 — 디자인은 별도 "랜딩페이지 디자인 시스템" 문서). `vercel.json`에 `/` → `/landingpage.html` rewrite가 있으나 **현재 미작동**(정적 index.html 파일시스템 매치가 우선 — HEALTH.md B-1, 해소 시 이 문구 갱신). 설문 제출은 `CONFIG.formEndpoint`로 POST — 외부 폼 수신 서비스 사용은 §1 "백엔드 없음" 규칙의 예외(서버 사이드 로직 아님).
- "배포가 안 반영" 진단은 §2 검증 사다리의 3~6번 순서로.

## 7. 문서 위생·자동화

- 임시 산출물은 `docs/tasks/`에 모으고, 실행 완료되면 주기적으로 삭제(git 히스토리 보존, `git log`·`git show`로 복원).
- 루트 `REFACTOR_RULES.md`는 §5 구조 규칙(5·6번)으로 **흡수 완료(2026-07-30)** — 규칙 정본은 이 파일뿐이다. 그 파일은 삭제 후보이며, 남아 있는 동안에도 규칙 근거로 인용하지 않는다.
- 확정된 규칙·결정은 문서 수를 늘리지 말고 해당 SSOT의 최신값만 갱신.
- **Notion MCP로 SSOT를 고칠 때는 절(節) 단위 전체 교체(`replace_content`)를 쓰고, 쓴 뒤 반드시 되읽어 대조한다.**
  한글 부분 치환(`update_content`)은 찾을 문자열이 전송 중 깨져 **매칭에 실패해도 성공으로 응답**하는 일이 있다
  (2026-07-31 실측: "바깥"→"밖깥", "펄스"→"펌스"). 여러 편집을 한 번에 보내면 맞은 것만 적용되고 나머지는 조용히 사라진다.
  ASCII만 담긴 문자열은 정상 매칭된다. 과거 세션이 이 방식으로 「탭1 — 공고 관리」 본문을 훼손했고, 2026-07-31 전체 재작성으로 복구했다.
- 동기화 스크립트: `pickd-design-update.sh` — 코드 수정 + Notion SSOT 업데이트 자동화(구 pickd-notion-update.sh 통합). 위치는 레포 밖 `/Users/xxxiynyng/Claude/Projects/Pickd Design/`(디자인 SSOT §9-4와 일치 — 2026-07-22 실폴더 확인 후 SSOT 정정 완료).

> 컬럼 폭만 rem이 아니라 px 숫자로 저장돼 `--ui-scale`을 못 탄다(드래그 계산이 clientX 기준 px라 유지). 2026-07-30 배율 도입 때 기본·최소·최대값을 ×1.1 하고 저장값은 키 버전을 올려 `migrateScaledPxMap`(lib/storage.ts)으로 1회 이관했다. **다음에 배율을 또 바꾸면 같은 절차를 반복해야 한다.**

## 부록 — 사고 아카이브 (배경은 여기 한 줄씩만)

- **2026-07-05 tailwind-merge**: 커스텀 폰트 토큰 미등록으로 `cn()`이 크기 토큰을 런타임 삭제 — "소스는 맞는데 화면엔 안 나옴"으로 하루 소모. 배포·캐시·URL 전부 무죄였다. 해소 커밋 `1ca1684`. → §1 등록 규칙, §2 사다리 1번.
- **2026-07-05 Vercel 도메인 충돌**: 한 레포에 프로젝트 3개(pickd/pickd-seven/my-job-desk)가 붙어 낡은 프로젝트가 정상 URL을 서빙 — "push해도 안 반영"으로 하루 소모. 잉여 2개 삭제로 해소. → §6, §2 사다리 4번.
- **2026-07-05 토큰화**: 손으로 박은 `text-[13px]` 300여 곳 → 토큰화. 계획서는 `git show 847d4da:docs/tasks/토큰_마이그레이션_계획.md`. 잔여 하드코딩 ~30곳은 기획 SSOT 기술 백로그에서 추적.
- **2026-07-06 text-micro 제거**: 9px 폐기, 최소 10px(`text-mini`)로 통일(커밋 `1b20fd6`·`da43c30`).
- **2026-07-13 폰트 토큰 단일 출처화**: `designTokens.ts`(FONT_SIZE)로 통합해 config·utils 손동기화 제거(2026-07-05 사고 원인 소멸), 하드코딩 `text-[Npx]` 30곳 토큰화(반픽셀 18곳 반올림·값동일 9곳·헤딩 3곳), `h2`(22)·`display`(30) 신설, 죽은 헤딩 CSS 변수 제거, 파생 테스트 + eslint 금지룰(warn) 추가. 커밋 `1271a0b`→`a3a6a73`(6개).
- **2026-07-29 세션 병행**: 구조 재편(`c41c910`) 중 다른 세션이 옛 경로 지도로 파일을 써, 앱에 연결되지 않은 채 tsc만 깨졌다. 마운트 세션이 남긴 `.git/index.lock`으로 로컬 git까지 막혔다. → §3 세션 병행 규칙.
- **2026-07-30 UI 배율 1.1배**: "화면이 전체적으로 한 단계 작다" → 브라우저 110% 확대와 같은 밀도를 기본값으로. `--ui-scale` 노브(루트 폰트 17.6px)로 rem 유틸 3,000여 곳을 한 번에 올리고, 폰트 토큰 9종은 ×1.1 반올림 정수로, 임의 px 127곳은 rem으로, 아이콘 `size={N}` 18곳·StatusBadge 인라인·컬럼 폭 상수는 ×1.1로 맞췄다. 실측(1280/1440/1920): root 17.6 · body 15 · H1 29 · 사이드바 66 · 행높이 48.4 · 배지 22px, 가로 스크롤 없음.
- **2025-06**: 미연결 dead code `Specs.tsx` 삭제.
