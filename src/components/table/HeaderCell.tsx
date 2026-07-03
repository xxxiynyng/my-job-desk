import { ArrowDown, ArrowUp, ChevronDown, Copy, EyeOff, ListFilter, Pin, PinOff, Trash2, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { HeaderFilterContent, type ColumnFilterProps } from "./HeaderFilter";

// ── 테이블 헤더 공용 컴포넌트 (탭1·탭2 공용) ─────────────────────────
// SSOT 6-2: 헤더 텍스트 text-xs font-medium text-gray-600 + whitespace-nowrap 필수.
//
// hover 인터랙션 규칙 (2026-07-02 확정 — 좁은 컬럼에서도 넘치지 않게 최대 2개 버튼):
//   [⠿ 그립: 좌측 절대배치 → 폭 미점유, 드래그=컬럼 이동] [라벨: 클릭=정렬 순환, 활성 시에만 ↑↓]
//   [∨ 컬럼 메뉴: 라벨 우측 16px 1개 — 정렬·필터·숨기기 등 세부 기능은 전부 이 메뉴 안]
// 고정 컬럼은 그립 없이 ∨만. 정렬 화살표는 활성일 때만 렌더(비활성 시 폭 미점유).

export type SortDir = "asc" | "desc" | null;

/** 헤더 셀 공통 클래스 — th에 직접 클래스를 써야 하는 경우(dnd-kit useSortable 등) 재사용 */
export const HEADER_CELL_CLASS =
  "relative text-left px-4 py-3 text-xs font-medium text-gray-600 whitespace-nowrap group";

/** 정렬 토글 버튼 — 라벨 + 활성 시에만 렌더되는 ↑↓ (비활성 시 공간을 차지하지 않음) */
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
      {dir != null && (
        <span className="inline-flex items-center justify-center w-3 h-3 shrink-0">
          {dir === "desc" ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
        </span>
      )}
    </button>
  );
}

/**
 * 컬럼 메뉴 (Notion 속성 메뉴 참고) — 정렬(오름/내림/해제) · 필터 · 고정 · 복제 · 숨기기 · 삭제.
 * 각 동작은 콜백을 넘긴 컬럼에서만 노출(고정/복제/삭제는 tail 컬럼 등 대상에만).
 * 추후 후보(백로그): 그룹화, 계산, 너비 초기화, 좌우 컬럼 삽입.
 */
export function ColumnMenuContent({
  sortDir,
  onSortChange,
  filter,
  pinned,
  onTogglePin,
  onDuplicate,
  onHide,
  onDelete,
}: {
  sortDir: SortDir;
  onSortChange: (dir: SortDir) => void;
  filter?: ColumnFilterProps;
  pinned?: boolean;
  onTogglePin?: () => void;
  onDuplicate?: () => void;
  onHide?: () => void;
  onDelete?: () => void;
}) {
  const filterActive = filter ? !!filter.colFilter[filter.colKey] : false;
  return (
    <DropdownMenuContent align="start" sideOffset={4} className="w-44">
      <DropdownMenuItem
        onSelect={() => onSortChange("asc")}
        className={cn("gap-2 text-[13px]", sortDir === "asc" && "font-medium text-primary")}
      >
        <ArrowUp className="w-3.5 h-3.5" /> 오름차순
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => onSortChange("desc")}
        className={cn("gap-2 text-[13px]", sortDir === "desc" && "font-medium text-primary")}
      >
        <ArrowDown className="w-3.5 h-3.5" /> 내림차순
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => onSortChange(null)}
        className={cn("gap-2 text-[13px]", sortDir == null && "opacity-40 pointer-events-none")}
      >
        <X className="w-3.5 h-3.5" /> 정렬 해제
      </DropdownMenuItem>
      {filter && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2 text-[13px]">
              <ListFilter className="w-3.5 h-3.5" /> 필터
              {filterActive && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-auto" />}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-[220px] p-2">
              <HeaderFilterContent {...filter} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </>
      )}
      {(onTogglePin || onDuplicate || onHide) && <DropdownMenuSeparator />}
      {onTogglePin && (
        <DropdownMenuItem onSelect={onTogglePin} className="gap-2 text-[13px]">
          {pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          {pinned ? "고정 해제" : "왼쪽에 고정"}
        </DropdownMenuItem>
      )}
      {onDuplicate && (
        <DropdownMenuItem onSelect={onDuplicate} className="gap-2 text-[13px]">
          <Copy className="w-3.5 h-3.5" /> 컬럼 복제
        </DropdownMenuItem>
      )}
      {onHide && (
        <DropdownMenuItem onSelect={onHide} className="gap-2 text-[13px]">
          <EyeOff className="w-3.5 h-3.5" /> 컬럼 숨기기
        </DropdownMenuItem>
      )}
      {onDelete && (
        <DropdownMenuItem
          onSelect={onDelete}
          className="gap-2 text-[13px] text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="w-3.5 h-3.5" /> 컬럼 삭제
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  );
}

/** 컬럼 메뉴 트리거(∨) — hover 시에만 보이는 16px 버튼, 라벨 우측 배치 */
export function ColumnMenuTrigger({ label }: { label: string }) {
  return (
    <DropdownMenuTrigger asChild>
      <button
        aria-label={`${label} 컬럼 메뉴`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center justify-center w-4 h-4 rounded transition-colors text-muted-foreground/50 hover:text-foreground opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 data-[state=open]:text-foreground data-[state=open]:bg-accent"
      >
        <ChevronDown className="w-3 h-3" />
      </button>
    </DropdownMenuTrigger>
  );
}

/**
 * 표준 헤더 셀 (고정 컬럼용 — 드래그 없음). 라벨 클릭=정렬 순환, ∨=컬럼 메뉴.
 * 드래그 가능한 컬럼은 SortableColumnHeader를 쓸 것.
 */
export function HeaderCell({
  label,
  colKey,
  sortDir,
  onSort,
  onSortChange,
  filter,
  onHide,
  className,
  style,
}: {
  label: string;
  /** 세로 구분선 실측(useTableDividers)용 data-col 부여 — 리사이즈 가능한 컬럼이면 필수 */
  colKey?: string;
  sortDir?: SortDir;
  onSort?: () => void;
  onSortChange?: (dir: SortDir) => void;
  filter?: ColumnFilterProps;
  onHide?: () => void;
  className?: string;
  /** sticky 고정 등 th에 직접 주입할 인라인 스타일 */
  style?: React.CSSProperties;
}) {
  return (
    <th data-col={colKey} style={style} className={cn(HEADER_CELL_CLASS, className)}>
      <span className="inline-flex items-center gap-1">
        {onSort ? <SortHeaderButton label={label} dir={sortDir} onSort={onSort} /> : <span>{label}</span>}
        {onSortChange && (
          <DropdownMenu>
            <ColumnMenuTrigger label={label} />
            <ColumnMenuContent sortDir={sortDir ?? null} onSortChange={onSortChange} filter={filter} onHide={onHide} />
          </DropdownMenu>
        )}
      </span>
    </th>
  );
}
