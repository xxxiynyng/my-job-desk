import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, FileText, Search, Upload, Briefcase, Check, CornerDownLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FallbackUploadModal } from "./FallbackUploadModal";
import {
  POSTINGS,
  searchPostings,
  calcPostingDday,
  type Posting,
} from "@/data/postings.seed";
import { formatApplyEnd, isRegistered } from "@/data/jobStore";

// ── 드롭다운 항목 평탄화 (키보드 탐색용) ─────────────────────────
type Option =
  | { kind: "org"; org: string; count: number }
  | { kind: "posting"; posting: Posting }
  | { kind: "position"; posting: Posting; positionId: string; jobTitle: string; employmentType: string }
  | { kind: "fallback" };

/**
 * 탭1 진입점 — 공고 검색(자동완성) → 직무 선택 → 담기.
 * 빈 포커스 = 진행중 공고 추천 / ↑↓·Enter 키보드 탐색 / 담은 공고 클릭 = 상세로 이동.
 */
export function QuickJobRegistration() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const blurTimer = useRef<number | null>(null);

  const hasQuery = q.trim().length > 0;

  // 옵션 구성 — 검색어 없으면 "진행중 공고 추천"(마감 임박순), 있으면 검색 결과
  const options: Option[] = useMemo(() => {
    if (!hasQuery) {
      const open = POSTINGS.filter((p) => calcPostingDday(p.applyEnd) >= 0)
        .sort((a, b) => calcPostingDday(a.applyEnd) - calcPostingDday(b.applyEnd))
        .slice(0, 5);
      return [...open.map<Option>((p) => ({ kind: "posting", posting: p })), { kind: "fallback" }];
    }
    const r = searchPostings(q);
    const opts: Option[] = [];
    // 기관: 공고 제목과 중복되는 노이즈를 줄이기 위해 "이름이 검색어로 시작하거나 단어 매칭"만 우선
    r.orgs.forEach((org) =>
      opts.push({
        kind: "org",
        org,
        count: POSTINGS.filter((p) => p.orgName === org && calcPostingDday(p.applyEnd) >= 0).length,
      }),
    );
    r.postings.forEach((p) => opts.push({ kind: "posting", posting: p }));
    r.positions.forEach(({ posting, position }) =>
      opts.push({
        kind: "position",
        posting,
        positionId: position.id,
        jobTitle: position.jobTitle,
        employmentType: position.employmentType,
      }),
    );
    opts.push({ kind: "fallback" });
    return opts;
  }, [q, hasQuery]);

  const pick = (opt: Option) => {
    if (opt.kind === "fallback") {
      setFallbackOpen(true);
      setFocused(false);
      return;
    }
    const posting =
      opt.kind === "org" ? POSTINGS.find((p) => p.orgName === opt.org) : opt.posting;
    if (!posting) return;
    // 공고 내용·원문을 먼저 확인하고 상세 페이지에서 직무를 골라 담는 플로우
    const positionQuery = opt.kind === "position" ? `?position=${opt.positionId}` : "";
    navigate(`/jobs/${posting.slug}${positionQuery}`);
    setFocused(false);
    setQ("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!focused) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (options[activeIdx]) pick(options[activeIdx]);
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  };

  const handleBlur = () => {
    blurTimer.current = window.setTimeout(() => setFocused(false), 150);
  };
  const handleFocus = () => {
    if (blurTimer.current) window.clearTimeout(blurTimer.current);
    setActiveIdx(0);
    setFocused(true);
  };

  // 섹션 헤더 계산 (첫 등장 인덱스에만 라벨)
  const sectionLabel = (opt: Option, idx: number): string | null => {
    const label =
      opt.kind === "org" ? "기관" : opt.kind === "posting" ? (hasQuery ? "공고" : "지금 진행중인 공고") : opt.kind === "position" ? "직무" : null;
    if (!label) return null;
    const prev = options[idx - 1];
    if (!prev || prev.kind !== opt.kind) return label;
    return null;
  };

  return (
    <>
      <div className="relative">
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-2 pickd-shadow">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActiveIdx(0);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={onKeyDown}
            placeholder="기관명, 직무, 공고명을 검색해 보세요"
            className="border-0 shadow-none bg-transparent h-7 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 px-0"
          />
          <button
            onClick={() => setFallbackOpen(true)}
            className="text-chip text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0 transition-colors"
          >
            <Upload className="w-3 h-3" />
            직접 등록
          </button>
        </div>

        {focused && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-card border border-border rounded-xl pickd-shadow overflow-hidden">
            <div className="max-h-72 overflow-y-auto py-1">
              {options.length === 1 && hasQuery ? (
                <div className="px-4 py-4 text-center">
                  <p className="text-sm text-muted-foreground">검색 결과가 없어요</p>
                  <p className="text-chip text-muted-foreground/70 mt-0.5">
                    지금은 공공기관 공고 {POSTINGS.length}건이 등록되어 있어요
                  </p>
                </div>
              ) : null}

              {options.map((opt, idx) => {
                const label = sectionLabel(opt, idx);
                return (
                  <div key={idx}>
                    {label && (
                      <p className="px-4 pt-2 pb-0.5 text-chip font-semibold text-muted-foreground/60 uppercase tracking-wide">
                        {label}
                      </p>
                    )}
                    {opt.kind === "fallback" ? (
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => pick(opt)}
                        className={cn(
                          "w-full flex items-center gap-2 px-4 py-2 text-left border-t border-border mt-1",
                          "text-xs text-muted-foreground hover:text-foreground",
                          idx === activeIdx && "bg-muted/60",
                        )}
                      >
                        <Upload className="w-3 h-3" />
                        찾는 공고가 없나요? PDF로 직접 등록하기
                      </button>
                    ) : (
                      <OptionRow
                        opt={opt}
                        active={idx === activeIdx}
                        onHover={() => setActiveIdx(idx)}
                        onPick={() => pick(opt)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-3 px-4 py-1.5 border-t border-border bg-muted/30 text-mini text-muted-foreground/60">
              <span className="inline-flex items-center gap-1">↑↓ 이동</span>
              <span className="inline-flex items-center gap-1">
                <CornerDownLeft className="w-2.5 h-2.5" /> 선택
              </span>
              <span>esc 닫기</span>
            </div>
          </div>
        )}
      </div>

      <FallbackUploadModal open={fallbackOpen} onOpenChange={setFallbackOpen} />
    </>
  );
}

function OptionRow({
  opt,
  active,
  onHover,
  onPick,
}: {
  opt: Exclude<Option, { kind: "fallback" }>;
  active: boolean;
  onHover: () => void;
  onPick: () => void;
}) {
  let icon: React.ReactNode;
  let title = "";
  let sub: string | undefined;
  let meta: string | undefined;
  let registered = false;

  if (opt.kind === "org") {
    icon = <Building2 className="w-3.5 h-3.5" />;
    title = opt.org;
    meta = opt.count > 0 ? `진행중 공고 ${opt.count}건` : "진행중 공고 없음";
  } else if (opt.kind === "posting") {
    icon = <FileText className="w-3.5 h-3.5" />;
    title = opt.posting.title;
    sub = opt.posting.orgName;
    meta = metaOf(opt.posting);
    registered = isRegistered(opt.posting.id);
  } else {
    icon = <Briefcase className="w-3.5 h-3.5" />;
    title = opt.jobTitle;
    sub = `${opt.posting.orgName} · ${opt.employmentType}`;
    meta = metaOf(opt.posting);
    registered = isRegistered(opt.posting.id);
  }

  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onMouseEnter={onHover}
      onClick={onPick}
      className={cn(
        "w-full flex items-center gap-2.5 px-4 py-2 text-left transition-colors",
        active && "bg-muted/60",
      )}
    >
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="min-w-0 flex-1 flex items-baseline gap-2">
        <span className="text-title text-foreground truncate">{title}</span>
        {sub && <span className="text-xs text-muted-foreground truncate shrink-0 max-w-[40%]">{sub}</span>}
      </span>
      {registered && (
        <span className="inline-flex items-center gap-0.5 text-xs text-pickd-green shrink-0">
          <Check className="w-3 h-3" />
          담음 · 상세 보기
        </span>
      )}
      {meta && <span className="text-xs tabular-nums text-muted-foreground shrink-0">{meta}</span>}
    </button>
  );
}

function metaOf(p: Posting): string {
  const d = calcPostingDday(p.applyEnd);
  return d >= 0 ? `D-${d} · ${formatApplyEnd(p)} 마감` : "마감";
}
