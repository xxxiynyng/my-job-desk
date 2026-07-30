import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ─────────────────────────────────────────────────────────────
// 삭제·되돌릴 수 없는 동작의 확인 다이얼로그 (탭1 공고 · 탭2 경험 · 파일함 공용)
// 세 화면에 문자 단위로 같은 마크업이 복제돼 있던 것을 그대로 옮겼다(2026-07-29).
// 클래스·DOM 구조는 종전과 동일하다 — 바뀌는 것은 문구와 핸들러뿐이다.
// ─────────────────────────────────────────────────────────────

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "삭제",
  cancelLabel = "취소",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[23.75rem]">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-sm">{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
