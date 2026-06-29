import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  CalendarEvent, DAYS_KO, MONTHS_KO, getDday,
  CalApplication, PostingFilterValue, CalSchedule, CalTask, getDateRange,
} from "@/data/calendarData";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MonthlyCalendarProps {
  currentDate: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  applications: CalApplication[];
  schedules: CalSchedule[];
  tasks: CalTask[];
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  postingFilter: PostingFilterValue;
  onPostingFilterChange: (v: PostingFilterValue) => void;
  viewMode: "month" | "week";
  onViewModeChange: (mode: "month" | "week") => void;
  selectedPostingId?: string | null;
  onSelectPosting?: (id: string | null) => void;
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const days: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) days.push({ date: new Date(year, month - 1, prevDays - i), isCurrentMonth: false });
  for (let i = 1; i <= daysInMonth; i++) days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  return days;
}

function getWeekDays(date: Date) {
  const day = date.getDay();
  const start = new Date(date);
  start.setDate(start.getDate() - day);
  const days: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push({ date: d, isCurrentMonth: d.getMonth() === date.getMonth() });
  }
  return days;
}

const eventTypeColor: Record<string, string> = {
  interview: "bg-primary/15 text-primary border-primary/20",
  deadline: "bg-red-50 text-red-600 border-red-200",
  personal: "bg-muted text-muted-foreground border-border",
  task: "bg-accent text-accent-foreground border-accent",
};

function filterEventByPosting(e: CalendarEvent, filter: PostingFilterValue) {
  if (filter === "all") return true;
  if (filter === "personal") return !e.postingId && e.type === "personal";
  return e.postingId === filter;
}

