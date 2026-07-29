import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ChevronRight,
  ExternalLink,
  PenLine,
  ArrowLeft,
  Copy,
  Check,
  X,
  Highlighter,
  AlertCircle,
  CalendarDays,
  ScrollText,
  Plus,
} from "lucide-react";
import { PickdSidebar } from "@/components/layout/PickdSidebar";
import { Button } from "@/components/ui/button";
import { StatusBadge, STATUS_MAP } from "@/components/ds/StatusBadge";
import { DdayChip } from "@/components/ds/DdayChip";
import { EssayStatus } from "@/components/ds/EssayStatus";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getPostingBySlug, type Posting } from "@/data/postings.seed";
import {
  postingToJobDetail,
  addRegistration,
  removeRegistration,
  getRegistration,
  REGISTRATIONS_EVENT,
} from "@/data/jobStore";
import { Users, MapPin, CheckCircle2 } from "lucide-react";
import { PageTitle } from "@/components/ds/PageTitle";
import { jobDetails } from "./model/jobDetailMock";

// TODO: MOCK_DATA - 실제 API 연결 시 제거. API: GET /job-postings/:id

function getJob(slug: string | undefined) {
  if (slug && jobDetails[slug]) return jobDetails[slug];
  // 검색으로 담은 공고(시드 DB) — 참조 데이터를 상세 화면 형태로 파생
  const posting = slug ? getPostingBySlug(slug) : undefined;
  if (posting) return postingToJobDetail(posting);
  return jobDetails.samsung;
}

// ---------- Highlight key helpers ----------
function hlKey(section: string, group: string, idx: number) {
  return `${section}::${group}::${idx}`;
}

// ---------- Copy button (복붙/오려두기 도우미) ----------
function CopyButton({ text, label = "복사", always = false }: { text: string; label?: string; always?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          toast("복사했어요");
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-chip text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0",
        !always && "opacity-0 group-hover:opacity-100"
      )}
      title="복사하기"
    >
      {copied ? <Check className="w-3 h-3 text-pickd-green" /> : <Copy className="w-3 h-3" />}
      {label}
    </button>
  );
}

// ---------- Numbered section (clear stage separation, no heavy box) ----------
function Section({
  n,
  title,
  subtitle,
  right,
  children,
}: {
  n: number;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5 last:mb-0">
      <div className="group bg-card border border-border rounded-2xl px-6 py-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="shrink-0 w-5 h-5 rounded-md bg-muted text-muted-foreground text-mini font-bold flex items-center justify-center tabular-nums">
              {n}
            </span>
            <h2 className="text-title font-semibold text-foreground tracking-tight">{title}</h2>
            {subtitle && <span className="text-chip text-muted-foreground">{subtitle}</span>}
          </div>
          {right}
        </div>
        {children}
      </div>
    </section>
  );
}

// ---------- HighlightableLine ----------
interface HighlightableLineProps {
  lineKey: string;
  text: string;
  highlighted: boolean;
  onToggle: (key: string) => void;
}

function HighlightableLine({ lineKey, text, highlighted, onToggle }: HighlightableLineProps) {
  return (
    <li
      className={cn(
        "group/line flex items-start gap-2 px-2 py-1.5 -mx-2 rounded transition-colors",
        highlighted ? "bg-[var(--warning-subtle)]" : "hover:bg-muted/30"
      )}
    >
      <button
        onClick={() => onToggle(lineKey)}
        title={highlighted ? "강조 해제" : "중요 표시"}
        className={cn(
          "shrink-0 mt-0.5 w-4 h-4 flex items-center justify-center rounded transition-all",
          "opacity-0 group-hover/line:opacity-100",
          highlighted
            ? "text-[var(--warning)]"
            : "text-muted-foreground hover:text-[var(--warning)]"
        )}
      >
        <Highlighter className="w-3 h-3" />
      </button>
      <span className="text-muted-foreground select-none shrink-0 mt-0.5 text-chip">•</span>
      <span
        className={cn(
          "text-body leading-relaxed break-words flex-1 select-text",
          highlighted ? "text-foreground font-semibold" : "text-foreground"
        )}
      >
        {text}
      </span>
    </li>
  );
}

