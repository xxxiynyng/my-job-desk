import { useEffect, useRef, useState } from "react";
import { Pin, Copy, ExternalLink, EyeOff, Eye, Pencil, Clipboard } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type Item, NARRATIVE_TYPES } from "./presets";

// ────────────────────────────────────────────────────────────────
// RepExperienceGrid — 복붙 뷰 (핀 고정 항목)
// ────────────────────────────────────────────────────────────────

export function RepExperienceGrid({
  items,
  onCopy,
  onOpenItem,
  onTogglePin,
  readMeta,
}: {
  items: Item[];
  onCopy: (t: string) => void;
  onOpenItem: (id: string) => void;
  onTogglePin: (id: string) => void;
  readMeta: (i: Item) => { org: string; period: string };
}) {
  if (items.length === 0) {
    return (
      <div className="bg-card border border-dashed border-border rounded-2xl px-6 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
          <Clipboard className="w-6 h-6 text-muted-foreground/50" />
        </div>
        <p className="text-sm text-foreground">복붙용으로 고정된 항목이 없어요.</p>
        <p className="text-xs text-muted-foreground mt-1.5">
          목록에서 항목에 마우스를 올리면 핀 아이콘이 나타나요.
          <br />
          클릭하면 이 화면에 복붙용 카드로 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
      {items.map((item) => (
        <RepExperienceCard
          key={item.id}
          item={item}
          onCopy={onCopy}
          onOpenItem={onOpenItem}
          onTogglePin={onTogglePin}
          readMeta={readMeta}
        />
      ))}
    </div>
  );
}

function RepExperienceCard({
  item,
  onCopy,
  onOpenItem,
  onTogglePin,
}: {
  item: Item;
  onCopy: (t: string) => void;
  onOpenItem: (id: string) => void;
  onTogglePin: (id: string) => void;
  readMeta: (i: Item) => { org: string; period: string };
}) {
  const isNarrative = NARRATIVE_TYPES.includes(item.type);

  // 값이 있는 필드 (keywords, importance 제외)
  const filledFields = item.fields
    .filter((f) => f.key !== "keywords" && f.key !== "importance" && !f.hidden && item.values[f.key]?.trim())
    .map((f) => ({ key: f.key, label: f.label, value: item.values[f.key] }));

  const docText = item.document?.trim() ?? "";

  return (
    <div className="group/card bg-card border border-border rounded-2xl px-5 py-4 flex flex-col gap-3.5 hover:border-border/80 hover:shadow-sm transition-all">
      {/* 헤더 — 제목 + 유형 뱃지, 관리 액션(핀·상세) hover */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2 flex-wrap">
          <p className="text-title font-semibold text-foreground leading-snug">{item.name}</p>
          <span className="text-mini text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded shrink-0">{item.type}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/card:opacity-100 focus-within:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onTogglePin(item.id)}
                className="w-6 h-6 rounded-md flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                aria-label="고정 해제"
              >
                <Pin className="w-3.5 h-3.5 fill-current" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">고정 해제</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onOpenItem(item.id)}
                className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="상세 보기"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">상세 보기</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* 자소서용 요약 — 복붙 히어로 블록 (narrative + document) */}
      {isNarrative && docText && (
        <div className="rounded-xl bg-muted/40 p-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-chip font-medium text-muted-foreground">자소서용 요약</span>
            <button
              onClick={() => onCopy(docText)}
              className="text-mini text-muted-foreground hover:text-primary inline-flex items-center gap-1 px-1.5 py-0.5 -mr-1 rounded hover:bg-background transition-all opacity-0 group-hover/card:opacity-100 focus:opacity-100"
            >
              <Copy className="w-3 h-3" /> 복사
            </button>
          </div>
          <button
            onClick={() => onCopy(docText)}
            title="클릭하면 복사돼요"
            className="text-body leading-relaxed text-foreground whitespace-pre-line text-left w-full"
          >
            {docText}
          </button>
        </div>
      )}

      {/* 세부 필드 — 값 하나하나 hover 복사 (제목·전체복사 제거) */}
      {filledFields.length > 0 && (
        <div className="space-y-1.5">
          {filledFields.map((f) => (
            <div key={f.key} className="flex items-start gap-3 group/row">
              <span className="text-chip text-muted-foreground w-[92px] shrink-0 pt-0.5">{f.label}</span>
              <button
                onClick={() => onCopy(f.value)}
                className="group/val inline-flex items-start gap-1 text-body text-foreground text-left flex-1 min-w-0 rounded px-1 -mx-1 hover:bg-muted transition-colors"
              >
                <span className="break-words min-w-0">{f.value}</span>
                <Copy className="w-3 h-3 mt-0.5 opacity-0 group-hover/val:opacity-100 shrink-0 transition-opacity text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// InfoRow
// ────────────────────────────────────────────────────────────────

export function InfoRow({
  label,
  value,
  onCopy,
  onSave,
  hidden,
  onToggleHidden,
  onReveal,
}: {
  label: string;
  value: string;
  onCopy: (t: string) => void;
  onSave: (v: string) => void;
  hidden?: boolean;
  onToggleHidden?: () => void;
  onReveal?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const save = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  return (
    <div className="flex items-center gap-3 min-w-0 group">
      <span className="text-chip text-muted-foreground w-[96px] shrink-0">{label}</span>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
          }}
          className="w-full text-sm text-foreground bg-transparent border-b border-primary/60 outline-none py-0.5"
        />
      ) : (
        <div className="flex items-center gap-1 min-w-0">
          {hidden ? (
            <button
              aria-label="값 보기"
              onClick={onReveal}
              className="inline-flex items-center text-muted-foreground/60 hover:text-foreground -mx-1 px-1 py-0.5 rounded transition-colors"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => value && onCopy(value)}
              className="group/copy inline-flex items-center gap-1 text-sm text-foreground hover:text-primary hover:bg-primary/5 -mx-1 px-1 rounded transition-colors max-w-full cursor-pointer min-w-0"
            >
              <span className="truncate">{value || <span className="text-muted-foreground">—</span>}</span>
              {value && <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 shrink-0" />}
            </button>
          )}
          <button
            aria-label="편집"
            onClick={() => setEditing(true)}
            className="p-0.5 rounded text-muted-foreground/70 hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pencil className="w-3 h-3" />
          </button>
          {onToggleHidden && (
            <button
              aria-label={hidden ? "값 보기" : "값 가리기"}
              onClick={onToggleHidden}
              className="p-0.5 rounded text-muted-foreground/70 hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
