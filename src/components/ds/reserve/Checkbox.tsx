import React from "react";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  checked?: boolean;
  indeterminate?: boolean;
  label?: React.ReactNode;
  onChange?: (checked: boolean) => void;
}

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const DashIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round">
    <path d="M5 12h14" />
  </svg>
);

export function Checkbox({ checked = false, indeterminate = false, disabled = false, label, onChange, style, ...rest }: CheckboxProps) {
  const on = checked || indeterminate;
  return (
    <label
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1,
        fontSize: "var(--text-body)", color: "var(--text-body-color)", userSelect: "none",
        ...style,
      } as React.CSSProperties}
    >
      <span
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 18, height: 18, flex: "none",
          borderRadius: "var(--radius-xs)",
          background: on ? "var(--brand)" : "var(--surface-card)",
          border: `1px solid ${on ? "var(--brand)" : "var(--border-default)"}`,
          transition: "background-color .12s ease, border-color .12s ease",
        }}
      >
        {indeterminate ? <DashIcon /> : checked ? <CheckIcon /> : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        {...rest}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
      />
      {label && <span>{label}</span>}
    </label>
  );
}
