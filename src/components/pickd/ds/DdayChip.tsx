import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DdayChipProps {
  days: number;
  size?: "sm" | "md";
  className?: string;
}

export function DdayChip({ days = 0, size = "md", className }: DdayChipProps) {
  let label: string;
  let colorClass: string;
  // D-7 이내(D-DAY 포함)만 긴급 Clock 아이콘 표시
  const urgent = days >= 0 && days <= 7;

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

  const iconSz = size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md whitespace-nowrap tabular-nums font-bold tracking-wide",
        size === "sm" ? "h-5 px-1.5 text-[10px]" : "h-6 px-2 text-[11px]",
        colorClass,
        className,
      )}
    >
      {urgent && <Clock className={cn(iconSz, "shrink-0")} />}
      {label}
    </span>
  );
}
