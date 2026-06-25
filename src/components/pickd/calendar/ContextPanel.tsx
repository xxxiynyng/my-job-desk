import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProgressRing } from "./ProgressRing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ListHeader } from "./ListHeader";
import { cn } from "@/lib/utils";
import {
  formatKoreanDate, getDday, getDdayStyle,
  CalTask, CalApplication, CalSchedule, PostingFilterValue, ApplicationStatus,
} from "@/data/calendarData";
import { Clock, Sparkles, Star, ChevronDown, CalendarPlus, ListPlus, ChevronLeft } from "lucide-react";
import { CreateScheduleModal, CreateTaskModal } from "./CreateModal";
import { PostingDetailModal, ScheduleDetailModal, TaskDetailModal } from "./DetailModal";

interface ContextPanelProps {
  selectedDate: Date;
  tasks: CalTask[];
  carriedOverTasks: CalTask[];
  applications: CalApplication[];
  schedules: CalSchedule[];
  onToggleTask: (id: string) => void;
  onAddTask: (title: string, linkedPostingId?: string) => void;
  onAddSchedule: (data: { title: string; date: string; time: string; linkedPostingId?: string; notes: string }) => void;
  progress: number;
  postingFilter: PostingFilterValue;
  onToggleStar: (id: string) => void;
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
}

const priorityStyles: Record<string, string> = {
  high: "bg-red-100 text-red-600 border-red-200",
  medium: "bg-primary/10 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
};
const priorityLabels: Record<string, string> = { high: "긴급", medium: "보통", low: "낮음" };

const stageStyles: Record<string, string> = {
  "지원서 작성": "bg-muted text-muted-foreground",
  "서류 전형": "bg-primary/10 text-primary",
  "필기 전형": "bg-amber-100 text-amber-700",
  "면접 전형": "bg-emerald-100 text-emerald-700",
  "최종합격": "bg-green-100 text-green-700",
};

