# PICKD MVP Sprint Report
실행 날짜: 2026-06-29
커밋 범위: b2964e1 ~ f0efb79

## 항목별 결과

| 항목 | 결과 | 커밋 hash | 내용 |
|------|------|-----------|------|
| A-1 헤더 font-weight | 수정됨 | b2964e1 | StatusManagementModal.tsx 4개 th, DetailModal.tsx 5개 th → font-normal |
| A-2 D-DAY 색상 | 수정됨 | b4c39ab | getDdayStyle() string 반환으로 변경. D-0 빨강bg, D-1~3 빨강, D-4~7 주황, D-8+ 회색. ContextPanel·DetailModal 호출부 업데이트 + "마감" 텍스트 추가 |
| A-3 빈 값 em dash | 이미 완료 | — | pickd 컴포넌트 전체 em dash(—) 이미 사용 중. 일반 하이픈 노출 없음 |
| A-4 영문 subtitle | 수정됨 | abf4996 | JobDetail 4곳 한국어화: Properties→기본 정보, Eligibility & Requirements→지원 요건, Hiring Process→전형 절차, Job Description→직무 설명 |
| A-5 hover 아이콘 | 이미 올바름 | — | RowContextMenu.tsx GripTrigger에 opacity-0 group-hover:opacity-100 이미 적용 |
| B-1 D-DAY 계산 | 이미 완료 + TODO 추가 | cce3112 | getDday() 올바름(0시 기준, Math.ceil). mock dday: 8 필드에 TODO 주석 추가 |
| B-2 상태값 표시 | 건드리지 않음 | — | 상태값 한국어로 이미 사용자 친화적. StatusBadge 통해 렌더링. 값 변경 시 연쇄 영향 크므로 유지 |
| B-3 필터 count | 이미 완료 | — | 원본 items 기준 count 계산 — 의도된 스펙 |
| B-4 count=0 숨김 | 이미 완료 | — | Experiences.tsx:601-603 이미 구현됨 |
| B-5 검색 범위 | 이미 완료 | — | 항목명 단일 검색 — 의도적 스펙 |
| B-6 칸반 그룹핑 | 이미 올바름 | — | KanbanView byStatus가 STATUS_OPTIONS와 동일하게 매핑됨 |
| C-1 console.log | 이미 완료 | — | src/ 전체 검색 결과 없음 |
| C-2 미사용 import | 수정됨 | a49e51f | MonthlyCalendar.tsx에서 getDdayStyle 미사용 import 제거 |
| C-3 key prop | 유지 | — | process·competencies는 고유 id 없는 정적 mock 배열 — index key 유지 |
| C-4 mock 주석 | 수정됨 | f0efb79 | jobDetails 객체 위 TODO 주석 추가 |

## ⚠️ 사용자 결정 필요 (자동 수정 안 함)

- [ ] **JobDetail 공고 상세**: 현재 완전 mock 데이터 (`const jobDetails`) — 실제 API 연결 시 별도 작업 필요. slug별 `GET /job-postings/:id` 연결 예정
- [ ] **지원 상태값 구조**: `JobPostingTable`의 상태("작성 중"/"결과 대기") vs `calendarData`의 ApplicationStatus("지원서 작성"/"서류 전형")가 서로 다른 두 세트로 운영 중. 통합 시 연쇄 영향 크므로 팀 논의 후 결정 필요
- [ ] **DdayChip 음수 표시**: `DdayChip.tsx`는 `getDdayStyle()`과 별도 로직으로 days < 0일 때 `D+N` 표시. 스프린트 A-2의 "마감" 텍스트 방향으로 통일할지 여부 결정 필요
- [ ] **A-1 JobPostingTable 헤더**: 이미 `font-normal text-muted-foreground` 적용 중이나, 이전 스프린트(20105b2, fd8d9be 등)에서 여러 차례 수정된 이력이 있음. 향후 컬럼 추가 시 동일 스타일 유지 주의

## 되돌리고 싶은 항목이 있다면

각 항목은 개별 커밋으로 나뉘어 있어 원하는 것만 되돌릴 수 있습니다:

```bash
# 특정 커밋만 되돌리기 (다른 커밋은 유지)
git revert <커밋 hash> --no-commit
git commit -m "revert: A-4 JobDetail subtitle 되돌림"
git push origin main

# 이 스프린트 전체 되돌리기
git reset --hard 20105b2   # 스프린트 시작 전 hash
git push origin main --force
```
