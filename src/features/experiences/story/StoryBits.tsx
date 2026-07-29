// ────────────────────────────────────────────────────────────────
// 탭2 v2 — 공통 UI 부품 (기획서 1.6 공통 UI 규약)
// 신규 디자인 토큰 없음. 기존 토큰 조합만 사용한다.
//   · AI 역량 칩  = 축 칩 규격 (brand-subtle 배경 · brand 글자 · blue-100 테두리)
//   · 사용자 칩   = 태그 칩 규격 (gray-50 / gray-500 / gray-100)
//   · 근거 하이라이트 = brand-subtle 배경 <mark>
// ────────────────────────────────────────────────────────────────

import { useState } from "react";
import { Check, X, ChevronRight, MoreHorizontal, Scissors, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NCS_LABEL, type Story, type StoryCompetency, liveTags } from "./model";

/* ── 역량 칩 ─────────────────────────────────────────────────── */

export function CompetencyChip({
  tag,
  active,
  compact,
  onClick,
  onAccept,
  onReject,
}: {
  tag: StoryCompetency;
  active?: boolean;
  /** 목록 셀처럼 폭이 좁은 자리 — 하위능력은 숨긴다(상세에서 본다) */
  compact?: boolean;
  onClick?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  const isAi = tag.taggedBy === "ai";
  return (
    <span className="inline-flex items-center group/chip">
      <button
        type="button"
        onClick={onClick}
        aria-label={`${isAi ? "AI가 붙인 역량" : "직접 붙인 역량"} ${NCS_LABEL[tag.competency]}`}
        className={cn(
          "inline-flex items-center gap-1 px-1.5 py-0.5 text-chip font-medium rounded-md border transition-colors",
          isAi
            ? "bg-blue-50 text-primary border-blue-100 hover:bg-blue-100"
            : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100",
          active && "ring-1 ring-primary/40",
        )}
      >
        {tag.userVerdict === "accepted" && <Check className="w-2.5 h-2.5" />}
        {NCS_LABEL[tag.competency]}
        {!compact && tag.subCompetency && <span className="opacity-70">· {tag.subCompetency}</span>}
      </button>
      {(onAccept || onReject) && tag.userVerdict === "unset" && (
        <span className="ml-0.5 hidden group-hover/chip:inline-flex items-center gap-0.5">
          <button
            type="button"
            aria-label="맞아요"
            onClick={onAccept}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            type="button"
            aria-label="아니에요"
            onClick={onReject}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}
    </span>
  );
}

/* ── 근거 하이라이트 본문 ────────────────────────────────────── */

export function EvidenceBody({
  text,
  evidence,
  className,
}: {
  text: string;
  evidence?: string | null;
  className?: string;
}) {
  if (!evidence || !text.includes(evidence)) {
    return (
      <p className={cn("text-body text-muted-foreground whitespace-pre-wrap leading-relaxed", className)}>
        {text}
        {evidence && !text.includes(evidence) && (
          <span className="block mt-2 pl-2 border-l-2 border-blue-100 text-body text-primary">“{evidence}”</span>
        )}
      </p>
    );
  }
  const i = text.indexOf(evidence);
  return (
    <p className={cn("text-body text-muted-foreground whitespace-pre-wrap leading-relaxed", className)}>
      {text.slice(0, i)}
      <mark className="bg-blue-50 text-foreground rounded-sm px-0.5">{evidence}</mark>
      {text.slice(i + evidence.length)}
    </p>
  );
}

/* ── 소재 카드 ───────────────────────────────────────────────── */

const STAR_LABELS: { key: keyof NonNullable<Story["starHint"]>; label: string }[] = [
  { key: "situation", label: "어떤 상황이었나요" },
  { key: "task", label: "무엇을 맡았나요" },
  { key: "action", label: "어떻게 했나요" },
  { key: "result", label: "어떻게 됐나요" },
];

export function StoryCard({
  story,
  matchedQuestionCount = 0,
  onVerdict,
  onSplit,
  onDelete,
  compact,
}: {
  story: Story;
  matchedQuestionCount?: number;
  onVerdict?: (index: number, verdict: "accepted" | "rejected") => void;
  onSplit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}) {
  const [activeEvidence, setActiveEvidence] = useState<string | null>(null);
  const [mode, setMode] = useState<"prose" | "steps">("prose");
  const tags = liveTags(story);
  const hasSteps = !!story.starHint && Object.values(story.starHint).some(Boolean);

  return (
    <div className={cn("group border border-border bg-card rounded-xl", compact ? "px-4 py-3" : "px-5 py-4")}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground leading-snug">{story.headline || "제목 없음"}</p>
        </div>
        {(onSplit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="소재 메뉴"
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground shrink-0"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {onSplit && (
                <DropdownMenuItem onClick={onSplit} className="text-xs">
                  <Scissors className="w-3.5 h-3.5" /> 둘로 나누기
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-xs text-destructive">
                  <Trash2 className="w-3.5 h-3.5" /> 삭제
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {mode === "prose" ? (
        <EvidenceBody text={story.body} evidence={activeEvidence} className="mt-1.5" />
      ) : (
        <div className="mt-2 space-y-2">
          {STAR_LABELS.map(({ key, label }) => {
            const v = story.starHint?.[key];
            return (
              <div key={key}>
                <span className="inline-flex items-center px-1.5 py-0.5 text-chip font-medium rounded-md bg-blue-50 text-primary border border-blue-100">
                  {label}
                </span>
                {v ? (
                  <p className="text-body text-muted-foreground mt-1 leading-relaxed">{v}</p>
                ) : (
                  <p className="text-chip text-muted-foreground mt-1">
                    여기는 아직 안 적혀 있어요 · <button className="text-primary hover:underline">보충하기</button>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {tags.map((t) => {
            const idx = story.competencies.indexOf(t);
            return (
              <CompetencyChip
                key={`${t.competency}-${t.subCompetency ?? ""}`}
                tag={t}
                active={activeEvidence === t.evidenceText}
                onClick={() => setActiveEvidence((p) => (p === t.evidenceText ? null : t.evidenceText))}
                onAccept={onVerdict ? () => onVerdict(idx, "accepted") : undefined}
                onReject={onVerdict ? () => onVerdict(idx, "rejected") : undefined}
              />
            );
          })}
        </div>
      )}

      {tags.length === 0 && (
        <p className="text-chip text-muted-foreground mt-2.5">역량 태그가 없어요</p>
      )}

      {story.insufficient && (
        <p className="text-chip text-muted-foreground mt-2.5 pt-2.5 border-t border-border/60">
          조금 더 채우면 소재가 돼요 · <button className="text-primary hover:underline">보충하기</button>
        </p>
      )}

      {!compact && (
        <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-border/60">
          {hasSteps && (
            <div className="inline-flex rounded-md border border-border overflow-hidden">
              {(["prose", "steps"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "px-2 py-0.5 text-chip",
                    mode === m ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  {m === "prose" ? "줄글" : "단계별"}
                </button>
              ))}
            </div>
          )}
          <span className="ml-auto text-chip text-muted-foreground inline-flex items-center gap-0.5">
            {matchedQuestionCount > 0 ? (
              <button className="text-primary hover:underline inline-flex items-center">
                쓸 수 있는 문항 {matchedQuestionCount}개 <ChevronRight className="w-3 h-3" />
              </button>
            ) : (
              "아직 담은 공고에 맞는 문항이 없어요"
            )}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── 빈 소재 안내 ────────────────────────────────────────────── */

export function StoryEmpty({ onInterview, onManual }: { onInterview: () => void; onManual: () => void }) {
  return (
    <div className="border border-dashed border-border rounded-xl px-5 py-6 text-center">
      <p className="text-body text-muted-foreground">아직 소재가 없어요</p>
      <div className="flex items-center justify-center gap-2 mt-3">
        <Button size="sm" className="h-8 text-xs bg-action hover:bg-action-hover text-white" onClick={onInterview}>
          질문에 답하며 만들기
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onManual}>
          직접 추가
        </Button>
      </div>
    </div>
  );
}
