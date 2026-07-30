// ─────────────────────────────────────────────────────────────
// localStorage 안전 접근 유틸 (단일 출처)
// 파싱 실패·접근 차단(사파리 프라이빗 등) 시 조용히 fallback — 기존 5개 파일에
// 각각 복제돼 있던 동일 구현을 통합했다. 동작은 종전과 동일하다.
// ─────────────────────────────────────────────────────────────

export function lsGet<T>(k: string, fallback: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function lsSet(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

/**
 * 저장된 px 값 맵을 배율만큼 키워 새 키로 1회 이관한다 (2026-07-30 UI 배율 1.1배 도입).
 *
 * 테이블 컬럼 폭은 rem이 아니라 px 숫자로 저장돼 있어서 --ui-scale을 따라오지 못한다.
 * 사용자가 직접 맞춰 둔 폭 비율을 그대로 살리려고, 기존 값을 한 번만 곱해서 옮긴다.
 * 멱등: 새 키가 이미 있으면 아무것도 하지 않는다.
 */
export function migrateScaledPxMap(fromKey: string, toKey: string, factor: number) {
  try {
    if (typeof localStorage === "undefined") return;
    if (localStorage.getItem(toKey) != null) return;
    const raw = localStorage.getItem(fromKey);
    if (raw == null) return;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const scaled: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "number" && Number.isFinite(v)) scaled[k] = Math.round(v * factor);
    }
    localStorage.setItem(toKey, JSON.stringify(scaled));
    localStorage.removeItem(fromKey);
  } catch {}
}
