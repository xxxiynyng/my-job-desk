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
      <div className="bg-card border border-dashed border-border rounded-xl px-6 py-12 text-center">
        <Clipboard className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
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
  readMeta,
}: {
  item: Item;
  onCopy: (t: string) => void;
  onOpenItem: (id: string) => void;
  onTogglePin: (id: string) => void;
  readMeta: (i: Item) => { org: string; period: string };
}) {
  const { org, period } = readMeta(item);
  const isNarrative = NARRATIVE_TYPES.includes(item.type);

  // 값이 있는 필드 (keywords, importance 제외)
  const filledFields = item.fields
    .filter((f) => f.key !== "keywords" && f.key !== "importance" && !f.hidden && item.values[f.key]?.trim())
    .map((f) => ({ key: f.key, label: f.label, value: item.values[f.key] }));

  const docText = item.document?.trim() ?? "";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden group/card hover:border-border/80 transition-colors">
      {/* 헤더 */}
      <div className="px-3 pt-3 pb-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">{item.type}</span>
          <p className="text-[13px] font-semibold text-foreground mt-1.5 leading-snug">{item.name}</p>
          {(org || period) && (
            <p className="text-[11px] text-muted-foreground mt-1">{[org, period].filter(Boolean).join(" · ")}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
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

      <div className="border-t border-border/60 divide-y divide-border/60">
        {/* 자소서용 요약 — narrative 타입 + document 있을 때만 */}
        {isNarrative && docText && (
          <RepSection label="자소서용 요약" onCopyAll={() => onCopy(docText)}>
            <button
              onClick={() => onCopy(docText)}
              className="text-[12px] leading-loose text-foreground whitespace-pre-line text-left hover:text-primary transition-colors w-full"
            >
              {docText}
            </button>
          </RepSection>
        )}

        {/* 세부 필드 */}
        {filledFields.length > 0 && (
          <RepSection label="세부 필드">
            {filledFields.map((f) => (
              <div key={f.key} className="flex items-center gap-2 group/row">
                <span className="text-[11px] text-muted-foreground w-[80px] shrink-0">{f.label}</span>
                <button
                  onClick={() => onCopy(f.value)}
                  className="group/val inline-flex items-center gap-1 text-[12px] text-foreground hover:text-primary flex-1 min-w-0 text-left transition-colors"
                >
                  <span className="truncate">{f.value}</span>
                  <Copy className="w-3 h-3 opacity-0 group-hover/val:opacity-100 shrink-0 transition-opacity text-muted-foreground" />
                </button>
              </div>
            ))}
          </RepSection>
        )}
      </div>
    </div>
  );
}

function RepSection({
  label,
  onCopyAll,
  children,
}: {
  label: string;
  onCopyAll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="px-3 pt-3 pb-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
        {onCopyAll && (
          <button
            onClick={onCopyAll}
            className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 transition-colors"
          >
            <Copy className="w-3 h-3" /> 전체 복사
          </button>
        )}
      </div>
      <div className="space-y-1">{children}</div>
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
      <span className="text-[11px] text-muted-foreground w-[96px] shrink-0">{label}</span>
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
            onClick={() => setEditing(true)}
            className="p-0.5 rounded text-muted-foreground/70 hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pencil className="w-3 h-3" />
          </button>
          {onToggleHidden && (
            <button
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
