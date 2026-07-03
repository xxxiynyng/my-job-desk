import { useState, useMemo, useEffect, useRef } from "react";
import type React from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  Columns3,
  Check,
  X,
  Search,
  Table as TableIcon,
  Star,
  ChevronRight,
  ChevronUp,
  LayoutGrid,
  Folder,
  CalendarDays,
  CheckSquare2,
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
import { useResizableCols } from "@/hooks/useResizableCols";
import { ColumnDivider } from "@/components/table/ColumnDivider";
import { DragHandle } from "@/components/table/DragHandle";
import { HeaderCell } from "@/components/table/HeaderCell";
import { SortableColumnHeader } from "@/components/table/SortableColumnHeader";
import { BatchActionBar } from "@/components/table/BatchActionBar";
import { type ColFilterShape, type ColumnFilterProps } from "@/components/table/HeaderFilter";
import { useTableDividers } from "@/components/table/useTableDividers";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { StatusManagementModal, type AppStage, type FinalResult } from "./StatusManagementModal";
import { DocumentStatusList } from "./DocumentStatusList";
import { StatusBadge, DdayChip } from "@/components/pickd/ds";
import { StarToggle } from "@/components/table/StarToggle";
import { JobRowContextMenu, JobRowActionCell, type JobMenuStatus } from "@/components/pickd/RowContextMenu";

// ── 컬럼 최소 너비 (제목 + 내용 기준) ───────────────────────────
const COL_MIN_WIDTHS: Record<string, number> = {
  company: 80,
  title: 130,
  role: 70,
  employType: 70,
  dday: 60,
  deadline: 90,
  status: 90,
  linked: 85,
  industry: 80,
  registeredAt: 95,   // 등록일 — "2026-06-15" 한 줄 보장
  updated: 95,        // 최근 수정일
};

// 컬럼 최대 너비 — 내용보다 훨씬 넓게 드래그해서 헤더·본문 사이에 큰 빈 공백이
// 남는 것을 방지. 저장된 값이 이보다 크면 useResizableCols가 자동으로 clamp한다.
const COL_MAX_WIDTHS: Record<string, number> = {
  company: 200,
  title: 320,
  role: 160,
  employType: 140,
  dday: 120,
  deadline: 160,
  status: 160,
  linked: 160,
  industry: 160,
  registeredAt: 160,
  updated: 160,
};

// ── 타입 ──────────────────────────────────────────────────────────
// 전형 단계 6개 (2026-07-02 재편 — 지원예정·서류합격 삭제, 최종합격/불합격/보류는
// "전형완료" 단일 단계 + 세부 결과(finalResult) 배지로 구분)
type StatusType = "작성중" | "지원완료" | "서류전형" | "필기전형" | "면접전형" | "전형완료";
const ACTIVE_STATUSES: StatusType[] = ["작성중", "지원완료", "서류전형", "필기전형", "면접전형"];
const COMPLETED_STATUSES: StatusType[] = ["전형완료"];
const STATUS_OPTIONS: StatusType[] = [...ACTIVE_STATUSES, ...COMPLETED_STATUSES];

const STATUS_DS_KEY: Record<
  StatusType,
  "draft" | "applied" | "document" | "test" | "interview" | "finished"
> = {
  "작성중":   "draft",
  "지원완료": "applied",
  "서류전형": "document",
  "필기전형": "test",
  "면접전형": "interview",
  "전형완료": "finished",
};

