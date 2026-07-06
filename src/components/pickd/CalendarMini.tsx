import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

export type CalEventType =
  | "공고 마감"
  | "면접 일정"
  | "문서 마감"
  | "연결된 할 일"
  | "개인 일정";

export type CalEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  type: CalEventType;
  title: string;
  meta?: string;     // 회사명 등
  detail?: string;   // 추가 설명
};

const TYPE_STYLES: Record<CalEventType, { dot: string; chip: string; label: string }> = {
  "공고 마감":   { dot: "bg-pickd-red",    chip: "bg-pickd-red-light text-pickd-red",        label: "공고 마감" },
  "면접 일정":   { dot: "bg-pickd-orange", chip: "bg-pickd-orange-light text-pickd-orange",  label: "면접" },
  "문서 마감":   { dot: "bg-pickd-purple", chip: "bg-pickd-purple-light text-pickd-purple",  label: "문서" },
  "연결된 할 일":{ dot: "bg-primary",      chip: "bg-accent text-accent-foreground",         label: "할 일" },
  "개인 일정":   { dot: "bg-pickd-green",  chip: "bg-pickd-green-light text-pickd-green",    label: "개인" },
};

// 데모 데이터 — 이번 달 기준 동적으로 채워줍니다
function buildDemoEvents(year: number, month: number): CalEvent[] {
  const d = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return [
    { id: "a", date: d(14), type: "공고 마감",    title: "토스 Product Designer",  meta: "토스" },
    { id: "b", date: d(15), type: "문서 마감",    title: "카카오 자소서 제출",      meta: "카카오" },
    { id: "c", date: d(15), type: "연결된 할 일", title: "포트폴리오 PDF 변환",     meta: "네이버" },
    { id: "d", date: d(18), type: "공고 마감",    title: "네이버 프론트엔드",        meta: "네이버" },
    { id: "e", date: d(20), type: "면접 일정",    title: "토스 1차 면접 14:00",      meta: "토스" },
    { id: "f", date: d(22), type: "개인 일정",    title: "스터디 모임",              meta: "개인" },
    { id: "g", date: d(25), type: "면접 일정",    title: "삼성전자 인적성",          meta: "삼성전자" },
  ];
}

export function CalendarMini({
  events,
  onSelectEvent,
  onMonthTitleClick,
}: {
  events?: CalEvent[];
  onSelectEvent?: (e: CalEvent) => void;
  onMonthTitleClick?: () => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const fallback = useMemo(() => buildDemoEvents(year, month), [year, month]);
  const data = events ?? fallback;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDate = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    data.forEach((ev) => {
      const arr = m.get(ev.date) ?? [];
      arr.push(ev);
      m.set(ev.date, arr);
    });
    return m;
  }, [data]);

  const today = new Date();
  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const fmt = (d: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return (
    <section className="bg-card border border-border rounded-xl overflow-hidden">
      <header className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            aria-label="이전 달"
            className="w-6 h-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          {onMonthTitleClick ? (
            <button
              onClick={onMonthTitleClick}
              className="text-xs font-semibold text-foreground tabular-nums px-1.5 hover:text-primary transition-colors"
              aria-label="캘린더 탭으로 이동"
            >
              {year}.{String(month + 1).padStart(2, "0")}
            </button>
          ) : (
            <span className="text-xs font-semibold text-foreground tabular-nums px-1.5">
              {year}.{String(month + 1).padStart(2, "0")}
            </span>
          )}
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            aria-label="다음 달"
            className="w-6 h-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <button
                aria-label="범례 도움말"
                className="w-6 h-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-2">
              <p className="text-chip font-medium text-foreground mb-1.5">캘린더 표시</p>
              <ul className="space-y-1">
                {(Object.keys(TYPE_STYLES) as CalEventType[]).map((t) => (
                  <li key={t} className="flex items-center gap-1.5 text-chip text-muted-foreground">
                    <span className={cn("w-1.5 h-1.5 rounded-full", TYPE_STYLES[t].dot)} />
                    {t}
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
          <button
            onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }}
            className="text-mini text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted"
          >오늘</button>
        </div>
      </header>

      <div className="grid grid-cols-7 text-mini text-muted-foreground border-b border-border bg-muted/20">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} className="px-1 py-1 text-center font-medium">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const evs = d ? byDate.get(fmt(d)) ?? [] : [];
          return (
            <div
              key={i}
              className={cn(
                "min-h-[44px] border-r border-b border-border/60 p-1 text-mini",
                (i + 1) % 7 === 0 && "border-r-0",
                !d && "bg-muted/10",
              )}
            >
              {d && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="w-full text-left group focus:outline-none"
                      disabled={evs.length === 0 && !d}
                    >
                      <div
                        className={cn(
                          "tabular-nums text-right text-mini leading-none",
                          isToday(d)
                            ? "text-primary-foreground bg-primary rounded-sm w-4 h-4 inline-flex items-center justify-center ml-auto"
                            : "text-muted-foreground",
                        )}
                      >
                        {d}
                      </div>
                      {evs.length > 0 && (
                        <div className="flex items-center gap-0.5 mt-1 flex-wrap">
                          {evs.slice(0, 4).map((ev) => (
                            <span
                              key={ev.id}
                              className={cn("w-1.5 h-1.5 rounded-full", TYPE_STYLES[ev.type].dot)}
                            />
                          ))}
                          {evs.length > 4 && (
                            <span className="text-mini text-muted-foreground">+{evs.length - 4}</span>
                          )}
                        </div>
                      )}
                    </button>
                  </PopoverTrigger>
                  {evs.length > 0 && (
                    <PopoverContent align="start" className="w-64 p-2">
                      <div className="text-chip font-medium text-foreground mb-1.5">
                        {year}.{String(month + 1).padStart(2, "0")}.{String(d).padStart(2, "0")}
                      </div>
                      <ul className="space-y-1">
                        {evs.map((ev) => {
                          const s = TYPE_STYLES[ev.type];
                          return (
                            <li key={ev.id}>
                              <button
                                onClick={() => onSelectEvent?.(ev)}
                                className="w-full text-left flex items-start gap-2 px-1.5 py-1 rounded hover:bg-muted"
                              >
                                <span className={cn("mt-1 w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />
                                <span className="flex-1 min-w-0">
                                  <span className="block text-chip text-foreground truncate">{ev.title}</span>
                                  {ev.meta && (
                                    <span className="block text-mini text-muted-foreground truncate">{ev.meta}</span>
                                  )}
                                </span>
                                <span className={cn("text-mini px-1 py-0.5 rounded shrink-0", s.chip)}>
                                  {s.label}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </PopoverContent>
                  )}
                </Popover>
              )}
            </div>
          );
        })}
      </div>

    </section>
  );
}
