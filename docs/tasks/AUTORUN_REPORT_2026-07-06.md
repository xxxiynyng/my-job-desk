# 자율주행 감사 리포트 — 2026-07-06

> 이전 세션 보고서(`AUTORUN_REPORT_2026-07-05.md` 등)는 과거 참고용. 이 문서는 그 이후 **현재 코드 + 최신 SSOT를 직접 대조**해 다시 수행한 결과다.
> 롤백 기준 태그: **`pre-autorun-2026-07-06`** (이번 세션 시작 HEAD = `14783df`). 이전 세션 태그 `pre-autorun-2026-07-05`(4d40b1c)는 31커밋 뒤라 별도 생성함.

## Phase 게이트 통과 현황

| Phase | 내용 | 결과 |
|-------|------|------|
| 1 | tsc / build / test / 라우트 로드 | ✅ 전부 통과 (신규 에러 0, test 1 passed) |
| 2 | UI/UX 감사·수정 | ✅ 완료 (토스트 톤 6건 + aria-label 9건 수정) |
| 3 | 서비스 로직 감사·수정 | ✅ 완료 (상태 불일치 2건 수정, 불변원칙 3개 준수 확인) |
| 4 | 미사용 코드 정리 | ✅ 완료 (import·지역변수 제거, build·test 통과) |
| 5 | 정리·보고 | ✅ 이 문서 |

최종 재검증: `npx tsc -p tsconfig.app.json --noEmit` 신규 에러 0 · `npm run build` OK · `npm run test` 1 passed.

---

## 수정 내역 (개별 커밋 = 되돌림 단위)

| # | 커밋 | Phase | 조치 |
|---|------|-------|------|
| 1 | `2fd01d2` | 2 | **토스트 톤 통일** — `삭제되었어요.`·`추가되었어요.`·`변경되었어요.`·`완료되었어요.`·`추가했어요.`·`복사했어요.` 6건을 다수 형제와 동일한 축약 능동형·무마침표(`삭제했어요`·`바꿨어요`·`합쳤어요`·`복사했어요`)로 정렬. (Experiences.tsx, DetailEditor.tsx, CopyGenerator.tsx) |
| 2 | `7e0ff06` | 3 | **상태 정합성** — JobDetail 목데이터의 임의 상태 `"서류 작성중"`(6단계 집합 밖)을 캐노니컬 `"작성중"`으로 교체. |
| 3 | `3f34b16` | 3 | **상태 표기 통일** — JobPostingTable 완료카드가 `finalResult` raw 값(`포기`)을 그려, 같은 파일 칸반·테이블의 `FINAL_RESULT_LABEL`(`보류`)과 표기가 갈리던 것을 매핑 경유로 통일. |
| 4 | `02cecf9` | 2 | **접근성** — 아이콘 전용 버튼 9곳에 `aria-label` 부여: 캘린더 날짜/달 이동(ListHeader×4, MonthlyCalendar×2), 경험 편집기 더보기·필드메뉴·키워드삭제·값 보기/가리기/편집(DetailEditor, fieldWidgets, RepExperienceViews). |
| 5 | `ee6841d` | 4 | **미사용 코드 정리** — Experiences의 lucide 16개·dropdown 5개·타입 4개 + 8개 파일의 미사용 import·지역변수(`infoExpanded`·`scrollContainerRef`·`label`·`listDate`) 제거. tsc `--noUnusedLocals` 기준 검증. |

## 확인만 하고 정상이던 항목 (수정 불필요)

- **6단계 전형 체계**: StatusBadge / JobPostingTable / RowContextMenu / StatusManagementModal / calendarData / ContextPanel 전부 캐노니컬 6단계 + finalResult 배지로 일치. (탭2 경험 상태 `작성중/완료/병합 필요`, 자소서 문항 상태 `완료/작성중/초안/미작성`는 별도 도메인 — 정상.)
- **불변원칙 3개 모두 준수**: ① AI는 사용자 문장을 자동 수정·삭제하지 않음(`polish()`는 공백정리+마침표만, `applySentence`는 명시적 반영 버튼·드래그로만 삽입) ② 파일 추출은 `UploadKindModal` 등록 승인 전까지 미확정 ③ 경험 자동 병합 없음(필드별 라디오 선택 + 수동 합치기 버튼 경유).
- **D-day 계산**: `calcDday`·`getDday` 둘 다 자정 정규화(양쪽 피연산자 `setHours(0,0,0,0)`) — off-by-one 없음.
- **외부 링크**: 모든 `target="_blank"`/`window.open`에 `noopener` 있음.
- **색 하드코딩**: `bg-[#…]`/`text-[#…]` 0건.
- **파괴적 액션(주요)**: 공고·경험 전체 삭제는 탭1·탭2 공통 확인 다이얼로그로 가드됨.
- **console**: 앱 코드에 디버그 로그 없음(NotFound의 `console.error`만 — 정상).

