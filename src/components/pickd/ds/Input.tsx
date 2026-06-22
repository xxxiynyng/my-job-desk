import React, { useId } from "react";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "sm" | "md" | "lg";
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  invalid?: boolean;
}

const SIZES = {
  sm: { h: "var(--control-h-sm)", font: "var(--text-body-sm)", pad: 10 },
  md: { h: "var(--control-h)", font: "var(--text-body)", pad: 12 },
  lg: { h: "var(--control-h-lg)", font: "var(--text-body-lg)", pad: 14 },
};

export function Input({
  size = "md",
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  invalid,
  disabled = false,
  style,
  id,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const s = SIZES[size] ?? SIZES.md;
  const isInvalid = invalid || !!error;
  const [focused, setFocused] = React.useState(false);
  const autoId = useId();
  const fieldId = id ?? autoId;

  const borderColor = isInvalid ? "var(--danger)" : focused ? "var(--brand)" : "var(--border-default)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {label && (
        <label htmlFor={fieldId} style={{ fontSize: "var(--text-body-sm)", fontWeight: "var(--weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--text-body-color)" }}>
          {label}
        </label>
      )}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 8,
          height: s.h, padding: `0 ${s.pad}px`,
          background: disabled ? "var(--bg-subtle)" : "var(--surface-card)",
          border: `1px solid ${borderColor}`,
          borderRadius: "var(--radius-sm)",
          boxShadow: focused ? (isInvalid ? "0 0 0 3px var(--danger-subtle)" : "var(--ring-focus)") : "none",
          transition: "border-color .14s ease, box-shadow .14s ease",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {leftIcon && <span style={{ color: "var(--text-subtle-color)", display: "inline-flex", flex: "none" }}>{leftIcon}</span>}
        <input
          id={fieldId}
          disabled={disabled}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          {...rest}
          style={{
            flex: 1, minWidth: 0, height: "100%", border: "none", outline: "none",
            background: "transparent", fontSize: s.font, color: "var(--text-strong)",
            fontFamily: "var(--font-sans)",
          }}
        />
        {rightIcon && <span style={{ color: "var(--text-subtle-color)", display: "inline-flex", flex: "none" }}>{rightIcon}</span>}
      </div>
      {(hint || error) && (
        <span style={{ fontSize: "var(--text-caption)", color: error ? "var(--danger)" : "var(--text-muted-color)" }}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
}
