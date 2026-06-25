import { useState, useCallback, useEffect } from "react";
import { PickdSidebar } from "@/components/pickd/PickdSidebar";
import { MonthlyCalendar } from "@/components/pickd/calendar/MonthlyCalendar";
import { ContextPanel } from "@/components/pickd/calendar/ContextPanel";
import { ExpandedView } from "@/components/pickd/calendar/ExpandedView";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import {
  mockCalTasks, mockCalCarriedOverTasks, mockCalEvents,
  mockCalApplications, mockCalSchedules,
  CalTask, PostingFilterValue, CalApplication, ApplicationStatus, CalSchedule,
} from "@/data/calendarData";
import { toast } from "sonner";

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [postingFilter, setPostingFilter] = useState<PostingFilterValue>("all");
  const [showExpanded, setShowExpanded] = useState(false);
  const [selectedPostingId, setSelectedPostingId] = useState<string | null>(null);

  const [tasks, setTasks] = useState<CalTask[]>(() => {
    try {
      const saved = localStorage.getItem("cal.tasks.v1");
      return saved ? JSON.parse(saved) : mockCalTasks;
    } catch { return mockCalTasks; }
  });
  const [carriedOver, setCarriedOver] = useState<CalTask[]>(() => {
    try {
      const saved = localStorage.getItem("cal.carriedOver.v1");
      return saved ? JSON.parse(saved) : mockCalCarriedOverTasks;
    } catch { return mockCalCarriedOverTasks; }
  });
  const [applications, setApplications] = useState<CalApplication[]>(mockCalApplications);
  const [scheduleList, setScheduleList] = useState<CalSchedule[]>(mockCalSchedules);

  const allTasks = [...carriedOver, ...tasks];
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.completed).length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  useEffect(() => {
    localStorage.setItem("cal.tasks.v1", JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem("cal.carriedOver.v1", JSON.stringify(carriedOver));
  }, [carriedOver]);

  const handleToggleTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    setCarriedOver((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }, []);

  const handleAddTask = useCallback((title: string, linkedPostingId?: string) => {
    const linkedApp = linkedPostingId ? applications.find((a) => a.id === linkedPostingId) : undefined;
    const newTask: CalTask = {
      id: `t-${Date.now()}`, title, completed: false, priority: "medium", type: "기타",
      linkedPostingId: linkedPostingId || undefined,
      linkedPosting: linkedApp?.company || undefined,
    };
    setTasks((prev) => [...prev, newTask]);
    toast.success("할 일이 추가되었습니다");
  }, [applications]);

  const handleAddSchedule = useCallback((data: { title: string; date: string; time: string; linkedPostingId?: string; notes: string }) => {
    const linkedApp = data.linkedPostingId ? applications.find((a) => a.id === data.linkedPostingId) : undefined;
    const newSchedule: CalSchedule = {
      id: `s-${Date.now()}`, title: data.title, date: data.date, time: data.time || undefined,
      scheduleType: data.linkedPostingId ? "posting" : "personal",
      linkedPostingId: data.linkedPostingId || undefined,
      linkedPosting: linkedApp?.company || undefined,
    };
    setScheduleList((prev) => [...prev, newSchedule]);
    toast.success("일정이 추가되었습니다");
  }, [applications]);

  const handleToggleStar = useCallback((id: string) => {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, starred: !a.starred } : a)));
  }, []);

  const handleUpdateStatus = useCallback((id: string, status: ApplicationStatus) => {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status, stage: status } : a)));
    toast.success("지원 상태가 변경되었습니다");
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <PickdSidebar />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={60} minSize={50} maxSize={72}>
          <div className="h-full p-5 flex flex-col min-w-0">
            <MonthlyCalendar
              currentDate={currentDate} selectedDate={selectedDate}
              events={mockCalEvents} applications={applications}
              schedules={scheduleList} tasks={allTasks}
              onDateSelect={setSelectedDate} onMonthChange={setCurrentDate}
              postingFilter={postingFilter} onPostingFilterChange={setPostingFilter}
              viewMode={viewMode} onViewModeChange={setViewMode}
              selectedPostingId={selectedPostingId} onSelectPosting={setSelectedPostingId}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={40} minSize={28}>
          <div className="h-full p-5 flex flex-col min-w-0 overflow-hidden">
            <ContextPanel
              selectedDate={selectedDate} tasks={tasks} carriedOverTasks={carriedOver}
              applications={applications} schedules={scheduleList}
              onToggleTask={handleToggleTask} onAddTask={handleAddTask} onAddSchedule={handleAddSchedule}
              progress={progress} postingFilter={postingFilter}
              onExpandClick={() => setShowExpanded(true)}
              onToggleStar={handleToggleStar} onUpdateStatus={handleUpdateStatus}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {showExpanded && (
        <ExpandedView
          applications={applications} schedules={scheduleList}
          tasks={tasks} carriedOverTasks={carriedOver}
          onClose={() => setShowExpanded(false)}
          onToggleTask={handleToggleTask} onAddTask={handleAddTask} onAddSchedule={handleAddSchedule}
          onToggleStar={handleToggleStar} onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}
