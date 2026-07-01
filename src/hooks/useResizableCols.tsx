import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 드래그로 컬럼 너비를 조절할 수 있는 간단한 훅.
 * - 각 컬럼 key 별 width(px)를 관리합니다.
 * - localStorage 에 저장해 새로고침 후에도 유지합니다.
 */
export function useResizableCols(
  storageKey: string,
  defaults: Record<string, number>,
  minWidths?: Record<string, number>,
) {
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return defaults;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return { ...defaults, ...JSON.parse(raw) };
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
        const min = minWidths?.[dragRef.current.key] ?? 60;
        const next = Math.max(min, dragRef.current.startW + dx);
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
    [widths, defaults],
  );

  return { widths, onMouseDown, resizingKey, resizingStartX };
}

/** 컬럼 헤더 오른쪽 끝의 드래그 핸들 */
export function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <span
      onMouseDown={onMouseDown}
      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none hover:bg-primary/30 active:bg-primary/60"
      aria-hidden
    />
  );
}