// 전형완료의 세부 결과 → 배지 키·표시 라벨
const FINAL_RESULT_DS_KEY: Record<NonNullable<FinalResult>, "passed" | "rejected" | "hold"> = {
  합격: "passed",
  불합격: "rejected",
  포기: "hold",
};
const FINAL_RESULT_LABEL: Record<NonNullable<FinalResult>, string> = {
  합격: "최종합격",
  불합격: "불합격",
  포기: "보류",
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
  url?: string;
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
    deadline: "2026-07-01",
    dday: calcDday("2026-07-01"),
    status: "작성중",
    finalResult: null,
    linked: { schedules: 1, todos: 2 },
    starred: false,
    updatedAt: "2시간 전",
    registeredAt: "2026-06-15",
    stage: "작성중",
  },
  {
    id: "j2",
    slug: "kakao",
    company: "카카오",
    title: "백엔드 엔지니어",
    role: "백엔드",
    employType: "신입",
    industry: "IT/테크",
    deadline: "2026-07-05",
    dday: calcDday("2026-07-05"),
    status: "작성중",
    finalResult: null,
    linked: { schedules: 2, todos: 1 },
    starred: true,
    updatedAt: "3시간 전",
    registeredAt: "2026-06-16",
    stage: "작성중",
  },
  {
    id: "j3",
    slug: "toss",
    company: "토스",
    title: "Product Designer",
    role: "디자인",
    employType: "인턴",
    industry: "핀테크",
    deadline: "2026-06-30",
    dday: calcDday("2026-06-30"),
    status: "작성중",
    finalResult: null,
    linked: { schedules: 1, todos: 3 },
    starred: true,
    updatedAt: "1시간 전",
    registeredAt: "2026-06-18",
    stage: "작성중",
  },
  {
    id: "j4",
    slug: "samsung",
    company: "삼성전자",
    title: "SW 엔지니어",
    role: "풀스택",
    employType: "신입",
    industry: "제조/전자",
    deadline: "2026-07-10",
    dday: calcDday("2026-07-10"),
    status: "지원완료",
    finalResult: null,
    linked: { schedules: 0, todos: 1 },
    starred: false,
    updatedAt: "어제",
    registeredAt: "2026-06-10",
    stage: "지원완료",
  },
  {
    id: "j5",
    slug: "coupang",
    company: "쿠팡",
    title: "데이터 분석가",
    role: "데이터",
    employType: "경력",
    industry: "이커머스",
    deadline: "2026-06-15",
    dday: calcDday("2026-06-15"),
    status: "전형완료",
    finalResult: "불합격",
    linked: { schedules: 0, todos: 0 },
    starred: false,
    updatedAt: "3일 전",
    registeredAt: "2026-05-20",
    stage: "전형완료",
    completedAt: "2026-06-15",
  },
  {
    id: "j6",
    slug: "line",
    company: "라인",
    title: "iOS 개발자",
    role: "모바일",
    employType: "신입",
    industry: "IT/테크",
    deadline: "2026-07-07",
    dday: calcDday("2026-07-07"),
    status: "면접전형",
    finalResult: null,
    linked: { schedules: 1, todos: 0 },
    starred: false,
    updatedAt: "5일 전",
    registeredAt: "2026-06-05",
    stage: "면접전형",
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
  company: 90,
  title: 160,
  role: 80,
  employType: 75,
  dday: 65,
  deadline: 100,
  status: 100,
  linked: 90,
  industry: 90,
  registeredAt: 95,
  updated: 100,
};


const FILTER_CHIPS = ["전체", "★", "마감임박", "|", ...ACTIVE_STATUSES];
const ROW_CAP = 7;

function lsGet<T>(k: string, fb: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fb;
  } catch {
    return fb;
  }
}

// 마감일(YYYY-MM-DD) → 오늘 기준 남은 일수 (음수면 지남)
function calcDday(deadline: string): number {
  if (!deadline) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dl = new Date(deadline + "T00:00:00");
  return Math.round((dl.getTime() - today.getTime()) / 86400000);
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
                    <span className="inline-flex items-center gap-1 shrink-0">
                      {/* 원문 URL·파일 미등록(직접입력) 공고 표기 — 5-2 태그 칩 스타일 재사용 */}
                      {!job.url && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-500 border border-gray-100">
                          수기등록
                        </span>
                      )}
                      {job.finalResult && (
                        <span className="text-[11px] text-muted-foreground font-medium">{job.finalResult}</span>
                      )}
                    </span>
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
  "작성중":   { bg: "bg-blue-50",             text: "text-blue-700",      dot: "bg-blue-500",            border: "border-l-blue-400" },
  "지원완료": { bg: "bg-emerald-50",          text: "text-emerald-700",   dot: "bg-emerald-500",         border: "border-l-emerald-400" },
  "서류전형": { bg: "bg-sky-50",              text: "text-sky-700",       dot: "bg-sky-500",             border: "border-l-sky-400" },
  "필기전형": { bg: "bg-amber-50",            text: "text-amber-700",     dot: "bg-amber-500",           border: "border-l-amber-400" },
  "면접전형": { bg: "bg-pickd-orange-light",  text: "text-pickd-orange",  dot: "bg-pickd-orange",        border: "border-l-pickd-orange" },
  "전형완료": { bg: "bg-muted/60",            text: "text-foreground/70", dot: "bg-muted-foreground/40", border: "border-l-muted-foreground/30" },
};

