# MVP 정비 자율주행 보고서 — 2026-07-05

> 롤백 기준 태그: `pre-autorun-2026-07-05` (작업 시작점)
> 진단 원칙: 구 보고서(MVP_AUTORUN_LOG·SPRINT_REPORT·UPDATE_REPORT)는 과거 참고용으로만 읽고,
> **현재 코드 + SSOT를 직접 대조**해 재진단. 이미 해소된 항목(상태 레이블 불일치 등)은 재이슈화하지 않음.

---

## 게이트 통과 요약

| Phase | 내용 | 결과 |
|-------|------|------|
| **Phase 1** | 동작 확인 (install·tsc·build·test·라우트) | ✅ **전부 통과** |
| **Phase 2** | UI/UX 감사·수정 (일관성·접근성·카피·가치정합) | ✅ 통과 |
| **Phase 3** | 서비스 감사·수정 (불변원칙·상태정합·안전) | ✅ 통과 |
| **Phase 4** | 불필요 코드 정리 | ✅ 통과 |
| **Phase 5** | 최종 검증·보고 | ✅ 통과 |

**최종 검증(2026-07-05 마감):** `tsc` 0 errors · `build` OK(7.6s) · `test` 1/1 pass.
lint: 66→63 problems (에러 43→40, 남은 건 의도적/범위밖 — 아래 참조).

---

## Phase 1 — 프로토타입 동작 확인 (게이트 통과)

- `npm install` OK → `npx tsc -p tsconfig.app.json --noEmit` **0 errors** → `npm run build` OK → `npm run test` **1/1 pass**.
- 라우트 소스 검증(App.tsx): `/onboarding`·`/`(온보딩 가드)·`/jobs/:slug`·`/experiences`·`/basic-info`→redirect·`/files`→redirect·`/ai-cover`·`/settings`·`/calendar`·catch-all `*` 순서 정상.
- **재진단 확인**: 구 보고서의 "상태 레이블 7 vs 9 불일치(Critical)"는 **이미 해소됨**. `StatusBadge`·`JobPostingTable`·`StatusManagementModal`·`RowContextMenu`·`calendarData` 5개 소스의 전형 6단계 집합(작성중/지원완료/서류전형/필기전형/면접전형/전형완료 + finalResult 배지)이 **완전 일치**. 구 레이블(지원예정·서류합격)은 마이그레이션 설명 주석에만 남고 실코드엔 없음. → 재이슈화 안 함.

## 조치 항목 (Phase별)

| # | Phase | 항목 | 조치 | 커밋 |
|---|-------|------|------|------|
| 1 | 사전 | 기본정보 섹션 행 긴 값 truncate로 잘림 | 좌측정렬 break-words wrap로 안잘림(세션 전 워킹트리 변경 보존) | `6c741bc` |
| 2 | 4 | stray `vite.config.ts.timestamp-*.mjs` 3개 누적 | 삭제 + gitignore 등록 | `fff0099` |
| 3 | 3 | 외부 공고 링크 rel이 `noreferrer`만 | `noopener noreferrer` 명시(규약 정합) | `76278da` |
| 4 | 2 | 마감경고 배경이 raw `bg-[var(--pickd-red-light,#fff1f2)]` | 기존 토큰 클래스 `bg-pickd-red-light`로 통일, stale fallback 제거 | `d9f8b43` |
| 5 | 2 | 토스트 3곳 `~어요` 톤 드리프트 | Calendar·FilesPanel·TodayPanel `~어요`로 복원 | `8e565ff` |
| 6 | 2 | icon-only 버튼 12곳 접근명 없음 | aria-label 일괄 추가(9파일) | `1fd2965` |
| 7 | 2·3 | 탭1 공고 삭제(배치·행)가 확인 없이 즉시 실행 | 탭2와 동일 Dialog 확인 경유, deleteJob·deleteSelected→performDelete 통합 | `d71e0b2` |
| 8 | 2·3 | 파일함 삭제가 확인 없이 즉시 실행 | 파일명 명시 확인 다이얼로그 경유 | `6dac0df` |
| 9 | 4 | Set 토글 삼항문(no-unused-expressions 에러) | if/else로 교체(동작 동일) | `a752c1e` |

## Phase 2 — UI/UX 감사 (판단 근거)

