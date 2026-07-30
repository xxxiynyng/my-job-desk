// ────────────────────────────────────────────────────────────────
// 탭2 v2 — 역량 스트립 · 역량 뷰 (기획서 1.11 · 1.14)
//
// 지켜야 하는 것:
//  · 점수·퍼센트·등급 금지 (타협 불가 ③)
//  · 진행 바 금지 — 막대는 "비율"이 아니라 "소재 개수" (디자인 §0-10 · 원칙 9b)
//  · 요구 곡선의 출처를 화면에 반드시 표기
//  · 갭 행에만 다음 행동 버튼 (원칙 ⑥)
// ────────────────────────────────────────────────────────────────

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  buildCoverage,
  BASELINE_DEMAND,
  DEMAND_SEED,
  NCS_LABEL,
  type Competency,
  type CoverageRow,
  type Story,
} from "./model";

/* ── 목록 상단 요약 스트립 ───────────────────────────────────── */

export function CompetencyStrip({
  stories,
  hasPostings,
  onOpen,
  onFindPostings,
}: {
  stories: Story[];
  hasPostings: boolean;
  onOpen: () => void;
  onFindPostings: () => void;
}) {
  const confirmed = stories.filter((s) => s.status === "user_confirmed");
  if (confirmed.length === 0) return null; // 빈 그래프 유도 금지

  const rows = buildCoverage(confirmed, hasPostings ? DEMAND_SEED.byCompetency : {}, DEMAND_SEED.postingCount);
  const covered = rows.filter((r) => r.storyCount > 0).length;
  const gaps = rows.filter((r) => r.isGap).length;

  return (
    <button
      onClick={hasPostings ? onOpen : onFindPostings}
      className="w-full text-left border border-border bg-card rounded-xl px-5 py-3.5 hover:bg-gray-50 transition-colors flex items-center gap-2"
    >
      <span className="text-body text-foreground">
        10개 역량 중 <span className="font-semibold">{covered}개</span>에 쓸 소재가 있어요
      </span>
      {hasPostings ? (
        gaps > 0 && (
          <>
            <span className="text-border">·</span>
            <span className="text-body text-foreground">
              담은 공고가 묻는 갭 <span className="font-semibold text-orange-600">{gaps}개</span>
            </span>
          </>
        )
      ) : (
        <>
          <span className="text-border">·</span>
          <span className="text-body text-muted-foreground">
            공고를 담으면 그 기관이 실제로 묻는 역량이 보여요
          </span>
        </>
      )}
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0" />
    </button>
  );
}

/* ── 역량 뷰 ─────────────────────────────────────────────────── */

const MAX_UNITS = 6;

function CountBar({ n }: { n: number }) {
  if (n === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: Math.min(n, MAX_UNITS) }).map((_, i) => (
        <span key={i} className="w-2.5 h-3 rounded-sm bg-primary" />
      ))}
      {n > MAX_UNITS && <span className="text-chip text-muted-foreground ml-1">+{n - MAX_UNITS}</span>}
    </span>
  );
}