const KANBAN_COL_CAP = 8;

function KanbanView({
  jobs,
  onMove,
  onSelect,
}: {
  jobs: Job[];
  onMove: (jobId: string, toStatus: StatusType) => void;
  onSelect: (job: Job) => void;
}) {
  const dragId = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [overCol, setOverCol] = useState<StatusType | null>(null);
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
    const m = Object.fromEntries(STATUS_OPTIONS.map((s) => [s, []])) as Record<StatusType, Job[]>;
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
                overCol === col && "border-primary/30 bg-primary/5",
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
                onMove(id, col);
              }}
            >
              <div className={cn("flex items-center gap-2 px-2.5 py-2 mb-2 rounded-lg", theme.bg)}>
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", theme.dot)} />
                <span className={cn("text-[12.5px] font-semibold flex-1 truncate", theme.text)}>{col}</span>
                <span className={cn("text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full bg-card/70 shrink-0", theme.text)}>
                  {colJobs.length}
                </span>
              </div>
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
                      "bg-card border border-border rounded-lg cursor-grab active:cursor-grabbing hover:shadow-sm hover:border-primary/20 transition-all group overflow-hidden",
                    )}
                  >
                    {/* 상단 컬러 바 */}
                    <div className={cn("h-0.5 w-full", theme.dot.replace("bg-", "bg-"))} />
                    <div className="p-3">
                      {/* 기업명 + 별표 */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[13px] font-bold text-foreground truncate leading-tight">{job.company}</span>
                        {job.starred && <Star className="w-3 h-3 fill-current text-pickd-orange shrink-0" />}
                      </div>
                      {/* 직무 */}
                      <p className="text-[11px] text-muted-foreground truncate leading-tight">{job.title}</p>
                      {/* 하단: 고용형태 + D-day / 결과 */}
                      <div className="flex items-center justify-between mt-2.5 gap-1">
                        <span className="text-[10px] text-muted-foreground/70 bg-muted/60 px-1.5 py-0.5 rounded-sm tabular-nums shrink-0">{job.employType}</span>
                        {!COMPLETED_STATUSES.includes(col) && <DdayChip days={calcDday(job.deadline)} size="sm" />}
                        {COMPLETED_STATUSES.includes(col) && job.finalResult && (
                          <StatusBadge status={FINAL_RESULT_DS_KEY[job.finalResult]} size="sm" />
                        )}
                      </div>
                    </div>
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

    </>
  );
}

// ── 드래그로 순서를 바꿀 수 있는 컬럼 헤더 ─────────────────────────────
// ── 탭1 행 드래그 셸 — 탭2 SortableExpRow와 동일 패턴 (tr + 그립 활성화만 담당) ──
function SortableJobRow({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: (grip: {
    setActivatorNodeRef: (el: HTMLElement | null) => void;
    listeners: ReturnType<typeof useSortable>["listeners"];
  }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes} className={className}>
      {children({ setActivatorNodeRef, listeners })}
    </tr>
  );
}

