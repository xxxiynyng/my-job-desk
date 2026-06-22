import React from "react";

type AvatarSize = "xs" | "sm" | "md" | "lg" | number;

interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name?: string;
  src?: string;
  size?: AvatarSize;
  square?: boolean;
}

const SIZE_PX: Record<string, number> = { xs: 22, sm: 28, md: 36, lg: 44 };

const TINTS: [string, string][] = [
  ["#DCE8FD", "#2A52CC"],
  ["#E7F6EF", "#0F7A57"],
  ["#FCF3E2", "#A56F08"],
  ["#EEEEFB", "#4848B3"],
  ["#EFF2F6", "#3E4859"],
];

function pickTint(name: string): [string, string] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h * 31 + name.charCodeAt(i)) >>> 0);
  return TINTS[h % TINTS.length];
}

export function Avatar({ name = "", src, size = "md", square = false, style, ...rest }: AvatarProps) {
  const px = typeof size === "number" ? size : (SIZE_PX[size] ?? 36);
  const [bg, fg] = pickTint(name);
  const initials = name.trim().slice(0, 2) || "?";

  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: px, height: px, flex: "none",
        borderRadius: square ? "var(--radius-sm)" : "50%",
        background: src ? "var(--bg-muted)" : bg,
        color: fg, overflow: "hidden",
        fontSize: Math.round(px * 0.4), fontWeight: "var(--weight-semibold)" as React.CSSProperties["fontWeight"],
        letterSpacing: "-0.02em", userSelect: "none",
        ...style,
      }}
      {...rest}
    >
      {src
        ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials}
    </span>
  );
}