export function ContextPanel({
  selectedDate, tasks, carriedOverTasks, applications, schedules,
  onToggleTask, onAddTask, onAddSchedule, progress,
  postingFilter, onToggleStar, onUpdateStatus,
}: ContextPanelProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const dateStr = selectedDate.toISOString().split("T")[0];
  const isToday = dateStr === todayStr;

  const [detailApp, setDetailApp] = useState<CalApplication | null>(null);
  const [detailSchedule, setDetailSchedule] = useState<CalSchedule | null>(null);
  const [detailTask, setDetailTask] = useState<CalTask | null>(null);
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"today" | "all">("today");
  const [taskMode, setTaskMode] = useState<"today" | "all">("today");
  const [listDate, setListDate] = useState(selectedDate);
  const [listMonth, setListMonth] = useState(new Date());
  const [schedulePeriod, setSchedulePeriod] = useState("1개월");
  const [taskPeriod, setTaskPeriod] = useState("1개월");
  const [postingsOpen, setPostingsOpen] = useState(true);
  const [panelMode, setPanelMode] = useState<"date" | "all">("date");

  const defaultPostingId = postingFilter !== "all" && postingFilter !== "personal" ? postingFilter : undefined;

  const upcomingApps = applications.filter((a) => {
    const dd = getDday(a.deadline);
    if (postingFilter === "personal") return false;
    if (postingFilter !== "all" && a.id !== postingFilter) return false;
    return dd >= 0 && dd <= 14;
  }).sort((a, b) => getDday(a.deadline) - getDday(b.deadline));

  const effectiveScheduleMode = panelMode === "all" ? "all" : scheduleMode;
  const effectiveTaskMode = panelMode === "all" ? "all" : taskMode;

  const filteredSchedules = schedules.filter((s) => {
    if (effectiveScheduleMode === "today" && s.date !== dateStr) return false;
    if (postingFilter === "personal") return s.scheduleType === "personal";
    if (postingFilter !== "all") return s.linkedPostingId === postingFilter;
    return true;
  });

  const allTodayTasks = [...carriedOverTasks, ...tasks]
    .filter((t) => {
      if (postingFilter === "personal") return !t.linkedPostingId;
      if (postingFilter !== "all") return t.linkedPostingId === postingFilter;
      return true;
    })
    .sort((a, b) => Number(a.completed) - Number(b.completed));
  void effectiveTaskMode; // used in TaskMode toggle label only

  const MAX_POSTINGS = 3;
  const [showAllPostings, setShowAllPostings] = useState(false);
  const visibleApps = showAllPostings ? upcomingApps : upcomingApps.slice(0, MAX_POSTINGS);
  const allTasksForModal = [...carriedOverTasks, ...tasks];

  const shiftListDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setListDate(d);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
        <div className="flex-1 min-w-0">
          {panelMode === "date" ? (
            <>
              <h3 className="text-base font-semibold text-foreground">{formatKoreanDate(selectedDate)}</h3>
              {isToday && <span className="text-xs text-muted-foreground">오늘의 진행률</span>}
            </>
          ) : (
            <h3 className="text-base font-semibold text-foreground">전체 일정 · 할일 · 공고</h3>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ProgressRing progress={progress} size={44} strokeWidth={3.5} />
          <Button
            variant="ghost" size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-foreground px-2 gap-1"
            onClick={() => setPanelMode(m => m === "date" ? "all" : "date")}
          >
            {panelMode === "date" ? "전체보기" : <><ChevronLeft size={12} />날짜별</>}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4">
          <Collapsible open={postingsOpen} onOpenChange={setPostingsOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group">
              <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", !postingsOpen && "-rotate-90")} />
              <span className="text-sm font-semibold">다가오는 공고</span>
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{upcomingApps.length}</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              {visibleApps.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 pl-5">다가오는 공고가 없습니다</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {visibleApps.map((app) => {
                    const dd = getDday(app.deadline);
                    const ddStyle = getDdayStyle(dd);
                    return (
                      <div key={app.id}
                        className="flex items-center justify-between py-2 px-3 rounded-md text-sm cursor-pointer hover:bg-accent/40 transition-colors border border-transparent hover:border-border"
                        onClick={() => setDetailApp(app)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <button onClick={(e) => { e.stopPropagation(); onToggleStar(app.id); }} className="shrink-0">
                            <Star size={13} className={cn(app.starred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                          </button>
                          <div className="min-w-0">
                            <span className="font-medium text-sm truncate block">{app.position}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-muted-foreground">{app.company}</span>
                              <Badge className={cn("text-[9px] h-4 px-1 border-0", stageStyles[app.stage] || "bg-muted text-muted-foreground")}>{app.stage}</Badge>
                            </div>
                          </div>
                        </div>
                        <Badge className={cn("text-[10px] h-5 border-0 shrink-0", ddStyle.bg, ddStyle.text)}>{ddStyle.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
              {upcomingApps.length > MAX_POSTINGS && !showAllPostings && (
                <div className="flex justify-end mt-1">
                  <Button variant="ghost" size="sm" className="h-6 text-[11px] text-muted-foreground" onClick={() => setShowAllPostings(true)}>
                    더보기 +{upcomingApps.length - MAX_POSTINGS}
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <div>
            <ListHeader
              label="일정" count={filteredSchedules.length}
              mode={effectiveScheduleMode} onToggleMode={() => panelMode === "date" && setScheduleMode(m => m === "today" ? "all" : "today")}
              selectedDate={selectedDate} onShiftDate={shiftListDate} onResetToday={() => setListDate(new Date())}
              currentMonth={listMonth} onShiftMonth={(d) => setListMonth(new Date(listMonth.getFullYear(), listMonth.getMonth() + d, 1))}
              period={schedulePeriod} onPeriodChange={setSchedulePeriod}
              onAdd={() => setShowCreateSchedule(true)} className="mb-2"
            />
            {filteredSchedules.length === 0 ? (
              <button onClick={() => setShowCreateSchedule(true)}
                className="w-full flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground hover:text-primary hover:bg-accent/30 rounded-md border border-dashed border-border transition-colors">
                <CalendarPlus size={14} />선택한 날짜에 일정 추가하기
              </button>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredSchedules.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-1.5 px-2 rounded-md text-sm cursor-pointer hover:bg-accent/30 transition-colors"
                    onClick={() => setDetailSchedule(s)}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate text-sm">{s.title}</span>
                      {s.linkedPosting && <span className="text-[10px] text-muted-foreground">{s.linkedPosting}</span>}
                      {s.scheduleType === "personal" && <Badge variant="outline" className="text-[9px] h-4 bg-muted border-0">개인</Badge>}
                    </div>
                    {s.time && <span className="text-[11px] text-muted-foreground flex items-center gap-0.5 shrink-0"><Clock size={10} />{s.time}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <ListHeader
              label="할 일" count={allTodayTasks.length}
              mode={effectiveTaskMode} onToggleMode={() => panelMode === "date" && setTaskMode(m => m === "today" ? "all" : "today")}
              selectedDate={selectedDate} onShiftDate={shiftListDate} onResetToday={() => setListDate(new Date())}
              currentMonth={listMonth} onShiftMonth={(d) => setListMonth(new Date(listMonth.getFullYear(), listMonth.getMonth() + d, 1))}
              period={taskPeriod} onPeriodChange={setTaskPeriod}
              onAdd={() => setShowCreateTask(true)} className="mb-2"
            />
            {allTodayTasks.length === 0 ? (
              <button onClick={() => setShowCreateTask(true)}
                className="w-full flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground hover:text-primary hover:bg-accent/30 rounded-md border border-dashed border-border transition-colors">
                <ListPlus size={14} />선택한 날짜에 할 일 추가하기
              </button>
            ) : (
              <div className="flex flex-col gap-1">
                {allTodayTasks.map((task) => (
                  <div key={task.id}
                    className={cn("relative flex items-start gap-2 py-1.5 px-2 rounded-md transition-all",
                      task.completed ? "opacity-50" : "",
                      task.carriedOver && !task.completed && "bg-orange-50/50"
                    )}>
                    {task.carriedOver && (
                      <Badge className="absolute top-1 right-1 bg-orange-100 text-orange-600 border-orange-200 text-[9px] h-4 px-1">이월</Badge>
                    )}
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
          </div>

          <div className="bg-accent/60 border border-primary/20 rounded-md p-3">
            <div className="flex items-start gap-2">
              <Sparkles size={14} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-foreground">
                <span className="font-semibold">AI 제안:</span> 삼성전자 마감이 오늘이에요. '최종 검토'를 오늘 할 일에 추가할까요?
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>

      <PostingDetailModal app={detailApp} schedules={schedules} tasks={allTasksForModal} onClose={() => setDetailApp(null)}
        onUpdateStatus={(id, s) => { onUpdateStatus(id, s); setDetailApp(prev => prev ? { ...prev, status: s, stage: s } : null); }}
        onToggleTask={onToggleTask} onAddTask={onAddTask} />
      <ScheduleDetailModal schedule={detailSchedule} onClose={() => setDetailSchedule(null)} />
      <TaskDetailModal task={detailTask} onClose={() => setDetailTask(null)} onToggle={onToggleTask} />
      <CreateScheduleModal open={showCreateSchedule} onClose={() => setShowCreateSchedule(false)} onSave={onAddSchedule} applications={applications} defaultDate={dateStr} defaultPostingId={defaultPostingId} />
      <CreateTaskModal open={showCreateTask} onClose={() => setShowCreateTask(false)} applications={applications} defaultDate={dateStr} defaultPostingId={defaultPostingId}
        onSave={(data) => { onAddTask(data.title, data.linkedPostingId); }} />
    </div>
  );
}
