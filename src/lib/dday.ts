// D-day 라벨/색 규칙 (대시보드 카드 계열 공용 — §5-4-1 예외 계열)
// 주의: TodayPanel의 ddayLabel/ddayColor는 라벨("오늘")과 색 규칙이 달라 별개다. 통합 금지.
export const ddayLabel = (dday: number) => (dday > 0 ? `D-${dday}` : dday === 0 ? "D-Day" : `D+${Math.abs(dday)}`);
export const ddayCls = (dday: number) =>
  dday <= 0
    ? "text-muted-foreground/50"
    : dday <= 3
      ? "text-pickd-red font-semibold"
      : dday <= 7
        ? "text-pickd-orange"
        : "text-foreground/60";
