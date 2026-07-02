import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ── 테이블 헤더 공용 컴포넌트 (탭1·탭2 공용) ─────────────────────────
// SSOT 6-2: 헤더 텍스트 text-xs font-medium text-gray-600 + whitespace-nowrap 필수.
// 정렬 버튼·화살표·정렬 드롭다운 마크업을 여기 한 곳으로 단일화.
// 새 테이블 헤더가 필요하면 이 컴포넌트를 import해서 쓸 것 — 파일별 재정의 금지.

export type SortDir = "asc" | "desc" | null;

/** 헤더 셀 공통 클래스 — th에 직접 클래스를 써야 하는 경우(dnd-kit useSortable 등) 재사용 */
export const HEADER_CELL_CLASS =
  "relative text-left px-4 py-3 text-xs font-medium text-gray-600 whitespace-nowrap group";

/** 정렬 토글 버튼 — 라벨 + 활성 시에만 보이는 ↑↓ 화살표 (오름→내림→해제 순환은 호출부 toggleColSort 담당) */
export function SortHeaderButton({
  label,
  dir,
  onSort,
}: {
  label: string;
  dir?: SortDir;
  onSort: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onSort();
      }}
      className="inline-flex items-center gap-1 hover:text-gray-900"
    >
      {label}
      <span
        className={cn(
          "inline-flex items-center justify-center w-3 h-3 shrink-0 transition-opacity",
          dir != null ? "opacity-100" : "opacity-0",
        )}
      >
        {dir === "desc" ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
      </span>
    </button>
  );
}

/** 정렬 드롭다운 내용 — 그립 클릭 시 열리는 메뉴 (탭1·탭2 공용) */
export function SortMenuContent({
  dir,
  onChange,
}: {
  dir: SortDir;
  onChange: (dir: SortDir) => void;
}) {
  return (
    <DropdownMenuContent align="start" sideOffset={4} className="w-36">
      <DropdownMenuItem
        onSelect={() => onChange("asc")}
        className={cn("gap-2 text-[13px]", dir === "asc" && "font-medium text-primary")}
      >
        <ArrowUp className="w-3.5 h-3.5" /> 오름차순
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => onChange("desc")}
        className={cn("gap-2 text-[13px]", dir === "desc" && "font-medium text-primary")}
      >
        <ArrowDown className="w-3.5 h-3.5" /> 내림차순
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => onChange(null)}
        className={cn("gap-2 text-[13px]", dir == null && "opacity-40 pointer-events-none")}
      >
        <X className="w-3.5 h-3.5" /> 정렬 해제
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

/**
 * 표준 헤더 셀 — 정렬 버튼 + (선택) 컬럼 필터 + (선택) 정렬 드롭다운 그립.
 * onSortChange를 주면 hover 시 좌측에 그립(⠿)이 나타나고, 클릭하면 정렬 드롭다운이 열린다.
 * (드래그 가능한 컬럼은 이 컴포넌트 대신 SortableColumnHeader를 쓸 것 — 같은 그립이 드래그까지 겸한다)
 */
export function HeaderCell({
  label,
  filter,
  sortDir,
  onSort,
  onSortChange,
  className,
}: {
  label: string;
  filter?: React.ReactNode;
  sortDir?: SortDir;
  onSort?: () => void;
  onSortChange?: (dir: SortDir) => void;
  className?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <th className={cn(HEADER_CELL_CLASS, className)}>
      {onSortChange && (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              aria-label={`${label} 정렬 메뉴`}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-[2px] inset-y-1 w-[15px] z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <GripVertical className="w-3 h-3 pointer-events-none" />
            </button>
          </DropdownMenuTrigger>
          <SortMenuContent
            dir={sortDir ?? null}
            onChange={(d) => {
              onSortChange(d);
              setMenuOpen(false);
            }}
          />
        </DropdownMenu>
      )}
      <span className="inline-flex items-center gap-1">
        {onSort ? <SortHeaderButton label={label} dir={sortDir} onSort={onSort} /> : <span>{label}</span>}
        {filter}
      </span>
    </th>
  );
}
