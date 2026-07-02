# My Job Desk (Pickd) — Claude 컨텍스트

취업 준비용 개인 지원 관리 앱. 백엔드 없이 localStorage만 사용하는 순수 클라이언트 앱.

> 📌 단일 출처: 코드/작업 규칙은 **이 파일(CLAUDE.md) 하나**가 기준(예전엔 별도 대화창 지침 md와 나뉘어 있었으나 통합함).
> 디자인 값(색·토큰·칩·상태·테이블 규칙)은 Notion「Pickd 디자인 시스템」(SSOT, 아래 링크)이 기준. 자동화는 `pickd-design-update.sh`.

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
/               → Index.tsx          지원 대시보드
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
│   ├── JobDetail.tsx                    공고 상세 + 자소서 작성
│   ├── AICover.tsx                      AI 자소서 생성
│   ├── Calendar.tsx                     일정 캘린더
│   └── Settings.tsx                     설정
├── components/pickd/
│   ├── PickdSidebar.tsx                 좌측 60px 아이콘 사이드바
│   ├── BasicInfoPanel.tsx               기본정보 탭 (Experiences에서 렌더)
│   ├── FilesPanel.tsx                   파일함 탭
│   ├── DashboardHeader.tsx              대시보드 상단
│   ├── JobPostingTable.tsx              공고 목록 테이블 (탭1)
│   ├── JobRegistrationModal.tsx         공고 등록 모달
│   ├── RowContextMenu.tsx               행 그립·컨텍스트 메뉴 (탭1·탭2 공용)
│   └── RightPanel.tsx                   우측 패널
├── components/table/
│   ├── ColumnDivider.tsx                컬럼 리사이즈 세로 구분선 (탭1·탭2 공용, hover 전용, 색=행 구분선과 동일)
│   ├── DragHandle.tsx                   dnd-kit 드래그 핸들 뼈대 (탭1·탭2 공용)
│   ├── HeaderCell.tsx                   헤더 셀·정렬 버튼·정렬 드롭다운 (탭1·탭2 공용)
│   ├── SortableColumnHeader.tsx         드래그 가능한 컬럼 헤더 (탭1·탭2 공용, 그립=드래그+정렬 메뉴)
│   ├── BatchActionBar.tsx               배치 액션 바 셸 (탭1·탭2 공용, 액션 항목은 탭별 주입)
│   └── HeaderFilter.tsx                 컬럼별 헤더 필터 (탭1·탭2 공용)
└── hooks/
    └── useResizableCols.tsx             컬럼 리사이즈 훅 (min/maxWidths clamp 지원)
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

## 진단 규칙 (반복 삽질 방지)

- **추측으로 수정 반복 금지.** 원인은 코드에서 확인하고 짚는다.
- 정렬·간격은 **눈대중 금지 → 좌표/수치로 검증**(예: 컬럼별 좌측 x를 표로 확인).
- 안 고쳐지면 새 시도 전에 "언제/어느 요소에서" 나타나는지부터 좁힌다.

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
