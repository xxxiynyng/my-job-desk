import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Sparkles,
  Pin,
  Copy,
  Check,
  ChevronDown,
  MoreHorizontal,
  EyeOff,
  Wand2,
  Trash2,
  Layers,
  FileText,
  X,
  RotateCcw,
  Pencil,
  Upload,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
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
  KEYWORD_OPTIONS,
  EXTRA_COMMON,
} from "./presets";

// ────────────────────────────────────────────────────────────────
// DetailEditor
// ────────────────────────────────────────────────────────────────

type SentenceCard = { id: string; question: string; answer: string; sentence: string };

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
// Field components
// ────────────────────────────────────────────────────────────────

function FieldRow({
  field,
  value,
  keywords,
  onChangeValue,
  onChangeKeywords,
  onRename,
  onHide,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  field: FieldDef;
  value: string;
  keywords: string[];
  onChangeValue: (v: string) => void;
  onChangeKeywords: (ks: string[]) => void;
  onRename: (label: string) => void;
  onHide: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [labelDraft, setLabelDraft] = useState(field.label);
  useEffect(() => {
    setLabelDraft(field.label);
  }, [field.label]);

  return (
    <>
      <div className="group/label py-1.5 flex items-center min-w-0">
        {renaming ? (
          <input
            autoFocus
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onBlur={() => {
              onRename(labelDraft || field.label);
              setRenaming(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="text-[12px] text-foreground bg-transparent border-b border-border focus:outline-none focus:border-primary w-full"
          />
        ) : (
          <span className="text-[12px] text-muted-foreground truncate" onDoubleClick={() => setRenaming(true)}>
            {field.label}
          </span>
        )}
      </div>
      <div className="group/value py-1.5 flex items-center gap-1 min-w-0">
        <div className="flex-1 min-w-0">
          {field.type === "tags" ? (
            <KeywordEditor keywords={keywords} onChange={onChangeKeywords} />
          ) : field.type === "textarea" ? (
            <Textarea
              value={value}
              onChange={(e) => onChangeValue(e.target.value)}
              placeholder={field.placeholder ?? "내용을 입력하세요"}
              className="min-h-[32px] text-[13.5px] bg-transparent border-0 px-0 py-0 focus-visible:ring-0 resize-none shadow-none placeholder:text-muted-foreground/50"
            />
          ) : field.type === "file" ? (
            <button className="text-[13px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <Upload className="w-3 h-3" /> {value || "파일 첨부"}
            </button>
          ) : (
            <input
              value={value}
              onChange={(e) => onChangeValue(e.target.value)}
              placeholder={field.placeholder ?? "—"}
              className="bg-transparent w-full text-[13.5px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            />
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="opacity-0 group-hover/value:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground shrink-0">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-xs" onClick={() => setRenaming(true)}>
              <Pencil className="w-3 h-3 mr-1.5" /> 이름 바꾸기
            </DropdownMenuItem>
            {onMoveUp && (
              <DropdownMenuItem className="text-xs" onClick={onMoveUp}>
                위로 이동
              </DropdownMenuItem>
            )}
            {onMoveDown && (
              <DropdownMenuItem className="text-xs" onClick={onMoveDown}>
                아래로 이동
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs" onClick={onHide}>
              <EyeOff className="w-3 h-3 mr-1.5" /> 숨기기
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs text-destructive" onClick={onDelete}>
              <Trash2 className="w-3 h-3 mr-1.5" /> 삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

function FieldAdder({
  item,
  addField,
  unhideField,
}: {
  item: Item;
  addField: (f: FieldDef) => void;
  unhideField: (k: string) => void;
}) {
  const ownKeys = new Set(item.fields.map((f) => f.key));
  const [customOpen, setCustomOpen] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [customValue, setCustomValue] = useState("");

  const submitCustom = () => {
    const label = customLabel.trim();
    if (!label) return;
    const key = `custom_${Date.now()}`;
    addField({ key, label, type: "text", custom: true });
    setCustomLabel("");
    setCustomValue("");
    setCustomOpen(false);
  };

  const ownExtras = PRESETS[item.type].fields.filter((f) => !item.fields.find((x) => x.key === f.key));
  const commonExtras = EXTRA_COMMON.filter((f) => !item.fields.find((x) => x.key === f.key));

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="필드 추가"
                className="inline-flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[11px]">
            필드 추가
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start" className="min-w-[220px] max-h-[60vh] overflow-y-auto">
          {ownExtras.length > 0 && (
            <>
              {ownExtras.map((f) => (
                <DropdownMenuItem key={f.key} className="text-xs" onClick={() => addField(f)}>
                  {f.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}
          {commonExtras.length > 0 && (
            <>
              {commonExtras.map((f) => (
                <DropdownMenuItem key={f.key} className="text-xs" onClick={() => addField(f)}>
                  {f.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-xs">다른 유형의 필드</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="max-h-[60vh] overflow-y-auto">
                {ALL_TYPES.filter((t) => t !== item.type).map((t) => (
                  <DropdownMenuSub key={t}>
                    <DropdownMenuSubTrigger className="text-xs">{t}</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {PRESETS[t].fields.map((f) => (
                          <DropdownMenuItem
                            key={f.key}
                            className="text-xs"
                            onClick={() => addField({ ...f, key: ownKeys.has(f.key) ? `${f.key}_${t}` : f.key })}
                          >
                            {f.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-xs"
            onSelect={(e) => {
              e.preventDefault();
              setCustomOpen(true);
            }}
          >
            <Plus className="w-3 h-3 mr-1.5" /> 사용자 지정 필드
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-base">사용자 지정 필드</DialogTitle>
            <DialogDescription className="text-xs">원하는 항목명과 값을 자유롭게 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div>
              <p className="text-[11px] text-muted-foreground mb-1">항목명</p>
              <Input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="예: 멘토"
                className="h-8 text-sm"
                autoFocus
              />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-1">값 (선택)</p>
              <Input
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="값을 입력하세요"
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitCustom();
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setCustomOpen(false)}>
              취소
            </Button>
            <Button size="sm" className="h-8 text-xs" onClick={submitCustom} disabled={!customLabel.trim()}>
              추가
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function KeywordEditor({ keywords, onChange }: { keywords: string[]; onChange: (ks: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const commit = () => {
    const v = draft.trim();
    if (v && !keywords.includes(v)) onChange([...keywords, v]);
    setDraft("");
    setAdding(false);
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 py-0.5">
      {keywords.map((k) => (
        <span
          key={k}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[11px] text-foreground/80"
        >
          {k}
          <button
            onClick={() => onChange(keywords.filter((x) => x !== k))}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            else if (e.key === "Escape") {
              setDraft("");
              setAdding(false);
            }
          }}
          placeholder="키워드 입력 후 Enter"
          className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-card focus:outline-none focus:border-primary min-w-[120px]"
        />
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted">
              + 키워드
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-[40vh] overflow-y-auto">
            <DropdownMenuItem
              className="text-xs"
              onSelect={(e) => {
                e.preventDefault();
                setAdding(true);
              }}
            >
              <Plus className="w-3 h-3 mr-1.5" /> 직접 입력
            </DropdownMenuItem>
            {KEYWORD_OPTIONS.filter((k) => !keywords.includes(k)).length > 0 && <DropdownMenuSeparator />}
            {KEYWORD_OPTIONS.filter((k) => !keywords.includes(k)).map((k) => (
              <DropdownMenuItem key={k} className="text-xs" onClick={() => onChange([...keywords, k])}>
                {k}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// AnnotatedView & SentenceCardView
// ────────────────────────────────────────────────────────────────

const TAG_HINTS: { tag: string; match: RegExp }[] = [
  { tag: "나의 역할", match: /(나의 역할|역할은|담당했|맡았)/ },
  { tag: "문제", match: /(문제|이슈|어려움|갈등)/ },
  { tag: "실행", match: /(실행|진행|수행|구현|기획|인터뷰|반복)/ },
  { tag: "결과", match: /(결과|성과|완성|출시|성공)/ },
  { tag: "수치 성과", match: /(\d+(\.\d+)?\s*(%|점|명|건|회|배|위))/ },
  { tag: "배운 점", match: /(배웠|느꼈|깨달|성장)/ },
  { tag: "직무 관련성", match: /(직무|관련|이어|연결)/ },
  { tag: "협업", match: /(협업|함께|동료|팀원)/ },
];
function tagSentence(s: string): string | null {
  for (const h of TAG_HINTS) if (h.match.test(s)) return h.tag;
  return null;
}

function AnnotatedView({ text }: { text: string }) {
  const sentences = text.split(/(?<=[.!?。])\s+|\n+/).filter((s) => s.trim().length);
  return (
    <div className="space-y-3 text-[13.5px] leading-7 text-foreground">
      {sentences.map((s, i) => {
        const tag = tagSentence(s);
        return (
          <div key={i}>
            {tag && <p className="text-[10.5px] text-muted-foreground/80 mb-0.5">{tag}</p>}
            <p>{s.trim()}</p>
          </div>
        );
      })}
    </div>
  );
}

function SentenceCardView({
  card,
  onApply,
  onRewrite,
  onDelete,
}: {
  card: SentenceCard;
  onApply: () => void;
  onRewrite: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", card.sentence);
        e.dataTransfer.effectAllowed = "copy";
      }}
      className="border border-border rounded-md bg-muted/20 px-3 py-2.5 cursor-grab active:cursor-grabbing"
    >
      <p className="text-[10px] text-muted-foreground mb-1">{card.question}</p>
      <p className="text-[12.5px] text-foreground leading-snug">{card.sentence}</p>
      <div className="mt-2 flex items-center gap-1">
        <Button size="sm" className="h-6 text-[10.5px] px-2" onClick={onApply}>
          반영
        </Button>
        <span className="text-[10px] text-muted-foreground px-1">드래그해서 넣기</span>
        <Button size="sm" variant="ghost" className="h-6 text-[10.5px] px-2 ml-auto" onClick={onRewrite}>
          다시 쓰기
        </Button>
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive p-0.5" aria-label="삭제">
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
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
