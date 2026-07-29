import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, FileText, Search, Upload, Briefcase, Check, CornerDownLeft, X, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FallbackUploadModal } from "./FallbackUploadModal";
import {
  POSTINGS,
  searchPostings,
  calcPostingDday,
  type Posting,
  type JobCategory,
} from "@/data/postings.seed";
import { formatApplyEnd, isRegistered } from "@/data/jobStore";

// ── 최근 검색어 (localStorage) ───────────────────────────────────
const RECENT_KEY = "pickd.jobs.recentSearches.v1";
const RECENT_MAX = 8;
function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
}
function pushRecent(q: string) {
  const t = q.trim();
  if (!t) return;
  const next = [t, ...getRecent().filter((v) => v !== t)].slice(0, RECENT_MAX);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}
function clearRecent() { localStorage.removeItem(RECENT_KEY); }

// ── 필터 정의 (탭1 기획 4축 중 드롭다운용 3축 — 기관유형은 탐색 화면에서) ──
// 직무: 공공기관 실제 직렬 18종을 4그룹으로. 지역: 전국 17개 시도 + 해외.
const JOB_GROUPS: { sub: string; values: JobCategory[] }[] = [
  { sub: "관리·사무", values: ["사무·행정", "경영·기획", "회계·재무", "인사·법무", "홍보·대외"] },
  { sub: "기술",     values: ["전산·IT", "전기·통신", "기계·설비", "토목·건축", "화공·환경"] },
  { sub: "전문",     values: ["안전관리", "검사·품질", "보건·의료", "연구·조사", "교육·상담"] },
  { sub: "현장",     values: ["운전·운송", "시설·미화", "기타"] },
];

/** 지역 칩 — label은 표시용, match는 공고 regions 값과 대조할 별칭 */
type RegionChip = { label: string; match: string[] };
const REGION_GROUPS: { sub: string; values: RegionChip[] }[] = [
  { sub: "동남권", values: [
    { label: "부산", match: ["부산"] }, { label: "울산", match: ["울산"] },
    { label: "경남", match: ["경남"] }, { label: "경북", match: ["경북"] },
  ]},
  { sub: "그 외", values: [
    { label: "서울", match: ["서울"] }, { label: "인천", match: ["인천"] },
    { label: "경기", match: ["경기"] }, { label: "강원", match: ["강원"] },
    { label: "대전", match: ["대전"] }, { label: "세종", match: ["세종"] },
    { label: "충북", match: ["충북"] }, { label: "충남", match: ["충남"] },
    { label: "대구", match: ["대구"] },
    { label: "전북", match: ["전북"] }, { label: "전남·광주", match: ["전남", "광주"] },
    { label: "제주", match: ["제주"] }, { label: "해외", match: ["해외"] },
  ]},
];
const REGION_MATCH: Record<string, string[]> = Object.fromEntries(
  REGION_GROUPS.flatMap((g) => g.values).map((r) => [r.label, r.match]),
);
const TYPE_FILTERS = ["신입", "인턴", "경력"] as const;

type Filters = { job: JobCategory | null; region: string | null; type: string | null };
const EMPTY_FILTERS: Filters = { job: null, region: null, type: null };

function matchPosting(p: Posting, f: Filters): boolean {
  if (f.region) {
    const aliases = REGION_MATCH[f.region] ?? [f.region];
    if (!p.regions.some((r) => aliases.some((a) => r.includes(a)))) return false;
  }
  const positions = p.positions.filter((pos) => {
    if (f.job && pos.jobCategory !== f.job) return false;
    if (f.type === "인턴") return pos.employmentType.includes("인턴");
    if (f.type === "신입") return pos.recruitType.includes("신입") && !pos.employmentType.includes("인턴");
    if (f.type === "경력") return pos.recruitType.includes("경력");
    return true;
  });
  return positions.length > 0;
}

// ── 검색 결과 옵션 (키보드 탐색용) ───────────────────────────────
type Option =
  | { kind: "org"; org: string; count: number }
  | { kind: "posting"; posting: Posting }
  | { kind: "position"; posting: Posting; positionId: string; jobTitle: string; employmentType: string }
  | { kind: "fallback" };

/**
 * 탭1 진입점 — 공고 검색.
 * 빈 포커스: 좌측 필터로 찾기 + 우측 최근 검색어 / 입력: 기관·공고·직무 결과 + 키보드 탐색.
 */
