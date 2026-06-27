import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Pin,
  Copy,
  Check,
  ChevronDown,
  Wand2,
  Layers,
  FileText,
  X,
  RotateCcw,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  type Item,
  type FieldDef,
  type Status,
  PRESETS,
  NARRATIVE_TYPES,
  ALL_TYPES,
} from "./presets";
import { type SentenceCard, FieldRow, FieldAdder, KeywordEditor, tagSentence, AnnotatedView, SentenceCardView } from './fieldWidgets';

// ────────────────────────────────────────────────────────────────
// DetailEditor
// ────────────────────────────────────────────────────────────────


export function DetailEditor({
  item,
  allItems,
  onClose,
  onChange,
  onTogglePin,
  onDelete,
  mergeOpen,
  setMergeOpen,
}: {
  item: Item;
  allItems: Item[];
  onClose: () => void;
  onChange: (patch: Partial<Item>) => void;
  onTogglePin: () => void;
  onDelete: () => void;
  mergeOpen: boolean;
  setMergeOpen: (b: boolean) => void;
}) {
  const [saveState, setSaveState] = useState<"저장됨" | "작성중">("저장됨");
  const [copyOpen, setCopyOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [cards, setCards] = useState<SentenceCard[]>([]);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const update = (patch: Partial<Item>) => {
    setSaveState("작성중");
    onChange(patch);
    setTimeout(() => setSaveState("저장됨"), 500);
  };
  const preset = PRESETS[item.type];
  const isNarrative = NARRATIVE_TYPES.includes(item.type);
  const setFieldValue = (key: string, v: string) => update({ values: { ...item.values, [key]: v } });
  const visibleFields = item.fields.filter((f) => !f.hidden);
  const updateField = (key: string, patch: Partial<FieldDef>) =>
    update({ fields: item.fields.map((f) => (f.key === key ? { ...f, ...patch } : f)) });
  const moveField = (key: string, dir: -1 | 1) => {
    const idx = item.fields.findIndex((f) => f.key === key);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= item.fields.length) return;
    const arr = [...item.fields];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    update({ fields: arr });
  };
  const addField = (f: FieldDef) => {
    if (item.fields.some((x) => x.key === f.key)) {
      updateField(f.key, { hidden: false });
      return;
    }
    update({ fields: [...item.fields, { ...f, hidden: false }] });
  };
  const removeField = (key: string) => update({ fields: item.fields.filter((f) => f.key !== key) });

  const generateQuestion = () => {
    const qs = preset.aiQuestions.length ? preset.aiQuestions : ["이 경험을 한 문장으로 정리하면요?"];
    return qs[Math.floor(Math.random() * qs.length)];
  };
  const [currentQ, setCurrentQ] = useState<string>("");
  const [draftAnswer, setDraftAnswer] = useState("");
  useEffect(() => {
    if (aiOpen && !currentQ) setCurrentQ(generateQuestion());
  }, [aiOpen]);

  const polish = (q: string, a: string) => {
    const trimmed = a.trim().replace(/\s+/g, " ");
    if (!trimmed) return "";
    if (/[.?!。]$/.test(trimmed)) return trimmed;
    return trimmed + ".";
  };
  const onSubmitAnswer = () => {
    if (!draftAnswer.trim()) return;
    const sentence = polish(currentQ, draftAnswer);
    setCards((p) => [{ id: String(Date.now()), question: currentQ, answer: draftAnswer, sentence }, ...p]);
    setDraftAnswer("");
    setCurrentQ(generateQuestion());
  };
  const applySentence = (s: string) => {
    const next = (item.document ? item.document.trim() + "\n" : "") + s;
    update({ document: next });
    toast.success("문장을 본문 끝에 추가했어요.");
  };
  const onDropSentence = (e: React.DragEvent<HTMLTextAreaElement>) => {
    const text = e.dataTransfer.getData("text/plain");
    if (!text) return;
    e.preventDefault();
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart ?? item.document?.length ?? 0;
    const end = el.selectionEnd ?? start;
    const cur = item.document ?? "";
    const next = cur.slice(0, start) + text + cur.slice(end);
    update({ document: next });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[1140px] w-[95vw] h-[96vh] max-h-[96vh] p-0 gap-0 overflow-hidden [&>button]:hidden flex flex-col">
        <div className="px-6 py-3.5 border-b border-border flex items-center justify-between gap-4 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5">
              <span>경험정리</span>
              <span>›</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-1 text-foreground hover:bg-muted px-1.5 py-0.5 rounded transition-colors">
                    {item.type}
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[180px] max-h-[60vh] overflow-y-auto">
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
                    유형 선택
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ALL_TYPES.map((t) => (
                    <DropdownMenuItem
                      key={t}
                      className="text-xs flex items-center justify-between"
                      onClick={() => {
                        if (t === item.type) return;
                        update({ type: t, fields: PRESETS[t].fields.map((f) => ({ ...f })) });
                        toast.success(`유형이 ${t}(으)로 변경되었어요.`);
                      }}
                    >
                      <span>{t}</span>
                      {t === item.type && <Check className="w-3.5 h-3.5 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <input
              value={item.name}
              onChange={(e) => update({ name: e.target.value })}
              className="text-[16px] font-semibold text-foreground bg-transparent w-full focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-muted-foreground">{saveState}</span>
            <div className="inline-flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-md border border-border">
              {(["작성중", "완료"] as Status[]).map((s) => (
                <button
                  key={s}
                  onClick={() => update({ status: s })}
                  className={cn(
                    "px-2 py-0.5 rounded text-[11px] transition-colors",
                    item.status === s
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onTogglePin}
                  className="p-1.5 rounded hover:bg-muted text-muted-foreground"
                  aria-label={item.pinned ? "고정 해제" : "고정"}
                >
                  <Pin className={cn("w-3.5 h-3.5", item.pinned && "fill-current text-foreground")} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">{item.pinned ? "고정 해제" : "고정"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setAiOpen((p) => !p)}
                  className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded-md border border-border hover:bg-muted",
                    aiOpen ? "bg-accent text-accent-foreground border-accent" : "text-muted-foreground",
                  )}
                  aria-label="AI로 더 구체화하기"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">AI로 더 구체화하기</TooltipContent>
            </Tooltip>
            <button
              onClick={() => setCopyOpen(true)}
              className="text-[11px] px-2 py-1 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              복붙용 문장 만들기
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-[11px] p-1.5 rounded hover:bg-muted text-muted-foreground">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-xs" onClick={() => setMergeOpen(true)}>
                  <Layers className="w-3 h-3 mr-1.5" /> 비슷한 항목과 합치기
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => setShowAnnotations((p) => !p)}>
                  <FileText className="w-3 h-3 mr-1.5" /> 문장 태그 {showAnnotations ? "숨기기" : "보기"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-destructive" onClick={onDelete}>
                  <Trash2 className="w-3 h-3 mr-1.5" /> 삭제하기
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DialogTitle className="sr-only">{item.name}</DialogTitle>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          className={cn(
            "grid flex-1 min-h-0 overflow-hidden transition-[grid-template-columns]",
            aiOpen ? "grid-cols-[1fr_320px]" : "grid-cols-[1fr_0px]",
          )}
        >
          <div className="overflow-y-auto bg-background">
            <div className="max-w-[820px] mx-auto px-10 py-8 space-y-8">
              <section>
                <div className="grid grid-cols-[120px_1fr] gap-x-4">
                  {visibleFields.map((f, idx) => (
                    <FieldRow
                      key={f.key}
                      field={f}
                      value={item.values[f.key] ?? ""}
                      keywords={item.keywords}
                      onChangeValue={(v) => setFieldValue(f.key, v)}
                      onChangeKeywords={(ks) => update({ keywords: ks })}
                      onRename={(label) => updateField(f.key, { label })}
                      onHide={() => updateField(f.key, { hidden: true })}
                      onDelete={() => removeField(f.key)}
                      onMoveUp={idx > 0 ? () => moveField(f.key, -1) : undefined}
                      onMoveDown={idx < visibleFields.length - 1 ? () => moveField(f.key, 1) : undefined}
                    />
                  ))}
                </div>
                <div className="mt-2 -ml-1">
                  <FieldAdder item={item} addField={addField} unhideField={(k) => updateField(k, { hidden: false })} />
                </div>
              </section>
              <div className="h-px bg-border/60" />
              <section>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10.5px] text-muted-foreground">
                    {item.document ? `${item.document.length}자` : "비어 있음"}
                  </span>
                  <label className="inline-flex items-center gap-1.5 text-[10.5px] text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showAnnotations}
                      onChange={(e) => setShowAnnotations(e.target.checked)}
                      className="h-3 w-3"
                    />
                    문장 태그 보기
                  </label>
                </div>
                {showAnnotations && item.document ? (
                  <AnnotatedView text={item.document} />
                ) : (
                  <Textarea
                    ref={editorRef}
                    value={item.document ?? ""}
                    onChange={(e) => update({ document: e.target.value })}
                    onDrop={onDropSentence}
                    onDragOver={(e) => e.preventDefault()}
                    placeholder={
                      isNarrative
                        ? "자유롭게 써내려가 보세요. 자소서 초안을 그대로 옮겨 적어도 좋아요."
                        : "이 항목과 관련된 메모나 학습 과정을 자유롭게 적어 보세요."
                    }
                    className="min-h-[440px] text-[14.5px] leading-7 bg-transparent border-0 px-0 focus-visible:ring-0 resize-none whitespace-pre-wrap shadow-none placeholder:text-muted-foreground/50"
                  />
                )}
                {preset.writingGuide.length > 0 && !item.document && (
                  <p className="mt-3 text-[10.5px] text-muted-foreground/70 leading-relaxed">
                    추천 흐름 — {preset.writingGuide.join(" · ")}
                  </p>
                )}
              </section>
              {item.linkedExperiences !== undefined && (
                <>
                  <div className="h-px bg-border/60" />
                  <section>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      연결된 경험
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(item.linkedExperiences ?? []).map((id) => {
                        const exp = allItems.find((e) => e.id === id);
                        if (!exp) return null;
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent text-[11px] text-accent-foreground"
                          >
                            {exp.name}
                            <button
                              onClick={() =>
                                update({ linkedExperiences: item.linkedExperiences?.filter((x) => x !== id) })
                              }
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        );
                      })}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-[11px] px-2 py-0.5 rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted">
                            + 경험 연결
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                          {allItems
                            .filter((e) => e.id !== item.id && !item.linkedExperiences?.includes(e.id))
                            .map((e) => (
                              <DropdownMenuItem
                                key={e.id}
                                className="text-xs"
                                onClick={() => update({ linkedExperiences: [...(item.linkedExperiences ?? []), e.id] })}
                              >
                                {e.name}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>

          {aiOpen && (
            <aside className="border-l border-border bg-card overflow-y-auto">
              <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-semibold text-foreground inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    AI 질문
                  </p>
                  <p className="text-[10.5px] text-muted-foreground mt-0.5">이 경험을 더 구체적으로 만들어 봐요.</p>
                </div>
                <button onClick={() => setAiOpen(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="px-4 py-3 space-y-3">
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5">
                  <p className="text-[10px] text-muted-foreground mb-1">AI의 질문</p>
                  <p className="text-[13px] text-foreground leading-snug">{currentQ}</p>
                  <button
                    onClick={() => setCurrentQ(generateQuestion())}
                    className="mt-1.5 text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> 다른 질문 받기
                  </button>
                </div>
                <Textarea
                  value={draftAnswer}
                  onChange={(e) => setDraftAnswer(e.target.value)}
                  placeholder="짧게 답변해 주세요. AI가 자소서 톤의 문장으로 다듬어 드려요."
                  className="min-h-[80px] text-[12.5px]"
                />
                <Button
                  size="sm"
                  className="h-8 text-xs w-full"
                  onClick={onSubmitAnswer}
                  disabled={!draftAnswer.trim()}
                >
                  <Wand2 className="w-3.5 h-3.5" /> 문장으로 다듬기
                </Button>
                {cards.length > 0 && (
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">생성된 문장</p>
                    {cards.map((c) => (
                      <SentenceCardView
                        key={c.id}
                        card={c}
                        onApply={() => applySentence(c.sentence)}
                        onRewrite={() =>
                          setCards((p) =>
                            p.map((x) =>
                              x.id === c.id ? { ...x, sentence: polish(c.question, c.answer) + " (다시 다듬음)" } : x,
                            ),
                          )
                        }
                        onDelete={() => setCards((p) => p.filter((x) => x.id !== c.id))}
                      />
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>

        <CopyGenerator open={copyOpen} onOpenChange={setCopyOpen} item={item} />

        <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
          <DialogContent className="max-w-[860px] p-0 overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-border">
              <DialogTitle className="text-base">비슷한 항목과 합치기</DialogTitle>
              <DialogDescription className="text-sm">최종 항목에 반영할 내용을 선택하세요.</DialogDescription>
            </DialogHeader>
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 mb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                <div>기존 항목</div>
                <div>새로 추출된 항목</div>
              </div>
              {["항목명", "유형", "기간", "역할", "기관", "주요 키워드", "상세 내용"].map((f) => (
                <div key={f} className="border-t border-border py-3">
                  <div className="text-[11px] text-muted-foreground mb-2">{f}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-start gap-2 border border-border rounded-md px-3 py-2.5 text-[12px] hover:bg-muted/30 cursor-pointer">
                      <input type="radio" name={f} defaultChecked className="mt-1" />
                      <span>기존 내용 예시</span>
                    </label>
                    <label className="flex items-start gap-2 border border-border rounded-md px-3 py-2.5 text-[12px] hover:bg-muted/30 cursor-pointer">
                      <input type="radio" name={f} className="mt-1" />
                      <span>새 추출 내용 예시</span>
                    </label>
                  </div>
                  <label className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                    <Checkbox className="h-3 w-3" /> 둘 다 유지
                  </label>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-border flex justify-end gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setMergeOpen(false)}>
                나중에
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setMergeOpen(false);
                  toast.success("합치기가 완료되었어요.");
                }}
              >
                합치기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────────────
// CopyGenerator
// ────────────────────────────────────────────────────────────────

function CopyGenerator({
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
            <p className="text-[11px] text-muted-foreground mb-1">목적</p>
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
            <p className="text-[11px] text-muted-foreground mb-1">글자수</p>
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
          className="min-h-[180px] text-[13px] mt-1"
          placeholder="생성된 문장이 여기에 표시돼요"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            현재 {text.length}자 / 목표 {length}자
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={generate}>
              다시 만들기
            </Button>
            <Button
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => {
                navigator.clipboard.writeText(text);
                toast.success("복사했어요.");
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
