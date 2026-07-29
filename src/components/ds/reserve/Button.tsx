import React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outlined" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const SIZES: Record<Size, React.CSSProperties> = {
  sm: { height: "var(--control-h-sm)", padding: "0 10px", fontSize: "var(--text-body)", gap: "5px", borderRadius: "var(--radius-sm)" },
  md: { height: "var(--control-h)", padding: "0 14px", fontSize: "var(--text-sm)", gap: "6px", borderRadius: "var(--radius-sm)" },
  lg: { height: "var(--control-h-lg)", padding: "0 18px", fontSize: "var(--text-title)", gap: "7px", borderRadius: "var(--radius-md)" },
};

const VARIANTS: Record<Variant, React.CSSProperties & { "--hover-bg"?: string; "--active-bg"?: string }> = {
  primary: { background: "var(--brand)", color: "var(--text-onbrand)", border: "1px solid transparent" },
  secondary: { background: "var(--surface-card)", color: "var(--text-body-color)", border: "1px solid var(--border-default)" },
  ghost: { background: "transparent", color: "var(--text-body-color)", border: "1px solid transparent" },
  outlined: { background: "transparent", color: "var(--brand)", border: "1px solid var(--brand)" },
  danger: { background: "transparent", color: "var(--danger)", border: "1px solid var(--danger)" },
};

const HOVER_BG: Record<Variant, string> = {
  primary: "var(--brand-hover)",
  secondary: "var(--bg-subtle)",
  ghost: "var(--bg-muted)",
  outlined: "var(--brand-subtle)",
  danger: "var(--danger-subtle)",
};

const ACTIVE_BG: Record<Variant, string> = {
  primary: "var(--brand-active)",
  secondary: "var(--bg-muted)",
  ghost: "var(--slate-200)",
  outlined: "var(--blue-100)",
  danger: "var(--red-100)",
};

export function Button({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  type = "button",
  children,
  style,
  ...rest
}: ButtonProps) {
  const s = SIZES[size];
  const v = VARIANTS[variant];
  const isDisabled = disabled || loading;
  const { className: callerClass, ...restWithoutClass } = rest as { className?: string } & typeof rest;

  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: s.gap,
    height: s.height,
    padding: s.padding,
    width: fullWidth ? "100%" : "auto",
    fontSize: s.fontSize,
    fontWeight: "var(--weight-semibold)" as React.CSSProperties["fontWeight"],
    fontFamily: "var(--font-sans)",
    letterSpacing: "var(--tracking-snug)",
    lineHeight: 1,
    borderRadius: s.borderRadius,
    cursor: isDisabled ? "not-allowed" : "pointer",
    opacity: isDisabled ? 0.5 : 1,
    transition: "background-color .14s ease, box-shadow .14s ease, border-color .14s ease",
    whiteSpace: "nowrap",
    userSelect: "none",
    ...v,
    ...style,
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      style={base}
      className={cn("focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500", callerClass)}
      onMouseEnter={(e) => { if (!isDisabled) e.currentTarget.style.backgroundColor = HOVER_BG[variant]; }}
      onMouseLeave={(e) => { if (!isDisabled) e.currentTarget.style.backgroundColor = (v.background as string) ?? ""; }}
      onMouseDown={(e) => { if (!isDisabled) e.currentTarget.style.backgroundColor = ACTIVE_BG[variant]; }}
      onMouseUp={(e) => { if (!isDisabled) e.currentTarget.style.backgroundColor = HOVER_BG[variant]; }}
      {...restWithoutClass}
    >
      {loading && <Spinner />}
      {!loading && leftIcon}
      {children && <span>{children}</span>}
      {!loading && rightIcon}
    </button>
  );
}

function Spinner() {
  return (
    <>
      <style>{"@keyframes pickd-spin{to{transform:rotate(360deg)}}"}</style>
      <span
        style={{
          width: 14, height: 14, borderRadius: "50%",
          border: "2px solid currentColor", borderTopColor: "transparent",
          display: "inline-block", animation: "pickd-spin .6s linear infinite",
        }}
      />
    </>
  );
}
