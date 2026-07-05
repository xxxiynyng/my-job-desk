import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { MONTHS_KO, formatShortKoreanDate } from "@/data/calendarData";

type ListMode = "today" | "all";

interface ListHeaderProps {
  label: string;
  count: number;
  mode: ListMode;
  onToggleMode: () => void;
  selectedDate: Date;
  onShiftDate: (delta: number) => void;
  onResetToday: () => void;
  currentMonth: Date;
  onShiftMonth: (delta: number) => void;
  period: string;
  onPeriodChange?: (p: string) => void;
  onAdd: () => void;
  className?: string;
}

export function ListHeader({
  label, count, mode, onToggleMode,
  selectedDate, onShiftDate, onResetToday,
  currentMonth, onShiftMonth,
  period, onPeriodChange,
  onAdd, className,
}: ListHeaderProps) {
  const isToday = selectedDate.toISOString().split("T")[0] === new Date().toISOString().split("T")[0];
  const todayLabel = isToday ? "오늘" : formatShortKoreanDate(selectedDate);
  const monthLabel = `${currentMonth.getFullYear()}년 ${MONTHS_KO[currentMonth.getMonth()]}`;

  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <div className="flex items-center gap-1.5">
        <button onClick={onToggleMode} className="flex items-center gap-1 text-sm font-semibold hover:text-primary transition-colors">
          <span className={cn(mode === "today" ? "text-foreground" : "text-muted-foreground")}>
            {mode === "today" ? `오늘의 ${label}` : `전체 ${label}`}
          </span>
        </button>
        <span className="text-mini text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{count}</span>
      </div>

      <div className="flex items-center gap-1">
        {mode === "today" ? (
          <div className="flex items-center gap-0.5">
            <Button aria-label="이전 날" variant="ghost" size="icon" className="h-6 w-6" onClick={() => onShiftDate(-1)}><ChevronLeft size={12} /></Button>
            <button onClick={onResetToday} className="text-xs text-muted-foreground hover:text-foreground px-1 min-w-[40px] text-center">{todayLabel}</button>
            <Button aria-label="다음 날" variant="ghost" size="icon" className="h-6 w-6" onClick={() => onShiftDate(1)}><ChevronRight size={12} /></Button>
          </div>
        ) : (
          <div className="flex items-center gap-0.5">
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-mini text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border hover:border-primary/30 transition-colors">
                  {period || "1개월"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-32 p-1" align="end">
                {["1주", "2주", "1개월", "직접 선택"].map((p) => (
                  <button key={p} onClick={() => onPeriodChange?.(p)}
                    className={cn("w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent transition-colors", period === p && "bg-accent font-medium")}>
                    {p}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
            <Button aria-label="이전 달" variant="ghost" size="icon" className="h-6 w-6" onClick={() => onShiftMonth(-1)}><ChevronLeft size={12} /></Button>
            <span className="text-xs text-muted-foreground min-w-[80px] text-center">{monthLabel}</span>
            <Button aria-label="다음 달" variant="ghost" size="icon" className="h-6 w-6" onClick={() => onShiftMonth(1)}><ChevronRight size={12} /></Button>
          </div>
        )}
        <button onClick={onAdd} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors ml-1" title={`${label} 추가`}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
