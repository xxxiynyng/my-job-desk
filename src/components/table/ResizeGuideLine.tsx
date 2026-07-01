import { forwardRef } from "react";

/** 컬럼 리사이즈 중 표시되는 세로 가이드선 — ResizeHandle과 같은 gray-400/1px 톤.
 * 테이블을 감싸는 relative 컨테이너(예: overflow-x-auto 래퍼) 기준으로 top-0 bottom-0을 줘서
 * 헤더뿐 아니라 테이블 전체 높이에 걸쳐 끊김 없이 이어지도록 한다. */
export const ResizeGuideLine = forwardRef<HTMLDivElement, { left: number }>(({ left }, ref) => (
  <div
    ref={ref}
    className="absolute top-0 bottom-0 w-px bg-gray-400 z-20 pointer-events-none"
    style={{ left }}
  />
));
ResizeGuideLine.displayName = "ResizeGuideLine";
