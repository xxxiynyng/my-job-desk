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
