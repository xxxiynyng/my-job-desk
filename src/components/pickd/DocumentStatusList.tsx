import { useMemo, useState } from "react";
import { Star, LayoutGrid, LayoutList } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

type Doc = {
  id: string;
  slug: string;
  company: string;
  jobTitle: string;
  employType: string;
  deadline: string;
  dday: number;
  updatedAt: string;
  progress: number;
  starred: boolean;
};

const initial: Doc[] = [
  {
    id: "d1",
    slug: "toss",
    company: "토스",
    jobTitle: "Product Designer",
    employType: "인턴",
    deadline: "2026-04-14",
    dday: 2,
    updatedAt: "2시간 전",
    progress: 60,
    starred: true,
  },
  {
    id: "d2",
    slug: "kakao",
    company: "카카오",
    jobTitle: "백엔드 엔지니어",
    employType: "신입",
    deadline: "2026-04-15",
    dday: 3,
    updatedAt: "3시간 전",
    progress: 40,
    starred: false,
  },
  {
    id: "d3",
    slug: "naver",
    company: "네이버",
    jobTitle: "프론트엔드 개발자",
    employType: "신입",
    deadline: "2026-04-18",
    dday: 6,
    updatedAt: "어제",
    progress: 85,
    starred: false,
  },
  {
    id: "d4",
    slug: "samsung",
    company: "삼성전자",
    jobTitle: "SW 엔지니어",
    employType: "신입",
    deadline: "2026-04-20",
    dday: 8,
    updatedAt: "1일 전",
    progress: 100,
    starred: false,
  },
];

export function DocumentStatusList() {
  const [docs, setDocs] = useState<Doc[]>(initial);
  const [view, setView] = useState<"card" | "list">("card");

  // 정렬: starred 우선 → dday 가까운 순
  const sorted = useMemo(
    () =>
      [...docs].sort((a, b) => {
        if (a.starred !== b.starred) return a.starred ? -1 : 1;
        return a.dday - b.dday;
      }),
    [docs],
  );

  const toggleStarred = (id: string) => setDocs((p) => p.map((d) => (d.id === id ? { ...d, starred: !d.starred } : d)));

  const ddayLabel = (dday: number) => (dday > 0 ? `D-${dday}` : dday === 0 ? "D-Day" : `D+${Math.abs(dday)}`);
  const ddayCls = (dday: number) =>
    dday <= 0
      ? "text-muted-foreground/50"
      : dday <= 3
        ? "text-pickd-red font-semibold"
        : dday <= 7
          ? "text-pickd-orange"
          : "text-foreground/60";

  return (
    <>
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        {/* 헤더 */}
        <div className="px-4 pt-2 pb-1.5 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">작성중인 서류</h2>
            <span className="text-[11px] text-muted-foreground">{sorted.length}건</span>
          </div>
          <div className="inline-flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-md border border-border">
            <button
              onClick={() => setView("card")}
              aria-label="카드형"
              className={cn(
                "inline-flex items-center justify-center w-6 h-6 rounded transition-colors",
                view === "card" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView("list")}
              aria-label="리스트형"
              className={cn(
                "inline-flex items-center justify-center w-6 h-6 rounded transition-colors",
                view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">작성 중인 서류가 없어요.</div>
        ) : view === "card" ? (
          /* ── 카드형 ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 p-4">
            {sorted.map((doc) => (
              <Link
                key={doc.id}
                to={`/jobs/${doc.slug}?from=doclist`}
                className="bg-card border border-border rounded-lg px-4 py-3.5 hover:bg-muted/20 hover:border-primary/40 transition-colors flex flex-col"
              >
                {/* 제목 행: 별표 + 기업명+직무+고용형태 */}
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => toggleStarred(doc.id)}
                    aria-label={doc.starred ? "중요 해제" : "중요 표시"}
                    className="mt-0.5 shrink-0"
                  >
                    <Star
                      className={cn(
                        "w-3.5 h-3.5 transition-colors",
                        doc.starred
                          ? "fill-current text-pickd-orange"
                          : "text-muted-foreground/30 hover:text-muted-foreground/60",
                      )}
                    />
                  </button>
                  <p className="text-[13px] font-semibold text-foreground leading-tight">
                    {doc.company} {doc.jobTitle} {doc.employType}
                  </p>
                </div>

                {/* 서브라인: 지원서 · D-day */}
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-[11px] text-muted-foreground">지원서</span>
                  <span className="text-muted-foreground/40 text-[10px]">·</span>
                  <span className={cn("text-[11px] tabular-nums", ddayCls(doc.dday))}>{ddayLabel(doc.dday)}</span>
                </div>

                {/* 진행률 바 */}
                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1 tabular-nums">
                    <span>진행률</span>
                    <span>{doc.progress}%</span>
                  </div>
                  <Progress value={doc.progress} className="h-1.5" />
                </div>

                {/* 마감일 · 수정일 */}
                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground tabular-nums">
                  <span>마감 {doc.deadline}</span>
                  <span>{doc.updatedAt}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* ── 리스트형 ── */
          <div className="divide-y divide-border/60">
            {sorted.map((doc) => (
              <Link
                key={doc.id}
                to={`/jobs/${doc.slug}?from=doclist`}
                className="px-4 py-3 hover:bg-muted/20 transition-colors group block"
              >
                {/* 1행: 별표 + 기업명/직무/고용형태 + D-day */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => toggleStarred(doc.id)}
                    aria-label={doc.starred ? "중요 해제" : "중요 표시"}
                    className="shrink-0"
                  >
                    <Star
                      className={cn(
                        "w-3.5 h-3.5 transition-colors",
                        doc.starred
                          ? "fill-current text-pickd-orange"
                          : "text-muted-foreground/30 group-hover:text-muted-foreground/60",
                      )}
                    />
                  </button>
                  <span className="text-[13px] font-medium text-foreground min-w-0 flex-1 truncate">
                    {doc.company} {doc.jobTitle} {doc.employType}
                  </span>
                  <span className={cn("text-[11px] tabular-nums shrink-0", ddayCls(doc.dday))}>
                    {ddayLabel(doc.dday)}
                  </span>
                </div>

                {/* 2행: 진행률 바 + 퍼센트 */}
                <div className="flex items-center gap-2 mt-2 pl-6">
                  <Progress value={doc.progress} className="h-1.5 flex-1 max-w-[220px]" />
                  <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{doc.progress}%</span>
                </div>

                {/* 3행: 마감일 · 수정일 */}
                <div className="flex items-center gap-2 mt-1.5 pl-6 text-[10px] text-muted-foreground tabular-nums">
                  <span>지원서</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>마감 {doc.deadline}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>{doc.updatedAt}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
