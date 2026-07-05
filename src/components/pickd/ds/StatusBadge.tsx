import React from "react";

type StatusKey =
  | "draft" | "applied" | "document" | "test" | "interview"
  | "finished" | "passed" | "rejected" | "hold";

type Tone = "neutral" | "brand" | "info" | "success" | "warning" | "danger" | "caution";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: StatusKey;
  label?: string;
  tone?: Tone;
  size?: "sm" | "md";
}

// 전형 단계 6개 (2026-07-02 재편: 지원예정·서류합격 삭제, 최종합격/불합격/보류는
// "전형완료" 단일 단계로 통합 — 세부 결과는 passed/rejected/hold 배지로 구분)
export const STATUS_MAP: Record<StatusKey, { label: string; tone: Tone }> = {
  draft:     { label: "작성중",   tone: "neutral" },
  applied:   { label: "지원완료", tone: "brand" },
  document:  { label: "서류전형", tone: "info" },
  test:      { label: "필기전형", tone: "info" },
  interview: { label: "면접전형", tone: "warning" },
  finished:  { label: "전형완료", tone: "neutral" },
  // 세부 결과 배지 (전형완료 옆에 표시)
  passed:    { label: "최종합격", tone: "success" },
  rejected:  { label: "불합격",   tone: "danger" },
  hold:      { label: "보류",     tone: "caution" },
};

const TONES: Record<Tone, { bg: string; fg: string; dot: string }> = {
  neutral: { bg: "var(--bg-muted)", fg: "var(--text-body-color)", dot: "var(--slate-400)" },
  brand:   { bg: "var(--brand-subtle)", fg: "var(--brand-hover)", dot: "var(--blue-500)" },
  info:    { bg: "var(--indigo-50)", fg: "var(--indigo-600)", dot: "var(--indigo-500)" },
  success: { bg: "var(--success-subtle)", fg: "var(--green-700)", dot: "var(--green-500)" },
  warning: { bg: "var(--warning-subtle)", fg: "var(--amber-700)", dot: "var(--amber-500)" },
  danger:  { bg: "var(--danger-subtle)", fg: "var(--red-700)", dot: "var(--red-500)" },
  caution: { bg: "var(--violet-50)", fg: "var(--violet-600)", dot: "var(--violet-500)" },
};

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
        fontSize: sm ? "var(--text-nano)" : "var(--text-micro)",
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
