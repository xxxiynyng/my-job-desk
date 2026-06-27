# My Job Desk (Pickd) — Claude 컨텍스트

취업 준비용 개인 지원 관리 앱. 백엔드 없이 localStorage만 사용하는 순수 클라이언트 앱.

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
└── components/pickd/
    ├── PickdSidebar.tsx                 좌측 60px 아이콘 사이드바
    ├── BasicInfoPanel.tsx               기본정보 탭 (Experiences에서 렌더)
    ├── FilesPanel.tsx                   파일함 탭
    ├── DashboardHeader.tsx              대시보드 상단
    ├── JobPostingTable.tsx              공고 목록 테이블
    ├── JobRegistrationModal.tsx         공고 등록 모달
    └── RightPanel.tsx                   우측 패널
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
- 커밋 메시지: `type(scope): 한국어 설명` (예: `feat(BasicInfoPanel): ...`)

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
