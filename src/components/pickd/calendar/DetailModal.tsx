import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, Plus, Clock } from "lucide-react";
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

  return (
    <Dialog open={!!app} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span>{app.position}</span>
            <span className="text-sm font-normal text-muted-foreground">— {app.company}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground">지원 상태</span>
              <Select value={app.status} onValueChange={(v) => onUpdateStatus(app.id, v as ApplicationStatus)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{APPLICATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">마감일</span>
              <div className="flex items-center gap-2 mt-1">
                <span>{app.deadline}</span>
                <Badge className={cn("text-[10px] h-5 border-0", ddStyle.bg, ddStyle.text)}>{ddStyle.label}</Badge>
              </div>
            </div>
          </div>
          {app.keyDates && app.keyDates.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">주요 일정</span>
              <div className="flex flex-col gap-1 mt-1">
                {app.keyDates.map((kd, i) => (
                  <div key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{kd.date}</span><span>{kd.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <span className="text-xs font-medium">연결된 일정 ({linkedSchedules.length})</span>
            {linkedSchedules.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-1">연결된 일정이 없습니다</p>
            ) : (
              <div className="flex flex-col gap-1 mt-1">
                {linkedSchedules.map((s) => (
                  <div key={s.id} className="text-xs flex items-center gap-2 p-1.5 rounded border">
                    <span className="font-medium">{s.title}</span>
                    <span className="text-muted-foreground">{s.date}</span>
                    {s.time && <span className="text-muted-foreground flex items-center gap-0.5"><Clock size={9} />{s.time}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <span className="text-xs font-medium">연결된 할 일 ({linkedTasks.length})</span>
            {linkedTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-1">연결된 할 일이 없습니다</p>
            ) : (
              <div className="flex flex-col gap-1 mt-1">
                {linkedTasks.map((t) => (
                  <div key={t.id} className="text-xs flex items-center gap-2 p-1.5 rounded border">
                    <Checkbox checked={t.completed} onCheckedChange={() => onToggleTask(t.id)} className="h-3 w-3" />
                    <span className={cn(t.completed && "line-through text-muted-foreground")}>{t.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2 border-t">
            <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="할 일 추가" className="text-xs h-8"
              onKeyDown={(e) => { if (e.key === "Enter" && newTask.trim()) { onAddTask(newTask.trim(), app.id); setNewTask(""); } }} />
            <Button size="sm" className="h-8 text-xs" onClick={() => { if (newTask.trim()) { onAddTask(newTask.trim(), app.id); setNewTask(""); } }}>
              <Plus size={12} />추가
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
