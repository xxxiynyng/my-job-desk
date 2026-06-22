import React from "react";

interface DdayChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  days: number;
  size?: "sm" | "md";
}

export function DdayChip({ days = 0, size = "md", style, ...rest }: DdayChipProps) {
  let label: string, bg: string, fg: string;

  if (days < 0) {
    label = `D+${Math.abs(days)}`; bg = "var(--bg-muted)"; fg = "var(--text-muted-color)";
  } else if (days === 0) {
    label = "D-DAY"; bg = "var(--red-500)"; fg = "#fff";
  } else if (days <= 1) {
    label = `D-${days}`; bg = "var(--danger-subtle)"; fg = "var(--red-700)";
  } else if (days <= 3) {
    label = `D-${days}`; bg = "var(--warning-subtle)"; fg = "var(--amber-700)";
  } else if (days <= 7) {
    label = `D-${days}`; bg = "var(--brand-subtle)"; fg = "var(--brand-hover)";
  } else {
    label = `D-${days}`; bg = "var(--bg-muted)"; fg = "var(--text-body-color)";
  }

  const sm = size === "sm";
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        height: sm ? 20 : 24, padding: sm ? "0 7px" : "0 9px",
        background: bg, color: fg,
        fontSize: sm ? "var(--text-micro)" : "var(--text-caption)",
        fontWeight: "var(--weight-bold)" as React.CSSProperties["fontWeight"],
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "0.01em", borderRadius: "var(--radius-sm)", whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {label}
    </span>
  );
}
