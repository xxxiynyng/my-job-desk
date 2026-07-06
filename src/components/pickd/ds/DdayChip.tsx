import { cn } from "@/lib/utils";

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

interface DdayChipProps {
  days: number;
  size?: "sm" | "md";
  className?: string;
}

export function DdayChip({ days = 0, size = "md", className }: DdayChipProps) {
  let label: string;
  let colorClass: string;

  if (days < 0) {
    label = `D+${Math.abs(days)}`;
    colorClass = "bg-gray-100 text-gray-400";
  } else if (days === 0) {
    label = "D-DAY";
    colorClass = "bg-red-500 text-white font-bold animate-pulse";
  } else if (days <= 3) {
    label = `D-${days}`;
    colorClass = "bg-red-100 text-red-600";
  } else if (days <= 7) {
    label = `D-${days}`;
    colorClass = "bg-orange-100 text-orange-600";
  } else {
    label = `D-${days}`;
    colorClass = "bg-gray-100 text-gray-500";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full whitespace-nowrap tabular-nums font-semibold tracking-tight",
        size === "sm" ? "h-5 px-1.5 text-mini" : "h-6 px-2 text-mini",
        colorClass,
        className,
      )}
    >
      {label}
    </span>
  );
}
