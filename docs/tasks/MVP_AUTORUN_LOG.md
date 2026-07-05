# MVP 자율주행 로그

## Phase 1 — 프로토타입 동작 확인

| 항목 | 결과 | 커밋 | 비고 |
|------|------|------|------|
| npm install | ✅ 통과 | — | 보안 취약점 18개(기능 영향 없음) |
| tsc --noEmit | ✅ 수정 후 0 에러 | deac006 | Tabs.tsx onChange 타입 충돌 → Omit 패치 |
| npm run build | ✅ 통과 | — | 번들 843KB(code-split 고려 필요, 기능 영향 없음) |
| npm run test | ✅ 1/1 통과 | — | |
| 라우트 확인 | ✅ 소스 구조 정상 | — | / /jobs/:slug /experiences /calendar /settings |

## Phase 2 — UI/UX 감사 & 수정

| 항목 | 조치 | 커밋 |
|------|------|------|
| P2-1: 사이드바 아이콘 링크·버튼 aria-label | 수정 | 0231930 |
| P2-2: Tag 삭제 버튼 aria-label 한국어화 + 클릭 영역 20px | 수정 | e175723 |
| P2-3: GripTrigger aria-label 기본값 추가 | 수정 | cd4221c |
| P2-4: StatusManagementModal Trash2 aria-label | 수정 | fdb1ac4 |
| P2-5: DashboardHeader 캘린더 버튼 title → aria-label | 수정 | 42aefb3 |
| P2-6: Experiences 카드뷰 키워드 칩 bg-gray-50 통일(SSOT) | 수정 | 18db7aa |
| P2-7: Settings 토스트 "저장됐어요" 어요체 | 수정 | dda4f11 |
| P2-8: Calendar 토스트 "추가됐어요" × 2 어요체 | 수정 | c3ca2c0 |
| P2-9: ds/Button·IconButton focus-visible 링 추가 | 수정 | 1bda981 |

## Phase 3 — 서비스 개발 감사 & 수정

| 항목 | 조치 | 커밋 |
|------|------|------|
| P3-1: StatusBadge offer/처우협의 제거(기획 9개 확정) | 수정 | 29e1243 |
| P3-2: 공고 URL 외부 링크 noopener,noreferrer 추가 | 수정 | 030ac45 |
| P3-3: SectionHeader icon prop any → ComponentType 교체 | 수정 | 1759ca6 |
| D-DAY 계산 로직 | 이미 정상 | — | 자정 기준, Math.round 정수 차이 |
| 경험 삭제 확인 다이얼로그 | 이미 정상 | — | "되돌릴 수 없어요" 경고 포함 |

## Phase 4 — 불필요 코드 정리

| 항목 | 조치 | 커밋 |
|------|------|------|
| P4-1: JobPostingTable 미사용 임포트·함수·상태 제거 | 수정 | a8b5e12 |
| P4-2: Settings.tsx 미사용 cn 임포트 제거 | 수정 | 51ff411 |

## ⚠️ 사용자 결정 필요

1. **상태 레이블 불일치(Critical)**: JobPostingTable/StatusManagementModal/RowContextMenu의 상태 레이블이 SSOT 기획 9개와 다름.
   - 현재 코드: 서류작성중, 지원완료, 서류합격, 필기진행, 면접진행, 최종합격, 불합격 (7개)
   - SSOT 기획: 작성중, 지원예정, 지원완료, 서류전형, 코딩테스트, 면접전형, 최종합격, 불합격, 보류 (9개)
   - ⚠️ localStorage 데이터에 영향 → 자율주행 범위 외, 사용자 결정 필요.
   - 결정 시: localStorage 키 버전 올리고(`.v2`), 마이그레이션 스크립트 작성 권장.

2. **번들 크기(낮음)**: 843KB → code-split(dynamic import) 고려.

3. **npm audit**: 보안 취약점 18개(moderate 6, high 11, critical 1) — 기능 영향 없으나 `npm audit fix` 실행 권고.
