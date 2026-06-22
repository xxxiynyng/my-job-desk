import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarMini } from "./CalendarMini";
import { toast } from "sonner";

type Section = {
  title: string;
  items: { text: string; meta?: string; done?: boolean }[];
};

const initialSections: Section[] = [
  {
    title: "오늘 해야 할 일",
    items: [
      { text: "토스 면접 답변 준비" },
      { text: "카카오 자소서 3번 문항 수정" },
      { text: "네이버 코딩테스트 복기", done: true },
    ],
  },
  {
    title: "다가오는 마감",
    items: [
      { text: "토스 Product Designer", meta: "D-2" },
      { text: "카카오 자소서", meta: "D-3" },
      { text: "네이버 포트폴리오", meta: "D-6" },
    ],
  },
  {
    title: "다가오는 일정",
    items: [
      { text: "토스 1차 면접", meta: "4/20 14:00" },
      { text: "삼성 인적성", meta: "4/25" },
    ],
  },
];

// TodayPanel — 접기/펼치기는 Index.tsx의 탭 버튼이 담당
// 내부는 콘텐츠만 렌더링
export function TodayPanel() {
  const [sections, setSections] = useState(initialSections);

  const toggleTodo = (sIdx: number, iIdx: number) => {
    setSections((prev) =>
      prev.map((s, si) =>
        si === sIdx ? { ...s, items: s.items.map((it, ii) => (ii === iIdx ? { ...it, done: !it.done } : it)) } : s,
      ),
    );
  };

  const dateStr = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="space-y-4 py-4 px-4 min-w-[288px]">
      {/* 날짜 헤더 */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">오늘</p>
        <p className="text-sm font-semibold text-foreground mt-0.5">{dateStr}</p>
      </div>

      {/* 캘린더 */}
      <CalendarMini onSelectEvent={(ev) => toast(ev.title, { description: `${ev.type} · ${ev.meta ?? ""}` })} />

      {/* 섹션 목록 */}
      {sections.map((s, sIdx) => (
        <section key={s.title}>
          <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
            <span className="flex-1">{s.title}</span>
            {(s.title === "오늘 해야 할 일" || s.title === "다가오는 일정") && (
              <button
                aria-label={`${s.title} 추가`}
                className="w-4 h-4 inline-flex items-center justify-center rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
          </h3>
          <ul className="space-y-1">
            {s.items.map((it, iIdx) => {
              const isTodo = s.title === "오늘 해야 할 일";
              return (
                <li
                  key={iIdx}
                  className="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-card group cursor-pointer text-[12px]"
                  onClick={() => isTodo && toggleTodo(sIdx, iIdx)}
                >
                  {isTodo ? (
                    <span
                      className={cn(
                        "mt-0.5 w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0",
                        it.done ? "bg-primary border-primary" : "border-muted-foreground/40",
                      )}
                    >
                      {it.done && <span className="text-[9px] text-primary-foreground">✓</span>}
                    </span>
                  ) : (
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                  )}
                  <span className={cn("flex-1 leading-snug", it.done && "line-through text-muted-foreground")}>
                    {it.text}
                  </span>
                  {it.meta && (
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{it.meta}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
