import React from "react";

type TabItem = string | { value: string; label: string; count?: number };

interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  tabs: TabItem[];
  value: string;
  onChange?: (value: string) => void;
}

export function Tabs({ tabs, value, onChange, style, ...rest }: TabsProps) {
  return (
    <div
      role="tablist"
      style={{ display: "flex", alignItems: "stretch", gap: 4, borderBottom: "1px solid var(--border-subtle)", ...style }}
      {...rest}
    >
      {tabs.map((t) => {
        const key = typeof t === "string" ? t : t.value;
        const label = typeof t === "string" ? t : t.label;
        const count = typeof t === "object" ? t.count : undefined;
        const active = key === value;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(key)}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "var(--text-body-color)"; }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "var(--text-muted-color)"; }}
            style={{
              position: "relative", display: "inline-flex", alignItems: "center", gap: 6,
              padding: "0 4px 10px", marginBottom: -1, background: "none", border: "none",
              cursor: "pointer", fontSize: "var(--text-body)",
              fontWeight: (active ? "var(--weight-semibold)" : "var(--weight-medium)") as React.CSSProperties["fontWeight"],
              color: active ? "var(--text-strong)" : "var(--text-muted-color)",
              borderBottom: `2px solid ${active ? "var(--brand)" : "transparent"}`,
              transition: "color .14s ease",
            }}
          >
            {label}
            {count != null && (
              <span style={{
                fontSize: "var(--text-micro)", fontWeight: "var(--weight-semibold)" as React.CSSProperties["fontWeight"],
                color: active ? "var(--brand-hover)" : "var(--text-subtle-color)",
                background: active ? "var(--brand-subtle)" : "var(--bg-muted)",
                borderRadius: "var(--radius-pill)", padding: "1px 6px",
              }}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