export function QuickJobRegistration() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const blurTimer = useRef<number | null>(null);

  const hasQuery = q.trim().length > 0;
  const hasFilter = !!(filters.job || filters.region || filters.type);

  const options: Option[] = useMemo(() => {
    if (!hasQuery) return [];
    const r = searchPostings(q);
    const opts: Option[] = [];
    r.orgs.forEach((org) =>
      opts.push({ kind: "org", org, count: POSTINGS.filter((p) => p.orgName === org && calcPostingDday(p.applyEnd) >= 0).length }),
    );
    r.postings.forEach((p) => opts.push({ kind: "posting", posting: p }));
    r.positions.forEach(({ posting, position }) =>
      opts.push({ kind: "position", posting, positionId: position.id, jobTitle: position.jobTitle, employmentType: position.employmentType }),
    );
    opts.push({ kind: "fallback" });
    return opts;
  }, [q, hasQuery]);

  const filtered = useMemo(
    () => (hasFilter ? POSTINGS.filter((p) => calcPostingDday(p.applyEnd) >= 0 && matchPosting(p, filters)) : []),
    [filters, hasFilter],
  );

  const goPosting = (posting: Posting, positionId?: string) => {
    if (hasQuery) pushRecent(q);
    const positionQuery = positionId ? `?position=${positionId}` : "";
    navigate(`/jobs/${posting.slug}${positionQuery}`);
    setFocused(false);
    setQ("");
    setFilters(EMPTY_FILTERS);
  };

  const pick = (opt: Option) => {
    if (opt.kind === "fallback") { setFallbackOpen(true); setFocused(false); return; }
    const posting = opt.kind === "org" ? POSTINGS.find((p) => p.orgName === opt.org) : opt.posting;
    if (!posting) return;
    goPosting(posting, opt.kind === "position" ? opt.positionId : undefined);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!focused || !hasQuery) {
      if (e.key === "Escape") setFocused(false);
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, options.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (options[activeIdx]) pick(options[activeIdx]); }
    else if (e.key === "Escape") setFocused(false);
  };

  const handleBlur = () => { blurTimer.current = window.setTimeout(() => setFocused(false), 150); };
  const handleFocus = () => {
    if (blurTimer.current) window.clearTimeout(blurTimer.current);
    setActiveIdx(0);
    setFocused(true);
  };

  const sectionLabel = (opt: Option, idx: number): string | null => {
    const label = opt.kind === "org" ? "기관" : opt.kind === "posting" ? "공고" : opt.kind === "position" ? "직무" : null;
    if (!label) return null;
    const prev = options[idx - 1];
    return !prev || prev.kind !== opt.kind ? label : null;
  };

  const recent = getRecent();

  return (
    <>
      <div className="relative">
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-2 pickd-shadow">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActiveIdx(0); }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={onKeyDown}
            placeholder="기관명, 직무, 공고명을 검색해 보세요"
            className="border-0 shadow-none bg-transparent h-7 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 px-0"
          />
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 shrink-0"
            onClick={() => { inputRef.current?.focus(); handleFocus(); }}
          >
            <Search className="w-3.5 h-3.5" />
            공고 검색하기
          </Button>
        </div>

        {focused && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-card border border-border rounded-xl pickd-shadow overflow-hidden">
            {hasQuery ? (
              /* ── 검색 결과 모드 ─────────────────────────────── */
              <div className="max-h-80 overflow-y-auto py-1">
                {options.length === 1 && (
                  <div className="px-4 py-4 text-center">
                    <p className="text-sm text-muted-foreground">검색 결과가 없어요</p>
                    <p className="text-chip text-muted-foreground/70 mt-0.5">
                      지금은 공공기관 공고 {POSTINGS.length}건이 등록되어 있어요
                    </p>
                  </div>
                )}
                {options.map((opt, idx) => {
                  const label = sectionLabel(opt, idx);
                  return (
                    <div key={idx}>
                      {label && (
                        <p className="px-4 pt-2 pb-0.5 text-chip font-semibold text-muted-foreground/60 uppercase tracking-wide">{label}</p>
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
                        <OptionRow opt={opt} active={idx === activeIdx} onHover={() => setActiveIdx(idx)} onPick={() => pick(opt)} />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── 빈 포커스: 좌 필터 / 우 최근 검색어 ───────────── */
              <div className="flex">
                {/* 좌: 필터로 찾기 */}
                <div className="flex-1 min-w-0 p-4 border-r border-border">
                  <p className="text-chip font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2">필터로 찾기</p>
                  <FilterSection
                    label="직무"
                    groups={JOB_GROUPS.map((g) => ({ sub: g.sub, values: [...g.values] }))}
                    current={filters.job}
                    onPick={(v) => setFilters((f) => ({ ...f, job: f.job === v ? null : (v as JobCategory) }))}
                  />
                  <FilterSection
                    label="지역"
                    groups={REGION_GROUPS.map((g) => ({ sub: g.sub, values: g.values.map((r) => r.label) }))}
                    current={filters.region}
                    onPick={(v) => setFilters((f) => ({ ...f, region: f.region === v ? null : v }))}
                  />
                  <FilterSection
                    label="형태"
                    groups={[{ sub: "", values: [...TYPE_FILTERS] }]}
                    current={filters.type}
                    onPick={(v) => setFilters((f) => ({ ...f, type: f.type === v ? null : v }))}
                  />

                  {hasFilter && (
                    <div className="mt-3 border-t border-border/60 pt-2">
                      <p className="text-chip text-muted-foreground mb-1">
                        조건에 맞는 공고 {filtered.length}건
                        {filtered.length === 0 && <span className="text-muted-foreground/60"> — 조건을 넓혀보세요</span>}
                      </p>
                      <div className="max-h-40 overflow-y-auto -mx-2">
                        {filtered.map((p) => (
                          <OptionRow
                            key={p.id}
                            opt={{ kind: "posting", posting: p }}
                            active={false}
                            onHover={() => {}}
                            onPick={() => goPosting(p)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 우: 최근 검색어 */}
                <div className="w-[280px] shrink-0 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-chip font-semibold text-muted-foreground/60 uppercase tracking-wide">최근 검색어</p>
                    {recent.length > 0 && (
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { clearRecent(); setQ(""); setFocused(true); }}
                        className="text-chip text-muted-foreground/60 hover:text-foreground"
                      >
                        지우기
                      </button>
                    )}
                  </div>
                  {recent.length === 0 ? (
                    <p className="text-xs text-muted-foreground/60 py-2">아직 검색 기록이 없어요</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {recent.map((r) => (
                        <li key={r}>
                          <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { setQ(r); setActiveIdx(0); inputRef.current?.focus(); }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm text-foreground hover:bg-muted/50"
                          >
                            <History className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{r}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-muted/30">
              <div className="flex items-center gap-3 text-mini text-muted-foreground/60">
                <span>↑↓ 이동</span>
                <span className="inline-flex items-center gap-1"><CornerDownLeft className="w-2.5 h-2.5" /> 선택</span>
                <span>esc 닫기</span>
              </div>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setFallbackOpen(true); setFocused(false); }}
                className="text-mini text-muted-foreground/60 hover:text-foreground inline-flex items-center gap-1"
              >
                <Upload className="w-2.5 h-2.5" />
                PDF로 직접 등록
              </button>
            </div>
          </div>
        )}
      </div>

      <FallbackUploadModal open={fallbackOpen} onOpenChange={setFallbackOpen} />
    </>
  );
}

function FilterSection({
  label, groups, current, onPick,
}: {
  label: string;
  groups: { sub: string; values: string[] }[];
  current: string | null;
  onPick: (v: string) => void;
}) {
  return (
    <div className="flex items-start gap-2 mb-2">
      <span className="text-chip text-muted-foreground w-8 shrink-0 pt-1">{label}</span>
      <div className="min-w-0 flex-1 space-y-1">
        {groups.map((g) => (
          <div key={g.sub} className="flex items-start gap-2">
            {g.sub && (
              <span className="text-mini text-muted-foreground/50 w-12 shrink-0 pt-1 text-right">{g.sub}</span>
            )}
            <div className="flex flex-wrap gap-1">
              {g.values.map((v) => (
                <button
                  key={v}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onPick(v)}
                  className={cn(
                    "px-2 py-0.5 rounded-full border text-xs transition-colors",
                    current === v
                      ? "border-primary bg-accent text-primary font-medium"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  )}
                >
                  {v}
                  {current === v && <X className="inline w-2.5 h-2.5 ml-0.5 -mt-px" />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OptionRow({
  opt, active, onHover, onPick,
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
      className={cn("w-full flex items-center gap-2.5 px-4 py-2 text-left transition-colors hover:bg-muted/50", active && "bg-muted/60")}
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
