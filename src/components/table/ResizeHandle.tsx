/** 컬럼 헤더 오른쪽 끝의 드래그 핸들 — 클릭 영역은 6px이지만, 리사이즈 가이드선(w-px, gray-400)과
 * 동일하게 보이도록 실제로 색이 보이는 막대는 1px로 좁혀서 중앙에 둔다. */
export function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <span
      onMouseDown={onMouseDown}
      className="group/resize absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none"
      aria-hidden
    >
      <span className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-transparent group-hover/resize:bg-gray-400 group-active/resize:bg-gray-400" />
    </span>
  );
}