---

## ⚠️ 사용자 결정 필요 (자율주행 범위 밖 — 손대지 않음)

### A. 기획·기능 미확정
1. **최종결과 선택 UI 미연결** — `StatusManagementModal`은 `finalResult` 상태·옵션·스타일(`FINAL_RESULT_OPTIONS`·`finalResultStyles`·`activeFinalResult`·`setFinalResult`)을 보유하지만 **모달 본문에 결과 선택 UI가 렌더되지 않음**. 그 결과 사용자는 합격/불합격/보류를 앱 어디서도 설정할 수 없다(목데이터 `j5`만 seeded). → **선택**: 결과 선택 UI를 붙일지, 아니면 스캐폴딩을 제거할지. 반쯤 만든 기능이라 정리(Phase 4)에서 일부러 남겨둠.
2. **finalResult 내부값 `"포기"` vs 표시 `"보류"`** — 저장 enum은 `"포기"`(give up)인데 배지·라벨은 전부 `"보류"`(hold)로 표시. 이번에 표시는 통일(#3)했으나 **저장 enum 정본값**을 `포기`로 둘지 `보류`로 바꿀지는 데이터 의미 결정이라 미변경. (현재 localStorage 미저장이라 enum 변경 시 마이그레이션 부담은 낮음.)

### B. 코드 구조 — 판단 필요
3. **미사용 디자인시스템 컴포넌트 11개** (`ds/Avatar·Badge·Button·Card·Checkbox·IconButton·Input·Select·Stepper·Tabs·Tag`) — 현재 소비처 없음(배럴에서 StatusBadge·DdayChip만 사용). **의도된 공용 프리미티브 라이브러리로 판단해 삭제하지 않음.** → 계속 확장할지 / 미사용분을 잘라낼지 결정.
4. **`hooks/useProfileCompletion.ts` orphan** — 프로필 완성도 계산 훅, import 0건. 계획된 기능으로 보여 삭제하지 않음. → 연결할지/제거할지 결정.

### C. 접근성 심화 — 회귀 위험으로 미적용
5. **키보드 접근성(주요 열기/토글 액션)** — `Experiences` 테이블 행(:322)·카드(:1295), 칸반 카드(`JobPostingTable:547`), `TodayPanel` li 3곳, 캘린더 `ContextPanel`·`MonthlyCalendar` 이벤트가 `div/li/span onClick`만 있고 `role`/`tabIndex`/키보드 핸들러가 없음. → 드래그(행 그립·카드 draggable)와 포커스 관리를 함께 설계해야 안전. **단독 a11y 작업으로 분리 권장**(이번엔 회귀 위험으로 미적용).
6. **하위 항목 삭제의 확인/되돌리기 부재** — `StatusManagementModal`의 일정·할일 즉시 삭제(:279, 확인 없음)와 경험 필드·키워드·문장카드 삭제가 즉시 반영. 앱은 "대형 삭제만 다이얼로그 가드"를 일관되게 쓰는데, 하위 마이크로 삭제까지 확인을 붙일지(과도한 가드 = UX 저하 절충)는 결정 필요.

### D. 정리 후보 (동작 무해 — 취향/시점 결정)
7. **반픽셀 폰트 하드코딩 19곳** (`text-[10.5px]`·`text-[12.5px]`·`text-[13.5px]` 등, `ui/` 벤더 제외) — 토큰 스케일(9/10/11/12/13/14/15/26)에 없는 값. 토큰화하면 **렌더가 미세하게 바뀌므로**(눈대중 금지 규칙상 DevTools 수치 확인 필요) 일괄 변환은 보류. → 토큰_마이그레이션_계획에 편입해 시각 검수와 함께 진행 권장.
8. **`JobDetail` `any` 7곳** — 목 job 객체(essays/process/eligibility) 순회에 `any` 사용. 임의 상태(`서류 작성중`)가 여기로 새던 원인. 실제 API 연결 시 목 타입 지정 권장.
9. **D-day 함수 2벌** — `calcDday`(round) / `getDday`(ceil). 둘 다 정확하나 파싱·반올림이 달라 통합 후보(버그 아님).
10. **`DocumentStatusList` 목 dday 상수** — 대시보드가 고정 D-day(2·3·6·8)를 표시(실제 날짜 무관). 목데이터 품질 이슈.

---

## 되돌리는 법

- **특정 항목만**: `git revert <hash>` (예: 토스트 톤만 되돌리기 → `git revert 2fd01d2`)
- **이번 세션 전체**: `git reset --hard pre-autorun-2026-07-06`
- 이번 세션 커밋(오래된→최신): `2fd01d2` → `7e0ff06` → `3f34b16` → `02cecf9` → `ee6841d`

## push

미실행 — 사용자가 확인 후 직접(`git push origin main`). 로컬 커밋 5개는 모두 남겨둠.