- **일관성**: ds/ 공용 컴포넌트(StatusBadge·Button·Tag 등)와 `src/index.css` CSS 변수 토큰 체계가 잘 정의됨. 발견한 이탈은 #3·#4로 수정.
- **접근성**: 정상 라벨링된 버튼 다수 존재(예: `aria-label="복붙 보기"`). 누락 12곳만 보강(#6). `ds/IconButton`엔 focus-visible 존재.
- **카피 톤**: `~어요` 규약 3곳 드리프트만 복원(#5).
- **AI 부정표현**: 없음. AI 인접 카피는 이미 격려형("이 경험을 더 구체적으로 만들어 봐요", "문장을 다듬어 드려요")로 규약 준수.

## Phase 3 — 서비스 감사 (불변 원칙 4개 모두 준수 확인)

| 불변 원칙 | 코드 확인 결과 |
|-----------|----------------|
| AI가 사용자 문장 자동수정 금지 | ✅ `applySentence`는 본문 **끝에 append**만, 덮어쓰기 없음 |
| AI 생성문은 반영/드래그로만 삽입 | ✅ `onApply` 명시 액션에서만 삽입, `onRewrite`는 카드 자신 문장만 수정 |
| 파일 추출은 승인 전 미확정 | ✅ 추출 후보를 체크박스 체크리스트로 표시, "선택 저장하기"만 DB 반영 |
| 자동 병합 금지 | ✅ 자동 병합 로직 없음(병합은 기획 미확정 기능) |

- **상태 정합**: 6단계+finalResult 전 파일 일치(Phase 1 참조).
- **D-DAY**: `calcDday`가 today·deadline 모두 자정 정규화(`setHours(0,0,0,0)`, `T00:00:00`) — 자정 기준 정확.
- **외부 링크 안전**: `window.open`은 `noopener,noreferrer` 정상, `<a target=_blank>` rel 보강(#3).

## Phase 4 — 불필요 코드 정리

- 데드코드 감사 결과: **console.log 없음**(NotFound.tsx의 404 `console.error`는 의도적 진단, 유지). 주석처리 죽은코드 없음. 미사용 파일 없음.
- 처리: stray 빌드 산출물(#2), 삼항문 정리(#9).
- **의도적으로 남긴 것**:
  - **empty catch 블록(~15곳)**: localStorage 접근 가드로 의도적. lint `no-empty` 에러지만 기능상 정당 → churn 회피 위해 유지.
  - **DetailEditor 카드 삭제·fieldWidgets 필드 삭제**: 확인 다이얼로그 **미추가**. 이유 = 에디터 내 요소 편집 조작(문장카드·폼 필드 제거)이지 누적 자산 삭제가 아님. 매 필드 삭제마다 confirm은 UX 저해. 자산 단위(경험·공고·파일) 삭제만 confirm 적용.
  - **`RowEditCell` 직접 export**: 별칭(`JobRowActionCell`·`ExpRowActionCell`)으로만 소비됨. export 제거 가능하나 무해 → 미변경.

---

## ⚠️ 사용자 결정 필요 (자율 범위 밖 — 손대지 않음)

### 1. `ProfileCompletionCard` — 미연결 기능 (Onboarding.tsx:666~779, ~113줄)
- **상태**: 완성된 "점진 수집" 카드 컴포넌트인데 **어디서도 렌더되지 않음**(grep 0회 사용). 주석엔 "탭1 또는 마이페이지 상단에 배치" 의도 명시.
- **왜 안 지웠나**: 이건 단순 데드코드가 아니라 **"경험의 데이터 자산화" 가치에 정합하는 기능**(pending 큐에서 미입력 필드를 1개씩 스누즈 가능하게 노출 → 프로필을 점진 누적). 삭제하면 의도된 기능이 사라짐.
- **권장안**: **(A) 배치해 살리기** — 대시보드(Index.tsx) 또는 탭2 상단에 `<ProfileCompletionCard />` 렌더(배치 위치는 설계 결정이라 확정 필요). / (B) 정말 폐기라면 삭제. → **A 권장.**

### 2. 시스템 전반 토큰 마이그레이션 (~295곳)
- `text-[Npx]` ~295곳, `bg-[#F8FAFC]` 5곳(테이블 헤더), 유형칩 accent 7색 raw hex(Experiences.tsx:96~104)가 CSS 변수 토큰 대신 하드코딩됨.
- **왜 안 했나**: 이미 코드베이스 전반의 확립된 스타일이라 일괄 토큰화는 **대규모 churn + 렌더링 값 변경**(예: `#F8FAFC`↔`--slate-50 #F6F8FB` 미세 색차) 위험. "임의로 값 바꾸지 말 것" 원칙상 자율 변경 부적절.
- **권장안**: 별도 작업으로, ① 반복 상수(테이블 헤더 bg·유형칩 팔레트)부터 토큰/공용 클래스로 수렴 → ② `text-[Npx]`는 SSOT 타입 토큰(--text-*)에 매핑하는 Tailwind 유틸 도입 후 점진 치환. **디자인 검수와 함께 진행 권장.**

### 3. mock `any` 타입 (JobDetail.tsx 등 ~13곳)
- `jobDetails: Record<string, any>` + 반복 콜백 `(e: any)`. lint `no-explicit-any` 에러.
- **왜 안 했나**: 가드레일상 mock은 API 연결 시 제거 대상. 던져질 mock에 풀 인터페이스 정의는 저ROI.
- **권장안**: **API 연결 작업과 함께** 타입화(그때 실제 응답 스키마로 정의).

### 4. 기타 참고
- `#7` 커밋에 `.claude/settings.local.json`(무프롬프트용 로컬 권한 allowlist)이 `git add -A`로 혼입됨. 소스 아닌 로컬 설정이라 무해하나, 되돌릴 땐 해당 파일은 유지 권장.

---

## 되돌리는 법

- **특정 항목만**: `git revert <해시>` (예: 파일 삭제 확인만 되돌리기 `git revert 6dac0df`)
- **세션 전체**: `git reset --hard pre-autorun-2026-07-05`
- push는 하지 않음 — 검수 후 사용자가 직접 `git push`.

## 이번 세션 커밋 (9개, 시간 역순)

```
a752c1e refactor(experiences): 삼항문 → if/else — no-unused-expressions 정리
6dac0df fix(files): 파일 삭제에 확인 다이얼로그 추가 — 즉시 파괴 방지
d71e0b2 fix(jobs): 탭1 공고 삭제에 확인 다이얼로그 추가 — 즉시 파괴 방지
1fd2965 a11y(icons): icon-only 버튼 12곳 aria-label 추가
8e565ff style(toast): 토스트 3곳 ~어요 체로 통일 — 톤 컨벤션 드리프트 복원
d9f8b43 style(job-detail): 마감 경고 배경 bg-pickd-red-light 토큰 클래스 정합
76278da fix(job-detail): 외부 공고 링크 rel에 noopener 명시
fff0099 chore(gitignore): vite.config.ts.timestamp-*.mjs 무시
6c741bc style(basic-info): 섹션 행 값 좌측정렬 wrap — 긴 값 안잘림
```
