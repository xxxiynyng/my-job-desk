import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarMini } from "./CalendarMini";
import { toast } from "sonner";

// ── 마감 임박 공고 ────────────────────────────────────────────────
type DeadlineItem = { id: string; title: string; company: string; dday: number };

const deadlineItems: DeadlineItem[] = [
  { id: "1", title: "Product Designer", company: "토스",   dday: 2 },
  { id: "2", title: "자소서 제출",         company: "카카오", dday: 3 },
  { id: "3", title: "포트폴리오 제출",     company: "네이버", dday: 6 },
];

function ddayLabel(d: number) {
  if (d === 0) return "오늘";
  if (d < 0)   return `D+${Math.abs(d)}`;
  return `D-${d}`;
}
function ddayColor(d: number) {
  if (d <= 1) return "text-destructive";
  if (d <= 3) return "text-orange-500";
  return "text-muted-foreground";
}

// ── 오늘의 일정 ──────────────────────────────────────────────────
type ScheduleItem = { id: string; title: string; time: string; company?: string };

const scheduleItems: ScheduleItem[] = [
  { id: "s1", title: "토스 1차 면접",  time: "14:00", company: "토스" },
  { id: "s2", title: "삼성 인적성",     time: "종일",  company: "삼성전자" },
];

// ── 오늘의 할일 ──────────────────────────────────────────────────
type TodoItem = { id: string; text: string; done: boolean };

const initialTodos: TodoItem[] = [
  { id: "t1", text: "토스 면접 답변 준비",           done: false },
  { id: "t2", text: "카카오 자소서 3번 문항 수정",   done: false },
  { id: "t3", text: "네이버 코딩테스트 복기",        done: true  },
];

// ── TodayPanel ────────────────────────────────────────────────────
// 접기/펼치기는 Index.tsx의 슬라이딩 패널이 담당. 내부는 콘텐츠만 렌더링.
export function TodayPanel() {
  const navigate = useNavigate();
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos);

  const toggleTodo = (id: string) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const dateStr = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });

  // 일정·할일 추가: 추후 캘린더 공유 등록폼으로 연결 (현재는 캘린더 탭으로 이동)
  const handleAddSchedule = () => navigate("/calendar");
  const handleAddTodo    = () => navigate("/calendar");

  return (
    <div className="space-y-4 py-4 px-4 min-w-[288px]">
      {/* 날짜 헤더 — 클릭 시 캘린더 탭으로 이동 */}
      <button
        onClick={() => navigate("/calendar")}
        className="text-left group w-full"
        title="캘린더 탭으로 이동"
      >
        <p className="text-sm uppercase tracking-wide text-muted-foreground font-medium group-hover:text-primary transition-colors">오늘</p>
        <p className="text-sm font-semibold text-foreground mt-0.5 group-hover:text-primary transition-colors">{dateStr}</p>
      </button>

      {/* ① 미니 캘린더 — 월 제목 클릭 시 캘린더 탭으로 이동 */}
      <CalendarMini
        onMonthTitleClick={() => navigate("/calendar")}
        onSelectEvent={(ev) => toast(ev.title, { description: `${ev.type} · ${ev.meta ?? ""}` })}
      />

      {/* ② 마감 임박 공고 */}
      <section>
        <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
          마감 임박 공고
        </h3>
        <ul className="space-y-0.5">
          {deadlineItems.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-card cursor-pointer text-[12px] group"
              onClick={() => toast(`${item.company} · ${item.title}`, { description: "공고 상세는 준비 중이에요" })}
            >
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0 mt-0.5" />
              <span className="flex-1 leading-snug truncate">
                <span className="text-muted-foreground text-[10px] mr-1">{item.company}</span>
                {item.title}
              </span>
              <span className={cn("text-[10px] tabular-nums shrink-0 font-medium", ddayColor(item.dday))}>
                {ddayLabel(item.dday)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ③ 오늘의 일정 */}
      <section>
        <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
          <button
            onClick={() => navigate("/calendar")}
            className="flex-1 text-left flex items-center gap-1 hover:text-foreground transition-colors group"
            title="캘린더에서 전체 보기"
          >
            오늘의 일정
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
          </button>
          <button
            onClick={handleAddSchedule}
            aria-label="일정 추가"
            className="w-4 h-4 inline-flex items-center justify-center rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted"
          >
            <Plus className="w-3 h-3" />
          </button>
        </h3>
        {scheduleItems.length === 0 ? (
          <p className="text-[11px] text-muted-foreground px-2 py-1">오늘 일정이 없어요</p>
        ) : (
          <ul className="space-y-0.5">
            {scheduleItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-card cursor-pointer text-[12px]"
                onClick={() => navigate("/calendar")}
              >
                <span className="w-1 h-1 rounded-full bg-primary/60 shrink-0 mt-0.5" />
                <span className="flex-1 leading-snug truncate">{item.title}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{item.time}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ④ 오늘의 할일 */}
      <section>
        <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
          <button
            onClick={() => navigate("/calendar")}
            className="flex-1 text-left flex items-center gap-1 hover:text-foreground transition-colors group"
            title="캘린더에서 전체 보기"
          >
            오늘의 할일
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
          </button>
          <button
            onClick={handleAddTodo}
            aria-label="할일 추가"
            className="w-4 h-4 inline-flex items-center justify-center rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted"
          >
            <Plus className="w-3 h-3" />
          </button>
        </h3>
        <ul className="space-y-0.5">
          {todos.map((t) => (
            <li
              key={t.id}
              className="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-card cursor-pointer text-[12px]"
              onClick={() => toggleTodo(t.id)}
            >
              <span
                className={cn(
                  "mt-0.5 w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0",
                  t.done ? "bg-primary border-primary" : "border-muted-foreground/40",
                )}
              >
                {t.done && <span className="text-[9px] text-primary-foreground">✓</span>}
              </span>
              <span className={cn("flex-1 leading-snug", t.done && "line-through text-muted-foreground")}>
                {t.text}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
