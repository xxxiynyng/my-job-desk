import { useEffect, useRef, useState } from "react";
import { ChevronDown, Layers, Pencil, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResizeHandle } from "@/hooks/useResizableCols";
import { cn } from "@/lib/utils";
import { type Item } from "./presets";

// ────────────────────────────────────────────────────────────────
// ResizableHead, HeaderFilter, ManageIndicator
// ────────────────────────────────────────────────────────────────

export function ResizableHead({
  label,
  width,
  onResize,
  filter,
  sortDir,
  onSort,
}: {
  label: string;
  width?: number;
  onResize?: (e: React.MouseEvent) => void;
  filter?: React.ReactNode;
  sortDir?: "asc" | "desc" | null;
  onSort?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <th style={width ? { width } : undefined} className="relative text-left px-3 py-1.5 text-sm font-normal text-gray-500 overflow-hidden whitespace-nowrap group">
      {onSort && (
        <div ref={menuRef} className="absolute left-1 top-1/2 -translate-y-1/2">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
            aria-label="정렬 메뉴"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            ⋮⋮
          </button>
          {open && (
            <div className="absolute top-full left-0 z-50 mt-1 w-36 bg-white border border-gray-100 rounded-lg shadow-md py-1 text-sm text-gray-600">
              <div className="px-3 pt-2 pb-1 text-xs text-gray-400 font-normal">정렬</div>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 font-normal hover:bg-gray-50 hover:text-gray-900 transition-colors"
                onClick={(e) => { e.stopPropagation(); onSort(); setOpen(false); }}
              >
                <span className="text-gray-400">↑</span> 오름차순
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 font-normal hover:bg-gray-50 hover:text-gray-900 transition-colors"
                onClick={(e) => { e.stopPropagation(); onSort(); setOpen(false); }}
              >
                <span className="text-gray-400">↓</span> 내림차순
              </button>
              <button
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 font-normal hover:bg-gray-50 hover:text-gray-900 transition-colors",
                  sortDir === null && "opacity-40 cursor-not-allowed pointer-events-none",
                )}
                onClick={(e) => { e.stopPropagation(); onSort(); setOpen(false); }}
              >
                <span className="text-gray-400">✕</span> 정렬 해제
              </button>
            </div>
          )}
        </div>
      )}
      <span className="inline-flex items-center gap-1 overflow-hidden">
        <span className="truncate">{label}</span>
        {filter}
        {sortDir != null && (
          <span className="text-blue-500 text-xs ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
        )}
      </span>
      {onResize && <ResizeHandle onMouseDown={onResize} />}
    </th>
  );
}

export type ColFilterShape = { kind: "select"; values: string[] } | { kind: "text"; q: string };

export function HeaderFilter({
  colKey,
  kind,
  options,
  colFilter,
  setSelectFilter,
  setTextFilter,
}: {
  colKey: string;
  kind: "select" | "text";
  options: string[];
  colFilter: Record<string, ColFilterShape>;
  setSelectFilter: (k: string, v: string[]) => void;
  setTextFilter: (k: string, q: string) => void;
}) {
  const cur = colFilter[colKey];
  const active = !!cur;
  const [search, setSearch] = useState("");
  const [text, setText] = useState(cur && cur.kind === "text" ? cur.q : "");
  useEffect(() => {
    setText(cur && cur.kind === "text" ? cur.q : "");
  }, [cur]);
  const selectedSet = cur && cur.kind === "select" ? new Set(cur.values) : new Set<string>();
  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="컬럼 필터"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex items-center justify-center w-4 h-4 rounded transition-colors",
            active
              ? "text-foreground bg-accent"
              : "text-muted-foreground/50 hover:text-foreground opacity-60 hover:opacity-100",
          )}
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px] p-2" onClick={(e) => e.stopPropagation()}>
        {kind === "text" ? (
          <div className="space-y-2">
            <Input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setTextFilter(colKey, text);
              }}
              placeholder="포함하는 글자"
              className="h-7 text-[11px]"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                className="text-[11px] text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setText("");
                  setTextFilter(colKey, "");
                }}
              >
                초기화
              </button>
              <Button size="sm" className="h-6 text-[11px] px-2" onClick={() => setTextFilter(colKey, text)}>
                적용
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {options.length > 6 && (
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="검색"
                className="h-7 text-[11px]"
              />
            )}
            <div className="max-h-[220px] overflow-y-auto -mx-1 px-1">
              {filtered.length === 0 && <p className="text-[11px] text-muted-foreground px-1 py-2">옵션이 없어요.</p>}
              {filtered.map((o) => {
                const checked = selectedSet.has(o);
                return (
                  <label key={o} className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-muted cursor-pointer">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => {
                        const next = new Set(selectedSet);
                        checked ? next.delete(o) : next.add(o);
                        setSelectFilter(colKey, Array.from(next));
                      }}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-[11.5px] truncate">{o}</span>
                  </label>
                );
              })}
            </div>
            {active && (
              <div className="pt-1 border-t border-border flex justify-end">
                <button
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectFilter(colKey, [])}
                >
                  초기화
                </button>
              </div>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ManageIndicator({ item, onMerge }: { item: Item; onMerge: () => void }) {
  // 병합 필요: hasMergeCandidate 플래그 또는 기존 status 값 모두 처리
  if (item.hasMergeCandidate || item.status === "병합 필요")
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onMerge}
            className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-muted text-muted-foreground"
            aria-label="비슷한 항목 있음"
          >
            <Layers className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="text-xs">비슷한 항목이 있어요</TooltipContent>
      </Tooltip>
    );
  if (item.hasUnansweredAiQuestion)
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center justify-center w-6 h-6 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="text-xs">미답변 AI 질문이 있어요</TooltipContent>
      </Tooltip>
    );
  if (item.status === "작성중")
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center justify-center w-6 h-6 text-muted-foreground">
            <Pencil className="w-4 h-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="text-xs">아직 정리 중</TooltipContent>
      </Tooltip>
    );
  return <span className="text-muted-foreground/30 text-[11px]">—</span>;
}
