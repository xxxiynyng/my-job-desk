// ─────────────────────────────────────────────────────────────
// D-day — 계산과 표기 규칙의 단일 정본.
// 계산부(calcDday)는 원래 components/ds/DdayChip.tsx 안에 있었다. data/ 가 그 파일을
// 재수출하면서 data → components 역방향 의존이 생겨, 순수 계산만 여기로 옮겼다(2026-07-29).
// 렌더는 그대로 DdayChip 이 담당한다.
// ─────────────────────────────────────────────────────────────

// 마감일(YYYY-MM-DD) → 오늘 기준 남은 일수 (음수면 지남) — D-day 계산 단일 정본.
// 구 getDday(calendarData)·JobPostingTable 로컬 구현을 이 함수로 통합(2026-07-06).
export function calcDday(deadline: string): number {
  if (!deadline) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dl = new Date(deadline.length === 10 ? deadline + "T00:00:00" : deadline);
  dl.setHours(0, 0, 0, 0);
  return Math.round((dl.getTime() - today.getTime()) / 86400000);
}

// D-day 라벨/색 규칙 (대시보드 카드 계열 공용 — §5-4-1 예외 계열)
// 라벨은 이 함수가 전 화면 정본이다 — 0일 표기가 "D-Day"/"오늘"로 갈리던 4벌을 통일했다(2026-07-30 daf3a36).
// 주의: 색 규칙만 화면별로 남아 있다(TodayPanel.ddayColor·DdayChip). 경계값이 달라 통합 금지.
export const ddayLabel = (dday: number) => (dday > 0 ? `D-${dday}` : dday === 0 ? "D-Day" : `D+${Math.abs(dday)}`);
export const ddayCls = (dday: number) =>
  dday <= 0
    ? "text-muted-foreground/50"
    : dday <= 3
      ? "text-pickd-red font-semibold"
      : dday <= 7
        ? "text-pickd-orange"
        : "text-foreground/60";
