import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const PIPELINE_NODES = ["문항 분석", "경험 매칭", "초안 생성", "검토"];
// 스텝 플로우('공고 선택→…→초안→완성')는 제거(2026-07-29) — '초안' 단계 의미가 직관적이지 않고,
// 진행 정보는 화면 요소(문항 페이저·상태 칩·AI 초안 생성 버튼)가 이미 보여줘 중복이었음.

// LangGraph 노드 순차 점등 — 생성 중에만 노출
export function PipelineView({ activeIdx }: { activeIdx: number }) {
  return (
    <ol className="mt-2.5 flex flex-col gap-1.5" aria-label="초안 생성 단계">
      {PIPELINE_NODES.map((n, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <li key={n} className="flex items-center gap-2">
            <span
              className={cn("w-1.5 h-1.5 rounded-full shrink-0", active && "animate-pulse")}
              style={{ background: done ? "var(--green-500)" : active ? "var(--brand)" : "var(--slate-300)" }}
            />
            <span className={cn("text-xs", active ? "font-semibold text-primary" : done ? "text-muted-foreground" : "text-muted-foreground/50")}>
              {n}
            </span>
            {done && <Check className="w-3 h-3 text-pickd-green" />}
          </li>
        );
      })}
    </ol>
  );
}
