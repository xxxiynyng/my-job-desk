import { RefreshCw, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// 인라인 AI 초안 제안 — 비파괴(닫기·반영은 사용자 선택). solid CTA는 여기 '이 문장 반영' 하나뿐
export function SuggestionBlock({
  text, onApply, onRegenerate, onClose, regenerating,
}: {
  text: string; onApply: () => void; onRegenerate: () => void; onClose: () => void; regenerating: boolean;
}) {
  return (
    <div className="relative mt-5 rounded-xl bg-blue-50/40 border border-blue-100/70 px-5 py-4" role="region" aria-label="AI 초안 제안">
      <button
        type="button"
        onClick={onClose}
        aria-label="제안 닫기"
        className="absolute right-3 top-3 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/80 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="flex items-center gap-2 flex-wrap">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-body font-semibold text-primary">AI 초안 제안</span>
        <span className="inline-flex items-center px-2 py-0.5 text-mini font-semibold rounded-full bg-white border border-blue-200 text-primary">
          인재상 반영
        </span>
      </div>
      <p className={cn("mt-2.5 text-sm text-foreground leading-[1.8] select-text transition-opacity", regenerating ? "opacity-40" : "opacity-100")}>
        {text}
      </p>
      <p className="mt-3 text-xs text-muted-foreground">내가 쓴 문장은 그대로 둡니다. 반영을 누르면 이어서 붙어요.</p>
      <div className="mt-3 flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5" onClick={onRegenerate} disabled={regenerating}>
          <RefreshCw className="w-3.5 h-3.5" />
          다르게
        </Button>
        <Button size="sm" className="h-8 px-3 text-xs" onClick={onApply} disabled={regenerating}>
          이 문장 반영
        </Button>
      </div>
    </div>
  );
}
