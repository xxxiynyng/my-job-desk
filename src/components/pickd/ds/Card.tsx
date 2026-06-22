import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  raised?: boolean;
  padding?: string | number;
  interactive?: boolean;
}

export function Card({ raised = false, padding = "16px", interactive = false, style, children, ...rest }: CardProps) {
  return (
    <div
      onMouseEnter={interactive ? (e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.borderColor = "var(--border-default)";
      } : undefined}
      onMouseLeave={interactive ? (e) => {
        e.currentTarget.style.boxShadow = raised ? "var(--shadow-sm)" : "none";
        e.currentTarget.style.borderColor = "var(--border-subtle)";
      } : undefined}
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        boxShadow: raised ? "var(--shadow-sm)" : "none",
        padding,
        cursor: interactive ? "pointer" : "default",
        transition: "box-shadow .16s ease, border-color .16s ease",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
