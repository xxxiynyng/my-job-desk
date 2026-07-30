// ────────────────────────────────────────────────────────────────
// 탭2 v2 — 인터뷰 모드 (기획서 1.8)
//
// 피로를 늘리지 않기 위한 7가지 규칙 — 코드에서 지켜야 하는 것들:
//  ① 1턴은 타이핑 0. 칩만 고르면 넘어간다.
//  ② 최대 3턴. 남은 개수는 "3개 중 2번째" 텍스트로만 (진행 바 금지 — 디자인 §0-10)
//  ③ 1턴만 답해도 결과가 남는다. 2턴부터 [여기까지 저장하기] 상시 노출
//  ④ 질문은 구어·구체·저추상. 예시(placeholder·hint)를 항상 함께 준다
//  ⑤ 답변마다 1줄 리액션 — 취조가 아니라 대화로 읽히게
//  ⑥ 완료 후 "하나 더 하실래요?"를 띄우지 않는다
//  ⑦ 글자수 하한·재촉 문구 없음. 언제든 [건너뛰기]
// ────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { tab2Api, type InterviewMode as Mode, type InterviewTurn, type InterviewDraft } from "./api";
import type { ChipOption } from "./entryOptions";
import { BLANK, readAnswerSignal, signalMessage } from "./writingAids";
import { type Competency, NCS_LABEL, uid } from "./model";
import { TypingDots } from "./TypingDots";

const MAX_TURNS = 3;

type Bubble = { role: "ai" | "me"; text: string; hint?: string };

