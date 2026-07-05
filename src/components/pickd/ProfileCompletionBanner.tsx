import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";

const SS_DISMISS = "pickd.profileBanner.dismissed";

/**
 * 대시보드 상단 얇은 배너(컴팩트) — 공고 리스트 중심 SSOT를 지켜 통계처럼 커지지 않게 1줄.
 * 완성도 < 100%일 때만 노출. dismiss(세션 내 숨김) + 완료 시 자동 제거.
 * 클릭 시 /experiences?tab=basic-info 로 이동해 이어서 채우도록 유도(AI 자동 입력 없음).
 */
export function ProfileCompletionBanner({ className }: { className?: string }) {
  const { pct, incomplete, isComplete } = useProfileCompletion();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(SS_DISMISS) === "1",
  );

  if (isComplete || dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem(SS_DISMISS, "1");
    setDismissed(true);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-2",
        className,
      )}
    >
      <Sparkles className="w-3.5 h-3.5 shrink-0 text-primary" />
      <Link
        to="/experiences?tab=basic-info"
        className="group flex flex-1 items-center gap-1.5 min-w-0 text-[13px] text-foreground hover:text-primary transition-colors"
      >
        <span className="font-semibold text-primary tabular-nums">프로필 {pct}%</span>
        <span className="text-muted-foreground truncate">
          · {incomplete.length}개 항목만 채우면 완성돼요
        </span>
        <span className="ml-0.5 inline-flex items-center gap-0.5 shrink-0 text-primary font-medium">
          이어서 채우기
          <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="배너 닫기"
        className="shrink-0 p-0.5 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
