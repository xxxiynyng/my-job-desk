import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

// ── 테이블 헤더 공용 컴포넌트 (탭1·탭2 공용) ─────────────────────────
// SSOT 6-2: 헤더 텍스트 text-xs font-medium text-gray-600 + whitespace-nowrap 필수.
// 정렬 버튼·화살표 마크업이 파일마다 복붙되며 갈라졌던 것을 여기 한 곳으로 단일화.
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

/** 표준 헤더 셀 — 정렬 버튼 + (선택) 컬럼 필터. 구 ResizableHead(탭2 전용)를 대체. */
export function HeaderCell({
  label,
  filter,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  filter?: React.ReactNode;
  sortDir?: SortDir;
  onSort?: () => void;
  className?: string;
}) {
  return (
    <th className={cn(HEADER_CELL_CLASS, className)}>
      <span className="inline-flex items-center gap-1">
        {onSort ? <SortHeaderButton label={label} dir={sortDir} onSort={onSort} /> : <span>{label}</span>}
        {filter}
      </span>
    </th>
  );
}
