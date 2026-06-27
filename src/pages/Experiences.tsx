import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Download,
  X,
  Sparkles,
  Pin,
  Copy,
  Search,
  Columns3,
  Check,
  LayoutList,
  LayoutGrid,
  Upload,
  ChevronLeft,
  ChevronRight,
  Layers,
  RotateCcw,
  Pencil,
  MoreHorizontal,
  EyeOff,
  GripVertical,
  Wand2,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Filter,
  FilePlus,
  Eye,
  Image as ImageIcon,
  Star,
  Folder,
  ExternalLink,
  Clipboard,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PickdSidebar } from "@/components/pickd/PickdSidebar";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useResizableCols, ResizeHandle } from "@/hooks/useResizableCols";
import { useSearchParams } from "react-router-dom";
import { BasicInfoPanel } from "@/components/pickd/BasicInfoPanel";
import { FilesPanel } from "@/components/pickd/FilesPanel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export {
  type ItemType,
  type Status,
  type FieldType,
  type FieldDef,
  type Item,
  type Preset,
  SHARED_EXP_KEY,
  NARRATIVE_TYPES,
  SPEC_TYPES,
  ALL_TYPES,
  KEYWORD_OPTIONS,
  withTail,
  EXTRA_COMMON,
  PRESETS,
  makeFromPreset,
} from "./experiences/presets";

export const INITIAL_EXPERIENCES: Item[] = [
  {
    ...makeFromPreset("프로젝트", "경식이 AI 전화 서비스", {
      pinned: true,
      importance: "높음",
      keywords: ["문제해결", "사용자조사", "기획력"],
      competencies: ["문제해결", "기획력"],
      updatedAt: "어제",
      status: "완료",
      values: {
        ptype: "사이드 프로젝트",
        org: "사이드 프로젝트",
        period: "2025.03 ~ 2025.08",
        role: "PM / 기획",
        teamSize: "4명",
        stack: "Figma, Notion",
      },
      document: `고령층의 사회적 고립을 줄이기 위해 AI 전화 서비스를 기획했습니다.\n서비스 기획자로서 20명의 사용자 인터뷰를 주도하고 프로토타입을 3회 반복했습니다.\n베타 100명을 대상으로 한 테스트에서 만족도 4.5/5를 받았습니다.\n사용자 관점에서 문제를 정의하는 것이 가장 중요하다는 것을 배웠습니다.`,
    }),
  },
  {
    ...makeFromPreset("대외활동", "업비트 서포터즈", {
      pinned: true,
      importance: "보통",
      keywords: ["기획력", "소통"],
      competencies: ["기획력", "소통"],
      updatedAt: "3일 전",
      status: "작성중",
      values: { org: "업비트", period: "2024.08 ~ 2024.11", role: "콘텐츠 기획" },
    }),
  },
  {
    ...makeFromPreset("교환학생", "파리정치대학 교환학생", {
      pinned: true,
      keywords: ["글로벌", "팀워크"],
      competencies: ["글로벌"],
      updatedAt: "1주 전",
      status: "작성중",
      values: { country: "프랑스", univ: "파리정치대학", period: "2024.02 ~ 2024.07" },
    }),
  },
  {
    ...makeFromPreset("수상", "부산대학교 IT융합 해커톤 우수상", {
      pinned: true,
      keywords: ["문제해결", "협업"],
      linkedExperiences: [],
      status: "완료",
      values: { name: "부산대학교 IT융합 해커톤 우수상", level: "우수상", host: "부산대학교", awardedAt: "2025.08" },
    }),
  },
  {
    ...makeFromPreset("자격증", "컴퓨터활용능력 1급", {
      pinned: true,
      keywords: ["데이터 분석"],
      status: "완료",
      values: { name: "컴퓨터활용능력 1급", grade: "1급", issuer: "대한상공회의소", issuedAt: "2025.02" },
    }),
  },
  {
    ...makeFromPreset("수강과목", "Digital Marketing", {
      keywords: ["기획력", "데이터 분석"],
      competencies: ["기획력"],
      status: "작성중",
      values: { course: "Digital Marketing", school: "고려대학교", semester: "2024 2학기" },
    }),
  },
  {
    ...makeFromPreset("어학", "TOEIC 945", {
      pinned: true,
      keywords: ["글로벌"],
      competencies: ["글로벌"],
      status: "완료",
      values: { exam: "TOEIC", score: "945", issuedAt: "2025.01", issuer: "ETS", expireAt: "2027.01" },
    }),
  },
  {
    ...makeFromPreset("프로젝트", "고령층 인터뷰 경험", {
      keywords: ["사용자조사"],
      status: "병합 필요",
      updatedAt: "방금",
      values: { period: "2025.04 ~ 2025.05", role: "리서처" },
    }),
  },
];

// ────────────────────────────────────────────────────────────────
// localStorage helpers
// ────────────────────────────────────────────────────────────────

const LS_EXP_COLS = "pickd.experiences.visibleCols.v2";

// ────────────────────────────────────────────────────────────────
// 경험 DB 컬럼 설정
// ────────────────────────────────────────────────────────────────

type ColumnKey = "type" | "name" | "org" | "period" | "keywords" | "importance" | "updated" | "manage";

const ALL_COLUMNS: { key: ColumnKey; label: string; defaultVisible: boolean }[] = [
  { key: "type", label: "유형", defaultVisible: true },
  { key: "name", label: "항목명", defaultVisible: true },
  { key: "org", label: "기관/소속", defaultVisible: true },
  { key: "period", label: "기간", defaultVisible: true },
  { key: "keywords", label: "주요 키워드", defaultVisible: true },
  { key: "importance", label: "중요도", defaultVisible: false },
  { key: "updated", label: "최근 수정", defaultVisible: true },
  { key: "manage", label: "관리", defaultVisible: true },
];

const DEFAULT_EXP_WIDTHS: Record<string, number> = {
  type: 90,
  name: 260,
  org: 160,
  period: 140,
  keywords: 220,
  importance: 90,
  updated: 110,
  manage: 80,
};

const MIN_EXP_WIDTHS: Record<string, number> = {
  type: 56,
  name: 100,
  org: 72,
  period: 72,
  keywords: 80,
  importance: 56,
  updated: 64,
  manage: 60,
};

// "전체"와 복붙 아이콘은 렌더에서 별도 처리
const FILTER_CHIPS: ItemType[] = [...NARRATIVE_TYPES, ...SPEC_TYPES];

// ────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────

const EXTRACT_MOCK_CANDIDATES: { id: string; type: ItemType; name: string; summary: string }[] = [
  { id: "ec1", type: "프로젝트", name: "캡스톤 디자인 프로젝트", summary: "2024.09 ~ 2025.01 · PM / 기획" },
  { id: "ec2", type: "인턴", name: "여름 마케팅 인턴십", summary: "2024.07 ~ 2024.08 · 마케팅팀" },
  { id: "ec3", type: "대외활동", name: "청년 창업 서포터즈", summary: "2024.03 ~ 2024.06 · 기획 파트" },
];

