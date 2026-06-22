import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Star, X, Clock, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ListHeader } from "./ListHeader";
import { cn } from "@/lib/utils";
import {
  CalApplication, CalSchedule, CalTask, PostingFilterValue, ApplicationStatus,
  DAYS_KO, MONTHS_KO, getDday, getDdayStyle, getDateRange,
} from "@/data/calendarData";
import { CreateScheduleModal, CreateTaskModal } from "./CreateModal";
import { PostingDetailModal, ScheduleDetailModal, TaskDetailModal } from "./DetailModal";

interface ExpandedViewProps {
  applications: CalApplication[];
  schedules: CalSchedule[];
  tasks: CalTask[];
  carriedOverTasks: CalTask[];
  onClose: () => void;
  onToggleTask: (id: string) => void;
  onAddTask: (title: string, linkedPostingId?: string) => void;
  onAddSchedule: (data: { title: string; date: string; time: string; linkedPostingId?: string; notes: string }) => void;
  onToggleStar: (id: string) => void;
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
}

type SortKey = "deadline" | "company" | "starred" | "position" | "stage";
type SortDir = "asc" | "desc";

function MiniCalendar({
  currentDate, selectedDate, onDateSelect, onMonthChange,
  highlightDates, highlightColor, selectedHighlightDates, selectedHighlightColor,
  deadlineDates,
}: {
  currentDate: Date; selectedDate: Date;
  onDateSelect: (d: Date) => void; onMonthChange: (d: Date) => void;
  highlightDates: string[]; highlightColor?: string;
  selectedHighlightDates: string[]; selectedHighlightColor?: string;
  deadlineDates: { date: string; color: string }[];
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const todayStr = new Date().toISOString().split("T")[0];

  const days: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) days.push({ date: new Date(year, month - 1, prevDays - i), isCurrentMonth: false });
  for (let i = 1; i <= daysInMonth; i++) days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  const rem = 42 - days.length;
  for (let i = 1; i <= rem; i++) days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });

  const deadlineMap = useMemo(() => {
    const m = new Map<string, string>();
    deadlineDates.forEach((dd) => m.set(dd.date, dd.color));
    return m;
  }, [deadlineDates]);

  const hoverSet = useMemo(() => new Set(highlightDates), [highlightDates]);
  const selSet = useMemo(() => new Set(selectedHighlightDates), [selectedHighlightDates]);
  const allDateStrs = days.map(d => d.date.toISOString().split("T")[0]);

  const getPill = (ds: string, dateSet: Set<string>) => {
    const idx = allDateStrs.indexOf(ds);
    if (idx < 0) return null;
    const col = idx % 7;
    const prev = col > 0 ? allDateStrs[idx - 1] : null;
    const next = col < 6 ? allDateStrs[idx + 1] : null;
    return { isStart: !prev || !dateSet.has(prev), isEnd: !next || !dateSet.has(next) };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMonthChange(new Date(year, month - 1, 1))}><ChevronLeft size={14} /></Button>
        <span className="text-sm font-semibold">{year}년 {MONTHS_KO[month]}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMonthChange(new Date(year, month + 1, 1))}><ChevronRight size={14} /></Button>
      </div>
      <div className="grid grid-cols-7 gap-0">
        {DAYS_KO.map((d) => <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-0.5">{d}</div>)}
        {days.map(({ date, isCurrentMonth }, idx) => {
          const ds = date.toISOString().split("T")[0];
          const isToday = ds === todayStr;
          const isSel = date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
          const deadlineColor = deadlineMap.get(ds);
          const isHover = hoverSet.has(ds);
          const isSelHighlight = selSet.has(ds);
          const hovPill = isHover ? getPill(ds, hoverSet) : null;
          const selPill = isSelHighlight ? getPill(ds, selSet) : null;

          return (
            <button key={idx} onClick={() => onDateSelect(date)}
              className={cn(
                "w-7 h-7 text-[11px] rounded-full flex flex-col items-center justify-center transition-colors relative",
                !isCurrentMonth && "text-muted-foreground/30",
                isCurrentMonth && "text-foreground",
                isSel && "bg-primary text-primary-foreground",
                !isSel && isToday && "bg-accent text-accent-foreground font-semibold",
                !isSel && !isToday && isCurrentMonth && "hover:bg-accent/50",
              )}>
              {selPill && !isSel && (
                <div className="absolute inset-x-0 inset-y-0 z-0 pointer-events-none" style={{
                  backgroundColor: (selectedHighlightColor || '#3B82F6') + '20',
                  borderTopLeftRadius: selPill.isStart ? '9999px' : 0,
                  borderBottomLeftRadius: selPill.isStart ? '9999px' : 0,
                  borderTopRightRadius: selPill.isEnd ? '9999px' : 0,
                  borderBottomRightRadius: selPill.isEnd ? '9999px' : 0,
                  marginLeft: selPill.isStart ? '2px' : '-1px',
                  marginRight: selPill.isEnd ? '2px' : '-1px',
                }} />
              )}
              {hovPill && !selPill && !isSel && (
                <div className="absolute inset-x-0 inset-y-0 z-0 pointer-events-none opacity-40" style={{
                  backgroundColor: (highlightColor || '#3B82F6') + '15',
                  borderTopLeftRadius: hovPill.isStart ? '9999px' : 0,
                  borderBottomLeftRadius: hovPill.isStart ? '9999px' : 0,
                  borderTopRightRadius: hovPill.isEnd ? '9999px' : 0,
                  borderBottomRightRadius: hovPill.isEnd ? '9999px' : 0,
                  marginLeft: hovPill.isStart ? '2px' : '-1px',
                  marginRight: hovPill.isEnd ? '2px' : '-1px',
                }} />
              )}
              {deadlineColor && !isSel && <span className="absolute -top-0.5 w-1 h-1 rounded-full z-10" style={{ backgroundColor: deadlineColor }} />}
              <span className="relative z-10">{date.getDate()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ExpandedView({
  applications, schedules, tasks, carriedOverTasks,
  onClose, onToggleTask, onAddTask, onAddSchedule, onToggleStar, onUpdateStatus,
}: ExpandedViewProps) {
  const [postingFilter, setPostingFilter] = useState<PostingFilterValue>("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [checkedPostings, setCheckedPostings] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("deadline");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [hoveredPostingId, setHoveredPostingId] = useState<string | null>(null);
  const [selectedPostingId, setSelectedPostingId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"today" | "all">("today");
  const [taskMode, setTaskMode] = useState<"today" | "all">("today");
  const [listMonth, setListMonth] = useState(new Date());
  const [schedulePeriod, setSchedulePeriod] = useState("1개월");
  const [taskPeriod, setTaskPeriod] = useState("1개월");
  const [detailApp, setDetailApp] = useState<CalApplication | null>(null);
  const [detailSchedule, setDetailSchedule] = useState<CalSchedule | null>(null);
  const [detailTask, setDetailTask] = useState<CalTask | null>(null);
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [visibleCols, setVisibleCols] = useState({ company: true, type: false, time: true });

  const dateStr = selectedDate.toISOString().split("T")[0];
  const hasChecked = checkedPostings.size > 0;
  const effectiveFilter = hasChecked ? "checked" : postingFilter;
  const defaultPostingId = effectiveFilter !== "all" && effectiveFilter !== "personal" && effectiveFilter !== "checked" ? effectiveFilter : undefined;

  const toggleCheck = (id: string) => {
    setCheckedPostings((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const highlightDates = useMemo(() => {
    if (!hoveredPostingId) return [];
    const app = applications.find((a) => a.id === hoveredPostingId);
    if (!app?.recruitmentStart || !app?.recruitmentEnd) return [];
    return getDateRange(app.recruitmentStart, app.recruitmentEnd);
  }, [hoveredPostingId, applications]);

  const highlightColor = useMemo(() => applications.find((a) => a.id === hoveredPostingId)?.brandColor, [hoveredPostingId, applications]);

  const selectedHighlightDates = useMemo(() => {
    if (!selectedPostingId) return [];
    const app = applications.find((a) => a.id === selectedPostingId);
    if (!app?.recruitmentStart || !app?.recruitmentEnd) return [];
    return getDateRange(app.recruitmentStart, app.recruitmentEnd);
  }, [selectedPostingId, applications]);

  const selectedHighlightColor = useMemo(() => applications.find((a) => a.id === selectedPostingId)?.brandColor, [selectedPostingId, applications]);

  const deadlineDates = useMemo(() => applications.map((a) => ({ date: a.deadline, color: a.brandColor || "hsl(var(--primary))" })), [applications]);

  const sortedApps = useMemo(() => {
    let filtered = [...applications];
    if (postingFilter === "personal") filtered = [];
    else if (postingFilter !== "all") filtered = filtered.filter((a) => a.id === postingFilter);
    return filtered.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "starred") cmp = (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
      else if (sortKey === "company") cmp = a.company.localeCompare(b.company);
      else if (sortKey === "position") cmp = a.position.localeCompare(b.position);
      else if (sortKey === "stage") cmp = a.stage.localeCompare(b.stage);
      else cmp = getDday(a.deadline) - getDday(b.deadline);
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [applications, postingFilter, sortKey, sortDir]);

  const selectAll = () => {
    if (checkedPostings.size === sortedApps.length) setCheckedPostings(new Set());
    else setCheckedPostings(new Set(sortedApps.map((a) => a.id)));
  };

  const allTasks = [...carriedOverTasks, ...tasks];
  const filterItem = (linkedPostingId?: string, isPersonal?: boolean) => {
    if (effectiveFilter === "checked") return checkedPostings.has(linkedPostingId || "") || (!linkedPostingId && isPersonal !== false);
    if (effectiveFilter === "personal") return isPersonal || !linkedPostingId;
    if (effectiveFilter !== "all") return linkedPostingId === effectiveFilter;
    return true;
  };

  const todaySchedules = schedules.filter((s) => s.date === dateStr && filterItem(s.linkedPostingId, s.scheduleType === "personal"));
  const allSchedules = schedules.filter((s) => filterItem(s.linkedPostingId, s.scheduleType === "personal"));
  const displaySchedules = scheduleMode === "today" ? todaySchedules : allSchedules;

  const displayTasks = allTasks.filter((t) => filterItem(t.linkedPostingId, !t.linkedPostingId));
  const visibleDisplayTasks = showCompleted ? displayTasks : displayTasks.filter((t) => !t.completed);

  const filterLabel = (v: PostingFilterValue) => {
    if (v === "all") return "전체 보기";
    if (v === "personal") return "개인 항목만";
    return (applications.find((a) => a.id === v)?.company || "") + " / " + (applications.find((a) => a.id === v)?.position || "");
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const shiftDate = (delta: number) => { const d = new Date(selectedDate); d.setDate(d.getDate() + delta); setSelectedDate(d); };

  const priorityStyles: Record<string, string> = {
    high: "bg-red-100 text-red-600 border-red-200",
    medium: "bg-primary/10 text-primary border-primary/30",
    low: "bg-muted text-muted-foreground border-border",
  };
  const priorityLabels: Record<string, string> = { high: "긴급", medium: "보통", low: "낮음" };

  const SortHeader = ({ label, sortKeyVal, className }: { label: string; sortKeyVal: SortKey; className?: string }) => (
    <button onClick={() => handleSort(sortKeyVal)} className={cn("flex items-center gap-0.5 hover:text-foreground transition-colors group", className)}>
      {label}
      <span className={cn("text-[8px] opacity-0 group-hover:opacity-100 transition-opacity", sortKey === sortKeyVal && "opacity-100")}>
        {sortKey === sortKeyVal ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </button>
  );

  const checkedApps = applications.filter(a => checkedPostings.has(a.id));

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between px-6 h-12 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-foreground">지원중인 공고 확장보기</h1>
          <span className="text-xs text-muted-foreground">/ {hasChecked ? `${checkedPostings.size}개 공고 선택` : filterLabel(postingFilter)}</span>
          {checkedApps.length > 0 && (
            <div className="flex items-center gap-1 ml-2">
              {checkedApps.map(a => (
                <Badge key={a.id} variant="outline" className="text-[10px] h-5 gap-1 cursor-pointer hover:bg-accent" onClick={() => toggleCheck(a.id)}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: a.brandColor || '#3B82F6' }} />
                  {a.company}<span className="text-muted-foreground ml-0.5">✕</span>
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox checked={showCompleted} onCheckedChange={(c) => setShowCompleted(!!c)} className="h-3 w-3" />
            <span className="text-[11px] text-muted-foreground">완료 항목</span>
          </label>
          <Select value={postingFilter} onValueChange={(v) => { setPostingFilter(v as PostingFilterValue); setCheckedPostings(new Set()); }}>
            <SelectTrigger className="h-7 text-xs w-auto min-w-[160px]"><SelectValue>{filterLabel(postingFilter)}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 보기</SelectItem>
              <SelectItem value="personal">개인 항목만</SelectItem>
              {applications.map((app) => <SelectItem key={app.id} value={app.id}>{app.company} / {app.position}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X size={16} /></Button>
        </div>
      </div>

      <ResizablePanelGroup direction="vertical" className="flex-1">
        <ResizablePanel defaultSize={40} minSize={25} maxSize={60}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
              <div className="h-full p-4 border-r border-border overflow-auto">
                <MiniCalendar
                  currentDate={currentDate} selectedDate={selectedDate}
                  onDateSelect={setSelectedDate} onMonthChange={setCurrentDate}
                  highlightDates={highlightDates} highlightColor={highlightColor}
                  selectedHighlightDates={selectedHighlightDates} selectedHighlightColor={selectedHighlightColor}
                  deadlineDates={deadlineDates}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={70} minSize={40}>
              <div className="flex flex-col h-full min-w-0">
                <div className="flex items-center justify-between px-4 py-1.5 border-b border-border bg-muted/20">
                  <span className="text-xs font-semibold text-foreground">지원공고 리스트</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"><Settings2 size={12} /></button>
                    </PopoverTrigger>
                    <PopoverContent className="w-36 p-2" align="end">
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1">보기 옵션</p>
                      {[{ key: "company" as const, label: "회사" }, { key: "time" as const, label: "시간" }, { key: "type" as const, label: "유형" }].map(c => (
                        <label key={c.key} className="flex items-center gap-1.5 py-0.5 cursor-pointer">
                          <Checkbox checked={visibleCols[c.key]} onCheckedChange={(v) => setVisibleCols(p => ({ ...p, [c.key]: !!v }))} className="h-3 w-3" />
                          <span className="text-xs">{c.label}</span>
                        </label>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>
                <ScrollArea className="flex-1">
                  <div className="grid grid-cols-[28px_28px_minmax(60px,0.8fr)_minmax(80px,1.5fr)_72px_52px_90px] gap-1.5 px-4 py-1 text-[10px] font-medium text-muted-foreground border-b border-border sticky top-0 bg-background z-10">
                    <span><Checkbox checked={checkedPostings.size > 0 && checkedPostings.size === sortedApps.length} onCheckedChange={selectAll} className="h-3 w-3" /></span>
                    <SortHeader label="★" sortKeyVal="starred" />
                    <SortHeader label="기업명" sortKeyVal="company" />
                    <SortHeader label="직무명" sortKeyVal="position" />
                    <SortHeader label="마감일" sortKeyVal="deadline" />
                    <span className="text-[10px]">D-day</span>
                    <SortHeader label="전형 단계" sortKeyVal="stage" />
                  </div>
                  {sortedApps.map((app) => {
                    const dd = getDday(app.deadline);
                    const ddStyle = getDdayStyle(dd);
                    const isChecked = checkedPostings.has(app.id);
                    const isRowSelected = selectedPostingId === app.id;
                    return (
                      <div key={app.id}
                        onMouseEnter={() => setHoveredPostingId(app.id)}
                        onMouseLeave={() => setHoveredPostingId(null)}
                        onClick={() => setSelectedPostingId(selectedPostingId === app.id ? null : app.id)}
                        className={cn(
                          "grid grid-cols-[28px_28px_minmax(60px,0.8fr)_minmax(80px,1.5fr)_72px_52px_90px] gap-1.5 px-4 py-1.5 text-sm w-full border-b border-border/50 transition-colors cursor-pointer",
                          isRowSelected ? "bg-primary/5 border-l-2 border-l-primary" : isChecked ? "bg-accent/50" : "hover:bg-accent/20"
                        )}>
                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={isChecked} onCheckedChange={() => toggleCheck(app.id)} className="h-3.5 w-3.5" />
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onToggleStar(app.id); }} className="flex items-center">
                          <Star size={13} className={cn(app.starred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                        </button>
                        <span className="text-xs text-muted-foreground truncate">{app.company}</span>
                        <span className="text-xs font-medium truncate text-primary cursor-pointer hover:underline"
                          onClick={(e) => { e.stopPropagation(); setDetailApp(app); }}>{app.position}</span>
                        <span className="text-[11px]">{app.deadline.slice(5).replace("-", "/")}</span>
                        <Badge className={cn("text-[9px] h-4 border-0 w-fit", ddStyle.bg, ddStyle.text)}>{ddStyle.label}</Badge>
                        <Badge variant="outline" className="text-[9px] h-4 w-fit">{app.stage}</Badge>
                      </div>
                    );
                  })}
                </ScrollArea>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={60} minSize={30}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={45} minSize={25}>
              <div className="flex flex-col h-full min-w-0">
                <div className="px-4 py-2 border-b border-border">
                  <ListHeader label="일정" count={displaySchedules.length}
                    mode={scheduleMode} onToggleMode={() => setScheduleMode(m => m === "today" ? "all" : "today")}
                    selectedDate={selectedDate} onShiftDate={shiftDate} onResetToday={() => setSelectedDate(new Date())}
                    currentMonth={listMonth} onShiftMonth={(d) => setListMonth(new Date(listMonth.getFullYear(), listMonth.getMonth() + d, 1))}
                    period={schedulePeriod} onPeriodChange={setSchedulePeriod} onAdd={() => setShowCreateSchedule(true)} />
                </div>
                <ScrollArea className="flex-1 p-3">
                  {displaySchedules.length === 0 ? (
                    <button onClick={() => setShowCreateSchedule(true)}
                      className="w-full flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground hover:text-primary hover:bg-accent/30 rounded-md border border-dashed border-border transition-colors">
                      선택한 날짜에 일정 추가하기
                    </button>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {displaySchedules.map((s) => (
                        <div key={s.id} className="flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer hover:bg-accent/30 transition-colors"
                          onClick={() => setDetailSchedule(s)}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium truncate">{s.title}</span>
                            {s.linkedPosting && <span className="text-[10px] text-muted-foreground">{s.linkedPosting}</span>}
                            {s.scheduleType === "personal" && <Badge variant="outline" className="text-[9px] h-4 bg-muted border-0">개인</Badge>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 text-[11px] text-muted-foreground">
                            {scheduleMode === "all" && <span>{s.date.slice(5).replace("-", "/")}</span>}
                            {s.time && <span className="flex items-center gap-0.5"><Clock size={9} />{s.time}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={55} minSize={25}>
              <div className="flex flex-col h-full min-w-0">
                <div className="px-4 py-2 border-b border-border">
                  <ListHeader label="할 일" count={visibleDisplayTasks.length}
                    mode={taskMode} onToggleMode={() => setTaskMode(m => m === "today" ? "all" : "today")}
                    selectedDate={selectedDate} onShiftDate={shiftDate} onResetToday={() => setSelectedDate(new Date())}
                    currentMonth={listMonth} onShiftMonth={(d) => setListMonth(new Date(listMonth.getFullYear(), listMonth.getMonth() + d, 1))}
                    period={taskPeriod} onPeriodChange={setTaskPeriod} onAdd={() => setShowCreateTask(true)} />
                </div>
                <ScrollArea className="flex-1 p-3">
                  {visibleDisplayTasks.length === 0 ? (
                    <button onClick={() => setShowCreateTask(true)}
                      className="w-full flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground hover:text-primary hover:bg-accent/30 rounded-md border border-dashed border-border transition-colors">
                      선택한 날짜에 할 일 추가하기
                    </button>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {visibleDisplayTasks.map((task) => (
                        <div key={task.id}
                          className={cn("relative flex items-start gap-2 py-1.5 px-2 rounded-md transition-all",
                            task.completed ? "opacity-50" : "",
                            task.carriedOver && !task.completed && "bg-orange-50/50"
                          )}>
                          {task.carriedOver && <Badge className="absolute top-1 right-1 bg-orange-100 text-orange-600 border-orange-200 text-[9px] h-3.5 px-1">이월</Badge>}
                          <Checkbox checked={task.completed} onCheckedChange={() => onToggleTask(task.id)} className="mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setDetailTask(task)}>
                            <p className={cn("text-sm", task.completed && "line-through text-muted-foreground")}>{task.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <Badge variant="outline" className={cn("text-[9px] h-3.5 px-1 border-0", priorityStyles[task.priority])}>{priorityLabels[task.priority]}</Badge>
                              {task.linkedPosting && <span className="text-[10px] text-muted-foreground">{task.linkedPosting}</span>}
                              {task.dueTime && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock size={9} />{task.dueTime}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>

      <PostingDetailModal app={detailApp} schedules={schedules} tasks={allTasks} onClose={() => setDetailApp(null)}
        onUpdateStatus={(id, s) => { onUpdateStatus(id, s); setDetailApp((prev) => prev ? { ...prev, status: s, stage: s } : null); }}
        onToggleTask={onToggleTask} onAddTask={onAddTask} />
      <ScheduleDetailModal schedule={detailSchedule} onClose={() => setDetailSchedule(null)} />
      <TaskDetailModal task={detailTask} onClose={() => setDetailTask(null)} onToggle={onToggleTask} />
      <CreateScheduleModal open={showCreateSchedule} onClose={() => setShowCreateSchedule(false)} onSave={onAddSchedule} applications={applications} defaultDate={dateStr} defaultPostingId={defaultPostingId} />
      <CreateTaskModal open={showCreateTask} onClose={() => setShowCreateTask(false)} applications={applications} defaultDate={dateStr} defaultPostingId={defaultPostingId}
        onSave={(data) => { onAddTask(data.title, data.linkedPostingId); }} />
    </div>
  );
}
