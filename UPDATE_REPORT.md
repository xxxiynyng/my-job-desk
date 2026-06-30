# Pickd MVP 자율주행 완료 보고서

## 단계별 결과

### Phase 1 — 프로토타입 동작 확인

| 항목 | 조치 | 커밋해시 | 비고 |
|------|------|----------|------|
| tsc 타입 에러 수정 | 수정 | deac006 | Tabs.tsx onChange 타입 충돌 → Omit<HTMLAttributes, "onChange"> |
| npm run build | 이미 정상 | — | |
| npm run test | 이미 정상 | — | |

### Phase 2 — UI/UX 감사 & 수정

| 항목 | 조치 | 커밋해시 | 비고 |
|------|------|----------|------|
| 사이드바 icon-only 링크·버튼 aria-label | 수정 | 0231930 | 6개 NavLink + 도움말 버튼 |
| Tag 삭제 버튼 aria-label "remove"→"삭제" | 수정 | e175723 | 클릭 영역도 14→20px 확대 |
| GripTrigger aria-label 기본값 | 수정 | cd4221c | "행 메뉴 열기" |
| StatusManagementModal Trash2 aria-label | 수정 | fdb1ac4 | "항목 삭제" |
| DashboardHeader 캘린더 버튼 title→aria-label | 수정 | 42aefb3 | |
| Experiences 카드뷰 키워드 칩 SSOT 통일 | 수정 | 18db7aa | bg-muted→bg-gray-50 (SSOT 위반 수정) |
| Settings 토스트 어요체 통일 | 수정 | dda4f11 | "저장되었습니다"→"저장됐어요" |
| Calendar 토스트 어요체 통일 | 수정 | c3ca2c0 | "추가되었습니다"×2→"추가됐어요" |
| ds/Button·IconButton focus-visible 링 | 수정 | 1bda981 | 키보드 포커스 표시 추가 |

### Phase 3 — 서비스 개발 감사 & 수정

| 항목 | 조치 | 커밋해시 | 비고 |
|------|------|----------|------|
| StatusBadge offer/처우협의 제거 | 수정 | 29e1243 | 기획 확정 9개 — offer 미포함 |
| window.open noopener,noreferrer | 수정 | 030ac45 | 탭나킹 취약점 방지 |
| SectionHeader icon prop any 제거 | 수정 | 1759ca6 | → React.ComponentType<{className?}> |
| D-DAY 계산 로직 | 이미 정상 | — | 자정 기준 정확한 계산 |
| 경험 삭제 확인 다이얼로그 | 이미 정상 | — | 되돌릴 수 없음 경고 포함 |
| localStorage 상태 관리 | 이미 정상 | — | 단일 출처, 버전 suffix 있음 |

### Phase 4 — 불필요 코드 정리

| 항목 | 조치 | 커밋해시 | 비고 |
|------|------|----------|------|
| JobPostingTable 미사용 임포트 3개 제거 | 수정 | a8b5e12 | EyeOff, RotateCcw, ArrowUpDown |
| JobPostingTable FinalResultPicker 제거 | 수정 | a8b5e12 | 렌더되지 않던 dead component |
| JobPostingTable ColHeaderFilter 제거 | 수정 | a8b5e12 | 렌더되지 않던 dead component |
| JobPostingTable colFilters 상태 제거 | 수정 | a8b5e12 | |
| Settings.tsx cn 미사용 임포트 제거 | 수정 | 51ff411 | |
| console.log | 이미 정상 | — | 전체 소스에 없음 |

---

## ⚠️ 사용자 결정 필요

### 1. 상태 레이블 불일치 (Critical — 자율주행 범위 외)

현재 코드의 상태 집합과 SSOT 기획서가 다릅니다.

| 구분 | 현재 코드 | SSOT 기획 |
|------|----------|-----------|
| 수 | 7개 | 9개 |
| 목록 | 서류작성중, 지원완료, 서류합격, 필기진행, 면접진행, 최종합격, 불합격 | 작성중, 지원예정, 지원완료, 서류전형, 코딩테스트, 면접전형, 최종합격, 불합격, 보류 |

**영향 파일**: JobPostingTable.tsx, StatusManagementModal.tsx, RowContextMenu.tsx

**변경 시 주의사항**:
- localStorage에 저장된 상태값이 바뀌므로 기존 데이터 손실 위험
- localStorage 키 버전 올리기 필수 (`"pickd.jobs.data"` → `.v2`)
- 마이그레이션 스크립트 작성 권장

### 2. 번들 크기 (낮음)
- 현재 843KB (gzip 254KB) — 500KB 권장 초과
- 조치: dynamic import로 페이지별 code-split 고려

### 3. npm audit 취약점 (낮음)
- 18개 취약점 (moderate 6, high 11, critical 1)
- 기능 영향 없음 — `npm audit fix` 실행 권고

---

## 되돌리는 법 (개별 커밋 revert)

특정 커밋만 되돌리고 싶을 때:
```bash
git revert <커밋해시> --no-edit
```

예: P2-6 (카드뷰 키워드 칩 색상) 되돌리기:
```bash
git revert 18db7aa --no-edit
```

전체 자율주행 되돌리기 (deac006 이전으로):
```bash
git revert 51ff411 a8b5e12 1759ca6 030ac45 29e1243 1bda981 c3ca2c0 dda4f11 18db7aa 42aefb3 fdb1ac4 cd4221c e175723 0231930 deac006 --no-edit
```