export function InterviewMode({
  open,
  mode,
  targetCompetency,
  demandNote,
  onClose,
  onComplete,
}: {
  open: boolean;
  mode: Mode;
  targetCompetency?: Competency;
  /** 갭 모드에서 "담은 공고 3곳 중 2곳이 물어요" 같은 근거 한 줄 */
  demandNote?: string;
  onClose: () => void;
  onComplete: (draft: InterviewDraft) => void;
}) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [turn, setTurn] = useState<InterviewTurn | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  /** 1턴에서 고른 것들 — 여러 개 고를 수 있다 */
  const [picked, setPicked] = useState<ChipOption[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [slow, setSlow] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* 열릴 때 1턴 요청 */
  useEffect(() => {
    if (!open) return;
    setBubbles([]);
    setAnswers([]);
    setPicked([]);
    setTurn(null);
    setDraft("");
    setConfirmClose(false);
    void ask(1, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, thinking, turn]);

  useEffect(() => {
    if (!thinking) {
      setSlow(false);
      return;
    }
    const t = setTimeout(() => setSlow(true), 8000); // ⑤ 8초 넘으면 한 줄 안내
    return () => clearTimeout(t);
  }, [thinking]);

  async function ask(turnNo: number, prev: string[]) {
    setThinking(true);
    setTurn(null);
    const t = await tab2Api.nextInterviewTurn({ mode, targetCompetency, turnNo, answers: prev, picked });
    setThinking(false);
    if (t.reaction) setBubbles((b) => [...b, { role: "ai", text: t.reaction! }]);
    setBubbles((b) => [...b, { role: "ai", text: t.question, hint: t.hint }]);
    setTurn(t);
    setTimeout(() => inputRef.current?.focus(), 60);
  }

  async function submit(value: string) {
    const v = value.trim();
    if (!v) return;
    const nextAnswers = [...answers, v];
    setAnswers(nextAnswers);
    setBubbles((b) => [...b, { role: "me", text: v }]); // 낙관적 표시
    setDraft("");
    if (nextAnswers.length >= MAX_TURNS) {
      await finish(nextAnswers);
    } else {
      await ask(nextAnswers.length + 1, nextAnswers);
    }
  }

  async function finish(finalAnswers: string[]) {
    if (finalAnswers.length === 0) return;
    setFinishing(true);
    setTurn(null);
    const d = await tab2Api.buildInterviewDraft({ mode, answers: finalAnswers, picked, activityId: uid() });
    setFinishing(false);
    onComplete(d); // ⑥ "하나 더 하실래요?"를 띄우지 않는다 — 결과 확인 화면으로 바로 넘긴다
  }

  /**
   * 보조 칩을 커서 위치에 넣는다.
   * selectBlank=true 면 넣은 뒤 `__` 부분을 선택 상태로 둬서 바로 덮어쓸 수 있게 한다.
   */
  const insertAid = (text: string, selectBlank = false) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? start;
    const before = draft.slice(0, start);
    const after = draft.slice(end);
    // 앞뒤로 자연스럽게 띄어쓰기 — 사용자가 지우지 않아도 되게
    const needSpaceBefore = before.length > 0 && !/\s$/.test(before);
    const chunk = (needSpaceBefore ? " " : "") + text;
    const next = before + chunk + after;
    setDraft(next);

    const caret = before.length + chunk.length;
    requestAnimationFrame(() => {
      el?.focus();
      if (selectBlank) {
        const bStart = next.indexOf(BLANK, before.length);
        if (bStart >= 0) {
          el?.setSelectionRange(bStart, bStart + BLANK.length);
          return;
        }
      }
      el?.setSelectionRange(caret, caret);
    });
  };

  const canSaveNow = answers.length >= 1 && !thinking && !finishing;
  /** 지금 쓰고 있는 답이 소재가 될 준비가 됐는지 — 채워졌을 때만 한 줄 뜬다 (재촉 금지) */
  const draftSignal = signalMessage(readAnswerSignal(draft));
  const remainingLabel = `${MAX_TURNS}개 중 ${Math.min(answers.length + 1, MAX_TURNS)}번째`;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          if (answers.length > 0) setConfirmClose(true);
          else onClose();
        }
      }}
    >
      <DialogContent className="max-w-[720px] w-[92vw] max-h-[88vh] p-0 gap-0 overflow-hidden flex flex-col [&>button]:hidden">
        {/* 헤더 */}
        <DialogHeader className="px-6 py-4 border-b border-border text-left space-y-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-title font-semibold">
                {mode === "gap" && targetCompetency
                  ? `${NCS_LABEL[targetCompetency]} 이야기를 찾아볼게요`
                  : "경험 이야기 나누기"}
              </DialogTitle>
              <DialogDescription className="text-chip text-muted-foreground mt-1">
                {mode === "gap" && demandNote ? demandNote : "3개만 물어볼게요."}
                <span className="mx-1.5 text-border">·</span>
                {/* ② 진행 바 대신 텍스트 카운트만 */}
                {remainingLabel}
              </DialogDescription>
            </div>
            <button
              aria-label="닫기"
              onClick={() => (answers.length > 0 ? setConfirmClose(true) : onClose())}
              className="p-1 rounded hover:bg-muted text-muted-foreground shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        {/* 대화 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-3" aria-live="polite">
          {bubbles.map((b, i) =>
            b.role === "ai" ? (
              <div key={i} className="max-w-[85%]">
                <div className="border border-border bg-card rounded-lg px-4 py-3">
                  <p className="text-body text-foreground leading-snug">{b.text}</p>
                  {b.hint && <p className="text-chip text-muted-foreground mt-1.5">{b.hint}</p>}
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-end">
                <div className="max-w-[70%] bg-muted rounded-lg px-4 py-3">
                  <p className="text-body text-foreground whitespace-pre-wrap">{b.text}</p>
                </div>
              </div>
            ),
          )}

          {(thinking || finishing) && (
            <div className="max-w-[85%]">
              <div className="border border-border bg-card rounded-lg px-4 py-3 inline-flex items-center gap-1.5">
                <TypingDots />
                {finishing && <span className="ml-2 text-chip text-muted-foreground">이야기를 정리하고 있어요</span>}
              </div>
              {slow && !finishing && (
                <p className="text-chip text-muted-foreground mt-1.5">생각이 길어지고 있어요</p>
              )}
            </div>
          )}

          {/* ① 1턴은 타이핑 0 — 칩만 고르면 넘어간다. 여러 개 고를 수 있다 */}
          {turn?.kind === "chips" && (
            <div className="pt-1">
              <div className="flex flex-wrap gap-2">
                {turn.chips?.map((c) => {
                  const on = picked.some((x) => x.label === c.label);
                  return (
                    <button
                      key={c.label}
                      aria-pressed={on}
                      onClick={() =>
                        setPicked((p) =>
                          on ? p.filter((x) => x.label !== c.label) : [...p, c],
                        )
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 text-body rounded-lg border transition-colors",
                        on
                          ? "border-blue-100 bg-blue-50 text-primary font-medium"
                          : "border-border bg-card hover:bg-blue-50 hover:border-blue-100 hover:text-primary",
                      )}
                    >
                      {on && <Check className="w-3.5 h-3.5" />}
                      {c.label}
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    setTurn({ ...turn, kind: "text", placeholder: "직접 적어주세요", hint: undefined });
                    setTimeout(() => inputRef.current?.focus(), 60);
                  }}
                  className="px-3 py-1.5 text-body rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground"
                >
                  직접 쓸게요
                </button>
              </div>

              {/* 여러 개 골랐을 때 무슨 일이 생기는지 미리 알려준다 */}
              <div className="flex items-center gap-3 mt-3">
                <Button
                  className="h-9 px-4 bg-action hover:bg-action-hover text-white"
                  disabled={picked.length === 0}
                  onClick={() => void submit(picked.map((c) => c.label).join(" · "))}
                >
                  {picked.length > 1 ? `${picked.length}개 고르고 다음` : "다음"}
                </Button>
                {picked.length > 1 && (
                  <span className="text-chip text-muted-foreground">
                    첫 번째 「{picked[0].label}」부터 이야기를 들을게요. 나머지는 활동으로만 저장해 둘게요.
                  </span>
                )}
              </div>
            </div>
          )}

        </div>

        {/* 입력 */}
        <div className="px-6 py-4 border-t border-border">
          {/* 입력 보조 — 2·3턴의 백지를 없앤다. 완성된 문장은 넣지 않는다 */}
          {turn?.kind === "text" && turn.aids && (
            <div className="mb-2.5 space-y-1.5">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-chip text-muted-foreground mr-0.5">이렇게 시작해 보세요</span>
                {turn.aids.starters.map((t) => (
                  <button
                    key={t}
                    onClick={() => insertAid(t)}
                    className="px-1.5 py-0.5 text-chip rounded-md border border-blue-100 bg-blue-50 text-primary hover:bg-blue-100"
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-chip text-muted-foreground mr-0.5">자주 쓰는 말</span>
                {turn.aids.words.map((t) => (
                  <button
                    key={t}
                    onClick={() => insertAid(t)}
                    className="px-1.5 py-0.5 text-chip rounded-md border border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100"
                  >
                    {t}
                  </button>
                ))}
              </div>
              {turn.aids.units && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-chip text-muted-foreground mr-0.5">숫자</span>
                  {turn.aids.units.map((u) => (
                    <button
                      key={u}
                      onClick={() => insertAid(`${BLANK}${u}`, true)}
                      className="px-1.5 py-0.5 text-chip rounded-md border border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100 tabular-nums"
                    >
                      __{u}
                    </button>
                  ))}
                </div>
              )}
              {turn.aids.tip && <p className="text-chip text-muted-foreground">{turn.aids.tip}</p>}
            </div>
          )}

          {turn?.kind === "text" && (
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void submit(draft);
                  }
                }}
                placeholder={turn.placeholder}
                className="min-h-[64px] text-sm resize-none"
              />
              <Button
                className="h-9 px-4 bg-action hover:bg-action-hover text-white shrink-0"
                disabled={!draft.trim()}
                onClick={() => void submit(draft)}
              >
                보내기
              </Button>
            </div>
          )}

          {/* 준비됐다는 신호 — 채워졌을 때만 뜬다. 부족할 때는 아무 말도 하지 않는다(⑦ 재촉 금지) */}
          {turn?.kind === "text" && draftSignal && (
            <p className="text-chip text-primary mt-1.5 flex items-center gap-1">
              <Check className="w-3 h-3" />
              {draftSignal}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2.5">
            {/* ⑦ 언제든 건너뛰기 */}
            {turn && (
              <button
                onClick={() => {
                  if (turn.isLast) void finish(answers);
                  else void ask(answers.length + 2, answers);
                  setAnswers((a) => [...a, ""]);
                }}
                className="text-chip text-muted-foreground hover:text-foreground"
              >
                {mode === "gap" && turn.turnNo === 1 ? "해당 없어요" : "이 질문은 건너뛰기"}
              </button>
            )}
            {/* ③ 1턴만 답해도 결과가 남는다 */}
            {canSaveNow && (
              <button
                onClick={() => void finish(answers.filter(Boolean))}
                className="ml-auto text-chip text-primary hover:underline"
              >
                여기까지 저장하기
              </button>
            )}
          </div>
        </div>

        {/* 닫기 확인 — 나가는 길이 두 갈래다. 저장할 수도, 버릴 수도 있어야 한다.
            전에는 [계속할게요]와 [여기까지 저장] 둘뿐이라, 잘못 시작했거나 답이 마음에
            안 드는 사람에게 탈출구가 없었다. 원하지 않는 활동이 목록에 쌓이는 것도
            "정리해야 할 짐"이 된다(부록 C-17). */}
        {confirmClose && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="bg-card border border-border rounded-xl px-6 py-5 max-w-[400px] shadow-lg">
              <p className="text-title font-semibold text-foreground">정말 그만할까요?</p>
              <p className="text-body text-muted-foreground mt-1.5">
                지금까지 답한 {answers.filter(Boolean).length}개를 저장하면 나중에 이어서 쓸 수 있어요.
              </p>
              <div className="flex items-center gap-2 mt-4">
                {/* 파괴적 선택은 주 동선에서 떼어 왼쪽에 둔다 */}
                <button
                  onClick={() => {
                    setConfirmClose(false);
                    onClose();
                  }}
                  className="text-chip text-muted-foreground hover:text-destructive"
                >
                  저장 안 하고 닫기
                </button>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setConfirmClose(false)}>
                    계속할게요
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-action hover:bg-action-hover text-white"
                    onClick={() => {
                      setConfirmClose(false);
                      void finish(answers.filter(Boolean));
                    }}
                  >
                    여기까지 저장
                  </Button>
                </div>
              </div>
              <p className="text-mini text-muted-foreground mt-2.5">
                저장 안 하고 닫으면 답한 내용은 남지 않아요.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* 사용하지 않는 스타일 경고 방지용 (tailwind purge 힌트) */
