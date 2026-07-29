import { cn } from "@/lib/utils";

// 문항 숫자 페이저 — 문항 수만큼 1..N 버튼, 언제든 이동. 내용 있는 문항은 번호 위 dot
export function QuestionPager({
  count, currentIdx, hasContent, onSelect,
}: {
  count: number; currentIdx: number; hasContent: boolean[]; onSelect: (i: number) => void;
}) {
  return (
    <nav className="flex items-center gap-1" aria-label="문항 이동">
      {Array.from({ length: count }, (_, i) => {
        const cur = i === currentIdx;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`문항 ${i + 1}로 이동`}
            aria-current={cur ? "page" : undefined}
            className={cn(
              "relative w-8 h-8 rounded-md text-body tabular-nums transition-colors",
              cur ? "bg-accent text-accent-foreground font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {i + 1}
            {hasContent[i] && !cur && <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-primary/50" aria-hidden />}
          </button>
        );
      })}
    </nav>
  );
}
