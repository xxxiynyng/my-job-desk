import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

// ── 컬럼별 필터 본문 (탭1·탭2 공용) ──────────────────────────────────
// SSOT 6-3: 컬럼별 필터는 헤더 컬럼 메뉴(ColumnMenu)의 "필터" 서브메뉴 안에 들어간다.
// 구 HeaderFilter(독립 ∨ 트리거)는 컬럼 메뉴 통합(2026-07-02)으로 본문만 남기고 제거 —
// 트리거·배치는 HeaderCell/SortableColumnHeader의 ColumnMenu가 담당.

export type ColFilterShape = { kind: "select"; values: string[] } | { kind: "text"; q: string };

/** 컬럼 메뉴 → 필터 서브메뉴에 주입할 props 묶음 */
export type ColumnFilterProps = {
  colKey: string;
  kind: "select" | "text";
  options: string[];
  colFilter: Record<string, ColFilterShape>;
  setSelectFilter: (k: string, v: string[]) => void;
  setTextFilter: (k: string, q: string) => void;
};

export function HeaderFilterContent({
  colKey,
  kind,
  options,
  colFilter,
  setSelectFilter,
  setTextFilter,
}: ColumnFilterProps) {
  const cur = colFilter[colKey];
  const active = !!cur;
  const [search, setSearch] = useState("");
  const [text, setText] = useState(cur && cur.kind === "text" ? cur.q : "");
  useEffect(() => {
    setText(cur && cur.kind === "text" ? cur.q : "");
  }, [cur]);
  const selectedSet = cur && cur.kind === "select" ? new Set(cur.values) : new Set<string>();
  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  if (kind === "text") {
    return (
      <div className="space-y-2">
        <Input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") setTextFilter(colKey, text);
          }}
          placeholder="포함하는 글자"
          className="h-7 text-chip"
        />
        <div className="flex items-center justify-between gap-2">
          <button
            className="text-chip text-muted-foreground hover:text-foreground"
            onClick={() => {
              setText("");
              setTextFilter(colKey, "");
            }}
          >
            초기화
          </button>
          <Button size="sm" className="h-6 text-chip px-2" onClick={() => setTextFilter(colKey, text)}>
            적용
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {options.length > 6 && (
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="검색"
          className="h-7 text-chip"
        />
      )}
      <div className="max-h-[220px] overflow-y-auto -mx-1 px-1">
        {filtered.length === 0 && <p className="text-chip text-muted-foreground px-1 py-2">옵션이 없어요.</p>}
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
              <span className="text-chip truncate">{o}</span>
            </label>
          );
        })}
      </div>
      {active && (
        <div className="pt-1 border-t border-border flex justify-end">
          <button
            className="text-chip text-muted-foreground hover:text-foreground"
            onClick={() => setSelectFilter(colKey, [])}
          >
            초기화
          </button>
        </div>
      )}
    </div>
  );
}
