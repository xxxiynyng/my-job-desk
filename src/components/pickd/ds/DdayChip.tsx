import { cn } from "@/lib/utils";

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
        "inline-flex items-center justify-center rounded-full whitespace-nowrap tabular-nums font-bold tracking-wide",
        size === "sm" ? "h-5 px-1.5 text-mini" : "h-6 px-2 text-mini",
        colorClass,
        className,
      )}
    >
      {label}
    </span>
  );
}
