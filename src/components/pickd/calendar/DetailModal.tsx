import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Pencil, Clock, CalendarDays, CheckSquare, ChevronRight } from "lucide-react";
import { CalApplication, CalSchedule, CalTask, ApplicationStatus, APPLICATION_STATUSES, getDday, getDdayStyle } from "@/data/calendarData";

interface PostingDetailProps {
  app: CalApplication | null;
  schedules: CalSchedule[];
  tasks: CalTask[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onToggleTask: (id: string) => void;
  onAddTask: (title: string, linkedPostingId?: string) => void;
}

export function PostingDetailModal({ app, schedules, tasks, onClose, onUpdateStatus, onToggleTask, onAddTask }: PostingDetailProps) {
  const [newTask, setNewTask] = useState("");
  if (!app) return null;

  const dd = getDday(app.deadline);
  const ddStyle = getDdayStyle(dd);
  const linkedSchedules = schedules.filter((s) => s.linkedPostingId === app.id);
  const linkedTasks = tasks.filter((t) => t.linkedPostingId === app.id);
  const pendingTasks = linkedTasks.filter((t) => !t.completed);
  const doneTasks = linkedTasks.filter((t) => t.completed);

  return (
    <Dialog open={!!app} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-0 gap-0">
        {/* 헤더 영역 */}
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground mb-0.5">{app.company}</p>
              <h2 className="text-[15px] font-bold text-foreground leading-tight">{app.position}</h2>
            </div>
            <Badge className={cn("text-[11px] h-6 px-2 border-0 shrink-0 mt-0.5 font-semibold", ddStyle.bg, ddStyle.text)}>
              {ddStyle.label}
            </Badge>
          </div>
          {/* 상태 + 마감일 한 줄 */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Select value={app.status} onValueChange={(v) => onUpdateStatus(app.id, v as ApplicationStatus)}>
                <SelectTrigger className="h-7 text-xs border-border bg-muted/40 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPLICATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="tabular-nums">{app.deadline}</span>
              <span className="text-muted-foreground/40">마감</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* 주요 일정 타임라인 */}
          {app.keyDates && app.keyDates.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">전형 일정</p>
              <div className="relative pl-3">
                <div className="absolute left-0 top-1 bottom-1 w-px bg-border" />
                {app.keyDates.map((kd, i) => (
                  <div key={i} className="flex items-center gap-3 py-1 relative">
                    <div className="absolute -left-[5px] w-2.5 h-2.5 rounded-full border-2 border-border bg-background" />
                    <span className="text-[11px] tabular-nums text-muted-foreground w-20 shrink-0">{kd.date}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                    <span className="text-[12px] font-medium text-foreground">{kd.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 연결된 일정 테이블 */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              연결된 일정 <span className="text-muted-foreground/60 normal-case font-normal">({linkedSchedules.length})</span>
            </p>
            {linkedSchedules.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/50 py-2">연결된 일정이 없습니다</p>
            ) : (
              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="text-left px-3 py-1.5 font-medium text-muted-foreground text-[10px] w-24">날짜</th>
                      <th className="text-left px-3 py-1.5 font-medium text-muted-foreground text-[10px] w-16">시간</th>
                      <th className="text-left px-3 py-1.5 font-medium text-muted-foreground text-[10px]">일정</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {linkedSchedules.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2 tabular-nums text-muted-foreground">{s.date}</td>
                        <td className="px-3 py-2 tabular-nums text-muted-foreground">
                          {s.time ? (
                            <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{s.time}</span>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-2 font-medium text-foreground">{s.title}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 연결된 할일 테이블 */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              할 일 <span className="text-muted-foreground/60 normal-case font-normal">({pendingTasks.length}개 미완)</span>
            </p>
            {linkedTasks.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/50 py-2">연결된 할 일이 없습니다</p>
            ) : (
              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="text-left px-3 py-1.5 font-medium text-muted-foreground text-[10px] w-6" />
                      <th className="text-left px-3 py-1.5 font-medium text-muted-foreground text-[10px]">할 일</th>
                      <th className="text-right px-3 py-1.5 font-medium text-muted-foreground text-[10px] w-12">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {[...pendingTasks, ...doneTasks].map((t) => (
                      <tr key={t.id} className={cn("hover:bg-muted/20 transition-colors", t.completed && "opacity-50")}>
                        <td className="px-3 py-2">
                          <Checkbox checked={t.completed} onCheckedChange={() => onToggleTask(t.id)} className="h-3 w-3" />
                        </td>
                        <td className={cn("px-3 py-2 font-medium", t.completed ? "line-through text-muted-foreground" : "text-foreground")}>
                          {t.title}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {t.completed ? (
                            <span className="text-[10px] text-pickd-green">완료</span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">진행중</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 할일 추가 */}
          <div className="flex gap-2 pt-1 border-t border-border">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="할 일 추가..."
              className="text-xs h-8 bg-muted/30 border-border"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTask.trim()) {
                  onAddTask(newTask.trim(), app.id);
                  setNewTask("");
                }
              }}
            />
            <Button
              size="sm"
              className="h-8 text-xs px-3 shrink-0"
              onClick={() => {
                if (newTask.trim()) {
                  onAddTask(newTask.trim(), app.id);
                  setNewTask("");
                }
              }}
            >
              + 추가
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ScheduleDetailProps {
  schedule: CalSchedule | null;
  onClose: () => void;
}

export function ScheduleDetailModal({ schedule, onClose }: ScheduleDetailProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  if (!schedule) return null;

  return (
    <Dialog open={!!schedule} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            {editing ? <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-7 text-sm" autoFocus /> : <span>{schedule.title}</span>}
            {!editing && <button onClick={() => { setTitle(schedule.title); setEditing(true); }} className="text-muted-foreground hover:text-foreground"><Pencil size={12} /></button>}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2"><span className="text-muted-foreground text-xs w-16">날짜</span><span className="text-xs">{schedule.date}</span></div>
          {schedule.time && <div className="flex gap-2"><span className="text-muted-foreground text-xs w-16">시간</span><span className="text-xs">{schedule.time}</span></div>}
          {schedule.linkedPosting && <div className="flex gap-2"><span className="text-muted-foreground text-xs w-16">연결 공고</span><Badge variant="outline" className="text-[10px] h-5">{schedule.linkedPosting}</Badge></div>}
          {schedule.scheduleType === "personal" && <div className="flex gap-2"><span className="text-muted-foreground text-xs w-16">유형</span><Badge variant="outline" className="text-[10px] h-5 bg-muted">개인</Badge></div>}
        </div>
        {editing && <DialogFooter><Button size="sm" onClick={() => setEditing(false)}>저장</Button></DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

interface TaskDetailProps {
  task: CalTask | null;
  onClose: () => void;
  onToggle?: (id: string) => void;
}

export function TaskDetailModal({ task, onClose, onToggle }: TaskDetailProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  if (!task) return null;

  const priorityLabels: Record<string, string> = { high: "긴급", medium: "보통", low: "낮음" };

  return (
    <Dialog open={!!task} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            {editing ? <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-7 text-sm" autoFocus /> : (
              <>
                {onToggle && <Checkbox checked={task.completed} onCheckedChange={() => onToggle(task.id)} className="h-3.5 w-3.5" />}
                <span className={cn(task.completed && "line-through text-muted-foreground")}>{task.title}</span>
              </>
            )}
            {!editing && <button onClick={() => { setTitle(task.title); setEditing(true); }} className="text-muted-foreground hover:text-foreground"><Pencil size={12} /></button>}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2"><span className="text-muted-foreground text-xs w-16">우선순위</span><span className="text-xs">{priorityLabels[task.priority]}</span></div>
          <div className="flex gap-2"><span className="text-muted-foreground text-xs w-16">유형</span><span className="text-xs">{task.type}</span></div>
          {task.dueTime && <div className="flex gap-2"><span className="text-muted-foreground text-xs w-16">마감 시간</span><span className="text-xs">{task.dueTime}</span></div>}
          {task.linkedPosting && <div className="flex gap-2"><span className="text-muted-foreground text-xs w-16">연결 공고</span><Badge variant="outline" className="text-[10px] h-5">{task.linkedPosting}</Badge></div>}
          {task.carriedOver && <Badge className="bg-orange-100 text-orange-600 border-orange-200 text-[10px]">이월</Badge>}
        </div>
        {editing && <DialogFooter><Button size="sm" onClick={() => setEditing(false)}>저장</Button></DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
