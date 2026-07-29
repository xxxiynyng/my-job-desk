// 도구 창(작성 도우미) 표시 소품 — PanelSection·ZoomView·TruncText.
// AICoverPage.tsx에서 그대로 분리(2026-07-29). 렌더 결과 동일.
import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// 우측 패널 섹션 — JobDetail Section 번호 헤더 축소판. 헤더 전체가 접기 토글
export function PanelSection({
  n, title, sub, tinted, defaultOpen = true, children,
}: {
  n: number; title: string; sub?: ReactNode; tinted?: boolean; defaultOpen?: boolean; children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={tinted ? "bg-muted/30" : undefined}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full px-5 py-3.5 flex items-center gap-2.5 text-left group"
      >
        <span className="w-5 h-5 rounded-md bg-muted text-muted-foreground text-mini font-bold flex items-center justify-center tabular-nums shrink-0">
          {n}
        </span>
        <span className="text-sm font-semibold text-foreground tracking-tight">{title}</span>
        <span className="ml-auto flex items-center gap-2 min-w-0">
          {sub}
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 shrink-0 text-muted-foreground/60 group-hover:text-muted-foreground transition-transform",
              !open && "-rotate-90",
            )}
          />
        </span>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </section>
  );
}

// 긴 콘텐츠 크게 보기 — 실데이터에선 분석·인재상이 훨씬 길고 복잡해질 것에 대비한 확대 뷰(모달)
export function ZoomView({ title, trigger, children }: { title: string; trigger: ReactNode; children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-title font-semibold text-foreground">{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-1 space-y-3">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

// 길어질 수 있는 텍스트 — 2줄 넘으면 접고 '더 보기'로 펼침
export function TruncText({ text, className = "" }: { text: string; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 70;
  return (
    <>
      <p className={cn(className, long && !expanded && "line-clamp-2")}>{text}</p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors"
        >
          {expanded ? "접기" : "더 보기"}
        </button>
      )}
    </>
  );
}
