import { useState, useMemo, useEffect, useRef } from "react";
import type React from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  Columns3,
  Check,
  X,
  Search,
  EyeOff,
  Table as TableIcon,
  RotateCcw,
  Star,
  GripVertical,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  ArrowDownAZ,
  CalendarPlus,
  CalendarMinus,
  Clock,
  ChevronRight,
  ChevronUp,
  LayoutGrid,
  Folder,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useResizableCols, ResizeHandle } from "@/hooks/useResizableCols";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { StatusManagementModal, type AppStage, type FinalResult } from "./StatusManagementModal";
import { DocumentStatusList } from "./DocumentStatusList";
import { StatusBadge, DdayChip } from "@/components/pickd/ds";

// ── 컬럼 최소 너비 (제목 + 내용 기준) ───────────────────────────
const COL_MIN_WIDTHS: Record<string, number> = {
  company: 80,
  title: 140,
  role: 80,
  employType: 80,
  industry: 80,
  status: 100,
  deadline: 100,
  dday: 70,
  linked: 90,
  updated: 80,
  registeredAt: 90,
};

// ── 타입 ──────────────────────────────────────────────────────────
type StatusType = "작성 중" | "결과 대기" | "필기 전형" | "면접 전형" | "최종 결과";
const ACTIVE_STATUSES: StatusType[] = ["작성 중", "결과 대기", "필기 전형", "면접 전형"];
const STATUS_OPTIONS: StatusType[] = [...ACTIVE_STATUSES, "최종 결과"];

const STATUS_DS_KEY: Record<StatusType, "draft" | "applied" | "test" | "interview" | "hold"> = {
  "작성 중": "draft",
  "결과 대기": "applied",
  "필기 전형": "test",
  "면접 전형": "interview",
  "최종 결과": "hold",
};

const FINAL_RESULT_DS_KEY: Record<NonNullable<FinalResult>, "passed" | "rejected" | "hold"> = {
  합격: "passed",
  불합격: "rejected",
  포기: "hold",
};

type Job = {
  id: string;
  slug: string;
  company: string;
  title: string;
  role: string;
  employType: string;
  industry: string;
  deadline: string;
  dday: number;
  status: StatusType;
  finalResult: FinalResult;
  linked: { schedules: number; todos: number };
  starred: boolean;
  updatedAt: string;
  registeredAt: string;
  stage: AppStage;
  completedAt?: string;
};

const initialJobData: Job[] = [
  {
    id: "j1",
    slug: "naver",
    company: "네이버",
    title: "프론트엔드 개발자",
    role: "프론트엔드",
    employType: "신입",
    industry: "IT/테크",
    deadline: "2026-04-18",
    dday: 6,
    status: "작성 중",
    finalResult: null,
    linked: { schedules: 1, todos: 2 },
    starred: false,
    updatedAt: "2시간 전",
    registeredAt: "2026-04-01",
    stage: "작성 중",
  },
  {
    id: "j2",
    slug: "kakao",
    company: "카카오",
    title: "백엔드 엔지니어",
    role: "백엔드",
    employType: "신입",
    industry: "IT/테크",
    deadline: "2026-04-15",
    dday: 3,
    status: "작성 중",
    finalResult: null,
    linked: { schedules: 2, todos: 1 },
    starred: true,
    updatedAt: "3시간 전",
    registeredAt: "2026-04-02",
    stage: "작성 중",
  },
  {
    id: "j3",
    slug: "toss",
    company: "토스",
    title: "Product Designer",
    role: "디자인",
    employType: "인턴",
    industry: "핀테크",
    deadline: "2026-04-14",
    dday: 2,
    status: "작성 중",
    finalResult: null,
    linked: { schedules: 1, todos: 3 },
    starred: true,
    updatedAt: "1시간 전",
    registeredAt: "2026-04-03",
    stage: "작성 중",
  },
  {
    id: "j4",
    slug: "samsung",
    company: "삼성전자",
    title: "SW 엔지니어",
    role: "풀스택",
    employType: "신입",
    industry: "제조/전자",
    deadline: "2026-04-20",
    dday: 8,
    status: "결과 대기",
    finalResult: null,
    linked: { schedules: 0, todos: 1 },
    starred: false,
    updatedAt: "어제",
    registeredAt: "2026-03-28",
    stage: "결과 대기",
  },
  {
    id: "j5",
    slug: "coupang",
    company: "쿠팡",
    title: "데이터 분석가",
    role: "데이터",
    employType: "경력",
    industry: "이커머스",
    deadline: "2026-04-10",
    dday: -2,
    status: "최종 결과",
    finalResult: "불합격",
    linked: { schedules: 0, todos: 0 },
    starred: false,
    updatedAt: "3일 전",
    registeredAt: "2026-03-20",
    stage: "최종 결과",
    completedAt: "2026-04-10",
  },
  {
    id: "j6",
    slug: "line",
    company: "라인",
    title: "iOS 개발자",
    role: "모바일",
    employType: "신입",
    industry: "IT/테크",
    deadline: "2026-04-22",
    dday: 10,
    status: "면접 전형",
    finalResult: null,
    linked: { schedules: 1, todos: 0 },
    starred: false,
    updatedAt: "5일 전",
    registeredAt: "2026-03-25",
    stage: "면접 전형",
  },
];

