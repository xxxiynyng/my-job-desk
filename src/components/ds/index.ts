// ─────────────────────────────────────────────────────────────
// 디자인시스템 프리미티브 — 실제로 화면이 쓰는 것만 여기서 내보낸다.
// 미사용 예비 11종(Avatar·Badge·Button·Card·Checkbox·IconButton·Input·Select·Stepper·Tabs·Tag)은
// 2026-07 삭제했다. 새 프리미티브가 필요하면 shadcn/ui의 components/ui/를 먼저 확인할 것.
// ─────────────────────────────────────────────────────────────
export { DdayChip } from "./DdayChip";
export { EssayStatus, ESSAY_STATE } from "./EssayStatus";
export { StatusBadge, STATUS_MAP, TONES, stageStyle, type Tone } from "./StatusBadge";
export { calcDday } from "@/lib/dday";
