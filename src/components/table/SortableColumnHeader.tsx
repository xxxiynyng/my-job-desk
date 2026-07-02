import type React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { DragHandle } from "./DragHandle";
import {
  ColumnMenuContent,
  ColumnMenuTrigger,
  HEADER_CELL_CLASS,
  SortHeaderButton,
  type SortDir,
} from "./HeaderCell";
import type { ColumnFilterProps } from "./HeaderFilter";

/**
 * 드래그 가능한 컬럼 헤더 (탭1·탭2 공용) — dnd-kit useSortable + 정렬 + 컬럼 메뉴.
 *
 * hover 인터랙션 규칙 (2026-07-02): 버튼은 정확히 2개.
 *   [⠿ 그립] 좌측 절대배치(left 2px, 폭 15px) — 드래그 전용(컬럼 이동)
 *   [∨ 메뉴] 라벨 우측 16px — 정렬(오름/내림/해제)·필터·숨기기 등 세부 기능 전부 여기로
 * 라벨 클릭 = 정렬 순환(보조 경로), ↑↓ 화살표는 정렬 활성일 때만 렌더.
 *
 * attributes(role/aria-*)는 th에, listeners(포인터 핸들러)는 DragHandle에만 바인딩 —
 * 라벨·메뉴 버튼과 겹치지 않게 한다. 사용처의 DndContext에는
 * horizontalListSortingStrategy SortableContext로 감쌀 것.
 */
export function SortableColumnHeader({
  colKey,
  label,
  sortDir,
  onSortToggle,
  onSortChange,
  filter,
  onHide,
}: {
  colKey: string;
  label: string;
  sortDir: SortDir;
  /** 라벨 클릭 — 오름 → 내림 → 해제 순환 */
  onSortToggle: () => void;
  /** 컬럼 메뉴 — 방향 직접 지정 */
  onSortChange: (dir: SortDir) => void;
  filter?: ColumnFilterProps;
  onHide?: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: colKey });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <th ref={setNodeRef} style={style} {...attributes} data-col={colKey} className={HEADER_CELL_CLASS}>
      {/*
        left-[2px]로 경계에서 2px 띄워서 시작 — 왼쪽 옆 ColumnDivider의 리사이즈 히트박스([x-10, x-2])와
        절대 겹치지 않는 여백을 확보. z-30으로 ColumnDivider(z-20)보다 위.
        색상은 행 그립(RowContextMenu의 GripTrigger)과 동일한 gray-400 → gray-600.
      */}
      <DragHandle
        ref={setActivatorNodeRef}
        {...listeners}
        iconClassName="w-3 h-3"
        className="absolute left-[2px] inset-y-1 w-[15px] z-30 text-gray-400 hover:text-gray-600"
      />
      <span className="inline-flex items-center gap-1">
        <SortHeaderButton label={label} dir={sortDir} onSort={onSortToggle} />
        <DropdownMenu>
          <ColumnMenuTrigger label={label} />
          <ColumnMenuContent sortDir={sortDir} onSortChange={onSortChange} filter={filter} onHide={onHide} />
        </DropdownMenu>
      </span>
    </th>
  );
}