export function MonthlyCalendar({
  currentDate, selectedDate, events, applications,
  onDateSelect, onMonthChange,
  postingFilter, onPostingFilterChange,
  viewMode, onViewModeChange,
  selectedPostingId, onSelectPosting,
}: MonthlyCalendarProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const [hoveredPostingId, setHoveredPostingId] = useState<string | null>(null);

  const days = useMemo(
    () => (viewMode === "month" ? getMonthDays(year, month) : getWeekDays(selectedDate)),
    [year, month, viewMode, selectedDate]
  );

  const filteredEvents = useMemo(
    () => events.filter((e) => filterEventByPosting(e, postingFilter)),
    [events, postingFilter]
  );

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [filteredEvents]);

  const selectedHighlight = useMemo(() => {
    if (!selectedPostingId) return { dates: new Set<string>(), color: "" };
    const app = applications.find((a) => a.id === selectedPostingId);
    if (!app?.recruitmentStart || !app?.recruitmentEnd) return { dates: new Set<string>(), color: '' };
    return { dates: new Set(getDateRange(app.recruitmentStart, app.recruitmentEnd)), color: app.brandColor || '#3B82F6' };
  }, [selectedPostingId, applications]);

  const hoverHighlight = useMemo(() => {
    if (!hoveredPostingId || hoveredPostingId === selectedPostingId) return { dates: new Set<string>(), color: '' };
    const app = applications.find((a) => a.id === hoveredPostingId);
    if (!app?.recruitmentStart || !app?.recruitmentEnd) return { dates: new Set<string>(), color: '' };
    return { dates: new Set(getDateRange(app.recruitmentStart, app.recruitmentEnd)), color: app.brandColor || '#3B82F6' };
  }, [hoveredPostingId, selectedPostingId, applications]);

  const todayStr = new Date().toISOString().split("T")[0];
  const prevMonth = () => onMonthChange(new Date(year, month - 1, 1));
  const nextMonth = () => onMonthChange(new Date(year, month + 1, 1));

  const filterLabel = (v: PostingFilterValue) => {
    if (v === "all") return "전체 보기";
    if (v === "personal") return "개인 항목만";
    const app = applications.find((a) => a.id === v);
    return app ? `${app.company} / ${app.position}` : "전체 보기";
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    if (event.postingId && onSelectPosting) {
      onSelectPosting(selectedPostingId === event.postingId ? null : event.postingId);
    }
  };

  const getPillPosition = (dateStr: string, dates: Set<string>, allDays: { date: Date; isCurrentMonth: boolean }[]) => {
    const allDateStrs = allDays.map(d => d.date.toISOString().split("T")[0]);
    const idx = allDateStrs.indexOf(dateStr);
    if (idx < 0) return null;
    const col = idx % 7;
    const prevDate = col > 0 ? allDateStrs[idx - 1] : null;
    const nextDate = col < 6 ? allDateStrs[idx + 1] : null;
    return {
      isStart: !prevDate || !dates.has(prevDate),
      isEnd: !nextDate || !dates.has(nextDate),
    };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}><ChevronLeft size={16} /></Button>
          <h2 className="text-lg font-semibold text-foreground">{year}년 {MONTHS_KO[month]}</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}><ChevronRight size={16} /></Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={viewMode === "month" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => onViewModeChange("month")}>월간</Button>
          <Button variant={viewMode === "week" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => onViewModeChange("week")}>주간</Button>
        </div>
      </div>

      {/* Posting filter */}
      <div className="flex gap-2 mb-3 px-1">
        <Select value={postingFilter} onValueChange={onPostingFilterChange}>
          <SelectTrigger className="h-8 text-xs w-auto min-w-[180px]">
            <SelectValue>{filterLabel(postingFilter)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 보기</SelectItem>
            <SelectItem value="personal">개인 항목만</SelectItem>
            {applications.map((app) => (
              <SelectItem key={app.id} value={app.id}>{app.company} / {app.position}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedPostingId && (
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => onSelectPosting?.(null)}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedHighlight.color }} />
            {applications.find(a => a.id === selectedPostingId)?.company}
            <span className="ml-1 text-muted-foreground">✕</span>
          </Button>
        )}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_KO.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">{day}</div>
        ))}
      </div>

      {/* Grid */}
      <div className={cn("grid grid-cols-7 flex-1", viewMode === "week" ? "grid-rows-1" : "grid-rows-6")}>
        {days.map(({ date, isCurrentMonth }, idx) => {
          const dateStr = date.toISOString().split("T")[0];
          const isToday = dateStr === todayStr;
          const isSelected =
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
          const dayEvents = eventsByDate[dateStr] || [];

          const deadlineEvent = dayEvents.find((e) => e.type === "deadline");
          const ddVal = deadlineEvent ? getDday(deadlineEvent.date) : null;
          const urgencyDot = ddVal !== null && ddVal >= 0 && ddVal <= 3
            ? (ddVal <= 1 ? "bg-red-500 animate-pulse" : "bg-amber-500")
            : null;

          const isSelectedHighlight = selectedHighlight.dates.has(dateStr);
          const isHoverHighlight = hoverHighlight.dates.has(dateStr);
          const selPill = isSelectedHighlight ? getPillPosition(dateStr, selectedHighlight.dates, days) : null;
          const hovPill = isHoverHighlight ? getPillPosition(dateStr, hoverHighlight.dates, days) : null;

          return (
            <button
              key={idx}
              onClick={() => onDateSelect(date)}
              className={cn(
                "relative flex flex-col items-start p-1 border border-transparent rounded-md text-left transition-colors min-h-[80px]",
                isCurrentMonth ? "text-foreground" : "text-muted-foreground/40",
                isSelected && "border-primary bg-accent/50",
                !isSelected && isCurrentMonth && "hover:bg-accent/30"
              )}
            >
              {selPill && (
                <div className="absolute inset-x-0 top-0 h-1.5 z-0" style={{
                  backgroundColor: selectedHighlight.color + '30',
                  borderTopLeftRadius: selPill.isStart ? '9999px' : 0,
                  borderBottomLeftRadius: selPill.isStart ? '9999px' : 0,
                  borderTopRightRadius: selPill.isEnd ? '9999px' : 0,
                  borderBottomRightRadius: selPill.isEnd ? '9999px' : 0,
                  marginLeft: selPill.isStart ? '4px' : '-1px',
                  marginRight: selPill.isEnd ? '4px' : '-1px',
                }} />
              )}
              {hovPill && !selPill && (
                <div className="absolute inset-x-0 top-0 h-1 z-0 opacity-50" style={{
                  backgroundColor: hoverHighlight.color + '20',
                  borderTopLeftRadius: hovPill.isStart ? '9999px' : 0,
                  borderBottomLeftRadius: hovPill.isStart ? '9999px' : 0,
                  borderTopRightRadius: hovPill.isEnd ? '9999px' : 0,
                  borderBottomRightRadius: hovPill.isEnd ? '9999px' : 0,
                  marginLeft: hovPill.isStart ? '4px' : '-1px',
                  marginRight: hovPill.isEnd ? '4px' : '-1px',
                }} />
              )}
              <div className="flex items-center gap-1 w-full z-10">
                <span className={cn(
                  "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                  isToday && "bg-primary text-primary-foreground"
                )}>{date.getDate()}</span>
                {urgencyDot && <span className={cn("w-1.5 h-1.5 rounded-full", urgencyDot)} />}
              </div>
              <div className="flex flex-col gap-0.5 mt-0.5 w-full overflow-hidden z-10">
                {dayEvents.slice(0, 2).map((event) => (
                  <Badge
                    key={event.id}
                    className={cn("text-[10px] px-1 py-0 h-4 justify-start truncate rounded-sm font-normal w-full cursor-pointer hover:opacity-80", eventTypeColor[event.type])}
                    onClick={(e) => handleEventClick(e, event)}
                    onMouseEnter={() => event.postingId && setHoveredPostingId(event.postingId)}
                    onMouseLeave={() => setHoveredPostingId(null)}
                  >{event.title}</Badge>
                ))}
                {dayEvents.length > 2 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <span className="text-[10px] text-primary cursor-pointer hover:underline pl-1" onClick={(e) => e.stopPropagation()}>
                        +{dayEvents.length - 2} more
                      </span>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2" align="start">
                      <p className="text-xs font-semibold mb-1.5">{date.getMonth() + 1}월 {date.getDate()}일 일정</p>
                      <div className="flex flex-col gap-1">
                        {dayEvents.map((event) => (
                          <div key={event.id} className="flex items-center gap-1.5 cursor-pointer hover:bg-accent/30 rounded p-0.5"
                            onClick={(e) => handleEventClick(e, event)}>
                            <Badge className={cn("text-[10px] px-1 py-0 h-4 rounded-sm font-normal shrink-0", eventTypeColor[event.type])}>
                              {event.type === "interview" ? "면접" : event.type === "deadline" ? "마감" : event.type === "personal" ? "개인" : "할일"}
                            </Badge>
                            <span className="text-xs truncate">{event.title}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
