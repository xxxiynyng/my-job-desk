import React from "react";

type IBVariant = "ghost" | "secondary" | "primary";
type IBSize = "sm" | "md" | "lg";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IBVariant;
  size?: IBSize;
}

const SIZES: Record<IBSize, { box: string; radius: string }> = {
  sm: { box: "30px", radius: "var(--radius-sm)" },
  md: { box: "36px", radius: "var(--radius-sm)" },
  lg: { box: "42px", radius: "var(--radius-md)" },
};

const VARIANTS: Record<IBVariant, { background: string; color: string; border: string; hover: string }> = {
  ghost:     { background: "transparent", color: "var(--text-muted-color)", border: "1px solid transparent", hover: "var(--bg-muted)" },
  secondary: { background: "var(--surface-card)", color: "var(--text-body-color)", border: "1px solid var(--border-default)", hover: "var(--bg-subtle)" },
  primary:   { background: "var(--brand)", color: "#fff", border: "1px solid transparent", hover: "var(--brand-hover)" },
};

export function IconButton({ variant = "ghost", size = "md", disabled = false, children, style, ...rest }: IconButtonProps) {
  const s = SIZES[size];
  const v = VARIANTS[variant];

  return (
    <button
      type="button"
      disabled={disabled}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = v.hover; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = v.background; }}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: s.box, height: s.box, padding: 0,
        background: v.background, color: v.color, border: v.border,
        borderRadius: s.radius, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "background-color .14s ease, color .14s ease",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
