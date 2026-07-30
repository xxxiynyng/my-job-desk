// 경험 카드 + 경험 없음 안내 — AICoverPage.tsx에서 그대로 분리(2026-07-29).
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TONES } from "@/components/ds/StatusBadge";
import { SWOT_META, type Exp } from "../model/aiCoverMock";

// 경험 카드 — 카드 전체가 토글. 정보 3줄: 이름+체크 / 역할 라벨+적합도 / 왜 좋은지 한 줄
export function ExpCard({ exp, checked, onToggle }: { exp: Exp; checked: boolean; onToggle: () => void }) {
  const meta = SWOT_META[exp.swot];
  const tone = TONES[meta.tone];
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={cn(
        "w-full text-left rounded-xl border px-3.5 py-3 transition-all",
        checked ? "border-blue-100 bg-blue-50/40" : "border-border bg-white hover:bg-muted/30",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground truncate">{exp.name}</span>
        <span
          className={cn(
            "w-[1.125rem] h-[1.125rem] rounded-full shrink-0 flex items-center justify-center transition-colors",
            checked ? "text-white" : "border-2 border-border",
          )}
          style={checked ? { background: "var(--brand)" } : undefined}
          aria-hidden
        >
          {checked && <Check className="w-3 h-3" />}
        </span>
      </span>
      <span className="mt-1 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-mini font-semibold" style={{ color: tone.fg } as CSSProperties}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: tone.dot }} />
          {meta.label}
        </span>
        <span className="text-mini text-muted-foreground tabular-nums shrink-0">적합도 {exp.score}</span>
      </span>
      <span className="mt-1.5 block text-body text-muted-foreground leading-snug">{exp.reason}</span>
    </button>
  );
}

// 경험 전부 해제 시 — 격려형 카피 (부담 지표 금지, §0-9)
export function AddExperienceNotice() {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2.5 mb-2">
      <p className="text-xs text-muted-foreground leading-relaxed">
        아직 고른 경험이 없어요. 탭2에 정리해 두면 여기서 바로 이어 쓸 수 있어요.
      </p>
      <Link to="/experiences" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
        경험·스펙 DB로 이동
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
