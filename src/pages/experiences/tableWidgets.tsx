import { Layers, Pencil, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type Item } from "./presets";

// ────────────────────────────────────────────────────────────────
// ManageIndicator (탭2 전용)
// 구 ResizableHead → @/components/table/HeaderCell로 이동·통합
// 구 HeaderFilter·ColFilterShape → @/components/table/HeaderFilter로 이동(탭1·탭2 공용)
// ────────────────────────────────────────────────────────────────

export function ManageIndicator({ item, onMerge }: { item: Item; onMerge: () => void }) {
  // 우선순위: 병합 > AI질문 > 작성중 > 완료(—)
  if (item.hasMergeCandidate || item.status === "병합 필요")
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onMerge}
            className="inline-flex items-center justify-center w-5 h-5 rounded hover:bg-muted text-amber-500 align-middle"
            aria-label="비슷한 항목 있음"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="text-xs">비슷한 항목이 있어요</TooltipContent>
      </Tooltip>
    );
  if (item.hasUnansweredAiQuestion)
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center justify-center w-5 h-5 text-blue-500 align-middle">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="text-xs">미답변 AI 질문이 있어요</TooltipContent>
      </Tooltip>
    );
  if (item.status === "작성중")
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center justify-center w-5 h-5 text-gray-400 align-middle">
            <Pencil className="w-3.5 h-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="text-xs">아직 정리 중</TooltipContent>
      </Tooltip>
    );
  return <span className="text-gray-300 text-chip">—</span>;
}
