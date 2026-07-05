import { Sparkles, Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProfileCompletion } from "@/hooks/useProfileCompletion";
import type { InfoKey } from "@/data/basicInfoFields";

/**
 * 탭2 기본정보 상단 완성도 카드(상세형) — 점진 수집이 실제로 일어나는 자리.
 * 완성도 게이지 + 미완 항목 칩 + "이어서 채우기" CTA. 프레젠테이션 전용:
 * 완성도는 상위(BasicInfoPanel)의 단일 출처 계산값을 받고, 채우기는 콜백으로 위임.
 * AI가 값을 채우지 않고 사용자가 직접 채우도록 유도(불변 원칙 유지).
 */
export function ProfileCompletionCard({
  completion,
  onFillField,
  onFillAll,
  className,
}: {
  completion: ProfileCompletion;
  /** 특정 미완 필드 채우기(표시 + 인라인 편집 열기) */
  onFillField: (key: InfoKey) => void;
  /** 전체 편집 모달 열기 */
  onFillAll: () => void;
  className?: string;
}) {
  const { pct, filled, total, incomplete, isComplete } = completion;
  const CHIP_LIMIT = 6;

  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">프로필 완성도</h3>
        </div>
        <span className="text-sm font-bold text-primary tabular-nums">{pct}%</span>
      </div>

      {/* 게이지 */}
      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {isComplete ? (
        <p className="mt-3 text-xs text-muted-foreground">
          기본정보를 모두 채웠어요. 지원서·자소서에 그대로 재사용돼요 🎉
        </p>
      ) : (
        <>
          <p className="mt-3 text-xs text-muted-foreground">
            {filled}/{total} 항목 · 비어 있는 {incomplete.length}개를 채우면 지원서에 자동 재사용돼요.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {incomplete.slice(0, CHIP_LIMIT).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => onFillField(f.key)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[12px] text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                {f.label}
                <Plus className="w-3 h-3" />
              </button>
            ))}
            {incomplete.length > CHIP_LIMIT && (
              <span className="inline-flex items-center px-1.5 py-1 text-[12px] text-muted-foreground/70">
                +{incomplete.length - CHIP_LIMIT}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onFillAll}
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
          >
            이어서 채우기
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
