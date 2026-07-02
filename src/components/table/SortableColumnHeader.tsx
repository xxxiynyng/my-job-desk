import { useState } from "react";
import type React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DragHandle } from "./DragHandle";
import { HEADER_CELL_CLASS, SortHeaderButton, SortMenuContent, type SortDir } from "./HeaderCell";

/**
 * 드래그 가능한 컬럼 헤더 (탭1·탭2 공용) — dnd-kit useSortable + 정렬 + 컬럼 필터를 한 곳에서.
 *
 * 그립(⠿) 하나가 두 역할을 겸한다: 드래그하면 컬럼 순서 이동, 클릭(이동 없이 떼면)하면
 * 정렬 드롭다운(오름차순/내림차순/해제)이 열린다 — 행 그립(드래그+클릭 메뉴)과 동일한 패턴.
 * PointerSensor activationConstraint(distance 5) 덕분에 클릭과 드래그가 자연히 구분된다.
 *
 * attributes(role/aria-*)는 th에, listeners(포인터 핸들러)는 DragHandle에만 바인딩 —
 * 라벨 클릭 정렬·필터 버튼과 겹치지 않게 한다. 사용처의 DndContext에는
 * horizontalListSortingStrategy SortableContext로 감쌀 것.
 */
export function SortableColumnHeader({
  colKey,
  label,
  sortDir,
  onSortToggle,
  onSortChange,
  filter,
}: {
  colKey: string;
  label: string;
  sortDir: SortDir;
  /** 라벨 클릭 — 오름 → 내림 → 해제 순환 */
  onSortToggle: () => void;
  /** 그립 드롭다운 — 방향 직접 지정 */
  onSortChange: (dir: SortDir) => void;
  filter?: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: colKey });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <th ref={setNodeRef} style={style} {...attributes} className={HEADER_CELL_CLASS}>
      {/*
        left-[2px]로 경계에서 2px 띄워서 시작 — 왼쪽 옆 ColumnDivider의 리사이즈 히트박스([x-10, x-2])와
        절대 겹치지 않는 여백을 확보. z-30으로 ColumnDivider(z-20)보다 위.
        색상은 행 그립(RowContextMenu의 GripTrigger)과 동일한 gray-400 → gray-600.
      */}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          {/* 위치 앵커 전용(0×0) — 실제 열기는 아래 DragHandle의 클릭이 담당 */}
          <span aria-hidden className="absolute left-[2px] bottom-1 w-[15px] h-0" />
        </DropdownMenuTrigger>
        <SortMenuContent
          dir={sortDir}
          onChange={(d) => {
            onSortChange(d);
            setMenuOpen(false);
          }}
        />
      </DropdownMenu>
      <DragHandle
        ref={setActivatorNodeRef}
        {...listeners}
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen(true);
        }}
        iconClassName="w-3 h-3"
        className="absolute left-[2px] inset-y-1 w-[15px] z-30 text-gray-400 hover:text-gray-600"
      />
      <span className="inline-flex items-center gap-1">
        <SortHeaderButton label={label} dir={sortDir} onSort={onSortToggle} />
        {filter}
      </span>
    </th>
  );
}
