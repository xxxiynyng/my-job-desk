// ─────────────────────────────────────────────────────────────
// 탭1·탭2 테이블 공용 상태 setter 팩토리 (단일 출처)
// 두 화면에 글자 단위로 동일하게 복제돼 있던 컬럼 필터·정렬 setter를 통합했다.
// 상태(useState) 자체는 각 화면이 소유하고, 갱신 규칙만 여기서 공유한다.
// ─────────────────────────────────────────────────────────────
import type { Dispatch, SetStateAction } from "react";
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
