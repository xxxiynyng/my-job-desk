import React from "react";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
  size?: "sm" | "md";
}

const TONES: Record<Tone, { bg: string; fg: string; dot: string }> = {
  neutral: { bg: "var(--bg-muted)", fg: "var(--text-body-color)", dot: "var(--slate-400)" },
  brand:   { bg: "var(--brand-subtle)", fg: "var(--brand-hover)", dot: "var(--blue-500)" },
  success: { bg: "var(--success-subtle)", fg: "var(--green-700)", dot: "var(--green-500)" },
  warning: { bg: "var(--warning-subtle)", fg: "var(--amber-700)", dot: "var(--amber-500)" },
  danger:  { bg: "var(--danger-subtle)", fg: "var(--red-700)", dot: "var(--red-500)" },
  info:    { bg: "var(--indigo-50)", fg: "var(--indigo-600)", dot: "var(--indigo-500)" },
};

export function Badge({ tone = "neutral", dot = false, size = "md", children, style, ...rest }: BadgeProps) {
  const t = TONES[tone] ?? TONES.neutral;
  const sm = size === "sm";
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        height: sm ? 18 : 22, padding: sm ? "0 7px" : "0 9px",
        background: t.bg, color: t.fg,
        fontSize: sm ? "var(--text-chip)" : "var(--text-xs)",
        fontWeight: "var(--weight-semibold)" as React.CSSProperties["fontWeight"],
        letterSpacing: "-0.01em",
        borderRadius: "var(--radius-pill)", whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.dot, flex: "none" }} />}
      {children}
    </span>
  );
}
