import React from "react";

type TagTone = "neutral" | "brand" | "muted";

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: TagTone;
  onRemove?: () => void;
}

const TONES: Record<TagTone, { fg: string; border: string; bg: string }> = {
  neutral: { fg: "var(--text-body-color)", border: "var(--border-default)", bg: "var(--surface-card)" },
  brand:   { fg: "var(--brand-hover)", border: "var(--blue-200)", bg: "var(--brand-subtle)" },
  muted:   { fg: "var(--text-muted-color)", border: "transparent", bg: "var(--bg-muted)" },
};

export function Tag({ tone = "neutral", onRemove, children, style, ...rest }: TagProps) {
  const t = TONES[tone] ?? TONES.neutral;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        height: 22, padding: onRemove ? "0 5px 0 9px" : "0 9px",
        background: t.bg, color: t.fg,
        border: `1px solid ${t.border}`, borderRadius: "var(--radius-sm)",
        fontSize: "var(--text-caption)",
        fontWeight: "var(--weight-medium)" as React.CSSProperties["fontWeight"],
        whiteSpace: "nowrap", ...style,
      }}
      {...rest}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          aria-label="remove"
          onClick={onRemove}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 14, height: 14, padding: 0, border: "none", background: "transparent",
            color: "var(--text-subtle-color)", cursor: "pointer", borderRadius: 3,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
