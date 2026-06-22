import React from "react";

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: string[];
  current?: number;
}

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export function Stepper({ steps = [], current = 0, style, ...rest }: StepperProps) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", width: "100%", ...style }} {...rest}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={i}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: "none", width: 72 }}>
              <span
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 24, height: 24, borderRadius: "50%",
                  background: done ? "var(--brand)" : "var(--surface-card)",
                  border: `2px solid ${done || active ? "var(--brand)" : "var(--border-default)"}`,
                  color: active ? "var(--brand)" : "var(--text-subtle-color)",
                  fontSize: "var(--text-caption)",
                  fontWeight: "var(--weight-bold)" as React.CSSProperties["fontWeight"],
                }}
              >
                {done ? <CheckIcon /> : i + 1}
              </span>
              <span style={{
                fontSize: "var(--text-caption)", textAlign: "center", lineHeight: 1.3,
                color: active ? "var(--text-strong)" : done ? "var(--text-body-color)" : "var(--text-subtle-color)",
                fontWeight: (active ? "var(--weight-semibold)" : "var(--weight-regular)") as React.CSSProperties["fontWeight"],
              }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <span style={{
                flex: 1, height: 2, marginTop: 11, borderRadius: 2,
                background: i < current ? "var(--brand)" : "var(--border-subtle)",
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
