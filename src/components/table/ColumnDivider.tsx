import { cn } from "@/lib/utils";

type ColumnDividerProps = {
  /** 테이블 래퍼(position:relative, overflow-x-auto) 기준 왼쪽 오프셋(px) — 컬럼 경계 위치 */
  left: number;
  /** 리사이즈 가능한 경계만 전달. 없으면 정적 구분선(비인터랙티브)으로 렌더링 */
  onResizeMouseDown?: (e: React.MouseEvent) => void;
  /** 현재 이 경계를 드래그로 리사이즈하는 중인지 — hover와 무관하게 진한 색 유지 */
  active?: boolean;
};

/**
 * 컬럼 사이 세로 구분선 — 헤더 렌더링 시점에 컬럼 경계마다 1개씩, 테이블 래퍼에 절대 위치로
 * 한 번만 그린다(셀마다 따로 그리지 않으므로 레이어가 어긋날 수 없음).
 * top-0 bottom-0으로 테이블 전체 높이(헤더+바디)를 관통.
 *
 * 색상은 행 구분선과 동일한 --border 토큰 재사용: 평상시 50% 알파, hover/리사이즈 중엔 100%.
 * 두께는 항상 1px — 리사이즈 가능한 경계는 8px 히트박스를 경계에서 "왼쪽으로만" 확장해서 두고,
 * 오른쪽 옆 컬럼의 DragHandle(그립, 경계에서 우측으로 시작)과 절대 겹치지 않게 한다.
 */
export function ColumnDivider({ left, onResizeMouseDown, active }: ColumnDividerProps) {
  if (!onResizeMouseDown) {
    return <div className="absolute top-0 bottom-0 w-px bg-border/50 pointer-events-none" style={{ left }} />;
  }
  return (
    <div
      className="group/resize absolute top-0 bottom-0 w-2 -translate-x-full cursor-col-resize select-none z-20"
      style={{ left, touchAction: "none" }}
      onMouseDown={onResizeMouseDown}
    >
      <div
        className={cn(
          "absolute inset-y-0 right-0 w-px bg-border/50 transition-colors duration-150 group-hover/resize:bg-border",
          active && "bg-border",
        )}
      />
    </div>
  );
}
