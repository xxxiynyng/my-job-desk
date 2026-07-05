import { useState } from "react";
import { Sparkles, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { type Item } from "./presets";

// ────────────────────────────────────────────────────────────────
// CopyGenerator
// ────────────────────────────────────────────────────────────────

export function CopyGenerator({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  item: Item;
}) {
  const [purpose, setPurpose] = useState("문제해결");
  const [length, setLength] = useState(500);
  const [text, setText] = useState("");

  const generate = () => {
    const v = item.values;
    const parts = [item.document, v.role, v.tasks].filter(Boolean).join(" ");
    setText((parts || item.name).slice(0, length));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-base">복붙용 문장 만들기</DialogTitle>
          <DialogDescription className="text-sm">목적과 글자수에 맞춰 문장을 다듬어 드려요.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <p className="text-chip text-muted-foreground mb-1">목적</p>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full h-8 border border-border rounded-md px-2 text-xs bg-card"
            >
              {[
                "지원동기",
                "직무역량",
                "문제해결",
                "협업 경험",
                "도전 경험",
                "성과 경험",
                "성장 과정",
                "입사 후 포부",
                "면접 답변",
                "이력서 요약",
              ].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-chip text-muted-foreground mb-1">글자수</p>
            <select
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full h-8 border border-border rounded-md px-2 text-xs bg-card"
            >
              {[100, 300, 500, 700, 1000].map((n) => (
                <option key={n} value={n}>
                  {n}자 내외
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs mt-1" onClick={generate}>
          <Sparkles className="w-3.5 h-3.5" /> 생성하기
        </Button>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[180px] text-body mt-1"
          placeholder="생성된 문장이 여기에 표시돼요"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-chip text-muted-foreground tabular-nums">
            현재 {text.length}자 / 목표 {length}자
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-chip" onClick={generate}>
              다시 만들기
            </Button>
            <Button
              size="sm"
              className="h-7 text-chip"
              onClick={() => {
                navigator.clipboard.writeText(text);
                toast.success("복사했어요");
              }}
            >
              <Copy className="w-3 h-3" /> 복사하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
