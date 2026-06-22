import React, { useId } from "react";

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  size?: "sm" | "md" | "lg";
  label?: string;
  hint?: string;
  error?: string;
}

const HEIGHTS: Record<string, string> = {
  sm: "var(--control-h-sm)",
  md: "var(--control-h)",
  lg: "var(--control-h-lg)",
};

const CHEVRON = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%2379859A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>'
)}`;

export function Select({ label, hint, error, size = "md", disabled = false, children, style, id, onFocus, onBlur, ...rest }: SelectProps) {
  const [focused, setFocused] = React.useState(false);
  const autoId = useId();
  const fieldId = id ?? autoId;
  const borderColor = error ? "var(--danger)" : focused ? "var(--brand)" : "var(--border-default)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {label && (
        <label htmlFor={fieldId} style={{ fontSize: "var(--text-body-sm)", fontWeight: "var(--weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--text-body-color)" }}>
          {label}
        </label>
      )}
      <select
        id={fieldId}
        disabled={disabled}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        {...rest}
        style={{
          height: HEIGHTS[size] ?? HEIGHTS.md,
          padding: "0 34px 0 12px",
          background: `${disabled ? "var(--bg-subtle)" : "var(--surface-card)"} url("${CHEVRON}") no-repeat right 10px center`,
          border: `1px solid ${borderColor}`, borderRadius: "var(--radius-sm)",
          boxShadow: focused ? "var(--ring-focus)" : "none",
          fontSize: "var(--text-body)", color: "var(--text-strong)",
          fontFamily: "var(--font-sans)", appearance: "none", WebkitAppearance: "none",
          outline: "none", cursor: disabled ? "not-allowed" : "pointer",
          transition: "border-color .14s ease, box-shadow .14s ease",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {children}
      </select>
      {(hint || error) && (
        <span style={{ fontSize: "var(--text-caption)", color: error ? "var(--danger)" : "var(--text-muted-color)" }}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
}
