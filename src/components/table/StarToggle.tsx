import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// ── 별 토글 (탭1 즐겨찾기 · 탭2 중요도 공용) ──────────────────────────
// 켜짐=주황 채운 별, 꺼짐=회색 외곽선 별. 클릭 시 토글.
// 탭1 관심 공고(starred)와 탭2 중요도(★·☆, SSOT 3-2 "중요도는 사용자 직접 표시")를 한 컴포넌트로 관리.
export function StarToggle({
  active,
  onToggle,
  label,
  className,
}: {
  active: boolean;
  onToggle: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label ?? (active ? "표시 해제" : "표시")}
      aria-pressed={active}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn("inline-flex items-center justify-center", className)}
    >
      <Star
        className={cn(
          "w-3.5 h-3.5 transition-colors",
          active ? "fill-current text-pickd-orange" : "text-muted-foreground/30 hover:text-muted-foreground/60",
        )}
      />
    </button>
  );
}
