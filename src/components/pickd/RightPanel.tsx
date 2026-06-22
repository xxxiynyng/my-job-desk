import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Circle, CheckCircle2, PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_NAMES = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

function MiniCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.getDate());

  const deadlineDays = [14, 15, 18, 20, 22];

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else setCurrentMonth(currentMonth - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else setCurrentMonth(currentMonth + 1);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d: number) =>
    d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  return (
    <div className="bg-card border border-border rounded-xl p-3 pickd-shadow">
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="text-muted-foreground hover:text-foreground p-0.5">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-medium text-foreground">
          {currentYear}년 {MONTH_NAMES[currentMonth]}
        </span>
        <button onClick={nextMonth} className="text-muted-foreground hover:text-foreground p-0.5">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[9px] text-muted-foreground py-0.5 font-medium">
            {d}
          </div>
        ))}
        {cells.map((day, i) => (
          <button
            key={i}
            disabled={!day}
            onClick={() => day && setSelectedDate(day)}
            className={cn(
              "w-full aspect-square flex items-center justify-center text-[11px] rounded-md relative transition-colors",
              !day && "invisible",
              day === selectedDate && "bg-primary text-primary-foreground font-medium",
              day !== selectedDate && isToday(day!) && "ring-1 ring-primary/40 text-primary font-medium",
              day !== selectedDate && !isToday(day!) && "text-foreground hover:bg-muted",
            )}
          >
            {day}
            {day && deadlineDays.includes(day) && day !== selectedDate && (
              <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-pickd-red" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

const schedules = [
  { time: "14:00", title: "토스 면접 준비", type: "면접", date: "4/14" },
  { time: "18:00", title: "카카오 자소서 마감", type: "마감", date: "4/15" },
  { time: "10:00", title: "네이버 포트폴리오 제출", type: "제출", date: "4/18" },
];

const tasks = [
  { title: "토스 자소서 3번 문항 수정", done: false, priority: "high" },
  { title: "네이버 포트폴리오 PDF 변환", done: false, priority: "medium" },
  { title: "카카오 기업분석 자료 정리", done: true, priority: "low" },
  { title: "삼성전자 코딩테스트 복기", done: false, priority: "medium" },
];

const typeStyles: Record<string, string> = {
  면접: "bg-pickd-purple-light text-pickd-purple",
  마감: "bg-pickd-red-light text-pickd-red",
  제출: "bg-pickd-blue-light text-accent-foreground",
};

export function RightPanel() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    // 전체 래퍼 — 버튼 + 패널 콘텐츠를 가로로 배치
    <div className="flex items-start shrink-0">
      {/* 접기/펼치기 탭 버튼 — 항상 표시 */}
      <button
        onClick={() => setCollapsed((p) => !p)}
        aria-label={collapsed ? "패널 펼치기" : "패널 접기"}
        className="mt-1 mr-1 w-6 h-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
      >
        {collapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
      </button>

      {/* 패널 콘텐츠 — 접히면 숨김 */}
      <div
        className={cn("overflow-hidden transition-all duration-200", collapsed ? "w-0 opacity-0" : "w-72 opacity-100")}
      >
        <div className="w-72 space-y-3">
          <MiniCalendar />

          {/* 일정 */}
          <div className="bg-card border border-border rounded-xl p-3 pickd-shadow">
            <h3 className="text-xs font-semibold text-foreground mb-2">일정</h3>
            <div className="space-y-2">
              {schedules.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{s.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        {s.date} {s.time}
                      </span>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", typeStyles[s.type])}>
                        {s.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 할 일 */}
          <div className="bg-card border border-border rounded-xl p-3 pickd-shadow">
            <h3 className="text-xs font-semibold text-foreground mb-2">할 일</h3>
            <div className="space-y-1.5">
              {tasks.map((t, i) => (
                <div key={i} className="flex items-start gap-2">
                  {t.done ? (
                    <CheckCircle2 className="w-4 h-4 text-pickd-green shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  <span
                    className={cn(
                      "text-xs leading-relaxed",
                      t.done ? "text-muted-foreground line-through" : "text-foreground",
                    )}
                  >
                    {t.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
