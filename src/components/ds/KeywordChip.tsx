import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// 태그·키워드 칩 — 무채색·외곽선 저강조 (SSOT 5-2)
// AICoverPage 로컬 정의를 ds로 승격 (2026-07-29 리팩토링) — 클래스·렌더 결과 동일.
export function KeywordChip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 text-chip font-medium bg-gray-50 text-gray-500 border border-gray-100 rounded-md",
        className,
      )}
    >
      {children}
    </span>
  );
}
