import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ── 컬럼별 헤더 필터 (탭1·탭2 공용) ──────────────────────────────────
// SSOT 6-3: 필터는 헤더의 HeaderFilter(컬럼별) 사용 — 테이블 공통 규칙.
// 구 위치: src/pages/experiences/tableWidgets.tsx (탭2 전용) → 공용 컴포넌트로 이동.

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
              : "text-muted-foreground/50 hover:text-foreground opacity-0 group-hover:opacity-100",
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
