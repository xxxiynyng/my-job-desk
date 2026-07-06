# Pickd 일일 정합성·건강 점검 — 자율주행 프롬프트

> 매일 자동 실행. 목적: 어제(2026-07-05) 하루를 태운 실패들을 **일반화**해 코드·배포·문서 어디서든 조기에 잡는다.
> **안전한 것만 자동 수정(두 CLAUDE.md 동기화)하고, push·삭제·설정변경·문서 임의수정 등 위험/비가역 작업은 절대 자동 실행하지 말고 리포트로만 남긴다.**

## 매 실행의 3원칙 (어제 교훈의 일반화)
1. **소스가 맞다고 런타임이 맞다고 가정 금지.** 커스텀 추상화(cn/tailwind-merge 등 입력을 변형하는 모든 유틸)는 소스와 다른 결과를 낼 수 있다 → **빌드 산출물/렌더로 검증**.
2. **대시보드가 "정상"이라고 라이브가 맞다고 가정 금지.** → **origin/main == 라이브 산출물**을 실측.
3. **문서와 코드는 양방향으로 어긋난다.** → CLAUDE.md + 3개 Notion SSOT(기획·디자인·온보딩)를 **모두** 코드/git과 대조.

작업 폴더: 레포 `/Users/xxxiynyng/Downloads/My_Job_Desk 19.25.06`. 시작점: 루트 `CLAUDE.md`의 "📍 지침 지도".

## A. 코드·런타임 건강 (dev — 폰트에 국한하지 말 것)
- `npx tsc -p tsconfig.app.json --noEmit`(신규 에러 0) · `npx vite build --outDir /tmp/pickd_health`(exit 0) · `npm test`(전부 통과).
- **Silent-failure 회귀 세트** (소스는 맞는데 런타임이 다른 부류 — 이 클래스를 계속 넓힐 것):
  - cn 커스텀 토큰: `node -e 'const {extendTailwindMerge}=require("tailwind-merge");const m=extendTailwindMerge({extend:{classGroups:{"font-size":[{text:["micro","mini","chip","body","title","heading"]}]}}});process.stdout.write(m("text-mini text-gray-400").includes("text-mini")?"PASS":"FAIL")'` → FAIL이면 **CRITICAL ❌**.
  - `src/lib/utils.ts`의 `cn`이 `extendTailwindMerge`로 커스텀 토큰 등록을 유지하는지 grep(누가 되돌리면 감지).
  - **새 silent-failure를 발견하면 vitest 테스트로 고정**하도록 권고(리포트에 "테스트 추가 권장" 항목).
- dead code/lint 경고 급증, `console.log` 잔존, localStorage 키 버전 누락(breaking 시 `.vN` 상향) 스팟 확인.

## B. 배포 정합 (infra)
- `git fetch -q origin` → 미커밋(`git status --short`)·미푸시(`git log --oneline origin/main..HEAD`) 기록. 있으면 ❌ + "터미널 `git push` 필요"(자격증명 없어 직접 push 금지).
- **한 레포 = Vercel 프로젝트 하나** 원칙 상기(둘 이상이면 도메인 충돌 1순위 — CLAUDE.md 배포 지침). web_fetch로 `https://pickd-seven.vercel.app/` 200 로드 확인. 가능하면 라이브 번들이 origin 코드와 맞는지 스팟(브라우저 도구 없으면 "수동 확인 권장").

## C. 문서 ↔ 코드 정합 (기획·디자인·온보딩 **모두**)
각 SSOT를 fetch해 코드/git과 대조. 불일치는 **양방향**으로 기록(문서가 낡음 / 코드가 문서와 다름), 자동 수정 금지:
- **기획 정리본** (PICKD MVP, `38b01b3f87138145a89ec4d1fa3706be`): 전형 6단계·탭2 13개 프리셋·localStorage 키가 코드와 일치? 로드맵 날짜(예 2026.07 탭2 완료)가 경과했으면 "상태 갱신 필요"? Open Questions(예: 경험 필드 '숨기기' 복구)가 코드로 해소됐는지 스팟?
- **디자인 시스템** (`38e01b3f871381daac4dc686a06c3d54`): 배지 10px·D-day `font-semibold`·토큰 하드코딩(`text-[Npx]`/`bg-[#hex]`) 없음.
- **온보딩 v2** (`39301b3f871381478e31d3ea22b63b7b`): 필수 2단계 + 점진 수집이 `Onboarding.tsx`와 일치(단계 수·필수 항목)?

## D. 문서 위생·파일별 성격 관리
- 두 CLAUDE.md 비교: `diff "<레포>/CLAUDE.md" "/Users/xxxiynyng/Claude/Projects/Pickd Design/CLAUDE.md"` — 다르면 레포본을 마스터로 Pickd Design에 복사(안전 자동 수정).
- `src/` 파일 중 CLAUDE.md "주요 파일" 맵에 없는 신규 파일 → "문서화 필요" 플래그. 맵에 있지만 삭제된 파일도 플래그.
- `docs/tasks/`의 실행 완료된 일회용 md → "정리 후보"(삭제는 하지 않음). 같은 규칙이 두 곳에 중복 기재됐으면 플래그(중복 금지 원칙).

## E. 리포트
- `docs/HEALTH.md` **한 파일에 덮어써서** 갱신(새 파일 금지 — 문서 위생). 상단: 실행일시 + 총평(✅ 정상 / ⚠️ 주의 N / ❌ 조치필요 N). 이어서 A~D 결과 + **조치 필요 체크리스트**(CRITICAL → ❌ → ⚠️ 순, 특히 미푸시·회귀실패·SSOT 드리프트).
- 끝나면 총평과 조치 필요 항목만 간결히 사용자에게 보고.

## 절대 금지 (발견만, 자동 실행 금지)
`git push` · 파일/프로젝트 삭제 · Vercel·GitHub 설정 변경 · Notion·SSOT 임의 수정. 전부 리포트로만 남긴다.
