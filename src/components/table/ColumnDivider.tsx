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
 * 평상시엔 완전히 숨겨져 있다가(투명), 리사이즈 히트박스에 마우스를 올리거나 실제
 * 드래그 중일 때만 --border 토큰 색으로 나타난다 — "세로선은 전부 hover로"라는 결정에 따름.
 * 리사이즈할 수 없는 고정 경계(체크박스·즐겨찾기 열 등)는 hover로 나타낼 대상이 없으므로
 * 아예 그리지 않는다(onResizeMouseDown 없으면 null).
 * 두께는 항상 1px, 위치는 정수로 반올림해서 서브픽셀 렌더링으로 선이 두껍게/흐릿하게
 * 보이는 것을 방지한다.
 *
 * 리사이즈 가능한 경계는 8px 히트박스를 경계에서 "왼쪽으로만" 확장해서 두되, 실제로는
 * 경계 바로 앞 2px는 비워 둔다(hitbox: [left-8, left-2]). 오른쪽 옆 컬럼의 그립(DragHandle,
 * 경계에서 우측으로 2px 띄워서 시작)과 픽셀 단위로도 겹치지 않는 여백을 명시적으로 확보해서,
 * 두 레이어가 시각적으로 겹쳐 "선이 두 겹으로 보이는" 문제와 클릭이 엉뚱한 레이어로 새는
 * 문제를 근본적으로 차단한다.
 */
export function ColumnDivider({ left, onResizeMouseDown, active }: ColumnDividerProps) {
  const x = Math.round(left);
  if (!onResizeMouseDown) {
    return null;
  }
  return (
    // 폭 0인 위치 기준점 — 자식은 모두 absolute라 이 컨테이너의 실제 렌더 크기는 없지만,
    // 자식을 hover해도 group/resize의 :hover는 이 조상까지 정상적으로 전파된다.
    <div className="group/resize absolute top-0 bottom-0 z-20" style={{ left: x }}>
      {/* 평상시 투명, hover/리사이즈 중에만 보이는 1px 선 — 실제 컬럼 경계(x)에 정확히 고정 */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-px bg-transparent transition-colors duration-150 pointer-events-none group-hover/resize:bg-border",
          active && "bg-border",
        )}
      />
      {/* 리사이즈 히트박스 — 경계에서 왼쪽으로만 확장([x-10, x-2]), 경계 바로 앞 2px는 비워서
          오른쪽 옆 컬럼 그립(DragHandle, 경계에서 2px 띄워 시작)과 절대 겹치지 않게 한다. */}
      <div
        className="absolute inset-y-0 left-0 w-2 -translate-x-[10px] cursor-col-resize select-none"
        style={{ touchAction: "none" }}
        onMouseDown={onResizeMouseDown}
      />
    </div>
  );
}
