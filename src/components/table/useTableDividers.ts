import { useLayoutEffect, useState } from "react";

export type DividerBound = { key: string; left: number };

/**
 * 컬럼 경계 실측 훅 (탭1·탭2 공용) — colgroup 지정 너비의 "계산값"을 누적하는 대신,
 * 브라우저가 실제 렌더한 thead `th[data-col]`의 위치(offsetLeft + offsetWidth)를 읽는다.
 *
 * 왜 실측인가: table-fixed에서 지정 너비 합이 컨테이너 폭보다 작으면 남는 공간이
 * 컬럼들에 배분되어, 계산값 기준 세로선이 실제 경계와 어긋난다(2026-07-02 탭2에서 확인).
 * SSOT 진단 규칙 "정렬·간격은 눈대중 금지 → 좌표로 검증"의 구현체.
 *
 * 사용법: 헤더 셀(HeaderCell/SortableColumnHeader)에 colKey를 넘기면 data-col이 붙는다.
 * 반환된 경계에 각 탭이 리사이즈 핸들러(onMouseDown(key))만 이어 붙이면 된다.
 * 리사이즈·컬럼 순서 변경·창 크기 변경은 ResizeObserver + deps로 자동 재측정.
 */
export function useTableDividers(
  wrapRef: React.RefObject<HTMLElement | null>,
  deps: readonly unknown[],
): DividerBound[] {
  const [bounds, setBounds] = useState<DividerBound[]>([]);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const measure = () => {
      const table = el.querySelector("table");
      const tableLeft = table instanceof HTMLElement ? table.offsetLeft : 0;
      const ths = el.querySelectorAll<HTMLElement>("thead th[data-col]");
      const next: DividerBound[] = Array.from(ths).map((th) => ({
        key: th.dataset.col as string,
        left: tableLeft + th.offsetLeft + th.offsetWidth,
      }));
      setBounds((prev) =>
        prev.length === next.length && prev.every((b, i) => b.key === next[i].key && b.left === next[i].left)
          ? prev
          : next,
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const table = el.querySelector("table");
    if (table) ro.observe(table);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return bounds;
}