// ---------- Requirement group (seamless list + 그룹 통째 복사) ----------
function ReqGroup({
  label,
  items,
  section,
  isHighlighted,
  onToggle,
}: {
  label: string;
  items: string[];
  section: string;
  isHighlighted: (key: string) => boolean;
  onToggle: (key: string) => void;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground mb-1">{label}</h3>
      <ul className="space-y-0.5">
        {items.map((text, idx) => {
          const key = hlKey(section, label, idx);
          return (
            <HighlightableLine
              key={idx}
              lineKey={key}
              text={text}
              highlighted={isHighlighted(key)}
              onToggle={onToggle}
            />
          );
        })}
      </ul>
    </div>
  );
}


// ---------- 직무 선택·담기 (시드 공고 전용) ----------
// 공고 내용을 먼저 확인한 뒤, 이 페이지에서 직무를 선택해 담는다.
function PositionPickerSection({ posting, preselect }: { posting: Posting; preselect?: string | null }) {
  const [, force] = useState(0);
  useEffect(() => {
    const re = () => force((v) => v + 1);
    window.addEventListener(REGISTRATIONS_EVENT, re);
    return () => window.removeEventListener(REGISTRATIONS_EVENT, re);
  }, []);

  const reg = getRegistration(posting.id);
  const [sel, setSel] = useState<string | null>(preselect ?? null);
  const selectedId = reg?.positionId ?? sel;

  const handleAdd = () => {
    if (!selectedId) return;
    if (addRegistration(posting.id, selectedId)) {
      toast(`공고를 담았어요 — 일정 ${posting.scheduleEvents.length}개가 캘린더에 등록됐어요`, { duration: 2500 });
    }
  };
  const handleRemove = () => {
    removeRegistration(posting.id);
    toast("공고를 뺐어요 — 연결된 일정도 함께 정리돼요", { duration: 2000 });
  };

  return (
    <section className="mb-8 border border-border rounded-2xl bg-card pickd-shadow overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div>
          <h2 className="text-title font-semibold text-foreground">모집 직무 선택</h2>
          <p className="text-chip text-muted-foreground mt-0.5">
            {reg
              ? "이 직무로 담은 공고예요 — 직무를 바꾸려면 공고를 뺀 뒤 다시 담아 주세요"
              : "공고 내용을 확인한 뒤, 지원할 직무 1개를 선택해 담아 주세요"}
          </p>
        </div>
        {reg ? (
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleRemove}>
            공고 빼기
          </Button>
        ) : (
          <Button size="sm" className="h-8 text-xs" disabled={!selectedId} onClick={handleAdd}>
            이 직무로 담기
          </Button>
        )}
      </div>
      <div className="divide-y divide-border/60 border-t border-border/60">
        {(reg ? posting.positions.filter((p) => p.id === reg.positionId) : posting.positions).map((p) => {
          const active = p.id === selectedId;
          const isRegistered = reg?.positionId === p.id;
          return (
            <button
              key={p.id}
              disabled={!!reg && !isRegistered}
              onClick={() => !reg && setSel(p.id)}
              className={cn(
                "w-full text-left px-5 py-3 transition-colors",
                active ? "bg-accent" : "hover:bg-muted/40",
                !!reg && !isRegistered && "opacity-45 cursor-default hover:bg-transparent",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {isRegistered ? (
                    <CheckCircle2 className="w-4 h-4 text-pickd-green shrink-0" />
                  ) : (
                    <span
                      className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                        active ? "border-primary bg-primary" : "border-muted-foreground/40",
                      )}
                    >
                      {active && <Check className="w-3 h-3 text-white" />}
                    </span>
                  )}
                  <span className="text-sm font-medium text-foreground truncate">
                    {p.jobGroup ? `${p.jobGroup} · ` : ""}
                    {p.jobTitle}
                  </span>
                  {isRegistered && <span className="text-chip text-pickd-green shrink-0">담은 직무</span>}
                </div>
                <span className="text-chip text-muted-foreground shrink-0">{p.employmentType}</span>
              </div>
              {!reg && (
                <>
                  <div className="flex items-center gap-3 mt-1 pl-6 text-chip text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {p.headcount}명
                    </span>
                    <span className="inline-flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{p.workLocation.join(", ")}</span>
                    </span>
                    {p.writtenExam && <span className="shrink-0">필기 있음</span>}
                  </div>
                  <p className="mt-0.5 pl-6 text-chip text-muted-foreground/80 line-clamp-2">{p.qualification}</p>
                </>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ---------- Main component ----------
export default function JobDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const job = getJob(slug);
  // 시드 공고면 직무 선택·담기 섹션을 노출 (검색 → 상세 확인 → 담기 플로우)
  const seedPosting = slug ? getPostingBySlug(slug) : undefined;
  const preselectPosition = new URLSearchParams(location.search).get("position");
  // 담기 전에는 원문 확인·직무 선택만 노출, 담으면 상세 전체 공개 (2026-07-27 플로우 결정)
  const [, regTick] = useState(0);
  useEffect(() => {
    const f = () => regTick((v) => v + 1);
    window.addEventListener(REGISTRATIONS_EVENT, f);
    return () => window.removeEventListener(REGISTRATIONS_EVENT, f);
  }, []);
  const detailUnlocked = !seedPosting || !!getRegistration(seedPosting.id);
  // 검수된 공고문 PDF가 있으면 우측 패널에서 인라인으로 보여준다
  const noticePdfUrl = seedPosting?.attachments.find(
    (a) => a.docType === "공고문" && a.fileFormat === "pdf" && a.url !== "#",
  )?.url;

  const [rawOpen, setRawOpen] = useState(false);
  const [highlights, setHighlights] = useState<Set<string>>(new Set());
  const highlightsKey = `pickd.jobs.${slug ?? "samsung"}.highlights.v1`;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(highlightsKey);
      setHighlights(raw ? new Set(JSON.parse(raw)) : new Set());
    } catch {}
  }, [highlightsKey]);

  // 제출 서류 확인 체크 상태 (localStorage 지속)
  const submitDocs: string[] = job.eligibility["제출 서류"] ?? [];
  const reqGroups = Object.entries(job.eligibility).filter(([k]) => k !== "제출 서류") as [string, string[]][];
  const docsKey = `pickd.jobs.${slug ?? "samsung"}.docsChecked.v1`;
  const [checkedDocs, setCheckedDocs] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(docsKey);
      setCheckedDocs(raw ? new Set(JSON.parse(raw)) : new Set());
    } catch {}
  }, [docsKey]);

  const toggleDoc = (d: string) => {
    setCheckedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      try {
        localStorage.setItem(docsKey, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  // 공고 외 직접 준비하는 제출 서류(포트폴리오·경력증명서 등)를 사용자가 추가 — localStorage 지속
  const customDocsKey = `pickd.jobs.${slug ?? "samsung"}.customDocs.v1`;
  const [customDocs, setCustomDocs] = useState<string[]>([]);
  const [newDoc, setNewDoc] = useState("");
  const [addingDoc, setAddingDoc] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(customDocsKey);
      setCustomDocs(raw ? JSON.parse(raw) : []);
    } catch {}
  }, [customDocsKey]);
  const persistCustomDocs = (next: string[]) => {
    setCustomDocs(next);
    try { localStorage.setItem(customDocsKey, JSON.stringify(next)); } catch {}
  };
  const addCustomDoc = () => {
    const v = newDoc.trim();
    if (!v) return;
    if ([...submitDocs, ...customDocs].includes(v)) { toast("이미 있는 서류예요"); setNewDoc(""); return; }
    persistCustomDocs([...customDocs, v]);
    setNewDoc("");
    toast("서류를 추가했어요");
  };
  const removeCustomDoc = (d: string) => {
    persistCustomDocs(customDocs.filter((x) => x !== d));
    setCheckedDocs((prev) => {
      const n = new Set(prev);
      n.delete(d);
      try { localStorage.setItem(docsKey, JSON.stringify([...n])); } catch {}
      return n;
    });
  };
  const allDocs = [...submitDocs, ...customDocs];

  // 자소서 문항 ref — 작성중인 서류에서 진입 시 마지막 작업 문항으로 스크롤
  const essayRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const fromDoclist = new URLSearchParams(location.search).get("from") === "doclist";
    if (!fromDoclist) return;
    const lastActiveIdx = [...job.essays]
      .map((e: any, i: number) => ({ i, status: e.status }))
      .filter(({ status }: any) => status === "작성중" || status === "초안")
      .pop()?.i ?? 0;
    const el = essayRefs.current[lastActiveIdx];
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
  }, []);

  const toggleHighlight = (key: string) => {
    setHighlights((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try { localStorage.setItem(highlightsKey, JSON.stringify([...next])); } catch {}
      return next;
    });
  };
  const isHighlighted = (key: string) => highlights.has(key);

  const goToTab3 = (essayNo: number) => {
    navigate(`/ai-cover?from=job&slug=${slug ?? "samsung"}&essay=${essayNo}`);
  };

  const urgent = !job.expired && job.dday !== null && job.dday <= 3;
  // 지원 상태 라벨 → 탭1 StatusBadge 상태 키 매핑(같은 배지로 통일)
  const statusKey = Object.entries(STATUS_MAP).find(([, v]) => v.label === job.status)?.[0] as
    | keyof typeof STATUS_MAP
    | undefined;

  // 섹션별 '복사' 포맷 — 라벨·불릿을 살려 붙여넣었을 때 서식 유지
  const basicCopy = Object.entries(job.basic).map(([k, v]) => `${k}: ${v}`).join("\n");
  const jdCopy = `[직무 설명]\n${job.jobDescription}\n\n[요구 역량]\n${job.competencies
    .map((c: string) => `· ${c}`)
    .join("\n")}`;
  const eligibilityCopy = reqGroups
    .map(([label, items]) => `[${label}]\n${items.map((t) => `· ${t}`).join("\n")}`)
    .join("\n\n");
  const docsCopy = allDocs.map((d) => `· ${d}`).join("\n");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <PickdSidebar />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-white">
        {/* Sticky top bar */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border/60">
          <div className="mx-auto max-w-[860px] px-8 py-3 flex items-center justify-between">
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
              <Link to="/" className="hover:text-foreground transition-colors shrink-0">지원 대시보드</Link>
              <ChevronRight className="w-3 h-3 shrink-0" />
              <span className="text-foreground font-medium truncate">{job.company} {job.division ?? ""}</span>
            </nav>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant={rawOpen ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs gap-1.5 rounded-md"
                onClick={() => setRawOpen((v) => !v)}
              >
                <ScrollText className="w-3.5 h-3.5" />
                {rawOpen ? "원문 닫기" : "원문 보기"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5 rounded-md"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                대시보드로
              </Button>
            </div>
          </div>
        </div>

        {/* Centered content column */}
        <div className="mx-auto max-w-[860px] px-8 pt-11 pb-24">

          {/* Title + minimal at-a-glance meta */}
          <header className="mb-8">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
              <span className="font-medium text-foreground">{job.company}</span>
              {job.division && (<><span className="text-border">·</span><span>{job.division}</span></>)}
              <span className="text-border">·</span>
              <span>{job.role}</span>
            </div>
            <PageTitle>
              {job.title}
            </PageTitle>

            <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                마감 {job.deadline}
              </span>
              <DdayChip days={job.dday} size="sm" />
              {statusKey ? (
                <StatusBadge status={statusKey} size="sm" />
              ) : (
                <StatusBadge label={job.status} tone="neutral" size="sm" />
              )}
            </div>

            {seedPosting && detailUnlocked && (() => {
              const reg = getRegistration(seedPosting.id);
              const pos = seedPosting.positions.find((p) => p.id === reg?.positionId);
              if (!pos) return null;
              return (
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-chip rounded-md px-2.5 py-1 bg-pickd-green-light text-pickd-green">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    담은 직무 · {pos.jobTitle}
                  </span>
                  <button
                    onClick={() => {
                      removeRegistration(seedPosting.id);
                      toast("공고를 뺐어요 — 연결된 일정도 함께 정리돼요", { duration: 2000 });
                      navigate("/");
                    }}
                    className="text-chip text-muted-foreground hover:text-foreground transition-colors"
                  >
                    공고 빼기
                  </button>
                </div>
              );
            })()}

            {(job.expired || urgent) && (
              <div className={cn(
                "mt-3 inline-flex items-center gap-1.5 text-chip rounded-md px-2.5 py-1",
                job.expired ? "bg-muted/50 text-muted-foreground" : "bg-pickd-red-light text-pickd-red"
              )}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {job.expired ? "마감된 공고입니다" : "제출 기한이 얼마 남지 않았어요"}
              </div>
            )}
          </header>

          {seedPosting && !detailUnlocked && (
            <PositionPickerSection posting={seedPosting} preselect={preselectPosition} />
          )}

          {!detailUnlocked && seedPosting && (
            <div className="border border-dashed border-border rounded-2xl bg-card px-6 py-8 text-center">
              <p className="text-sm font-medium text-foreground">공고 내용은 원문에서 먼저 확인해 주세요</p>
              <p className="text-xs text-muted-foreground mt-1">
                직무를 선택해 담으면 일정·자격·문항이 정리된 상세 화면이 열려요
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                {noticePdfUrl && (
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setRawOpen(true)}>
                    <ScrollText className="w-3.5 h-3.5" />
                    원문 PDF 여기서 보기
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
                  <a href={seedPosting.sourceUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-3.5 h-3.5" />
                    잡알리오 원문
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
                  <a href={seedPosting.applyUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-3.5 h-3.5" />
                    접수처 열기
                  </a>
                </Button>
              </div>
            </div>
          )}

          {detailUnlocked && (<>
          {/* 1 · 기본 정보 — 복사하기 쉬운 정보 목록 */}
          <Section
            n={1}
            title="기본 정보"
            right={<CopyButton label="복사" text={basicCopy} />}
          >
            <dl className="divide-y divide-border/40">
              {Object.entries(job.basic).map(([k, v]) => (
                <div key={k} className="flex items-start gap-3 py-2">
                  <dt className="w-28 shrink-0 text-xs text-muted-foreground pt-0.5">{k}</dt>
                  <dd className={cn(
                    "flex-1 text-body leading-relaxed break-words select-text",
                    k === "D-day" && urgent ? "text-pickd-red font-semibold" : "text-foreground"
                  )}>
                    {String(v)}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>

          {/* 2 · 직무 설명 · 요구 역량 — 내용 없는 공고(시드·파싱 미확보)는 섹션 자체를 숨긴다 */}
          {(job.jobDescription || job.competencies.length > 0) && (
          <Section n={2} title="직무 설명 · 요구 역량" right={<CopyButton label="복사" text={jdCopy} />}>
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-1">직무 설명</h3>
                <p className="text-body text-foreground leading-relaxed select-text">{job.jobDescription}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-1">요구 역량</h3>
                <ul className="space-y-0.5">
                  {job.competencies.map((c: string, i: number) => {
                    const key = hlKey("jd", "competency", i);
                    return (
                      <HighlightableLine key={i} lineKey={key} text={c} highlighted={isHighlighted(key)} onToggle={toggleHighlight} />
                    );
                  })}
                </ul>
              </div>
            </div>
          </Section>
          )}

          {/* 3 · 지원 자격 · 우대 · 가산점 */}
          <Section
            n={3}
            title="지원 자격 · 우대"
            right={
              <div className="flex items-center gap-2">
                {highlights.size > 0 && (
                  <button
                    onClick={() => { setHighlights(new Set()); try { localStorage.setItem(highlightsKey, JSON.stringify([])); } catch {} }}
                    className="text-chip text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    강조 {highlights.size}개 초기화
                  </button>
                )}
                <CopyButton label="복사" text={eligibilityCopy} />
              </div>
            }
          >
            <div className="space-y-5">
              {reqGroups.filter(([label]) => label !== "우대사항").map(([label, items]) => (
                <ReqGroup
                  key={label}
                  label={label}
                  items={items}
                  section="eligibility"
                  isHighlighted={isHighlighted}
                  onToggle={toggleHighlight}
                />
              ))}
              {(() => {
                const pref = reqGroups.find(([label]) => label === "우대사항");
                if (!pref || pref[1].length === 0) return null;
                // 우대는 해당자에게만 의미 — 기본 접힘, 개수만 노출 (프로필 기반 개인화는 로드맵)
                return (
                  <details className="group">
                    <summary className="cursor-pointer list-none flex items-center gap-1.5 text-xs font-semibold text-muted-foreground select-none">
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                      우대사항 {pref[1].length}개
                      <span className="font-normal text-muted-foreground/60">— 해당되는 경우에만 확인하세요</span>
                    </summary>
                    <div className="mt-2 pl-5">
                      <ReqGroup
                        label=""
                        items={pref[1]}
                        section="eligibility"
                        isHighlighted={isHighlighted}
                        onToggle={toggleHighlight}
                      />
                    </div>
                  </details>
                );
              })()}
            </div>
          </Section>

          {/* 4 · 전형 절차 — 일정 미정도 흔하므로 '미정' 표기 대비 */}
          <Section
            n={4}
            title="전형 절차"
            right={<span className="text-chip text-muted-foreground/70">일정이 없으면 ‘미정’으로 표시돼요</span>}
          >
            <div>
              {job.process.map((p: any, i: number) => {
                const hasSchedule = !!(p.schedule && String(p.schedule).trim());
                return (
                  <div key={i} className="flex items-start gap-3.5 py-3 border-b border-border/40 last:border-0">
                    <span className="shrink-0 w-5 pt-0.5 text-body font-semibold text-muted-foreground/50 tabular-nums text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-body font-medium text-foreground">{p.step}</p>
                        {p.detail && <p className="text-xs text-muted-foreground mt-0.5">{p.detail}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        {hasSchedule ? (
                          <p className="text-xs tabular-nums text-foreground/80 select-text">{p.schedule}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground/60">일정 미정</p>
                        )}
                        {p.note ? (
                          <p className="text-chip text-muted-foreground mt-0.5">{p.note}</p>
                        ) : !hasSchedule ? (
                          <p className="text-chip text-muted-foreground/50 mt-0.5">확정되면 업데이트하세요</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* 5 · 제출 서류 — 확인 체크리스트 (+ 공고 외 직접 추가) */}
          <Section
            n={5}
            title="제출 서류"
            right={
              <div className="flex items-center gap-2">
                {allDocs.length > 0 && <CopyButton label="복사" text={docsCopy} />}
                <button
                  type="button"
                  onClick={() => setAddingDoc(true)}
                  title="준비 서류 추가"
                  aria-label="준비 서류 추가"
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/50"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            }
          >
            <ul className="space-y-0.5">
              {allDocs.map((d) => {
                const checked = checkedDocs.has(d);
                const isCustom = customDocs.includes(d);
                return (
                  <li key={d} className="group flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleDoc(d)}
                      className="flex-1 min-w-0 flex items-center gap-2.5 px-2 py-1.5 -mx-2 rounded text-left hover:bg-muted/30 transition-colors"
                    >
                      <span className={cn(
                        "shrink-0 w-4 h-4 rounded-[5px] border flex items-center justify-center transition-colors",
                        checked ? "bg-pickd-green border-pickd-green text-white" : "border-border bg-background"
                      )}>
                        {checked && <Check className="w-3 h-3" />}
                      </span>
                      <span className={cn("text-body leading-relaxed select-text truncate", checked ? "text-muted-foreground line-through" : "text-foreground")}>
                        {d}
                      </span>
                      {isCustom && <span className="shrink-0 text-chip text-muted-foreground/60">직접 추가</span>}
                    </button>
                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => removeCustomDoc(d)}
                        title="삭제"
                        aria-label="삭제"
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 w-6 h-6 flex items-center justify-center rounded text-muted-foreground/60 hover:text-destructive hover:bg-muted"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            {allDocs.length === 0 && !addingDoc && (
              <p className="text-chip text-muted-foreground/60 mt-1">
                공고에 명시된 제출 서류가 없어요. 우측 상단 <span className="inline-flex items-center align-middle"><Plus className="w-3 h-3" /></span> 로 직접 추가할 수 있어요.
              </p>
            )}

            {/* 공고에 없는 서류 직접 추가 — 목록 행처럼 자연스러운 입력 + 체크로 확인 */}
            {addingDoc && (
              <div className="flex items-center gap-2.5 px-2 py-1.5 -mx-2">
                <span className="shrink-0 w-4 h-4 rounded-[5px] border border-dashed border-border bg-background" />
                <input
                  autoFocus
                  value={newDoc}
                  onChange={(e) => setNewDoc(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addCustomDoc(); }
                    if (e.key === "Escape") { setNewDoc(""); setAddingDoc(false); }
                  }}
                  onBlur={() => { if (!newDoc.trim()) setAddingDoc(false); }}
                  placeholder="준비 서류 추가 (예: 포트폴리오, 경력증명서)"
                  className="flex-1 min-w-0 bg-transparent border-0 outline-none p-0 text-body text-foreground placeholder:text-muted-foreground/50"
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={addCustomDoc}
                  disabled={!newDoc.trim()}
                  aria-label="추가"
                  title="추가"
                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-pickd-green hover:bg-pickd-green-light transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </Section>

          {/* 6 · 자기소개서 (맨 아래) — 공고 원문은 상단 '원문 보기' 버튼 → 우측 슬라이드 패널 */}
          <Section
            n={6}
            title="자기소개서"
            subtitle={`${job.essays.length}문항`}
          >
            {job.essays.length === 0 ? (
              <p className="text-body text-muted-foreground px-2 py-3">이 공고는 별도 문항이 없어요</p>
            ) : (
              <ol className="divide-y divide-border">
                {job.essays.map((e: any, idx: number) => (
                  <li
                    key={e.no}
                    ref={(el) => { essayRefs.current[idx] = el; }}
                    className="py-5 first:pt-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-chip font-semibold text-muted-foreground tabular-nums">Q{e.no}</span>
                          <EssayStatus status={e.status} />
                          <span className="text-chip text-muted-foreground">
                            {e.charLimit.toLocaleString()}자{e.updated ? ` · 수정 ${e.updated}` : ""}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-relaxed select-text">{e.question}</p>
                        {e.preview ? (
                          <p className="mt-1.5 text-body text-muted-foreground leading-relaxed whitespace-pre-wrap select-text">{e.preview}</p>
                        ) : e.status === "미작성" ? (
                          <p className="mt-1 text-xs text-muted-foreground/50">아직 작성된 내용이 없어요</p>
                        ) : null}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className={cn(
                          "shrink-0 h-8 text-xs gap-1 whitespace-nowrap rounded-md border-border",
                          (e.status === "작성중" || e.status === "초안")
                            ? "text-primary hover:text-primary"
                            : "text-muted-foreground"
                        )}
                        onClick={() => goToTab3(e.no)}
                      >
                        <PenLine className="w-3 h-3" />
                        {e.status === "완료" ? "수정" : e.status === "미작성" ? "작성하기" : "이어서 작성하기"}
                      </Button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Section>
          </>)}
        </div>
        </div>

        {/* Right slide panel: 공고 원문 (좌우 대조용) */}
        <aside
          className={cn(
            "border-l border-border flex flex-col shrink-0 transition-all duration-300 overflow-hidden bg-white",
            rawOpen ? "w-[440px]" : "w-0"
          )}
        >
          {rawOpen && (
            <div className="flex flex-col h-full w-[440px]">
              <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center justify-between shrink-0 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center shrink-0">
                    <ScrollText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-body font-semibold text-foreground leading-tight">공고 원문</p>
                    <p className="text-chip text-muted-foreground truncate">{job.company} · 추출된 원본</p>
                  </div>
                </div>
                <button
                  onClick={() => setRawOpen(false)}
                  aria-label="원문 닫기"
                  className="w-7 h-7 rounded-md hover:bg-muted border border-transparent hover:border-border text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {noticePdfUrl ? (
                <iframe
                  src={noticePdfUrl}
                  title="공고 원문 PDF"
                  className="flex-1 w-full border-0 bg-white"
                />
              ) : (
              <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
                <pre className="text-xs leading-[1.85] text-foreground/80 whitespace-pre-wrap font-mono select-text">
                  {job.rawSource}
                </pre>
              </div>
              )}

              <div className="px-5 py-3 border-t border-border bg-muted/20 shrink-0 flex items-center justify-between gap-2">
                <CopyButton always label="전체 복사" text={job.rawSource} />
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-chip text-primary hover:underline font-medium"
                >
                  원문 사이트 열기
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