export function CompetencyView({
  stories,
  hasPostings,
  onBack,
  onMakeStory,
  onFindPostings,
  onOpenCompetency,
}: {
  stories: Story[];
  hasPostings: boolean;
  onBack: () => void;
  onMakeStory: (c: Competency) => void;
  onFindPostings: () => void;
  onOpenCompetency?: (c: Competency) => void;
}) {
  const [showRest, setShowRest] = useState(false);
  const confirmed = stories.filter((s) => s.status === "user_confirmed");
  const demand = hasPostings ? DEMAND_SEED.byCompetency : BASELINE_DEMAND;
  const rows = buildCoverage(confirmed, demand, DEMAND_SEED.postingCount);

  const asked = rows.filter((r) => r.demandCount > 0);
  const notAsked = rows.filter((r) => r.demandCount === 0);

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-body text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-3.5 h-3.5" /> 목록으로
      </button>

      <div>
        <h2 className="text-h2 font-bold text-foreground tracking-[-0.03em]">내 역량</h2>
        {/* 출처 표기 — 근거 없는 그림을 그리지 않는다 */}
        <p className="text-chip text-muted-foreground mt-1">
          {hasPostings
            ? `담은 공고 ${DEMAND_SEED.postingCount}곳의 자소서 문항 ${DEMAND_SEED.questionCount}개 기준`
            : "아직 담은 공고가 없어서, 부울경 공공기관 전체 평균으로 보여드려요"}
        </p>
      </div>

      {!hasPostings && (
        <div className="border border-border bg-card rounded-xl px-5 py-3.5 flex items-center gap-3">
          <span className="text-body text-muted-foreground">
            공고를 담으면 그 기관이 실제로 묻는 역량으로 바뀌어요.
          </span>
          <Button size="sm" variant="outline" className="h-7 text-xs ml-auto" onClick={onFindPostings}>
            공고 찾아보기
          </Button>
        </div>
      )}

      <div className="border border-border bg-card rounded-xl overflow-hidden">
        <div className="grid grid-cols-[10.5rem_12.5rem_11.875rem_1fr] items-center px-5 py-2.5 bg-slate-50 border-b border-border text-xs font-medium text-gray-600">
          <span>역량</span>
          <span>내 소재</span>
          <span>{hasPostings ? "담은 공고가 묻는 곳" : "평균적으로 묻는 정도"}</span>
          <span />
        </div>

        {asked.map((r) => (
          <Row key={r.competency} r={r} hasPostings={hasPostings} onMakeStory={onMakeStory} onOpen={onOpenCompetency} />
        ))}

        {notAsked.length > 0 && (
          <div className="border-t border-border">
            <button
              onClick={() => setShowRest((v) => !v)}
              className="w-full flex items-center gap-2 px-5 py-2.5 text-left text-body text-muted-foreground hover:bg-gray-50"
            >
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", !showRest && "-rotate-90")} />
              {hasPostings ? "담은 공고가 묻지 않는 역량" : "평균에서 잘 안 묻는 역량"} {notAsked.length}개
            </button>
            {showRest &&
              notAsked.map((r) => (
                <Row key={r.competency} r={r} hasPostings={hasPostings} onOpen={onOpenCompetency} muted />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  r,
  hasPostings,
  onMakeStory,
  onOpen,
  muted,
}: {
  r: CoverageRow;
  hasPostings: boolean;
  onMakeStory?: (c: Competency) => void;
  onOpen?: (c: Competency) => void;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[10.5rem_12.5rem_11.875rem_1fr] items-center px-5 h-11 border-b border-border/50 last:border-b-0",
        onOpen && "hover:bg-gray-50 cursor-pointer",
      )}
      onClick={() => onOpen?.(r.competency)}
    >
      <span className={cn("text-body", muted ? "text-muted-foreground" : "text-foreground")}>
        {NCS_LABEL[r.competency]}
      </span>
      <span className="flex items-center gap-2">
        <CountBar n={r.storyCount} />
        {r.storyCount > 0 && <span className="text-chip text-muted-foreground">{r.storyCount}개</span>}
      </span>
      <span className="text-body text-muted-foreground">
        {r.demandCount > 0 ? (
          hasPostings ? (
            <>
              {r.demandTotal}곳 중 <span className="font-medium text-foreground">{r.demandCount}곳</span>
            </>
          ) : (
            <span className="text-muted-foreground">자주 묻는 편</span>
          )
        ) : (
          "—"
        )}
      </span>
      <span className="text-right justify-self-end">
        {/* 갭 행에만 다음 행동 */}
        {r.isGap && onMakeStory && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-chip px-2"
            onClick={(e) => {
              e.stopPropagation();
              onMakeStory(r.competency);
            }}
          >
            소재 만들기
          </Button>
        )}
      </span>
    </div>
  );
}
