import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── 배치 액션 바 (탭1·탭2 공용) ──────────────────────────────────────
// SSOT 6-6: 체크박스 1개 이상 선택 시 테이블 상단 노출, 해제 시 자동 숨김.
// 셸(배경·카운트·구분선·해제 버튼)은 여기서 단일 관리, 메뉴 항목·문구는 탭별 actions로 주입.
// 컨테이너 형태 차이(탭1: 카드 내부 border-b / 탭2: 독립 rounded-lg)는 className으로 전달.

export type BatchAction = {
  label: string;
  onClick?: () => void;
  /** danger = 삭제 등 파괴적 액션(빨간 텍스트) */
  tone?: "default" | "danger";
};

export function BatchActionBar({
  count,
  actions,
  onClear,
  className,
}: {
  count: number;
  actions: BatchAction[];
  onClear: () => void;
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <div className={cn("bg-blue-50 border-blue-200 px-3 py-2 flex items-center gap-1.5", className)}>
      <span className="text-[12px] font-medium text-blue-700 shrink-0">{count}개 선택됨</span>
      <span className="w-px h-3.5 bg-blue-200 mx-1 shrink-0" />
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={a.onClick}
          className={cn(
            "text-[12px] px-2.5 py-1 rounded-md transition-colors font-medium",
            a.tone === "danger" ? "text-red-600 hover:bg-red-50" : "text-blue-700 hover:bg-blue-100",
          )}
        >
          {a.label}
        </button>
      ))}
      <button
        onClick={onClear}
        className="ml-auto text-blue-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-100 transition-colors"
        aria-label="선택 해제"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