// ── 탭1 행 거터 셀 — 그립(드래그+클릭 메뉴) + 체크박스. 탭2 행 거터와 동일 구조 ──
function JobRowGutterCell({
  grip,
  job,
  checked,
  onCheckedChange,
  onStar,
  onEdit,
  onDuplicate,
  onChangeStatus,
  onDelete,
}: {
  grip: {
    setActivatorNodeRef: (el: HTMLElement | null) => void;
    listeners: ReturnType<typeof useSortable>["listeners"];
  };
  job: { starred: boolean; updatedAt: string; url?: string; status: JobMenuStatus };
  checked: boolean;
  onCheckedChange: () => void;
  onStar: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onChangeStatus: (s: JobMenuStatus) => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <td className="relative w-12 pl-1 pr-3 py-2.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
      {/* 투명 히트 영역 — 드래그하면 행 이동, 클릭(이동 없이 떼면)하면 컨텍스트 메뉴 */}
      <DragHandle
        ref={grip.setActivatorNodeRef}
        {...grip.listeners}
        icon={null}
        onClick={() => setMenuOpen(true)}
        className="absolute left-0.5 top-1/2 -translate-y-1/2 w-6 h-6 z-20 rounded"
      />
      <JobRowContextMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        job={job}
        onStar={onStar}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onChangeStatus={onChangeStatus}
        onDelete={onDelete}
      />
      <div className="ml-5">
        <Checkbox checked={checked} onCheckedChange={onCheckedChange} className="h-3.5 w-3.5" />
      </div>
    </td>
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
  const [tableExpanded, setTableExpanded] = useState(false);
  const [colSort, setColSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  // 행 순서 커스텀 정렬 (드래그, 탭2 sortOrder와 동일 개념 — 탭1 jobs는 메모리 상태라 순서만 저장)
  const [rowOrder, setRowOrder] = useState<string[]>(() => lsGet<string[]>("pickd.jobs.rowOrder", []));
  useEffect(() => {
    try {
      localStorage.setItem("pickd.jobs.rowOrder", JSON.stringify(rowOrder));
    } catch {}
  }, [rowOrder]);
  const [sortMode, setSortMode] = useState<"custom" | null>(() =>
    lsGet<string | null>("pickd.jobs.sortMode", null) === "custom" ? "custom" : null,
  );
  useEffect(() => {
    try {
      if (sortMode === "custom") localStorage.setItem("pickd.jobs.sortMode", JSON.stringify("custom"));
      else localStorage.removeItem("pickd.jobs.sortMode");
    } catch {}
  }, [sortMode]);

  const toggleColSort = (key: string) => {
    setSortMode(null);
    setColSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  // 헤더 그립 드롭다운 — 방향 직접 지정 (오름/내림/해제)
  const setSortDirect = (key: string, dir: "asc" | "desc" | null) => {
    setSortMode(null);
    setColSort(dir ? { key, dir } : null);
  };

  // ── 컬럼별 헤더 필터 (탭2와 동일한 HeaderFilter 공용 컴포넌트) ──
  const [colFilter, setColFilter] = useState<Record<string, ColFilterShape>>({});
  const setSelectFilter = (key: string, values: string[]) =>
    setColFilter((p) => {
      const n = { ...p };
      if (!values.length) delete n[key];
      else n[key] = { kind: "select", values };
      return n;
    });
  const setTextFilter = (key: string, q: string) =>
    setColFilter((p) => {
      const n = { ...p };
      if (!q.trim()) delete n[key];
      else n[key] = { kind: "text", q };
      return n;
    });

  const getColValue = (j: Job, key: string): string => {
    switch (key) {
      case "company": return j.company;
      case "title": return j.title;
      case "role": return j.role;
      case "employType": return j.employType;
      case "industry": return j.industry;
      case "status": return j.status;
      case "deadline": return j.deadline;
      case "registeredAt": return j.registeredAt;
      case "updated": return j.updatedAt;
      default: return "";
    }
  };

  // 컬럼별 필터 종류 — dday(계산값)·linked(복합값)는 필터 제외
  const FILTER_KIND: Partial<Record<string, "select" | "text">> = {
    company: "select",
    title: "text",
    role: "select",
    employType: "select",
    industry: "select",
    status: "select",
    deadline: "text",
    registeredAt: "text",
    updated: "text",
  };

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
  const { widths: rawWidths, onMouseDown, resizingKey } = useResizableCols(
    "pickd.jobs.colWidths",
    DEFAULT_WIDTHS,
    COL_MIN_WIDTHS,
    COL_MAX_WIDTHS,
  );
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
  const tableWrapRef = useRef<HTMLDivElement>(null);

  // 컬럼 고정 — 고정된 컬럼은 이동 그룹 맨 앞(왼쪽)으로 모아 유지 (탭1·탭2 공통 규칙)
  const [pinnedCols, setPinnedCols] = useState<Set<ColumnKey>>(
    () => new Set(lsGet<ColumnKey[]>("pickd.jobs.colPinned", [])),
  );
  useEffect(() => {
    try {
      localStorage.setItem("pickd.jobs.colPinned", JSON.stringify([...pinnedCols]));
    } catch {}
  }, [pinnedCols]);
  const togglePin = (k: ColumnKey) =>
    setPinnedCols((p) => {
      const n = new Set(p);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  const orderedCols = useMemo(() => {
    const cols = colOrder.map((k) => ALL_COLUMNS.find((c) => c.key === k)!).filter(Boolean);
    return [...cols.filter((c) => pinnedCols.has(c.key)), ...cols.filter((c) => !pinnedCols.has(c.key))];
  }, [colOrder, pinnedCols]);
  // 컬럼 경계 세로 구분선 — 계산값이 아니라 실제 렌더된 th 경계를 실측(useTableDividers, 탭1·탭2 공용)
  const dividerBounds = useTableDividers(tableWrapRef, [widths, orderedCols, visibleCols]);
  const dividers = dividerBounds.map((b) => ({
    key: b.key,
    left: b.left,
    onResizeMouseDown: onMouseDown(b.key),
    active: resizingKey === b.key,
  }));
  const colSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  // 컬럼 헤더 드래그(순서 변경)와 행 드래그(커스텀 정렬)를 한 DndContext에서 id로 구분 — 탭2와 동일 패턴
  const handleTableDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    if (ALL_COLUMNS.some((c) => c.key === active.id)) {
      setColOrder((prev) => {
        const oldIdx = prev.findIndex((k) => k === active.id);
        const newIdx = prev.findIndex((k) => k === over.id);
        if (oldIdx === -1 || newIdx === -1) return prev;
        return arrayMove(prev, oldIdx, newIdx);
      });
      return;
    }
    // 행 드래그 — 현재 화면 순서 기준으로 rowOrder 재부여 후 커스텀 정렬로 전환
    const displayedIds = filtered.map((j) => j.id);
    const oldIdx = displayedIds.indexOf(String(active.id));
    const newIdx = displayedIds.indexOf(String(over.id));
    if (oldIdx === -1 || newIdx === -1) return;
    const newDisplayed = arrayMove(displayedIds, oldIdx, newIdx);
    const rest = activeJobs.map((j) => j.id).filter((id) => !newDisplayed.includes(id));
    setRowOrder([...newDisplayed, ...rest]);
    setSortMode("custom");
    setColSort(null);
  };

  // 지원중 vs 완료 분리
  const activeJobs = useMemo(() => jobs.filter((j) => ACTIVE_STATUSES.includes(j.status)), [jobs]);
  const completedJobs = useMemo(() => jobs.filter((j) => COMPLETED_STATUSES.includes(j.status)), [jobs]);

  // 정렬 — 커스텀(행 드래그) > 컬럼 정렬 > 기본 순
  const sortedActive = useMemo(() => {
    if (!colSort && sortMode === "custom" && rowOrder.length) {
      const pos = new Map(rowOrder.map((id, i) => [id, i]));
      return [...activeJobs].sort((a, b) => (pos.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (pos.get(b.id) ?? Number.MAX_SAFE_INTEGER));
    }
    if (!colSort) return [...activeJobs];
    return [...activeJobs].sort((a, b) => {
      const av = a[colSort.key as keyof Job] ?? "";
      const bv = b[colSort.key as keyof Job] ?? "";
      const cmp = String(av).localeCompare(String(bv), "ko", { numeric: true });
      return colSort.dir === "asc" ? cmp : -cmp;
    });
  }, [activeJobs, colSort, sortMode, rowOrder]);

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
    if (f === "마감임박") return searchedActive.filter((j) => { const d = calcDday(j.deadline); return d > 0 && d <= 3; }).length;
    return searchedActive.filter((j) => j.status === f).length;
  };

  // 필터 (상단 칩 필터 + 컬럼별 헤더 필터 — 탭2와 동일한 파이프라인)
  const filtered = useMemo(() => {
    return searchedActive.filter((j) => {
      if (activeFilter === "★") {
        if (!j.starred) return false;
      } else if (activeFilter === "마감임박") {
        const d = calcDday(j.deadline);
        if (!(d > 0 && d <= 3)) return false;
      } else if (activeFilter !== "전체") {
        if (j.status !== activeFilter) return false;
      }
      for (const [key, f] of Object.entries(colFilter)) {
        const v = getColValue(j, key);
        if (f.kind === "select") {
          if (!f.values.includes(v)) return false;
        } else {
          if (!v.toLowerCase().includes(f.q.toLowerCase())) return false;
        }
      }
      return true;
    });
  }, [searchedActive, activeFilter, colFilter]);

  // 헤더 필터 옵션 — 지원중 목록 기준 고유값
  const distinctValues = (key: string): string[] => {
    const set = new Set<string>();
    for (const j of activeJobs) {
      const v = getColValue(j, key);
      if (v) set.add(v);
    }
    return Array.from(set).sort();
  };

  // 컬럼 키 → 컬럼 메뉴의 필터 서브메뉴 props (필터 없는 컬럼은 undefined)
  const filterPropsFor = (key: string): ColumnFilterProps | undefined => {
    const kind = FILTER_KIND[key];
    if (!kind) return undefined;
    return {
      colKey: key,
      kind,
      options: kind === "select" ? distinctValues(key) : [],
      colFilter,
      setSelectFilter,
      setTextFilter,
    };
  };

  // 필터/검색이 바뀌면 펼침 상태 초기화 — 목록 길이가 들쭉날쭉해지는 것을 방지
  useEffect(() => setTableExpanded(false), [activeFilter, search, colFilter]);


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
    setJobs((p) => p.map((j) => (j.id === id ? { ...j, deadline: v, dday: calcDday(v) } : j)));

  const deleteSelected = () => {
    setJobs((p) => p.filter((j) => !selected.has(j.id)));
    setSelected(new Set());
  };

  const duplicateJob = (id: string) => {
    const src = jobs.find((j) => j.id === id);
    if (!src) return;
    const newJob: Job = { ...src, id: `${id}-${Date.now()}`, slug: `${src.slug}-copy` };
    setJobs((p) => [...p, newJob]);
    toast("공고를 복제했어요", { duration: 1500 });
  };

  const deleteJob = (id: string) => {
    setJobs((p) => p.filter((j) => j.id !== id));
    toast("공고를 삭제했어요", { duration: 1500 });
  };

  // 상태 변경 (칸반 드래그 포함)
  const moveJob = (jobId: string, toStatus: StatusType) => {
    setJobs((p) =>
      p.map((j) => {
        if (j.id !== jobId) return j;
        if (COMPLETED_STATUSES.includes(toStatus)) {
          // 전형완료로 이동 — 세부 결과(최종합격/불합격/보류)는 상태 모달에서 지정 (기존 값 있으면 유지)
          return {
            ...j,
            status: toStatus,
            stage: toStatus,
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
          return { ...j, finalResult: result, status: "전형완료", stage: "전형완료", completedAt: new Date().toISOString().split("T")[0] };
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
            <div className="ml-auto flex items-center gap-2">
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
                  <TooltipContent side="bottom" className="text-xs">표 보기</TooltipContent>
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
                  <TooltipContent side="bottom" className="text-xs">칸반 보기</TooltipContent>
                </Tooltip>
              </div>
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
            {view !== "kanban" && (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label="표시할 컬럼"
                        className="ml-auto shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted border border-border"
                      >
                        <Columns3 className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">표시할 컬럼</TooltipContent>
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
          {/* 배치 액션 바 — 공용 컴포넌트, 액션 항목만 탭1 전용 */}
          <BatchActionBar
            count={selected.size}
            className="border-b"
            actions={[
              { label: "상태 변경" },
              { label: "삭제", onClick: deleteSelected, tone: "danger" },
              { label: "내보내기" },
            ]}
            onClear={() => setSelected(new Set())}
          />

          {/* 칸반 / 테이블 */}
          {view === "kanban" ? (
            <KanbanView
              jobs={[...activeJobs, ...completedJobs]}
              onMove={(id, status) => moveJob(id, status)}
              onSelect={(j) => setModalJobId(j.id)}
            />
          ) : (
            <>
            <div ref={tableWrapRef} className="overflow-x-auto relative">
              {dividers.map((d) => (
                <ColumnDivider key={d.key} left={d.left} onResizeMouseDown={d.onResizeMouseDown} active={d.active} />
              ))}
              <DndContext sensors={colSensors} collisionDetection={closestCenter} onDragEnd={handleTableDragEnd}>
              <table className="w-full min-w-full text-[13px] table-fixed">
                {/* colgroup — table-fixed의 컬럼 너비 기준 명시, thead/tbody 정렬 보장 */}
                <colgroup>
                  <col style={{ width: 48 }} />
                  <col style={{ width: 36 }} />
                  <col style={{ width: widths.company }} />
                  <col style={{ width: widths.title }} />
                  {orderedCols
                    .filter((c) => isVisible(c.key))
                    .map((col) => {
                      const w = Math.max(widths[col.key] ?? 100, COL_MIN_WIDTHS[col.key] ?? 60);
                      return <col key={col.key} style={{ width: w }} />;
                    })}
                  <col style={{ width: 56 }} />
                </colgroup>
                <thead className="bg-[#F8FAFC]">
                  <tr className="text-xs font-medium text-gray-600 select-none border-b border-border">
                    <th className="w-12 pl-1 pr-3 py-3">
                      <div className="ml-5">
                        <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} className="h-3.5 w-3.5" />
                      </div>
                    </th>
                    <th className="w-9 px-2 py-3 text-left whitespace-nowrap">★</th>
                    {/* 기업명 — 고정 (드래그 없음, ∨ = 컬럼 메뉴) */}
                    <HeaderCell
                      label="기업명"
                      colKey="company"
                      sortDir={colSort?.key === "company" ? colSort.dir : null}
                      onSort={() => toggleColSort("company")}
                      onSortChange={(dir) => setSortDirect("company", dir)}
                      filter={filterPropsFor("company")}
                    />
                    {/* 공고명 — 고정 */}
                    <HeaderCell
                      label="공고명"
                      colKey="title"
                      sortDir={colSort?.key === "title" ? colSort.dir : null}
                      onSort={() => toggleColSort("title")}
                      onSortChange={(dir) => setSortDirect("title", dir)}
                      filter={filterPropsFor("title")}
                    />
                    {/* 드래그 가능 컬럼 */}
                    <SortableContext
                      items={orderedCols.filter((c) => isVisible(c.key)).map((c) => c.key)}
                      strategy={horizontalListSortingStrategy}
                    >
                      {orderedCols
                        .filter((c) => isVisible(c.key))
                        .map((col) => (
                          <SortableColumnHeader
                            key={col.key}
                            colKey={col.key}
                            label={col.label}
                            sortDir={colSort?.key === col.key ? colSort.dir : null}
                            onSortToggle={() => toggleColSort(col.key)}
                            onSortChange={(dir) => setSortDirect(col.key, dir)}
                            filter={filterPropsFor(col.key)}
                            pinned={pinnedCols.has(col.key)}
                            onTogglePin={() => togglePin(col.key)}
                            onDelete={() => toggleCol(col.key)}
                          />
                        ))}
                    </SortableContext>
                    {/* 액션 거터 헤더 — JobRowActionCell td(w-14)에 대응 */}
                    <th className="w-14 bg-[#F8FAFC]" />
                  </tr>
                </thead>
                <SortableContext items={visibleJobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {visibleJobs.map((job) => (
                    <SortableJobRow
                      key={job.id}
                      id={job.id}
                      className={cn(
                        "h-11 border-b border-border/50 hover:bg-gray-50 transition-colors group relative",
                        selected.has(job.id) && "bg-accent/30",
                      )}
                    >
                    {(grip) => (
                    <>
                      {/* 그립(드래그+클릭 메뉴) + 체크박스 */}
                      <JobRowGutterCell
                        grip={grip}
                        job={{
                          starred: job.starred,
                          updatedAt: job.updatedAt,
                          url: job.url,
                          status: job.status as JobMenuStatus,
                        }}
                        checked={selected.has(job.id)}
                        onCheckedChange={() => {
                          setSelected((p) => {
                            const n = new Set(p);
                            n.has(job.id) ? n.delete(job.id) : n.add(job.id);
                            return n;
                          });
                        }}
                        onStar={() => toggleStarred(job.id)}
                        onEdit={() => setModalJobId(job.id)}
                        onDuplicate={() => duplicateJob(job.id)}
                        onChangeStatus={(s) => moveJob(job.id, s as StatusType)}
                        onDelete={() => deleteJob(job.id)}
                      />
                      {/* 별표 (공용 StarToggle) */}
                      <td className="px-2 py-2.5 text-left whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <StarToggle active={job.starred} onToggle={() => toggleStarred(job.id)} label="관심 공고" />
                      </td>
                      {/* 기업명 — 3차 메타 (보조 정보) */}
                      <td
                        className="px-4 py-2.5 text-[13px] text-gray-500 whitespace-nowrap"
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block truncate">{job.company}</span>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">{job.company}</TooltipContent>
                        </Tooltip>
                      </td>
                      {/* 공고명 — 1차 정보 (가장 중요) */}
                      <td className="px-4 py-2.5 text-sm font-medium text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
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
                                  className="px-4 py-2.5 text-[13px] text-gray-500 whitespace-nowrap"
                                >
                                  <span className="block truncate">{job.role}</span>
                                </td>
                              );
                            case "employType":
                              return (
                                <td
                                  key="employType"
                                  className="px-4 py-2.5 text-[13px] text-gray-500 whitespace-nowrap"
                                >
                                  {job.employType}
                                </td>
                              );
                            case "industry":
                              return (
                                <td
                                  key="industry"
                                  className="px-4 py-2.5 text-[13px] text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis"
                                >
                                  {job.industry}
                                </td>
                              );
                            case "status":
                              return (
                                <td key="status" className="px-4 py-2.5 whitespace-nowrap">
                                  {/* 배지 클릭 → 모달. 전형완료는 세부 결과(최종합격/불합격/보류) 배지를 옆에 표시 */}
                                  <button
                                    onClick={() => setModalJobId(job.id)}
                                    className="transition-opacity hover:opacity-75 inline-flex items-center gap-1"
                                  >
                                    <StatusBadge status={STATUS_DS_KEY[job.status]} size="sm" />
                                    {job.status === "전형완료" && job.finalResult && (
                                      <StatusBadge
                                        status={FINAL_RESULT_DS_KEY[job.finalResult]}
                                        label={FINAL_RESULT_LABEL[job.finalResult]}
                                        size="sm"
                                      />
                                    )}
                                  </button>
                                </td>
                              );
                            case "deadline":
                              return (
                                <td
                                  key="deadline"
                                  className="px-4 py-2.5 whitespace-nowrap"
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
                                  className="px-4 py-2.5 text-left whitespace-nowrap"
                                >
                                  <DdayChip days={calcDday(job.deadline)} size="sm" />
                                </td>
                              );
                            case "linked":
                              return (
                                <td
                                  key="linked"
                                  className="px-4 py-2.5 text-left whitespace-nowrap cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setModalJobId(job.id);
                                  }}
                                  title="클릭하여 일정·할 일 편집"
                                >
                                  {job.linked.schedules === 0 && job.linked.todos === 0 ? (
                                    <span className="text-[13px] text-gray-400">—</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-2 text-[13px] text-gray-600">
                                      {job.linked.schedules > 0 && (
                                        <span className="inline-flex items-center gap-0.5">
                                          <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                                          {job.linked.schedules}
                                        </span>
                                      )}
                                      {job.linked.todos > 0 && (
                                        <span className="inline-flex items-center gap-0.5">
                                          <CheckSquare2 className="w-3.5 h-3.5 text-gray-400" />
                                          {job.linked.todos}
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </td>
                              );
                            case "updated":
                              return (
                                <td
                                  key="updated"
                                  className="px-4 py-2.5 text-[13px] text-muted-foreground whitespace-nowrap"
                                >
                                  {job.updatedAt}
                                </td>
                              );
                            case "registeredAt":
                              return (
                                <td
                                  key="registeredAt"
                                  className="px-4 py-2.5 text-[13px] text-muted-foreground tabular-nums whitespace-nowrap"
                                >
                                  {job.registeredAt}
                                </td>
                              );
                            default:
                              return null;
                          }
                        })}
                      <JobRowActionCell
                        onEdit={() => setModalJobId(job.id)}
                      />
                    </>
                    )}
                    </SortableJobRow>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={20} className="px-4 py-10 text-center text-xs text-muted-foreground">
                        해당하는 항목이 없습니다.
                      </td>
                    </tr>
                  )}
                  {!tableExpanded && Array.from({ length: Math.max(0, ROW_CAP - visibleJobs.length) }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td colSpan={20} className="h-11" />
                    </tr>
                  ))}
                </tbody>
                </SortableContext>
              </table>
              </DndContext>
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
