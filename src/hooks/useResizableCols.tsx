import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 드래그로 컬럼 너비를 조절할 수 있는 간단한 훅.
 * - 각 컬럼 key 별 width(px)를 관리합니다.
 * - localStorage 에 저장해 새로고침 후에도 유지합니다.
 * - maxWidths를 넘겨주면 저장된 값이 그보다 크더라도(과거 실수로 과도하게 늘려놓은 값
 *   포함) 읽어올 때/드래그 중 모두 그 상한으로 자동 clamp — 컬럼이 내용보다 훨씬
 *   넓어져서 헤더·본문 사이에 빈 공백이 크게 남는 문제를 막는다.
 */
export function useResizableCols(
  storageKey: string,
  defaults: Record<string, number>,
  minWidths?: Record<string, number>,
  maxWidths?: Record<string, number>,
) {
  const clamp = useCallback(
    (key: string, v: number) => {
      const min = minWidths?.[key] ?? 60;
      const max = maxWidths?.[key] ?? Infinity;
      return Math.min(Math.max(v, min), max);
    },
    [minWidths, maxWidths],
  );

  const [widths, setWidths] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return defaults;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const merged: Record<string, number> = { ...defaults, ...JSON.parse(raw) };
        for (const key of Object.keys(merged)) merged[key] = clamp(key, merged[key]);
        return merged;
      }
    } catch {}
    return defaults;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(widths));
    } catch {}
  }, [storageKey, widths]);

  const [resizingKey, setResizingKey] = useState<string | null>(null);
  const resizingStartX = useRef<number>(0);
  const dragRef = useRef<{ key: string; startX: number; startW: number } | null>(null);

  const onMouseDown = useCallback(
    (key: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setResizingKey(key);
      resizingStartX.current = e.clientX;
      dragRef.current = {
        key,
        startX: e.clientX,
        startW: widths[key] ?? defaults[key] ?? 120,
      };
      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        resizingStartX.current = ev.clientX;
        const dx = ev.clientX - dragRef.current.startX;
        const next = clamp(dragRef.current.key, dragRef.current.startW + dx);
        setWidths((p) => ({ ...p, [dragRef.current!.key]: next }));
      };
      const onUp = () => {
        dragRef.current = null;
        setResizingKey(null);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      document.body.style.cursor = "col-resize";
    },
    [widths, defaults, clamp],
  );

  return { widths, onMouseDown, resizingKey, resizingStartX };
}