// ── 컬럼 정의 ──────────────────────────────────────────────────────
type ColumnKey =
  | "employType"
  | "role"
  | "industry"
  | "deadline"
  | "dday"
  | "status"
  | "linked"
  | "updated"
  | "registeredAt";

const ALL_COLUMNS: { key: ColumnKey; label: string; defaultVisible: boolean }[] = [
  { key: "role", label: "직무", defaultVisible: true },
  { key: "employType", label: "고용형태", defaultVisible: true },
  { key: "status", label: "현재 상태", defaultVisible: true },
  { key: "deadline", label: "마감일", defaultVisible: true },
  { key: "dday", label: "D-day", defaultVisible: true },
  { key: "linked", label: "일정/할 일", defaultVisible: true },
  { key: "industry", label: "산업", defaultVisible: false },
  { key: "updated", label: "최근 수정일", defaultVisible: false },
  { key: "registeredAt", label: "등록일", defaultVisible: false },
];

const DEFAULT_WIDTHS: Record<string, number> = {
  company: 110,
  title: 200,
  role: 90,
  employType: 80,
  industry: 90,
  status: 110,
  deadline: 110,
  dday: 75,
  linked: 100,
  updated: 100,
  registeredAt: 95,
};

// ── 정렬 옵션 ──────────────────────────────────────────────────────
type SortOption = { label: string; key: keyof Job | "dday"; dir: "asc" | "desc"; icon: React.ElementType };
const SORT_OPTIONS: SortOption[] = [
  { label: "마감일 가까운 순", key: "dday", dir: "asc", icon: ArrowUpNarrowWide },
  { label: "마감일 먼 순", key: "dday", dir: "desc", icon: ArrowDownWideNarrow },
  { label: "최근 등록 순", key: "registeredAt", dir: "desc", icon: CalendarPlus },
  { label: "오래된 등록 순", key: "registeredAt", dir: "asc", icon: CalendarMinus },
  { label: "최근 수정 순", key: "updatedAt", dir: "desc", icon: Clock },
  { label: "기업명 가나다 순", key: "company", dir: "asc", icon: ArrowDownAZ },
];

const FILTER_CHIPS = ["전체", "★", "마감임박", "|", "작성 중", "결과 대기", "필기 전형", "면접 전형"];
const ROW_CAP = 8;

function lsGet<T>(k: string, fb: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fb;
  } catch {
    return fb;
  }
}

