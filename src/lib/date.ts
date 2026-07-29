// 날짜 → "YYYY-MM-DD" 공용 헬퍼 (2026-07-29 통합)
// 기존에 산재하던 `d.toISOString().split("T")[0]` / `.slice(0, 10)` 표현과 동작 동일(UTC 기준).
// ⚠️ UTC 기준이라 로컬 자정 경계에서 하루 밀릴 수 있는 특성까지 기존과 동일하게 보존함 — 동작 변경 없음.
export const toISODate = (date: Date): string => date.toISOString().slice(0, 10);
