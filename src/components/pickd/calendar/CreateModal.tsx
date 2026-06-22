import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalApplication } from "@/data/calendarData";

interface CreateScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; date: string; time: string; linkedPostingId?: string; notes: string }) => void;
  applications: CalApplication[];
  defaultDate?: string;
  defaultPostingId?: string;
}

export function CreateScheduleModal({ open, onClose, onSave, applications, defaultDate, defaultPostingId }: CreateScheduleModalProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("");
  const [linkedPostingId, setLinkedPostingId] = useState(defaultPostingId || "none");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), date, time, linkedPostingId: linkedPostingId === "none" ? undefined : linkedPostingId, notes });
    setTitle(""); setTime(""); setNotes(""); setLinkedPostingId(defaultPostingId || "none");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>일정 추가</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">일정명</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="일정명을 입력하세요" className="mt-1 h-8 text-sm" autoFocus /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">날짜</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 h-8 text-sm" /></div>
            <div><Label className="text-xs">시간</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 h-8 text-sm" /></div>
          </div>
          <div>
            <Label className="text-xs">연결 공고</Label>
            <Select value={linkedPostingId} onValueChange={setLinkedPostingId}>
              <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">개인 일정</SelectItem>
                {applications.map((a) => <SelectItem key={a.id} value={a.id}>{a.company} / {a.position}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">메모</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="메모" className="mt-1 text-sm min-h-[60px]" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>취소</Button>
          <Button size="sm" onClick={handleSave} disabled={!title.trim()}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; dueDate: string; dueTime: string; priority: string; linkedPostingId?: string; notes: string }) => void;
  applications: CalApplication[];
  defaultDate?: string;
  defaultPostingId?: string;
}

export function CreateTaskModal({ open, onClose, onSave, applications, defaultDate, defaultPostingId }: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(defaultDate || new Date().toISOString().split("T")[0]);
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState("medium");
  const [linkedPostingId, setLinkedPostingId] = useState(defaultPostingId || "none");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), dueDate, dueTime, priority, linkedPostingId: linkedPostingId === "none" ? undefined : linkedPostingId, notes });
    setTitle(""); setDueTime(""); setNotes(""); setPriority("medium"); setLinkedPostingId(defaultPostingId || "none");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>할 일 추가</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">할 일</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="할 일을 입력하세요" className="mt-1 h-8 text-sm" autoFocus /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">마감일</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 h-8 text-sm" /></div>
            <div><Label className="text-xs">마감 시간</Label><Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="mt-1 h-8 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">우선순위</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">긴급</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="low">낮음</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">연결 공고</Label>
              <Select value={linkedPostingId} onValueChange={setLinkedPostingId}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">개인 할 일</SelectItem>
                  {applications.map((a) => <SelectItem key={a.id} value={a.id}>{a.company} / {a.position}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-xs">메모</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="메모" className="mt-1 text-sm min-h-[60px]" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>취소</Button>
          <Button size="sm" onClick={handleSave} disabled={!title.trim()}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
