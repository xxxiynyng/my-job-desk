// ─────────────────────────────────────────────────────────────
// 탭1·탭2 테이블 공용 상태 setter 팩토리 (단일 출처)
// 두 화면에 글자 단위로 동일하게 복제돼 있던 컬럼 필터·정렬 setter를 통합했다.
// 상태(useState) 자체는 각 화면이 소유하고, 갱신 규칙만 여기서 공유한다.
// ─────────────────────────────────────────────────────────────
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type { ColFilterShape } from "./HeaderFilter";

export type ColSortState = { key: string; dir: "asc" | "desc" } | null;

/** 헤더 필터 — 선택형/텍스트형. 빈 값이면 해당 키를 제거한다. */
export function makeColFilterSetters(
  setColFilter: Dispatch<SetStateAction<Record<string, ColFilterShape>>>,
) {
  const setSelectFilter = (key: string, values: string[]) =>
    setColFilter((p) => {
      const n = { ...p };
      if (!values.length) delete n[key];
      else n[key] = { kind: "select", values };
      return n;
    });
  const setTextFilter = (key: string, q: string) =>
    setColFilter((p) => {
      const n = { ...p };
      if (!q.trim()) delete n[key];
      else n[key] = { kind: "text", q };
      return n;
    });
  return { setSelectFilter, setTextFilter };
}

/** 컬럼 정렬 — 헤더 클릭 토글(asc→desc→해제)과 그립 드롭다운의 방향 직접 지정. */
export function makeColSortSetters(
  setSortMode: Dispatch<SetStateAction<"custom" | null>>,
  setColSort: Dispatch<SetStateAction<ColSortState>>,
) {
  const toggleColSort = (key: string) => {
    setSortMode(null);
    setColSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };
  const setSortDirect = (key: string, dir: "asc" | "desc" | null) => {
    setSortMode(null);
    setColSort(dir ? { key, dir } : null);
  };
  return { toggleColSort, setSortDirect };
}

/* ── 아래는 탭1·탭2 테이블에 글자 단위로 복제돼 있던 순수 파생 (2026-07-29 통합) ──
   전부 렌더 중 호출되는 순수 함수·팩토리다. 훅이 아니므로 이펙트 순서에 영향이 없다. */

/** 좌측 고정 컬럼의 sticky style/className. frozenMap 구성은 각 화면이 소유한다. */
export function makeStickyProps(
  frozenMap: Map<string, { left: number; last?: boolean }> | undefined,
  cn: (...args: unknown[]) => string,
) {
  return (key: string, header = false): { style?: CSSProperties; className?: string } => {
    const f = frozenMap?.get(key);
    if (!f) return {};
    return {
      style: { position: "sticky", left: f.left, zIndex: 30 },
      className: cn(header ? "bg-slate-50" : "bg-card group-hover:bg-gray-50", f.last && "border-r border-border"),
    };
  };
}

/** 헤더 필터의 선택지 — 행 집합에서 고유값을 모아 사전순 정렬. 값이 배열이면 펼쳐 담는다. */
export function collectDistinct<T>(rows: readonly T[], getValue: (row: T) => string | string[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const v = getValue(r);
    if (Array.isArray(v)) v.forEach((x) => x && set.add(x));
    else if (v) set.add(String(v));
  }
  return Array.from(set).sort();
}

/** 전체선택 상태와 토글. 비교 대상(필터링된 행)은 호출부가 정한다. */
export function makeSelectAll<T extends { id: string }>(
  rows: readonly T[],
  selected: ReadonlySet<string>,
  setSelected: (s: Set<string>) => void,
) {
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  return {
    allSelected,
    toggleSelectAll: () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id))),
  };
}

/** 드래그로 바뀐 컬럼 순서 반영. 둘 중 하나라도 목록에 없으면 아무것도 하지 않는다. */
export function reorderColumns<K extends string>(
  setColOrder: Dispatch<SetStateAction<K[]>>,
  activeId: K,
  overId: K,
  arrayMove: <U>(arr: U[], from: number, to: number) => U[],
) {
  setColOrder((prev) => {
    const oldIdx = prev.findIndex((k) => k === activeId);
    const newIdx = prev.findIndex((k) => k === overId);
    if (oldIdx < 0 || newIdx < 0) return prev;
    return arrayMove(prev, oldIdx, newIdx);
  });
}
