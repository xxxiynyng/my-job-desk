import React from "react";

type StatusKey =
  | "draft" | "applied" | "document" | "test" | "interview"
  | "finished" | "passed" | "rejected" | "hold";

export type Tone = "neutral" | "brand" | "info" | "success" | "warning" | "danger" | "caution";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: StatusKey;
  label?: string;
  tone?: Tone;
  size?: "sm" | "md";
}

// 전형 단계 6개 (2026-07-02 재편: 지원예정·서류합격 삭제, 최종합격/불합격/보류는
// "전형완료" 단일 단계로 통합 — 세부 결과는 passed/rejected/hold 배지로 구분)
export const STATUS_MAP: Record<StatusKey, { label: string; tone: Tone }> = {
  draft:     { label: "작성중",   tone: "brand" },
  applied:   { label: "지원완료", tone: "neutral" },
  document:  { label: "서류전형", tone: "info" },
  test:      { label: "필기전형", tone: "info" },
  interview: { label: "면접전형", tone: "warning" },
  finished:  { label: "전형완료", tone: "neutral" },
  // 세부 결과 배지 (전형완료 옆에 표시)
  passed:    { label: "최종합격", tone: "success" },
  rejected:  { label: "불합격",   tone: "danger" },
  hold:      { label: "보류",     tone: "caution" },
};

// §5-3-1 tone 팔레트 — 정본. 상태칩을 손으로 칠하지 말고 이 값을 재사용할 것(§0-11 raw 금지).
export const TONES: Record<Tone, { bg: string; fg: string; dot: string }> = {
  neutral: { bg: "var(--bg-muted)", fg: "var(--text-body-color)", dot: "var(--slate-400)" },
  brand:   { bg: "var(--brand-subtle)", fg: "var(--brand-hover)", dot: "var(--blue-500)" },
  info:    { bg: "var(--indigo-50)", fg: "var(--indigo-600)", dot: "var(--indigo-500)" },
  success: { bg: "var(--success-subtle)", fg: "var(--green-700)", dot: "var(--green-500)" },
  warning: { bg: "var(--warning-subtle)", fg: "var(--amber-700)", dot: "var(--amber-500)" },
  danger:  { bg: "var(--danger-subtle)", fg: "var(--red-700)", dot: "var(--red-500)" },
  caution: { bg: "var(--violet-50)", fg: "var(--violet-600)", dot: "var(--violet-500)" },
};

// 상태 라벨(예: "작성중") → tone 역인덱스. STATUS_MAP 정본에서 파생 — 라벨↔색 매핑을 이중 관리하지 않는다.
const TONE_BY_LABEL: Record<string, Tone> = Object.fromEntries(
  Object.values(STATUS_MAP).map((s) => [s.label, s.tone]),
);

/** 상태 라벨에 대응하는 §5-3-1 tone 인라인 스타일(칸반 헤더·캘린더 배지 공용).
 *  backgroundColor·color와 함께 borderColor(=dot 색, 점·border-left 재사용)를 돌려준다.
 *  색 정의는 STATUS_MAP+TONES 한 곳뿐 — 손으로 칠하지 말 것(§0-11 raw 금지). */
export function stageStyle(label: string): { backgroundColor: string; color: string; borderColor: string } {
  const t = TONES[TONE_BY_LABEL[label] ?? "neutral"];
  return { backgroundColor: t.bg, color: t.fg, borderColor: t.dot };
}

export function StatusBadge({ status = "applied", label, tone, size = "md", style, ...rest }: StatusBadgeProps) {
  const def = STATUS_MAP[status] ?? STATUS_MAP.applied;
  const t = TONES[tone ?? def.tone] ?? TONES.neutral;
  const sm = size === "sm";

  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        height: sm ? 20 : 24, padding: sm ? "0 8px" : "0 10px",
        background: t.bg, color: t.fg,
        fontSize: sm ? "var(--text-mini)" : "var(--text-chip)",
        fontWeight: "var(--weight-semibold)" as React.CSSProperties["fontWeight"],
        letterSpacing: "-0.01em",
        borderRadius: "var(--radius-pill)", whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.dot, flex: "none" }} />
      {label ?? def.label}
    </span>
  );
}