// ── 칸반: 최종결과 드롭 팝업 ──────────────────────────────────────
function FinalResultPicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (r: NonNullable<FinalResult>) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20">
      <div className="bg-card border border-border rounded-xl p-5 shadow-lg w-72">
        <p className="text-sm font-semibold text-foreground mb-1">최종 결과 선택</p>
        <p className="text-[11px] text-muted-foreground mb-4">결과를 선택하면 완료된 공고로 이동합니다.</p>
        <div className="flex gap-2">
          {(["합격", "불합격", "포기"] as NonNullable<FinalResult>[]).map((r) => (
            <button
              key={r}
              onClick={() => onSelect(r)}
              className={cn(
                "flex-1 py-2 rounded-md text-[12px] font-medium border transition-colors hover:opacity-80",
                r === "합격"
                  ? "border-pickd-green/40 bg-pickd-green-light text-pickd-green"
                  : r === "불합격"
                    ? "border-pickd-red/40 bg-pickd-red-light text-pickd-red"
                    : "border-border bg-muted text-muted-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-3 w-full text-[11px] text-muted-foreground hover:text-foreground">
          취소
        </button>
      </div>
    </div>
  );
}

// ── 폴더 SVG 아이콘 ────────────────────────────────────────────────
function FolderSvgIcon() {
  const c = { body: "#f1f5f9", tab: "#e2e8f0", stroke: "#94a3b8" };

  return (
    <svg width="52" height="44" viewBox="0 0 52 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* folder body */}
      <path
        d="M3 16 L3 39 Q3 41 5 41 L47 41 Q49 41 49 39 L49 18 Q49 16 47 16 L26 16 Q24 16 23 14 L21 10 Q20 8 18 8 L5 8 Q3 8 3 10 Z"
        fill={c.body} stroke={c.stroke} strokeWidth="1.4" strokeLinejoin="round"
      />
      {/* folder tab shading */}
      <path
        d="M3 10 Q3 8 5 8 L18 8 Q20 8 21 10 L23 14 Q24 16 26 16 L3 16 Z"
        fill={c.tab}
      />
    </svg>
  );
}

// ── 완료된 공고 섹션 ───────────────────────────────────────────────
function CompletedJobsSection({ jobs }: { jobs: Job[] }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"file" | "card">("file");

  if (jobs.length === 0) return null;

  return (
    <section className="bg-card border border-border rounded-xl overflow-hidden">
      <div className={cn("px-4 pt-2 pb-1.5 flex items-center justify-between", !open && "border-b border-border")}>
        <button onClick={() => setOpen((p) => !p)} className="flex items-center gap-2 flex-1 text-left">
          <ChevronRight
            className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0", open && "rotate-90")}
          />
          <span className="text-sm font-semibold text-foreground">완료된 공고</span>
          <span className="text-[11px] text-muted-foreground">{jobs.length}건</span>
        </button>
        <div className="inline-flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-md border border-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setView("file")}
                aria-label="폴더형"
                className={cn(
                  "inline-flex items-center justify-center w-5 h-5 rounded transition-colors",
                  view === "file" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Folder className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">폴더형</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setView("card")}
                aria-label="카드형"
                className={cn(
                  "inline-flex items-center justify-center w-5 h-5 rounded transition-colors",
                  view === "card" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutGrid className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">카드형</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-3">
          {view === "file" ? (
            <div className="flex flex-wrap gap-1">
              {jobs.map((job) => {
                const year = job.completedAt ? new Date(job.completedAt).getFullYear() : new Date().getFullYear();
                const label = `${job.company} ${job.role}`;
                return (
                  <div
                    key={job.id}
                    className="flex flex-col items-center gap-1.5 w-[80px] py-3 px-1 rounded-lg select-none hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="relative">
                      <FolderSvgIcon />
                    </div>
                    <div className="flex flex-col items-center gap-0.5 w-full">
                      <span className="text-[9px] text-muted-foreground/60 leading-none tabular-nums">{year}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight text-center line-clamp-2 w-full px-0.5">
                        {job.company}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {jobs.map((job) => (
                <div key={job.id} className="bg-background border border-border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{job.company}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{job.role} {job.employType}</p>
                    </div>
                    {job.finalResult && (
                      <span className="text-[11px] text-muted-foreground shrink-0 font-medium">{job.finalResult}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 truncate">{job.title}</p>
                  {job.completedAt && (
                    <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">결과 확인일 {job.completedAt}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ── 칸반 뷰 (드래그앤드롭) ─────────────────────────────────────────
const COL_THEME: Record<StatusType, { bg: string; text: string; dot: string; border: string }> = {
  "작성 중":   { bg: "bg-muted/60",          text: "text-foreground/70", dot: "bg-muted-foreground/40", border: "border-l-muted-foreground/30" },
  "결과 대기": { bg: "bg-pickd-blue-light",   text: "text-pickd-blue",    dot: "bg-pickd-blue",          border: "border-l-pickd-blue" },
  "필기 전형": { bg: "bg-pickd-purple-light", text: "text-pickd-purple",  dot: "bg-pickd-purple",        border: "border-l-pickd-purple" },
  "면접 전형": { bg: "bg-pickd-orange-light", text: "text-pickd-orange",  dot: "bg-pickd-orange",        border: "border-l-pickd-orange" },
  "최종 결과": { bg: "bg-pickd-green-light",  text: "text-pickd-green",   dot: "bg-pickd-green",         border: "border-l-pickd-green" },
};

const KANBAN_COL_CAP = 8;

function KanbanView({
  jobs,
  onMove,
  onSelect,
}: {
  jobs: Job[];
  onMove: (jobId: string, toStatus: StatusType, finalResult?: NonNullable<FinalResult>) => void;
  onSelect: (job: Job) => void;
}) {
  const dragId = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [overCol, setOverCol] = useState<StatusType | null>(null);
  const [finalPickTarget, setFinalPickTarget] = useState<string | null>(null);
  const [expandedCols, setExpandedCols] = useState<Set<StatusType>>(new Set());

  // 드래그 중 컨테이너 가장자리에 가까워지면 자동으로 가로 스크롤 — 화면 밖으로 밀려난
  // "필기 전형" / "최종 결과" 컬럼에도 드롭할 수 있게 해줌
  const handleContainerDragOver = (e: React.DragEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const edge = 64;
    if (e.clientX - rect.left < edge) {
      el.scrollLeft -= 18;
    } else if (rect.right - e.clientX < edge) {
      el.scrollLeft += 18;
    }
  };

  const byStatus = useMemo(() => {
    const m: Record<StatusType, Job[]> = {
      "작성 중": [],
      "결과 대기": [],
      "필기 전형": [],
      "면접 전형": [],
      "최종 결과": [],
    };
    jobs.forEach((j) => {
      m[j.status]?.push(j);
    });
    return m;
  }, [jobs]);

  const toggleColExpand = (col: StatusType) =>
    setExpandedCols((p) => {
      const n = new Set(p);
      n.has(col) ? n.delete(col) : n.add(col);
      return n;
    });

  return (
    <>
      <div ref={scrollRef} onDragOver={handleContainerDragOver} className="flex gap-4 p-5 overflow-x-auto min-h-[320px]">
        {STATUS_OPTIONS.map((col) => {
          const theme = COL_THEME[col];
          const colJobs = byStatus[col];
          const isExpanded = expandedCols.has(col);
          const visibleColJobs = isExpanded ? colJobs : colJobs.slice(0, KANBAN_COL_CAP);
          return (
            <div
              key={col}
              className={cn(
                "flex-1 min-w-[180px] max-w-[240px] rounded-xl border-2 border-transparent bg-muted/15 p-2 transition-colors",
                overCol === col && col === "최종 결과" && "border-pickd-orange/40 bg-pickd-orange/5",
                overCol === col && col !== "최종 결과" && "border-primary/30 bg-primary/5",
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(col);
              }}
              onDragLeave={() => setOverCol(null)}
              onDrop={(e) => {
                e.preventDefault();
                setOverCol(null);
                const id = dragId.current;
                dragId.current = null;
                if (!id) return;
                if (col === "최종 결과") {
                  setFinalPickTarget(id);
                } else {
                  onMove(id, col);
                }
              }}
            >
              <div className={cn("flex items-center gap-2 px-2.5 py-2 mb-2 rounded-lg", theme.bg)}>
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", theme.dot)} />
                <span className={cn("text-[12.5px] font-semibold flex-1 truncate", theme.text)}>{col}</span>
                <span className={cn("text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full bg-card/70 shrink-0", theme.text)}>
                  {colJobs.length}
                </span>
              </div>
              {overCol === col && col === "최종 결과" && (
                <p className="px-2 -mt-1 mb-1.5 text-[10px] text-pickd-orange">놓으면 결과를 선택하게 돼요</p>
              )}
              <div className="space-y-2">
                {visibleColJobs.map((job) => (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={(e) => {
                      dragId.current = job.id;
                      e.dataTransfer.setData("text/plain", job.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => {
                      dragId.current = null;
                    }}
                    onClick={() => onSelect(job)}
                    className={cn(
                      "bg-card border border-border border-l-[3px] rounded-lg p-3.5 cursor-grab active:cursor-grabbing hover:border-primary/30 hover:bg-muted/30 transition-colors",
                      theme.border,
                    )}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-[12.5px] font-semibold text-foreground truncate">{job.company}</span>
                      {job.starred && <Star className="w-3 h-3 fill-current text-pickd-orange shrink-0 mt-0.5" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{job.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{job.employType}</p>
                    {col !== "최종 결과" && (
                      <div className="mt-1.5">
                        <DdayChip days={job.dday} size="sm" />
                      </div>
                    )}
                    {col === "최종 결과" && job.finalResult && (
                      <div className="mt-1.5">
                        <StatusBadge status={FINAL_RESULT_DS_KEY[job.finalResult]} size="sm" />
                      </div>
                    )}
                  </div>
                ))}
                {colJobs.length === 0 && (
                  <div className="px-2 py-4 text-center text-[11px] text-muted-foreground/50">
                    공고 없음
                  </div>
                )}
                {colJobs.length > KANBAN_COL_CAP && (
                  <button
                    onClick={() => toggleColExpand(col)}
                    className="w-full text-[10.5px] font-medium text-muted-foreground hover:text-foreground py-1.5 text-center"
                  >
                    {isExpanded ? "접기" : `더보기 +${colJobs.length - KANBAN_COL_CAP}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <FinalResultPicker
        open={!!finalPickTarget}
        onClose={() => setFinalPickTarget(null)}
        onSelect={(r) => {
          if (finalPickTarget) onMove(finalPickTarget, "최종 결과", r);
          setFinalPickTarget(null);
        }}
      />
    </>
  );
}

// ── ColHeaderFilter ────────────────────────────────────────────────
type ColFilter = { kind: "select"; values: string[] } | { kind: "text"; q: string };

function ColHeaderFilter({
  colKey,
  colFilters,
  setColFilter,
  sortBy,
  setSortBy,
}: {
  colKey: string;
  colFilters: Record<string, ColFilter>;
  setColFilter: (k: string, f: ColFilter | null) => void;
  sortBy: { key: string; dir: "asc" | "desc" } | null;
  setSortBy: (v: { key: string; dir: "asc" | "desc" } | null) => void;
}) {
  const active = !!colFilters[colKey];
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
      }}
      aria-label="필터"
      className={cn(
        "inline-flex items-center justify-center w-3 h-3 rounded transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground/40 hover:text-muted-foreground opacity-60 hover:opacity-100",
      )}
    >
      <ChevronDown className="w-2.5 h-2.5" />
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export function JobPostingTable() {
  const [jobs, setJobs] = useState<Job[]>(initialJobData);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("전체");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"table" | "kanban">("table");
  const [modalJobId, setModalJobId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>(SORT_OPTIONS[0]);
  const [tableExpanded, setTableExpanded] = useState(false);
  const [colFilters] = useState<Record<string, ColFilter>>({});
  const [sortBy] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  // 컬럼 표시
  const [visibleCols, setVisibleCols] = useState<Set<ColumnKey>>(() => {
    const raw = lsGet<ColumnKey[]>("pickd.jobs.visibleCols", []);
    if (raw.length) return new Set(raw);
    return new Set(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key));
  });
  useEffect(() => {
    try {
      localStorage.setItem("pickd.jobs.visibleCols", JSON.stringify([...visibleCols]));
    } catch {}
  }, [visibleCols]);
  const isVisible = (k: ColumnKey) => visibleCols.has(k);
  const toggleCol = (k: ColumnKey) =>
    setVisibleCols((p) => {
      const n = new Set(p);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  // 컬럼 너비 (최소 너비 적용)
  const { widths: rawWidths, onMouseDown } = useResizableCols("pickd.jobs.colWidths", DEFAULT_WIDTHS);
  const widths = useMemo(() => {
    const result: Record<string, number> = {};
    for (const key of Object.keys(rawWidths)) {
      result[key] = Math.max(rawWidths[key] ?? DEFAULT_WIDTHS[key] ?? 80, COL_MIN_WIDTHS[key] ?? 60);
    }
    return result;
  }, [rawWidths]);

  // 컬럼 순서 드래그
  const [colOrder, setColOrder] = useState<ColumnKey[]>(() => {
    const saved = lsGet<ColumnKey[]>("pickd.jobs.colOrder", []);
    if (saved.length === ALL_COLUMNS.length) return saved;
    return ALL_COLUMNS.map((c) => c.key);
  });
  useEffect(() => {
    try {
      localStorage.setItem("pickd.jobs.colOrder", JSON.stringify(colOrder));
    } catch {}
  }, [colOrder]);
  const dragColRef = useRef<number | null>(null);
  const [overColIdx, setOverColIdx] = useState<number | null>(null);
  const orderedCols = useMemo(
    () => colOrder.map((k) => ALL_COLUMNS.find((c) => c.key === k)!).filter(Boolean),
    [colOrder],
  );
  const handleColDragStart = (i: number) => {
    dragColRef.current = i;
  };
  const handleColDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    setOverColIdx(i);
  };
  const handleColDrop = (i: number) => {
    const from = dragColRef.current;
    dragColRef.current = null;
    setOverColIdx(null);
    if (from === null || from === i) return;
    const next = [...colOrder];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    setColOrder(next);
  };

  // 지원중 vs 완료 분리
  const activeJobs = useMemo(() => jobs.filter((j) => ACTIVE_STATUSES.includes(j.status)), [jobs]);
  const completedJobs = useMemo(() => jobs.filter((j) => j.status === "최종 결과"), [jobs]);

  // 정렬
  const sortedActive = useMemo(() => {
    return [...activeJobs].sort((a, b) => {
      const { key, dir } = sortOption;
      const av = a[key as keyof Job] ?? "";
      const bv = b[key as keyof Job] ?? "";
      const cmp = String(av).localeCompare(String(bv), "ko", { numeric: true });
      return dir === "asc" ? cmp : -cmp;
    });
  }, [activeJobs, sortOption]);

  // 검색 (칩 필터 적용 전) — 칩별 카운트 산출용
  const searchedActive = useMemo(() => {
    return sortedActive.filter((j) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return j.company.toLowerCase().includes(q) || j.title.toLowerCase().includes(q);
    });
  }, [sortedActive, search]);

  const chipCount = (f: string) => {
    if (f === "전체") return searchedActive.length;
    if (f === "★") return searchedActive.filter((j) => j.starred).length;
    if (f === "마감임박") return searchedActive.filter((j) => j.dday > 0 && j.dday <= 3).length;
    return searchedActive.filter((j) => j.status === f).length;
  };

  // 필터
  const filtered = useMemo(() => {
    return searchedActive.filter((j) => {
      if (activeFilter === "★") return j.starred;
      if (activeFilter === "마감임박") return j.dday > 0 && j.dday <= 3;
      if (activeFilter !== "전체") return j.status === activeFilter;
      return true;
    });
  }, [searchedActive, activeFilter]);

  // 필터/검색이 바뀌면 펼침 상태 초기화 — 목록 길이가 들쭉날쭉해지는 것을 방지
  useEffect(() => setTableExpanded(false), [activeFilter, search]);

  // 8개까지만 기본 노출, 나머지는 "더보기"로 — 결과 수가 줄어도 영역 높이는 유지됨
  const visibleJobs = useMemo(
    () => (tableExpanded ? filtered : filtered.slice(0, ROW_CAP)),
    [filtered, tableExpanded],
  );

  const allSelected = filtered.length > 0 && filtered.every((j) => selected.has(j.id));
  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((j) => j.id)));
  };

  const toggleStarred = (id: string) => setJobs((p) => p.map((j) => (j.id === id ? { ...j, starred: !j.starred } : j)));

  const updateDeadline = (id: string, v: string) =>
    setJobs((p) => p.map((j) => (j.id === id ? { ...j, deadline: v } : j)));

  // 상태 변경 (칸반 드래그 포함)
  const moveJob = (jobId: string, toStatus: StatusType, finalResult?: NonNullable<FinalResult>) => {
    setJobs((p) =>
      p.map((j) => {
        if (j.id !== jobId) return j;
        if (toStatus === "최종 결과" && finalResult) {
          return {
            ...j,
            status: toStatus,
            stage: toStatus,
            finalResult,
            completedAt: new Date().toISOString().split("T")[0],
          };
        }
        return { ...j, status: toStatus, stage: toStatus };
      }),
    );
  };

  // 모달
  const modalJob = modalJobId ? (jobs.find((j) => j.id === modalJobId) ?? null) : null;

  const handleStageChange = (stage: AppStage) => {
    if (!modalJobId) return;
    setJobs((p) => p.map((j) => (j.id === modalJobId ? { ...j, status: stage as StatusType, stage } : j)));
  };
  const handleFinalResultChange = (result: FinalResult) => {
    if (!modalJobId) return;
    setJobs((p) =>
      p.map((j) => {
        if (j.id !== modalJobId) return j;
        if (result)
          return {
            ...j,
            finalResult: result,
            status: "최종 결과",
            stage: "최종 결과",
            completedAt: new Date().toISOString().split("T")[0],
          };
        return { ...j, finalResult: null };
      }),
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* ── 공고 테이블 카드 ─────────────────────────────────── */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="px-3 py-1.5 border-b border-border flex items-center gap-2">
            {/* 정렬 — 칸반 보기에서는 적용되지 않으므로 표 보기에서만 노출 */}
            {view === "table" && (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted border border-border">
                        <sortOption.icon className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {sortOption.label}
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-[152px]">
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
                    정렬 기준
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {SORT_OPTIONS.map((opt) => (
                    <DropdownMenuItem
                      key={opt.label}
                      className="text-xs flex items-center justify-between"
                      onClick={() => setSortOption(opt)}
                    >
                      {opt.label}
                      {sortOption.label === opt.label && <Check className="w-3.5 h-3.5 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* 보기 전환 */}
            <div className="inline-flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-md border border-border">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setView("table")}
                    aria-label="표 보기"
                    className={cn(
                      "inline-flex items-center justify-center w-5 h-5 rounded transition-colors",
                      view === "table"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <TableIcon className="w-3 h-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  표 보기
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setView("kanban")}
                    aria-label="칸반 보기"
                    className={cn(
                      "inline-flex items-center justify-center w-5 h-5 rounded transition-colors",
                      view === "kanban"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Columns3 className="w-3 h-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  칸반 보기
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* 검색 */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="기업명 / 공고명"
                  className="h-7 w-44 pl-6 text-[12px] border-border"
                />
              </div>
              {/* 컬럼 선택 — 표 보기에서만 의미가 있어 칸반 보기에서는 숨김 */}
              {view === "table" && (
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <button
                          aria-label="표시할 컬럼"
                          className="inline-flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted border border-border"
                        >
                          <Columns3 className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      표시할 컬럼
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="min-w-[160px]">
                    <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
                      표시할 컬럼 선택
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ALL_COLUMNS.map((c) => (
                      <DropdownMenuItem
                        key={c.key}
                        onSelect={(e) => {
                          e.preventDefault();
                          toggleCol(c.key);
                        }}
                        className="text-xs flex items-center justify-between"
                      >
                        <span>{c.label}</span>
                        {isVisible(c.key) && <Check className="w-3.5 h-3.5 text-primary" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* 필터 칩 — 탭형, 칩별 카운트 표시 */}
          <div className="px-3 py-1.5 border-b border-border flex items-center gap-1.5 flex-wrap">
            {FILTER_CHIPS.map((f, i) =>
              f === "|" ? (
                <span key={`sep-${i}`} className="w-px h-3.5 bg-border mx-0.5" />
              ) : (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    "h-6 px-2 rounded-md text-[11px] font-medium transition-colors inline-flex items-center gap-1",
                    activeFilter === f
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {f === "★" ? (
                    <Star className={cn("w-3 h-3", activeFilter === f ? "fill-current text-pickd-orange" : "text-muted-foreground")} />
                  ) : (
                    f
                  )}
                  <span
                    className={cn(
                      "text-[10px] font-bold tabular-nums px-1 py-px rounded-full leading-none",
                      activeFilter === f ? "bg-card/70 text-accent-foreground" : "bg-muted text-muted-foreground/70",
                    )}
                  >
                    {chipCount(f)}
                  </span>
                </button>
              ),
            )}
          </div>

          {/* 칸반 / 테이블 */}
          {view === "kanban" ? (
            <KanbanView
              jobs={[...activeJobs, ...completedJobs]}
              onMove={(id, status, fr) => moveJob(id, status, fr)}
              onSelect={(j) => setModalJobId(j.id)}
            />
          ) : (
            <>
            <div className="overflow-x-auto" style={{ minHeight: 404 }}>
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-[12px] text-foreground/70 select-none">
                    <th className="w-9 px-3 py-1.5">
                      <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} className="h-3.5 w-3.5" />
                    </th>
                    <th className="w-9 px-2 py-1.5 text-center">★</th>
                    {/* 기업명 — 고정 */}
                    <th
                      className="relative text-left px-3 py-1.5 font-semibold"
                      style={{ width: widths.company, minWidth: COL_MIN_WIDTHS.company }}
                    >
                      기업명 <ResizeHandle onMouseDown={onMouseDown("company")} />
                    </th>
                    {/* 공고명 — 고정 */}
                    <th
                      className="relative text-left px-3 py-1.5 font-semibold"
                      style={{ width: widths.title, minWidth: COL_MIN_WIDTHS.title }}
                    >
                      공고명 <ResizeHandle onMouseDown={onMouseDown("title")} />
                    </th>
                    {/* 드래그 가능 컬럼 */}
                    {orderedCols
                      .filter((c) => isVisible(c.key))
                      .map((col, i) => {
                        const isOver = overColIdx === i;
                        const w = Math.max(widths[col.key] ?? 100, COL_MIN_WIDTHS[col.key] ?? 60);
                        return (
                          <th
                            key={col.key}
                            draggable
                            onDragStart={() => handleColDragStart(i)}
                            onDragOver={(e) => handleColDragOver(e, i)}
                            onDrop={() => handleColDrop(i)}
                            onDragEnd={() => {
                              dragColRef.current = null;
                              setOverColIdx(null);
                            }}
                            style={{ width: w, minWidth: COL_MIN_WIDTHS[col.key] ?? 60 }}
                            className={cn(
                              "relative text-left px-3 py-1.5 font-semibold cursor-grab",
                              isOver && "bg-primary/10",
                              ["dday", "linked"].includes(col.key) && "text-center",
                            )}
                          >
                            <span className="inline-flex items-center gap-1">
                              <GripVertical className="w-2.5 h-2.5 opacity-25 shrink-0" />
                              {col.label}
                            </span>
                            <ResizeHandle onMouseDown={onMouseDown(col.key)} />
                          </th>
                        );
                      })}
                  </tr>
                </thead>
                <tbody>
                  {visibleJobs.map((job) => (
                    <tr
                      key={job.id}
                      className={cn(
                        "border-b border-border/50 hover:bg-muted/30 transition-colors",
                        selected.has(job.id) && "bg-accent/20",
                      )}
                    >
                      {/* 체크박스 */}
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.has(job.id)}
                          onCheckedChange={() => {
                            setSelected((p) => {
                              const n = new Set(p);
                              n.has(job.id) ? n.delete(job.id) : n.add(job.id);
                              return n;
                            });
                          }}
                          className="h-3.5 w-3.5"
                        />
                      </td>
                      {/* 별표 */}
                      <td className="px-2 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => toggleStarred(job.id)} aria-label="관심 공고">
                          <Star
                            className={cn(
                              "w-3.5 h-3.5 transition-colors",
                              job.starred
                                ? "fill-current text-pickd-orange"
                                : "text-muted-foreground/30 hover:text-muted-foreground/60",
                            )}
                          />
                        </button>
                      </td>
                      {/* 기업명 — 반응 없음, tooltip */}
                      <td
                        className="px-3 py-2.5 font-medium text-foreground"
                        style={{ minWidth: COL_MIN_WIDTHS.company }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block truncate">{job.company}</span>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">{job.company}</TooltipContent>
                        </Tooltip>
                      </td>
                      {/* 공고명 — 클릭 시 공고 상세 페이지로 이동 */}
                      <td className="px-3 py-2.5 text-foreground" style={{ minWidth: COL_MIN_WIDTHS.title }}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              to={`/jobs/${job.slug}`}
                              className="block truncate text-foreground hover:text-primary hover:underline underline-offset-2 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {job.title}
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">{job.title} — 공고 상세 보기</TooltipContent>
                        </Tooltip>
                      </td>
                      {/* 드래그 가능 컬럼 셀 */}
                      {orderedCols
                        .filter((c) => isVisible(c.key))
                        .map((col) => {
                          switch (col.key) {
                            case "role":
                              return (
                                <td
                                  key="role"
                                  className="px-3 py-2.5 text-muted-foreground text-xs"
                                  style={{ minWidth: COL_MIN_WIDTHS.role }}
                                >
                                  <span className="block truncate">{job.role}</span>
                                </td>
                              );
                            case "employType":
                              return (
                                <td
                                  key="employType"
                                  className="px-3 py-2.5 text-muted-foreground text-xs"
                                  style={{ minWidth: COL_MIN_WIDTHS.employType }}
                                >
                                  {job.employType}
                                </td>
                              );
                            case "industry":
                              return (
                                <td
                                  key="industry"
                                  className="px-3 py-2.5 text-muted-foreground text-xs"
                                  style={{ minWidth: COL_MIN_WIDTHS.industry }}
                                >
                                  {job.industry}
                                </td>
                              );
                            case "status":
                              return (
                                <td key="status" className="px-3 py-2.5" style={{ minWidth: COL_MIN_WIDTHS.status }}>
                                  {/* 배지 클릭 → 모달 */}
                                  <button
                                    onClick={() => setModalJobId(job.id)}
                                    className="transition-opacity hover:opacity-75"
                                  >
                                    <StatusBadge status={STATUS_DS_KEY[job.status]} size="sm" />
                                  </button>
                                </td>
                              );
                            case "deadline":
                              return (
                                <td
                                  key="deadline"
                                  className="px-3 py-2.5"
                                  style={{ minWidth: COL_MIN_WIDTHS.deadline }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <DeadlinePicker
                                    value={job.deadline}
                                    onChange={(v) => updateDeadline(job.id, v)}
                                  />
                                </td>
                              );
                            case "dday":
                              return (
                                <td
                                  key="dday"
                                  className="px-3 py-2.5 text-center"
                                  style={{ minWidth: COL_MIN_WIDTHS.dday }}
                                >
                                  <DdayChip days={job.dday} size="sm" />
                                </td>
                              );
                            case "linked":
                              return (
                                <td
                                  key="linked"
                                  className="px-3 py-2.5 text-center text-[11px] text-muted-foreground tabular-nums cursor-pointer hover:text-foreground transition-colors"
                                  style={{ minWidth: COL_MIN_WIDTHS.linked }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setModalJobId(job.id);
                                  }}
                                  title="클릭하여 일정·할 일 편집"
                                >
                                  일정 {job.linked.schedules} · 할일 {job.linked.todos}
                                </td>
                              );
                            case "updated":
                              return (
                                <td
                                  key="updated"
                                  className="px-3 py-2.5 text-[11px] text-muted-foreground"
                                  style={{ minWidth: COL_MIN_WIDTHS.updated }}
                                >
                                  {job.updatedAt}
                                </td>
                              );
                            case "registeredAt":
                              return (
                                <td
                                  key="registeredAt"
                                  className="px-3 py-2.5 text-[11px] text-muted-foreground tabular-nums"
                                  style={{ minWidth: COL_MIN_WIDTHS.registeredAt }}
                                >
                                  {job.registeredAt}
                                </td>
                              );
                            default:
                              return null;
                          }
                        })}
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={20} className="px-4 py-10 text-center text-xs text-muted-foreground">
                        해당하는 항목이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filtered.length > ROW_CAP && (
              <div className="px-3 py-2.5 border-t border-border flex justify-center">
                <button
                  onClick={() => setTableExpanded((p) => !p)}
                  className="text-[12px] font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  {tableExpanded ? (
                    <>접기 <ChevronUp className="w-3.5 h-3.5" /></>
                  ) : (
                    <>더보기 {filtered.length - ROW_CAP}건 <ChevronDown className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>
            )}
            </>
          )}
        </div>

        {/* ── 작성중인 서류 ────────────────────────────────────── */}
        <DocumentStatusList />

        {/* ── 완료된 공고 (제일 아래, 기본 접힘) ──────────────── */}
        <CompletedJobsSection jobs={completedJobs} />

        {/* ── 지원상태 관리 모달 ───────────────────────────────── */}
        {modalJob && (
          <StatusManagementModal
            open={!!modalJob}
            onOpenChange={(o) => !o && setModalJobId(null)}
            job={{
              company: modalJob.company,
              title: modalJob.title,
              role: modalJob.role,
              deadline: modalJob.deadline,
              dday: modalJob.dday,
            }}
            currentStage={modalJob.stage}
            currentFinalResult={modalJob.finalResult}
            onStageChange={handleStageChange}
            onFinalResultChange={handleFinalResultChange}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

// ── DeadlinePicker ────────────────────────────────────────────────
function DeadlinePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState(value);

  useEffect(() => { setInputVal(value); }, [value]);

  const selected = value ? new Date(value + "T00:00:00") : undefined;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputVal(v);
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) onChange(v);
  };

  const handleInputBlur = () => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(inputVal)) onChange(inputVal);
    else setInputVal(value);
  };

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    const iso = day.toLocaleDateString("sv-SE");
    onChange(iso);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="text-xs text-muted-foreground tabular-nums hover:text-foreground transition-colors text-left w-full truncate">
          {value || "—"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="px-3 pt-3 pb-1">
          <input
            type="text"
            value={inputVal}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder="YYYY-MM-DD"
            className="w-full h-7 px-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleDaySelect}
          month={selected}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
