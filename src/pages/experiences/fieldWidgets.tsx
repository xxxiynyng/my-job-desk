import { useEffect, useState } from "react";
import { Upload, Pencil, EyeOff, Trash2, MoreHorizontal, Plus, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { type Item, type FieldDef, PRESETS, EXTRA_COMMON, ALL_TYPES, KEYWORD_OPTIONS } from "./presets";

export type SentenceCard = { id: string; question: string; answer: string; sentence: string };

// ────────────────────────────────────────────────────────────────
// Field components
// ────────────────────────────────────────────────────────────────

export function FieldRow({
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
            className="text-xs text-foreground bg-transparent border-b border-border focus:outline-none focus:border-primary w-full"
          />
        ) : (
          <span className="text-xs text-muted-foreground truncate" onDoubleClick={() => setRenaming(true)}>
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
              className="min-h-[32px] text-body bg-transparent border-0 px-0 py-0 focus-visible:ring-0 resize-none shadow-none placeholder:text-muted-foreground/50"
            />
          ) : field.type === "file" ? (
            <button className="text-body text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <Upload className="w-3 h-3" /> {value || "파일 첨부"}
            </button>
          ) : (
            <input
              value={value}
              onChange={(e) => onChangeValue(e.target.value)}
              placeholder={field.placeholder ?? "—"}
              className="bg-transparent w-full text-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            />
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="필드 메뉴" className="opacity-0 group-hover/value:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground shrink-0">
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

export function FieldAdder({
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
          <TooltipContent side="bottom" className="text-chip">
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
              <p className="text-chip text-muted-foreground mb-1">항목명</p>
              <Input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="예: 멘토"
                className="h-8 text-sm"
                autoFocus
              />
            </div>
            <div>
              <p className="text-chip text-muted-foreground mb-1">값 (선택)</p>
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

export function KeywordEditor({ keywords, onChange }: { keywords: string[]; onChange: (ks: string[]) => void }) {
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
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-chip text-foreground/80"
        >
          {k}
          <button
            aria-label={`키워드 ${k} 삭제`}
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
          className="text-chip px-2 py-0.5 rounded-full border border-border bg-card focus:outline-none focus:border-primary min-w-[120px]"
        />
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-chip px-2 py-0.5 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted">
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
export function tagSentence(s: string): string | null {
  for (const h of TAG_HINTS) if (h.match.test(s)) return h.tag;
  return null;
}

export function AnnotatedView({ text }: { text: string }) {
  const sentences = text.split(/(?<=[.!?。])\s+|\n+/).filter((s) => s.trim().length);
  return (
    <div className="space-y-3 text-body leading-7 text-foreground">
      {sentences.map((s, i) => {
        const tag = tagSentence(s);
        return (
          <div key={i}>
            {tag && <p className="text-mini text-muted-foreground/80 mb-0.5">{tag}</p>}
            <p>{s.trim()}</p>
          </div>
        );
      })}
    </div>
  );
}

export function SentenceCardView({
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
      <p className="text-mini text-muted-foreground mb-1">{card.question}</p>
      <p className="text-xs text-foreground leading-snug">{card.sentence}</p>
      <div className="mt-2 flex items-center gap-1">
        <Button size="sm" className="h-6 text-mini px-2" onClick={onApply}>
          반영
        </Button>
        <span className="text-mini text-muted-foreground px-1">드래그해서 넣기</span>
        <Button size="sm" variant="ghost" className="h-6 text-mini px-2 ml-auto" onClick={onRewrite}>
          다시 쓰기
        </Button>
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive p-0.5" aria-label="삭제">
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