export default function Experiences() {
  // ── 탭 허브 상태 (경험·스펙 DB / 기본정보 / 파일함) — ?tab= 쿼리로 딥링크 ──
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = tabParam === "basic-info" || tabParam === "files" ? tabParam : "db";
  const setActiveTab = (t: string) => {
    setSearchParams(t === "db" ? {} : { tab: t }, { replace: true });
  };

  // ── 경험 DB state ──
  const [items, setItems] = useState<Item[]>(() => {
    if (typeof window === "undefined") return INITIAL_EXPERIENCES;
    try {
      const raw = localStorage.getItem(SHARED_EXP_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Item[];
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch {}
    return INITIAL_EXPERIENCES;
  });
  useEffect(() => {
    try {
      localStorage.setItem(SHARED_EXP_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const [view, setView] = useState<"list" | "card" | "paste">("list");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("전체");

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  type ColFilter = { kind: "select"; values: string[] } | { kind: "text"; q: string };
  const [colFilter, setColFilter] = useState<Record<string, ColFilter>>({});
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
  const clearAllFilters = () => setColFilter({});
  const activeFilterCount = Object.keys(colFilter).length;

  const [visibleCols, setVisibleCols] = useState<Set<ColumnKey>>(() => {
    try {
      const raw = localStorage.getItem(LS_EXP_COLS);
      if (raw) return new Set(JSON.parse(raw) as ColumnKey[]);
    } catch {}
    return new Set(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key));
  });
  const { widths: colW, onMouseDown: onResize } = useResizableCols(
    "pickd.experiences.colWidths.v2",
    DEFAULT_EXP_WIDTHS,
    MIN_EXP_WIDTHS,
  );

  const resetCols = () => {
    setVisibleCols(new Set(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key)));
    try {
      localStorage.removeItem("pickd.experiences.colWidths.v2");
      localStorage.removeItem(LS_EXP_COLS);
    } catch {}
    window.location.reload();
  };

  const [entryOpen, setEntryOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractDoneOpen, setExtractDoneOpen] = useState(false);
  const [checkedCandidates, setCheckedCandidates] = useState<Set<string>>(
    new Set(["ec1", "ec2", "ec3"]),
  );
  const [mergeOpen, setMergeOpen] = useState(false);
  const [excelOpen, setExcelOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [infoExpanded, setInfoExpanded] = useState(false);

  const detail = detailId ? (items.find((i) => i.id === detailId) ?? null) : null;

  // ── 경험 DB helpers ──
  const readMeta = (i: Item) => {
    const v = i.values || {};
    const org = v.org ?? v.company ?? v.host ?? v.issuer ?? v.school ?? v.univ ?? "";
    const period = v.period ?? v.testDate ?? v.issuedAt ?? v.awardedAt ?? v.semester ?? "";
    return { org, period };
  };

  const getColValue = (i: Item, key: string): string | string[] => {
    const { org, period } = readMeta(i);
    switch (key) {
      case "type":
        return i.type;
      case "name":
        return i.name;
      case "org":
        return org;
      case "period":
        return period;
      case "keywords":
        return i.keywords;
      case "updated":
        return i.updatedAt ?? "";
      case "manage":
        return i.status;
      default:
        return "";
    }
  };

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (view === "paste") {
        if (!i.pinned) return false;
      } else if (activeFilter !== "전체") {
        if (i.type !== activeFilter) return false;
      }
      for (const [key, f] of Object.entries(colFilter)) {
        const v = getColValue(i, key);
        if (f.kind === "select") {
          if (Array.isArray(v)) {
            if (!v.some((x) => f.values.includes(x))) return false;
          } else {
            if (!f.values.includes(String(v))) return false;
          }
        } else {
          const q = f.q.toLowerCase();
          if (Array.isArray(v)) {
            if (!v.some((x) => x.toLowerCase().includes(q))) return false;
          } else {
            if (!String(v).toLowerCase().includes(q)) return false;
          }
        }
      }
      return true;
    });
  }, [items, search, activeFilter, view, colFilter]);

  const distinctValues = (key: string): string[] => {
    const set = new Set<string>();
    for (const i of items) {
      const v = getColValue(i, key);
      if (Array.isArray(v)) v.forEach((x) => x && set.add(x));
      else if (v) set.add(String(v));
    }
    return Array.from(set).sort();
  };

  useEffect(() => {
    try {
      localStorage.setItem(LS_EXP_COLS, JSON.stringify([...visibleCols]));
    } catch {}
  }, [visibleCols]);

  const isVisible = (k: ColumnKey) => visibleCols.has(k);
  const toggleCol = (k: ColumnKey) =>
    setVisibleCols((p) => {
      const n = new Set(p);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  const toggleSelect = (id: string) =>
    setSelected((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const allFilteredSelected = filtered.length > 0 && filtered.every((i) => selected.has(i.id));
  const toggleSelectAll = () => {
    if (allFilteredSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((i) => i.id)));
  };
  const togglePin = (id: string) => setItems((p) => p.map((i) => (i.id === id ? { ...i, pinned: !i.pinned } : i)));
  const updateItem = (id: string, patch: Partial<Item>) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const deleteItems = (ids: string[]) => {
    setItems((p) => p.filter((i) => !ids.includes(i.id)));
    setSelected(new Set());
    toast.success(`${ids.length}개 항목이 삭제되었어요.`);
  };
  const confirmDelete = (ids: string[]) => {
    setPendingDeleteIds(ids);
    setDeleteConfirmOpen(true);
  };

  const copy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast("복사했어요", { duration: 1200 });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen bg-background overflow-hidden">
        <PickdSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="px-10 pt-8 pb-10 max-w-[1400px] mx-auto space-y-3">
            {/* ── 페이지 헤더 ───────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-[26px] font-bold text-foreground tracking-[-0.04em] leading-tight">경험·스펙 DB</h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  경험과 스펙을 한 곳에서 정리하고, 자소서·면접에 바로 꺼내 쓰세요.
                </p>
              </div>
              {activeTab === "db" && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-[12px] px-3 rounded-md" onClick={() => setImportOpen(true)}>
                    <Sparkles className="w-3 h-3" /> 자소서에서 추출
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-[12px] px-3 rounded-md" onClick={() => setExcelOpen(true)}>
                    <Download className="w-3 h-3" /> Excel 내보내기
                  </Button>
                </div>
              )}
            </div>

            {/* ── 탭 허브: 경험·스펙 DB / 기본정보 / 파일함 ─────────────── */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-9 bg-muted/60">
                <TabsTrigger value="db" className="text-[13px]">경험·스펙 DB</TabsTrigger>
                <TabsTrigger value="basic-info" className="text-[13px]">기본정보</TabsTrigger>
                <TabsTrigger value="files" className="text-[13px]">파일함</TabsTrigger>
              </TabsList>

              <TabsContent value="db" className="space-y-5 mt-4 focus-visible:outline-none">

            {/* ── 경험·스펙 목록 ─────────────────────────────────────── */}
            <section>
              {/* Toolbar */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <Button size="sm" className="h-7 text-[12px] px-3 rounded-md" onClick={() => setEntryOpen(true)}>
                  <Plus className="w-3 h-3" /> 경험 추가
                </Button>

                <div className="ml-auto flex items-center gap-1.5">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="항목명 검색"
                      className="h-7 w-36 pl-6 text-[12px] border-border"
                    />
                  </div>
                  {/* Filter */}
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <button
                            aria-label="필터"
                            className={cn(
                              "relative inline-flex items-center justify-center w-6 h-6 rounded border border-border hover:bg-muted",
                              activeFilterCount > 0
                                ? "text-foreground bg-accent/40"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            <Filter className="w-3 h-3" />
                            {activeFilterCount > 0 && (
                              <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] leading-[14px] text-center">
                                {activeFilterCount}
                              </span>
                            )}
                          </button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        필터
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="min-w-[220px]">
                      <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
                        활성 필터
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {activeFilterCount === 0 ? (
                        <div className="px-2 py-3 text-[11px] text-muted-foreground">적용된 필터가 없어요.</div>
                      ) : (
                        Object.entries(colFilter).map(([k, f]) => {
                          const colLabel = ALL_COLUMNS.find((c) => c.key === k)?.label ?? k;
                          const summary = f.kind === "select" ? f.values.join(", ") : `"${f.q}"`;
                          return (
                            <DropdownMenuItem
                              key={k}
                              onSelect={(e) => {
                                e.preventDefault();
                                setColFilter((p) => {
                                  const n = { ...p };
                                  delete n[k];
                                  return n;
                                });
                              }}
                              className="text-xs flex items-center justify-between gap-2"
                            >
                              <span className="truncate">
                                <span className="text-muted-foreground">{colLabel}:</span> {summary}
                              </span>
                              <X className="w-3 h-3 shrink-0 text-muted-foreground" />
                            </DropdownMenuItem>
                          );
                        })
                      )}
                      {activeFilterCount > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-xs text-muted-foreground" onSelect={clearAllFilters}>
                            <RotateCcw className="w-3 h-3 mr-1.5" /> 모든 필터 초기화
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {/* Columns — 복붙 뷰일 때는 숨김 */}
                  {/* Columns — 복붙 뷰일 때만 숨김 */}
                  {view !== "paste" && (
                    <DropdownMenu>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <button
                              aria-label="표시할 컬럼"
                              className="inline-flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted border border-border"
                            >
                              <Columns3 className="w-3 h-3" />
                            </button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          표시할 컬럼
                        </TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="end" className="min-w-[180px]">
                        <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
                          표시할 컬럼
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-xs text-muted-foreground" onClick={resetCols}>
                          <RotateCcw className="w-3 h-3 mr-1.5" /> 기본값으로 초기화
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {/* View toggle — 복붙 포함 */}
                  <div className="inline-flex items-center gap-px bg-muted/50 p-px rounded border border-border">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setView("list")}
                          className={cn(
                            "inline-flex items-center justify-center w-5 h-5 rounded transition-colors",
                            view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                          )}
                          aria-label="리스트형"
                        >
                          <LayoutList className="w-3 h-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">리스트형</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setView("card")}
                          className={cn(
                            "inline-flex items-center justify-center w-5 h-5 rounded transition-colors",
                            view === "card" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                          )}
                          aria-label="카드형"
                        >
                          <LayoutGrid className="w-3 h-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">카드형</TooltipContent>
                    </Tooltip>
                  </div>
                  {/* 전체화면 — 복붙 뷰일 때만 표시 */}
                  {view === "paste" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            if (!document.fullscreenElement) {
                              document.documentElement.requestFullscreen();
                            } else {
                              document.exitFullscreen();
                            }
                          }}
                          className="inline-flex items-center justify-center w-6 h-6 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          aria-label={isFullscreen ? "전체화면 종료" : "전체화면"}
                        >
                          {isFullscreen
                            ? <X className="w-3 h-3" />
                            : <ExternalLink className="w-3 h-3" />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">{isFullscreen ? "전체화면 종료" : "전체화면 확장"}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Filter chips */}
              <div className="flex items-center gap-1 flex-wrap mb-3">
                {/* 전체 */}
                <button
                  onClick={() => setActiveFilter("전체")}
                  className={cn(
                    "h-6 px-2 inline-flex items-center rounded-full text-[11px] border transition-colors",
                    activeFilter === "전체" && view !== "paste"
                      ? "bg-accent text-accent-foreground border-accent"
                      : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  전체
                </button>

                {/* 복붙 뷰 버튼 */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setView((v) => v === "paste" ? "list" : "paste")}
                      className={cn(
                        "inline-flex items-center justify-center w-6 h-6 rounded border transition-colors",
                        view === "paste"
                          ? "bg-accent text-accent-foreground border-accent"
                          : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      aria-label="복붙 보기"
                    >
                      <Clipboard className="w-3 h-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">복붙 보기 (핀 고정 항목)</TooltipContent>
                </Tooltip>

                {/* 구분선 */}
                <span className="w-px h-3.5 bg-border/60 mx-0.5" />

                {/* 유형 필터 */}
                {FILTER_CHIPS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={cn(
                      "h-6 px-2 inline-flex items-center rounded-full text-[11px] border transition-colors",
                      activeFilter === f
                        ? "bg-accent text-accent-foreground border-accent"
                        : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* 복붙 / List / Card view */}
              {view === "paste" ? (
                <RepExperienceGrid
                  items={filtered}
                  onCopy={copy}
                  onOpenItem={setDetailId}
                  onTogglePin={togglePin}
                  readMeta={readMeta}
                />
              ) : view === "list" ? (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm table-fixed">
                    <thead>
                      <tr className="border-b border-border bg-[#F8FAFC] text-[10px] text-muted-foreground font-bold tracking-[0.5px] uppercase select-none">
                        <th className="w-9 px-3 py-2.5">
                          <Checkbox
                            checked={allFilteredSelected}
                            onCheckedChange={toggleSelectAll}
                            className="h-3.5 w-3.5"
                          />
                        </th>
                        {isVisible("type") && (
                          <ResizableHead
                            label="유형"
                            width={colW.type}
                            onResize={onResize("type")}
                            filter={
                              <HeaderFilter
                                colKey="type"
                                kind="select"
                                options={distinctValues("type")}
                                colFilter={colFilter}
                                setSelectFilter={setSelectFilter}
                                setTextFilter={setTextFilter}
                              />
                            }
                          />
                        )}
                        {isVisible("name") && (
                          <ResizableHead
                            label="항목명"
                            width={colW.name}
                            onResize={onResize("name")}
                            filter={
                              <HeaderFilter
                                colKey="name"
                                kind="text"
                                options={[]}
                                colFilter={colFilter}
                                setSelectFilter={setSelectFilter}
                                setTextFilter={setTextFilter}
                              />
                            }
                          />
                        )}
                        {isVisible("org") && (
                          <ResizableHead
                            label="기관/소속"
                            width={colW.org}
                            onResize={onResize("org")}
                            filter={
                              <HeaderFilter
                                colKey="org"
                                kind="select"
                                options={distinctValues("org")}
                                colFilter={colFilter}
                                setSelectFilter={setSelectFilter}
                                setTextFilter={setTextFilter}
                              />
                            }
                          />
                        )}
                        {isVisible("period") && (
                          <ResizableHead
                            label="기간"
                            width={colW.period}
                            onResize={onResize("period")}
                            filter={
                              <HeaderFilter
                                colKey="period"
                                kind="text"
                                options={[]}
                                colFilter={colFilter}
                                setSelectFilter={setSelectFilter}
                                setTextFilter={setTextFilter}
                              />
                            }
                          />
                        )}
                        {isVisible("keywords") && (
                          <ResizableHead
                            label="주요 키워드"
                            width={colW.keywords}
                            onResize={onResize("keywords")}
                            filter={
                              <HeaderFilter
                                colKey="keywords"
                                kind="select"
                                options={distinctValues("keywords")}
                                colFilter={colFilter}
                                setSelectFilter={setSelectFilter}
                                setTextFilter={setTextFilter}
                              />
                            }
                          />
                        )}
                        {isVisible("importance") && (
                          <ResizableHead label="중요도" width={colW.importance} onResize={onResize("importance")} />
                        )}
                        {isVisible("updated") && (
                          <ResizableHead
                            label="최근 수정"
                            width={colW.updated}
                            onResize={onResize("updated")}
                            filter={
                              <HeaderFilter
                                colKey="updated"
                                kind="text"
                                options={[]}
                                colFilter={colFilter}
                                setSelectFilter={setSelectFilter}
                                setTextFilter={setTextFilter}
                              />
                            }
                          />
                        )}
                        {isVisible("manage") && (
                          <ResizableHead
                            label="관리 상태"
                            width={colW.manage}
                            onResize={onResize("manage")}
                            filter={
                              <HeaderFilter
                                colKey="manage"
                                kind="select"
                                options={distinctValues("manage")}
                                colFilter={colFilter}
                                setSelectFilter={setSelectFilter}
                                setTextFilter={setTextFilter}
                              />
                            }
                          />
                        )}
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((i) => {
                        const { org, period } = readMeta(i);
                        return (
                          <tr
                            key={i.id}
                            className={cn(
                              "border-b border-border/50 hover:bg-accent/40 transition-colors group cursor-pointer",
                              selected.has(i.id) && "bg-accent/30",
                            )}
                            onClick={() => setDetailId(i.id)}
                          >
                            <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selected.has(i.id)}
                                onCheckedChange={() => toggleSelect(i.id)}
                                className="h-3.5 w-3.5"
                              />
                            </td>
                            {isVisible("type") && (
                              <td className="px-3 py-2.5 text-xs text-muted-foreground overflow-hidden">
                                <span className="block truncate">{i.type}</span>
                              </td>
                            )}
                            {isVisible("name") && (
                              <td className="px-3 py-2.5 font-medium text-foreground overflow-hidden">
                                <span className="flex items-center gap-1.5 min-w-0">
                                  <span className="truncate">{i.name}</span>
                                </span>
                              </td>
                            )}
                            {isVisible("org") && (
                              <td className="px-3 py-2.5 text-xs text-muted-foreground overflow-hidden">
                                <span className="block truncate">{org || "—"}</span>
                              </td>
                            )}
                            {isVisible("period") && (
                              <td className="px-3 py-2.5 text-xs text-muted-foreground tabular-nums overflow-hidden">
                                <span className="block truncate">{period || "—"}</span>
                              </td>
                            )}
                            {isVisible("keywords") && (
                              <td className="px-3 py-2.5 overflow-hidden">
                                <div className="flex flex-nowrap gap-1 overflow-hidden">
                                  {i.keywords.slice(0, 3).map((k) => (
                                    <span
                                      key={k}
                                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-foreground/70 shrink-0"
                                    >
                                      {k}
                                    </span>
                                  ))}
                                  {i.keywords.length > 3 && (
                                    <span className="text-[10px] text-muted-foreground shrink-0">+{i.keywords.length - 3}</span>
                                  )}
                                </div>
                              </td>
                            )}
                            {isVisible("importance") && (
                              <td className="px-3 py-2.5 text-[11px] text-muted-foreground overflow-hidden">
                                <span className="block truncate">{i.importance ?? "—"}</span>
                              </td>
                            )}
                            {isVisible("updated") && (
                              <td className="px-3 py-2.5 text-[11px] text-muted-foreground overflow-hidden">
                                <span className="block truncate">{i.updatedAt ?? "—"}</span>
                              </td>
                            )}
                            {isVisible("manage") && (
                              <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                                <ManageIndicator
                                  item={i}
                                  onMerge={() => {
                                    setDetailId(i.id);
                                    setMergeOpen(true);
                                  }}
                                  onOpen={() => setDetailId(i.id)}
                                />
                              </td>
                            )}
                            <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => togglePin(i.id)}
                                className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-opacity opacity-0 group-hover:opacity-100"
                                title={i.pinned ? "고정 해제" : "고정"}
                              >
                                <Pin className={cn("w-3 h-3", i.pinned && "fill-current text-foreground")} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
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
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {filtered.length === 0 && (
                    <div className="col-span-3 py-10 text-center text-xs text-muted-foreground">
                      해당하는 항목이 없습니다.
                    </div>
                  )}
                  {filtered.map((i) => {
                    const { org, period } = readMeta(i);
                    return (
                      <div
                        key={i.id}
                        onClick={() => setDetailId(i.id)}
                        className="bg-card border border-border rounded-xl px-4 py-3 cursor-pointer hover:bg-muted/30"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-muted-foreground">{i.type}</span>
                          <ManageIndicator
                            item={i}
                            onMerge={() => {
                              setDetailId(i.id);
                              setMergeOpen(true);
                            }}
                            onOpen={() => setDetailId(i.id)}
                          />
                        </div>
                        <p className="text-sm font-semibold text-foreground mt-1.5">{i.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {org || "—"} {period && `· ${period}`}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {i.keywords.map((k) => (
                            <span key={k} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-foreground/70">
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
              </TabsContent>

              <TabsContent value="basic-info" className="mt-4 focus-visible:outline-none">
                <BasicInfoPanel />
              </TabsContent>

              <TabsContent value="files" className="mt-4 focus-visible:outline-none">
                <FilesPanel />
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* 선택 플로팅 바 */}
        {selected.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-foreground text-background rounded-lg px-3 py-2.5 flex items-center gap-3 shadow-lg">
            <span className="text-[12px]">{selected.size}개 선택됨</span>
            <span className="w-px h-4 bg-background/20" />
            <button onClick={() => setMergeOpen(true)} className="text-[11px] hover:text-background/80">
              병합하기
            </button>
            <button className="text-[11px] hover:text-background/80">키워드 추가</button>
            <button onClick={() => confirmDelete([...selected])} className="text-[11px] text-red-400 hover:text-red-300">
              삭제
            </button>
            <button onClick={() => setSelected(new Set())} className="ml-1 text-background/60 hover:text-background">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Dialogs ─────────────────────────────────────────── */}
        <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
          <DialogContent className="max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-base">경험 추가</DialogTitle>
              <DialogDescription className="text-sm">시작 방식을 선택하세요.</DialogDescription>
            </DialogHeader>
            <div className="mt-2 grid grid-cols-1 gap-2">
              <button
                onClick={() => {
                  const ni = makeFromPreset("프로젝트", "새 경험");
                  setItems((p) => [ni, ...p]);
                  setEntryOpen(false);
                  setDetailId(ni.id);
                }}
                className="text-left border border-border rounded-lg px-4 py-3.5 hover:bg-muted/40 transition-colors flex items-start gap-3"
              >
                <div className="mt-0.5 w-8 h-8 rounded-md bg-accent/50 flex items-center justify-center shrink-0">
                  <Pencil className="w-4 h-4 text-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">직접 작성하기</p>
                  <p className="text-xs text-muted-foreground mt-0.5">빈 문서로 시작하고, 작성하면서 유형을 정해요.</p>
                </div>
              </button>
              <button
                onClick={() => {
                  setEntryOpen(false);
                  setImportOpen(true);
                }}
                className="text-left border border-border rounded-lg px-4 py-3.5 hover:bg-muted/40 transition-colors flex items-start gap-3"
              >
                <div className="mt-0.5 w-8 h-8 rounded-md bg-accent/50 flex items-center justify-center shrink-0">
                  <FilePlus className="w-4 h-4 text-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">자소서 파일 불러오기</p>
                  <p className="text-xs text-muted-foreground mt-0.5">기존 자소서에서 경험을 자동으로 추출해요.</p>
                </div>
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {detail && (
          <DetailEditor
            item={detail}
            allItems={items}
            onClose={() => {
              setDetailId(null);
              setMergeOpen(false);
            }}
            onChange={(patch) => updateItem(detail.id, patch)}
            onTogglePin={() => togglePin(detail.id)}
            onDelete={() => confirmDelete([detail.id])}
            mergeOpen={mergeOpen}
            setMergeOpen={setMergeOpen}
          />
        )}

        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent className="max-w-[560px] p-0 overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-border">
              <DialogTitle className="text-base">자소서 파일 불러오기</DialogTitle>
              <DialogDescription className="text-sm">파일이나 텍스트를 붙여 넣으면 경험을 추출해요.</DialogDescription>
            </DialogHeader>
            <div className="px-6 py-5">
              <Tabs defaultValue="file">
                <TabsList className="grid grid-cols-2 w-full h-9">
                  <TabsTrigger value="file" className="text-xs">
                    파일 업로드
                  </TabsTrigger>
                  <TabsTrigger value="text" className="text-xs">
                    텍스트 붙여넣기
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="file" className="mt-4">
                  <label className="block border border-dashed border-border rounded-lg px-6 py-8 text-center cursor-pointer hover:bg-muted/30">
                    <Upload className="w-5 h-5 mx-auto text-muted-foreground" />
                    <p className="text-sm text-foreground mt-2">파일을 끌어다 놓거나 클릭하여 업로드</p>
                    <p className="text-[11px] text-muted-foreground mt-1">PDF, DOCX, TXT</p>
                    <input type="file" className="hidden" accept=".pdf,.docx,.txt" />
                  </label>
                </TabsContent>
                <TabsContent value="text" className="mt-4 space-y-3">
                  <Input className="h-9 text-sm" placeholder="자소서 문항 (선택)" />
                  <Textarea className="min-h-[160px] text-sm" placeholder="자소서 답변을 붙여넣어 주세요." />
                </TabsContent>
              </Tabs>
            </div>
            <div className="px-6 py-3 border-t border-border flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setImportOpen(false)}>
                취소
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setImportOpen(false);
                  setExtractLoading(true);
                  setTimeout(() => {
                    setExtractLoading(false);
                    setExtractDoneOpen(true);
                  }, 1200);
                }}
              >
                업로드하고 추출하기
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={extractLoading} onOpenChange={setExtractLoading}>
          <DialogContent className="max-w-[380px]">
            <DialogHeader>
              <DialogTitle className="text-base">자소서에서 경험을 정리 중이에요</DialogTitle>
              <DialogDescription className="text-sm">잠시만 기다려 주세요.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-pulse [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={extractDoneOpen} onOpenChange={setExtractDoneOpen}>
          <DialogContent className="max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-base">추출된 경험 후보</DialogTitle>
              <DialogDescription className="text-sm">
                자소서에서 {EXTRACT_MOCK_CANDIDATES.length}개의 경험을 찾았어요. 저장할 항목을 선택하세요.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 my-2">
              {EXTRACT_MOCK_CANDIDATES.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={checkedCandidates.has(c.id)}
                    onCheckedChange={(v) =>
                      setCheckedCandidates((prev) => {
                        const next = new Set(prev);
                        if (v) next.add(c.id); else next.delete(c.id);
                        return next;
                      })
                    }
                    aria-label={c.name}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                        {c.type}
                      </span>
                      <span className="text-sm font-medium truncate">{c.name}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{c.summary}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[11px] text-muted-foreground">{checkedCandidates.size}개 선택됨</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setExtractDoneOpen(false)}
                >
                  나중에
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  disabled={checkedCandidates.size === 0}
                  onClick={() => {
                    const newItems = EXTRACT_MOCK_CANDIDATES.filter((c) =>
                      checkedCandidates.has(c.id),
                    ).map((c) => makeFromPreset(c.type, c.name));
                    setItems((p) => [...newItems, ...p]);
                    setExtractDoneOpen(false);
                    setCheckedCandidates(new Set(EXTRACT_MOCK_CANDIDATES.map((c) => c.id)));
                    toast.success(`${newItems.length}개의 경험이 추가되었어요.`);
                  }}
                >
                  선택 저장하기
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={excelOpen} onOpenChange={setExcelOpen}>
          <DialogContent className="max-w-[380px]">
            <DialogHeader>
              <DialogTitle className="text-base">Excel로 내보낼까요?</DialogTitle>
              <DialogDescription className="text-sm">
                현재 보고 있는 항목 {filtered.length}개를 내보냅니다.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setExcelOpen(false)}>
                취소
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setExcelOpen(false);
                  toast.success("Excel 파일로 내보냈어요.");
                }}
              >
                내보내기
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="max-w-[380px]">
            <DialogHeader>
              <DialogTitle className="text-base">정말 삭제하시겠어요?</DialogTitle>
              <DialogDescription className="text-sm">
                {pendingDeleteIds.length === 1
                  ? "이 경험을 삭제하면 되돌릴 수 없어요."
                  : `${pendingDeleteIds.length}개의 경험을 삭제하면 되돌릴 수 없어요.`}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setDeleteConfirmOpen(false)}>
                취소
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  deleteItems(pendingDeleteIds);
                  if (detailId && pendingDeleteIds.includes(detailId)) setDetailId(null);
                  setSelected(new Set());
                  setDeleteConfirmOpen(false);
                }}
              >
                삭제
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </TooltipProvider>
  );
}

// ────────────────────────────────────────────────────────────────
// RepExperienceGrid — 복붙 뷰 (핀 고정 항목)
// ────────────────────────────────────────────────────────────────

function RepExperienceGrid({
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

function InfoRow({
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

// ────────────────────────────────────────────────────────────────
// DetailEditor
// ────────────────────────────────────────────────────────────────

type SentenceCard = { id: string; question: string; answer: string; sentence: string };

function DetailEditor({
  item,
  allItems,
  onClose,
  onChange,
  onTogglePin,
  onDelete,
  mergeOpen,
  setMergeOpen,
}: {
  item: Item;
  allItems: Item[];
  onClose: () => void;
  onChange: (patch: Partial<Item>) => void;
  onTogglePin: () => void;
  onDelete: () => void;
  mergeOpen: boolean;
  setMergeOpen: (b: boolean) => void;
}) {
  const [saveState, setSaveState] = useState<"저장됨" | "작성중">("저장됨");
  const [copyOpen, setCopyOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [cards, setCards] = useState<SentenceCard[]>([]);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const update = (patch: Partial<Item>) => {
    setSaveState("작성중");
    onChange(patch);
    setTimeout(() => setSaveState("저장됨"), 500);
  };
  const preset = PRESETS[item.type];
  const isNarrative = NARRATIVE_TYPES.includes(item.type);
  const setFieldValue = (key: string, v: string) => update({ values: { ...item.values, [key]: v } });
  const visibleFields = item.fields.filter((f) => !f.hidden);
  const updateField = (key: string, patch: Partial<FieldDef>) =>
    update({ fields: item.fields.map((f) => (f.key === key ? { ...f, ...patch } : f)) });
  const moveField = (key: string, dir: -1 | 1) => {
    const idx = item.fields.findIndex((f) => f.key === key);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= item.fields.length) return;
    const arr = [...item.fields];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    update({ fields: arr });
  };
  const addField = (f: FieldDef) => {
    if (item.fields.some((x) => x.key === f.key)) {
      updateField(f.key, { hidden: false });
      return;
    }
    update({ fields: [...item.fields, { ...f, hidden: false }] });
  };
  const removeField = (key: string) => update({ fields: item.fields.filter((f) => f.key !== key) });

  const generateQuestion = () => {
    const qs = preset.aiQuestions.length ? preset.aiQuestions : ["이 경험을 한 문장으로 정리하면요?"];
    return qs[Math.floor(Math.random() * qs.length)];
  };
  const [currentQ, setCurrentQ] = useState<string>("");
  const [draftAnswer, setDraftAnswer] = useState("");
  useEffect(() => {
    if (aiOpen && !currentQ) setCurrentQ(generateQuestion());
  }, [aiOpen]);

  const polish = (q: string, a: string) => {
    const trimmed = a.trim().replace(/\s+/g, " ");
    if (!trimmed) return "";
    if (/[.?!。]$/.test(trimmed)) return trimmed;
    return trimmed + ".";
  };
  const onSubmitAnswer = () => {
    if (!draftAnswer.trim()) return;
    const sentence = polish(currentQ, draftAnswer);
    setCards((p) => [{ id: String(Date.now()), question: currentQ, answer: draftAnswer, sentence }, ...p]);
    setDraftAnswer("");
    setCurrentQ(generateQuestion());
  };
  const applySentence = (s: string) => {
    const next = (item.document ? item.document.trim() + "\n" : "") + s;
    update({ document: next });
    toast.success("문장을 본문 끝에 추가했어요.");
  };
  const onDropSentence = (e: React.DragEvent<HTMLTextAreaElement>) => {
    const text = e.dataTransfer.getData("text/plain");
    if (!text) return;
    e.preventDefault();
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart ?? item.document?.length ?? 0;
    const end = el.selectionEnd ?? start;
    const cur = item.document ?? "";
    const next = cur.slice(0, start) + text + cur.slice(end);
    update({ document: next });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[1140px] w-[95vw] h-[96vh] max-h-[96vh] p-0 gap-0 overflow-hidden [&>button]:hidden flex flex-col">
        <div className="px-6 py-3.5 border-b border-border flex items-center justify-between gap-4 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5">
              <span>경험정리</span>
              <span>›</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-1 text-foreground hover:bg-muted px-1.5 py-0.5 rounded transition-colors">
                    {item.type}
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[180px] max-h-[60vh] overflow-y-auto">
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
                    유형 선택
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ALL_TYPES.map((t) => (
                    <DropdownMenuItem
                      key={t}
                      className="text-xs flex items-center justify-between"
                      onClick={() => {
                        if (t === item.type) return;
                        update({ type: t, fields: PRESETS[t].fields.map((f) => ({ ...f })) });
                        toast.success(`유형이 ${t}(으)로 변경되었어요.`);
                      }}
                    >
                      <span>{t}</span>
                      {t === item.type && <Check className="w-3.5 h-3.5 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <input
              value={item.name}
              onChange={(e) => update({ name: e.target.value })}
              className="text-[16px] font-semibold text-foreground bg-transparent w-full focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-muted-foreground">{saveState}</span>
            <div className="inline-flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-md border border-border">
              {(["작성중", "완료"] as Status[]).map((s) => (
                <button
                  key={s}
                  onClick={() => update({ status: s })}
                  className={cn(
                    "px-2 py-0.5 rounded text-[11px] transition-colors",
                    item.status === s
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onTogglePin}
                  className="p-1.5 rounded hover:bg-muted text-muted-foreground"
                  aria-label={item.pinned ? "고정 해제" : "고정"}
                >
                  <Pin className={cn("w-3.5 h-3.5", item.pinned && "fill-current text-foreground")} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">{item.pinned ? "고정 해제" : "고정"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setAiOpen((p) => !p)}
                  className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded-md border border-border hover:bg-muted",
                    aiOpen ? "bg-accent text-accent-foreground border-accent" : "text-muted-foreground",
                  )}
                  aria-label="AI로 더 구체화하기"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">AI로 더 구체화하기</TooltipContent>
            </Tooltip>
            <button
              onClick={() => setCopyOpen(true)}
              className="text-[11px] px-2 py-1 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              복붙용 문장 만들기
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-[11px] p-1.5 rounded hover:bg-muted text-muted-foreground">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-xs" onClick={() => setMergeOpen(true)}>
                  <Layers className="w-3 h-3 mr-1.5" /> 비슷한 항목과 합치기
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => setShowAnnotations((p) => !p)}>
                  <FileText className="w-3 h-3 mr-1.5" /> 문장 태그 {showAnnotations ? "숨기기" : "보기"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-destructive" onClick={onDelete}>
                  <Trash2 className="w-3 h-3 mr-1.5" /> 삭제하기
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DialogTitle className="sr-only">{item.name}</DialogTitle>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          className={cn(
            "grid flex-1 min-h-0 overflow-hidden transition-[grid-template-columns]",
            aiOpen ? "grid-cols-[1fr_320px]" : "grid-cols-[1fr_0px]",
          )}
        >
          <div className="overflow-y-auto bg-background">
            <div className="max-w-[820px] mx-auto px-10 py-8 space-y-8">
              <section>
                <div className="grid grid-cols-[120px_1fr] gap-x-4">
                  {visibleFields.map((f, idx) => (
                    <FieldRow
                      key={f.key}
                      field={f}
                      value={item.values[f.key] ?? ""}
                      keywords={item.keywords}
                      onChangeValue={(v) => setFieldValue(f.key, v)}
                      onChangeKeywords={(ks) => update({ keywords: ks })}
                      onRename={(label) => updateField(f.key, { label })}
                      onHide={() => updateField(f.key, { hidden: true })}
                      onDelete={() => removeField(f.key)}
                      onMoveUp={idx > 0 ? () => moveField(f.key, -1) : undefined}
                      onMoveDown={idx < visibleFields.length - 1 ? () => moveField(f.key, 1) : undefined}
                    />
                  ))}
                </div>
                <div className="mt-2 -ml-1">
                  <FieldAdder item={item} addField={addField} unhideField={(k) => updateField(k, { hidden: false })} />
                </div>
              </section>
              <div className="h-px bg-border/60" />
              <section>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10.5px] text-muted-foreground">
                    {item.document ? `${item.document.length}자` : "비어 있음"}
                  </span>
                  <label className="inline-flex items-center gap-1.5 text-[10.5px] text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showAnnotations}
                      onChange={(e) => setShowAnnotations(e.target.checked)}
                      className="h-3 w-3"
                    />
                    문장 태그 보기
                  </label>
                </div>
                {showAnnotations && item.document ? (
                  <AnnotatedView text={item.document} />
                ) : (
                  <Textarea
                    ref={editorRef}
                    value={item.document ?? ""}
                    onChange={(e) => update({ document: e.target.value })}
                    onDrop={onDropSentence}
                    onDragOver={(e) => e.preventDefault()}
                    placeholder={
                      isNarrative
                        ? "자유롭게 써내려가 보세요. 자소서 초안을 그대로 옮겨 적어도 좋아요."
                        : "이 항목과 관련된 메모나 학습 과정을 자유롭게 적어 보세요."
                    }
                    className="min-h-[440px] text-[14.5px] leading-7 bg-transparent border-0 px-0 focus-visible:ring-0 resize-none whitespace-pre-wrap shadow-none placeholder:text-muted-foreground/50"
                  />
                )}
                {preset.writingGuide.length > 0 && !item.document && (
                  <p className="mt-3 text-[10.5px] text-muted-foreground/70 leading-relaxed">
                    추천 흐름 — {preset.writingGuide.join(" · ")}
                  </p>
                )}
              </section>
              {item.linkedExperiences !== undefined && (
                <>
                  <div className="h-px bg-border/60" />
                  <section>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      연결된 경험
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(item.linkedExperiences ?? []).map((id) => {
                        const exp = allItems.find((e) => e.id === id);
                        if (!exp) return null;
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent text-[11px] text-accent-foreground"
                          >
                            {exp.name}
                            <button
                              onClick={() =>
                                update({ linkedExperiences: item.linkedExperiences?.filter((x) => x !== id) })
                              }
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        );
                      })}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-[11px] px-2 py-0.5 rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted">
                            + 경험 연결
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                          {allItems
                            .filter((e) => e.id !== item.id && !item.linkedExperiences?.includes(e.id))
                            .map((e) => (
                              <DropdownMenuItem
                                key={e.id}
                                className="text-xs"
                                onClick={() => update({ linkedExperiences: [...(item.linkedExperiences ?? []), e.id] })}
                              >
                                {e.name}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>

          {aiOpen && (
            <aside className="border-l border-border bg-card overflow-y-auto">
              <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-semibold text-foreground inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    AI 질문
                  </p>
                  <p className="text-[10.5px] text-muted-foreground mt-0.5">이 경험을 더 구체적으로 만들어 봐요.</p>
                </div>
                <button onClick={() => setAiOpen(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="px-4 py-3 space-y-3">
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5">
                  <p className="text-[10px] text-muted-foreground mb-1">AI의 질문</p>
                  <p className="text-[13px] text-foreground leading-snug">{currentQ}</p>
                  <button
                    onClick={() => setCurrentQ(generateQuestion())}
                    className="mt-1.5 text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> 다른 질문 받기
                  </button>
                </div>
                <Textarea
                  value={draftAnswer}
                  onChange={(e) => setDraftAnswer(e.target.value)}
                  placeholder="짧게 답변해 주세요. AI가 자소서 톤의 문장으로 다듬어 드려요."
                  className="min-h-[80px] text-[12.5px]"
                />
                <Button
                  size="sm"
                  className="h-8 text-xs w-full"
                  onClick={onSubmitAnswer}
                  disabled={!draftAnswer.trim()}
                >
                  <Wand2 className="w-3.5 h-3.5" /> 문장으로 다듬기
                </Button>
                {cards.length > 0 && (
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">생성된 문장</p>
                    {cards.map((c) => (
                      <SentenceCardView
                        key={c.id}
                        card={c}
                        onApply={() => applySentence(c.sentence)}
                        onRewrite={() =>
                          setCards((p) =>
                            p.map((x) =>
                              x.id === c.id ? { ...x, sentence: polish(c.question, c.answer) + " (다시 다듬음)" } : x,
                            ),
                          )
                        }
                        onDelete={() => setCards((p) => p.filter((x) => x.id !== c.id))}
                      />
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>

        <CopyGenerator open={copyOpen} onOpenChange={setCopyOpen} item={item} />

        <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
          <DialogContent className="max-w-[860px] p-0 overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-border">
              <DialogTitle className="text-base">비슷한 항목과 합치기</DialogTitle>
              <DialogDescription className="text-sm">최종 항목에 반영할 내용을 선택하세요.</DialogDescription>
            </DialogHeader>
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 mb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                <div>기존 항목</div>
                <div>새로 추출된 항목</div>
              </div>
              {["항목명", "유형", "기간", "역할", "기관", "주요 키워드", "상세 내용"].map((f) => (
                <div key={f} className="border-t border-border py-3">
                  <div className="text-[11px] text-muted-foreground mb-2">{f}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-start gap-2 border border-border rounded-md px-3 py-2.5 text-[12px] hover:bg-muted/30 cursor-pointer">
                      <input type="radio" name={f} defaultChecked className="mt-1" />
                      <span>기존 내용 예시</span>
                    </label>
                    <label className="flex items-start gap-2 border border-border rounded-md px-3 py-2.5 text-[12px] hover:bg-muted/30 cursor-pointer">
                      <input type="radio" name={f} className="mt-1" />
                      <span>새 추출 내용 예시</span>
                    </label>
                  </div>
                  <label className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                    <Checkbox className="h-3 w-3" /> 둘 다 유지
                  </label>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-border flex justify-end gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setMergeOpen(false)}>
                나중에
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setMergeOpen(false);
                  toast.success("합치기가 완료되었어요.");
                }}
              >
                합치기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────────────
// Field components
// ────────────────────────────────────────────────────────────────

function FieldRow({
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
            className="text-[12px] text-foreground bg-transparent border-b border-border focus:outline-none focus:border-primary w-full"
          />
        ) : (
          <span className="text-[12px] text-muted-foreground truncate" onDoubleClick={() => setRenaming(true)}>
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
              className="min-h-[32px] text-[13.5px] bg-transparent border-0 px-0 py-0 focus-visible:ring-0 resize-none shadow-none placeholder:text-muted-foreground/50"
            />
          ) : field.type === "file" ? (
            <button className="text-[13px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <Upload className="w-3 h-3" /> {value || "파일 첨부"}
            </button>
          ) : (
            <input
              value={value}
              onChange={(e) => onChangeValue(e.target.value)}
              placeholder={field.placeholder ?? "—"}
              className="bg-transparent w-full text-[13.5px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            />
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="opacity-0 group-hover/value:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground shrink-0">
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

function FieldAdder({
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
          <TooltipContent side="bottom" className="text-[11px]">
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
              <p className="text-[11px] text-muted-foreground mb-1">항목명</p>
              <Input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="예: 멘토"
                className="h-8 text-sm"
                autoFocus
              />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-1">값 (선택)</p>
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

function KeywordEditor({ keywords, onChange }: { keywords: string[]; onChange: (ks: string[]) => void }) {
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
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[11px] text-foreground/80"
        >
          {k}
          <button
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
          className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-card focus:outline-none focus:border-primary min-w-[120px]"
        />
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted">
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
function tagSentence(s: string): string | null {
  for (const h of TAG_HINTS) if (h.match.test(s)) return h.tag;
  return null;
}

function AnnotatedView({ text }: { text: string }) {
  const sentences = text.split(/(?<=[.!?。])\s+|\n+/).filter((s) => s.trim().length);
  return (
    <div className="space-y-3 text-[13.5px] leading-7 text-foreground">
      {sentences.map((s, i) => {
        const tag = tagSentence(s);
        return (
          <div key={i}>
            {tag && <p className="text-[10.5px] text-muted-foreground/80 mb-0.5">{tag}</p>}
            <p>{s.trim()}</p>
          </div>
        );
      })}
    </div>
  );
}

function SentenceCardView({
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
      <p className="text-[10px] text-muted-foreground mb-1">{card.question}</p>
      <p className="text-[12.5px] text-foreground leading-snug">{card.sentence}</p>
      <div className="mt-2 flex items-center gap-1">
        <Button size="sm" className="h-6 text-[10.5px] px-2" onClick={onApply}>
          반영
        </Button>
        <span className="text-[10px] text-muted-foreground px-1">드래그해서 넣기</span>
        <Button size="sm" variant="ghost" className="h-6 text-[10.5px] px-2 ml-auto" onClick={onRewrite}>
          다시 쓰기
        </Button>
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive p-0.5" aria-label="삭제">
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// CopyGenerator
// ────────────────────────────────────────────────────────────────

function CopyGenerator({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  item: Item;
}) {
  const [purpose, setPurpose] = useState("문제해결");
  const [length, setLength] = useState(500);
  const [text, setText] = useState("");

  const generate = () => {
    const v = item.values;
    const parts = [item.document, v.role, v.tasks].filter(Boolean).join(" ");
    setText((parts || item.name).slice(0, length));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-base">복붙용 문장 만들기</DialogTitle>
          <DialogDescription className="text-sm">목적과 글자수에 맞춰 문장을 다듬어 드려요.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">목적</p>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full h-8 border border-border rounded-md px-2 text-xs bg-card"
            >
              {[
                "지원동기",
                "직무역량",
                "문제해결",
                "협업 경험",
                "도전 경험",
                "성과 경험",
                "성장 과정",
                "입사 후 포부",
                "면접 답변",
                "이력서 요약",
              ].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">글자수</p>
            <select
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full h-8 border border-border rounded-md px-2 text-xs bg-card"
            >
              {[100, 300, 500, 700, 1000].map((n) => (
                <option key={n} value={n}>
                  {n}자 내외
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs mt-1" onClick={generate}>
          <Sparkles className="w-3.5 h-3.5" /> 생성하기
        </Button>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[180px] text-[13px] mt-1"
          placeholder="생성된 문장이 여기에 표시돼요"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            현재 {text.length}자 / 목표 {length}자
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={generate}>
              다시 만들기
            </Button>
            <Button
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => {
                navigator.clipboard.writeText(text);
                toast.success("복사했어요.");
              }}
            >
              <Copy className="w-3 h-3" /> 복사하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────────────
// ResizableHead, HeaderFilter, ManageIndicator
// ────────────────────────────────────────────────────────────────

function ResizableHead({
  label,
  width,
  onResize,
  filter,
}: {
  label: string;
  width?: number;
  onResize?: (e: React.MouseEvent) => void;
  filter?: React.ReactNode;
}) {
  return (
    <th style={width ? { width } : undefined} className="relative text-left px-3 py-1.5 font-medium overflow-hidden whitespace-nowrap">
      <span className="inline-flex items-center gap-1 overflow-hidden">
        <span className="truncate">{label}</span>
        {filter}
      </span>
      {onResize && <ResizeHandle onMouseDown={onResize} />}
    </th>
  );
}

type ColFilterShape = { kind: "select"; values: string[] } | { kind: "text"; q: string };
function HeaderFilter({
  colKey,
  kind,
  options,
  colFilter,
  setSelectFilter,
  setTextFilter,
}: {
  colKey: string;
  kind: "select" | "text";
  options: string[];
  colFilter: Record<string, ColFilterShape>;
  setSelectFilter: (k: string, v: string[]) => void;
  setTextFilter: (k: string, q: string) => void;
}) {
  const cur = colFilter[colKey];
  const active = !!cur;
  const [search, setSearch] = useState("");
  const [text, setText] = useState(cur && cur.kind === "text" ? cur.q : "");
  useEffect(() => {
    setText(cur && cur.kind === "text" ? cur.q : "");
  }, [cur]);
  const selectedSet = cur && cur.kind === "select" ? new Set(cur.values) : new Set<string>();
  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="컬럼 필터"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex items-center justify-center w-4 h-4 rounded transition-colors",
            active
              ? "text-foreground bg-accent"
              : "text-muted-foreground/50 hover:text-foreground opacity-60 hover:opacity-100",
          )}
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px] p-2" onClick={(e) => e.stopPropagation()}>
        {kind === "text" ? (
          <div className="space-y-2">
            <Input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setTextFilter(colKey, text);
              }}
              placeholder="포함하는 글자"
              className="h-7 text-[11px]"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                className="text-[11px] text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setText("");
                  setTextFilter(colKey, "");
                }}
              >
                초기화
              </button>
              <Button size="sm" className="h-6 text-[11px] px-2" onClick={() => setTextFilter(colKey, text)}>
                적용
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {options.length > 6 && (
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="검색"
                className="h-7 text-[11px]"
              />
            )}
            <div className="max-h-[220px] overflow-y-auto -mx-1 px-1">
              {filtered.length === 0 && <p className="text-[11px] text-muted-foreground px-1 py-2">옵션이 없어요.</p>}
              {filtered.map((o) => {
                const checked = selectedSet.has(o);
                return (
                  <label key={o} className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-muted cursor-pointer">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => {
                        const next = new Set(selectedSet);
                        checked ? next.delete(o) : next.add(o);
                        setSelectFilter(colKey, Array.from(next));
                      }}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-[11.5px] truncate">{o}</span>
                  </label>
                );
              })}
            </div>
            {active && (
              <div className="pt-1 border-t border-border flex justify-end">
                <button
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectFilter(colKey, [])}
                >
                  초기화
                </button>
              </div>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ManageIndicator({ item, onMerge, onOpen }: { item: Item; onMerge: () => void; onOpen: () => void }) {
  if (item.status === "병합 필요")
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onMerge}
            className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-muted text-muted-foreground"
            aria-label="비슷한 항목 있음"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="text-xs">비슷한 항목이 있어요</TooltipContent>
      </Tooltip>
    );
  if (item.status === "작성중")
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onOpen}
            className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-muted text-muted-foreground"
            aria-label="작성중"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="text-xs">아직 정리 중</TooltipContent>
      </Tooltip>
    );
  return <span className="text-muted-foreground/30 text-[11px]">—</span>;
}
