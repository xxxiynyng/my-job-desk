// ────────────────────────────────────────────────────────────────
// 탭2 — 자소서 붙여넣기 (기획서 1.9)
//  1) ImportSheet      입력 다이얼로그 — controlled · 문항 단위 다중 입력
//  2) ExtractJobBanner 진행 배너 — 모달이 아니라 목록 상단 인라인
//     (수십 초 걸리는 작업을 모달로 가두면 그동안 아무것도 못 한다)
// ────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExtractJob, ExtractUnit } from "./api";
import { TypingDots } from "./TypingDots";

const MIN_CHARS = 200;
const MAX_CHARS = 20000;

export function ImportSheet({
  open,
  initialUnits,
  onClose,
  onStart,
}: {
  open: boolean;
  initialUnits?: ExtractUnit[];
  onClose: () => void;
  onStart: (units: ExtractUnit[]) => void;
}) {
  const [units, setUnits] = useState<ExtractUnit[]>([{ question: "", answer: "" }]);

  // 실패 후 재시도 — 붙여넣은 원문을 그대로 복원한다 (다시 붙여넣게 하지 않는다)
  useEffect(() => {
    if (open) setUnits(initialUnits?.length ? initialUnits : [{ question: "", answer: "" }]);
  }, [open, initialUnits]);

  const total = units.reduce((n, u) => n + u.answer.length, 0);
  const filled = units.filter((u) => u.answer.trim().length > 0);
  const canStart = total >= MIN_CHARS;

  const set = (i: number, patch: Partial<ExtractUnit>) =>
    setUnits((p) => p.map((u, idx) => (idx === i ? { ...u, ...patch } : u)));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[560px] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border text-left space-y-0">
          <DialogTitle className="text-title font-semibold">자소서 붙여넣기</DialogTitle>
          <DialogDescription className="text-body text-muted-foreground mt-1">
            문항 단위로 넣으면 더 정확해요.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 max-h-[52vh] overflow-y-auto">
          <Tabs defaultValue="text">
            <TabsList className="grid grid-cols-2 w-full h-9">
              <TabsTrigger value="text" className="text-xs">
                텍스트 붙여넣기
              </TabsTrigger>
              <TabsTrigger value="file" className="text-xs">
                파일 업로드
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="mt-4 space-y-4">
              {units.map((u, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={u.question ?? ""}
                      onChange={(e) => set(i, { question: e.target.value })}
                      className="h-9 text-sm"
                      placeholder={`문항 ${i + 1} (선택) — 예: 지원 동기를 기술하시오`}
                    />
                    {units.length > 1 && (
                      <button
                        aria-label="이 문항 지우기"
                        onClick={() => setUnits((p) => p.filter((_, idx) => idx !== i))}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <Textarea
                    value={u.answer}
                    onChange={(e) => set(i, { answer: e.target.value.slice(0, MAX_CHARS) })}
                    className="min-h-[150px] text-sm"
                    placeholder="자소서 답변을 붙여넣어 주세요."
                  />
                </div>
              ))}
              <button
                onClick={() => setUnits((p) => [...p, { question: "", answer: "" }])}
                className="inline-flex items-center gap-1 text-body text-primary hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> 문항 더 넣기
              </button>
            </TabsContent>

            <TabsContent value="file" className="mt-4">
              <div className="border border-dashed border-border rounded-lg px-6 py-8 text-center">
                <Upload className="w-5 h-5 mx-auto text-muted-foreground" />
                <p className="text-body text-foreground mt-2">파일 불러오기는 곧 열어드릴게요</p>
                <p className="text-chip text-muted-foreground mt-1">
                  지금은 텍스트 붙여넣기로 정리할 수 있어요 (PDF·DOCX는 다음 단계)
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="px-6 py-3 border-t border-border flex items-center justify-between">
          <span className="text-chip text-muted-foreground">
            {total.toLocaleString()}자 · 문항 {Math.max(filled.length, 1)}개
            {!canStart && total > 0 && <span className="ml-1.5">· 조금 더 넣어주시면 정리할 수 있어요</span>}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>
              취소
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs bg-action hover:bg-action-hover text-white"
              disabled={!canStart}
              onClick={() => onStart(filled.length ? filled : units)}
            >
              정리 시작하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── 진행 배너 ───────────────────────────────────────────────── */

export function ExtractJobBanner({
  job,
  onOpenResult,
  onRetry,
  onDismiss,
}: {
  job: ExtractJob;
  onOpenResult: () => void;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const failed = job.status === "failed";
  const counts = {
    activities: job.candidates.filter((c) => c.kind === "activity").length,
    stories: job.candidates.filter((c) => c.kind === "story" && !c.insufficient).length,
  };

  return (
    <div
      className={cn(
        "border rounded-xl px-5 py-3.5 flex items-center gap-3",
        failed ? "border-border bg-card" : "border-blue-100 bg-blue-50/60",
      )}
    >
      {!failed && (
        <span className="inline-flex items-center gap-1.5 shrink-0">
          <TypingDots />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-body text-foreground">
          {failed ? "정리하지 못했어요. 넣으신 글은 그대로 있어요" : job.step}
          {!failed && job.progress.total > 1 && (
            // 진행 바 대신 텍스트 카운트 (디자인 §0-10)
            <span className="text-muted-foreground">
              {" "}
              · 문항 {job.progress.total}개 중 {Math.max(job.progress.done, 1)}번째
            </span>
          )}
        </p>
        {!failed && counts.stories > 0 && (
          <p className="text-chip text-muted-foreground mt-0.5">
            활동 {counts.activities}개, 소재 {counts.stories}개를 찾았어요
          </p>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2 shrink-0">
        {failed ? (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onRetry}>
            다시 시도
          </Button>
        ) : (
          counts.stories > 0 && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onOpenResult}>
              지금 보기
            </Button>
          )
        )}
        <button onClick={onDismiss} className="text-chip text-muted-foreground hover:text-foreground">
          닫기
        </button>
      </div>
    </div>
  );
}
