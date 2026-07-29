import type { ReactNode } from "react";

// 화면 최상단 h1. 다섯 페이지에 같은 클래스 조합이 복제돼 있던 것을 그대로 옮겼다(2026-07-29).
// 감싸는 레이아웃은 각 페이지가 그대로 소유한다 — 여기서 바꾸는 것은 h1 하나뿐이다.
export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="text-heading font-bold text-foreground tracking-[-0.04em] leading-tight">{children}</h1>;
}
