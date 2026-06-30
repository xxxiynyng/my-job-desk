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
import {
  type ItemType,
  type Item,
  NARRATIVE_TYPES,
  SPEC_TYPES,
  SHARED_EXP_KEY,
  makeFromPreset,
} from "./experiences/presets";

function TypeChip({ type }: { type: ItemType }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium bg-gray-50 text-gray-500 border border-gray-100 rounded-md whitespace-nowrap">
      {type}
    </span>
  );
}
import { INITIAL_EXPERIENCES } from "./experiences/mockData";

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

export { INITIAL_EXPERIENCES } from "./experiences/mockData";

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

const PINNED_FILTER_CHIPS = ["전체", "프로젝트", "대외활동", "인턴", "공모전", "자격증"];
const MORE_FILTER_CHIPS = ["봉사활동", "교환학생", "알바", "학부연구생", "어학", "수상", "수강과목", "교육 이수"];

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

  const duplicateItem = (id: string) => {
    const src = items.find((i) => i.id === id);
    if (!src) return;
    setItems((p) => [...p, { ...src, id: `${id}-${Date.now()}` }]);
    toast("경험을 복제했어요", { duration: 1500 });
  };

  const copy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast("복사했어요", { duration: 1200 });
  };

  const expChipCount = (f: string) => {
    if (f === "전체") return items.length;
    return items.filter((i) => i.type === f).length;
  };

  const [colSort, setColSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const toggleColSort = (key: string) => {
    setColSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  const sortedFiltered = useMemo(() => {
    if (!colSort) return filtered;
    return [...filtered].sort((a, b) => {
      const av = getColValue(a, colSort.key);
      const bv = getColValue(b, colSort.key);
      const astr = Array.isArray(av) ? av.join(",") : String(av);
      const bstr = Array.isArray(bv) ? bv.join(",") : String(bv);
      const cmp = astr.localeCompare(bstr, "ko", { numeric: true });
      return colSort.dir === "asc" ? cmp : -cmp;
    });
  }, [filtered, colSort]);

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
                <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium gap-1.5" onClick={() => setEntryOpen(true)}>
                  <Plus className="w-3.5 h-3.5" /> 경험 추가
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

              {/* Filter tab-bar */}
              <div className="flex items-center border-b border-border mb-3">
                <div className="flex items-end -mb-px overflow-x-auto">
                  {PINNED_FILTER_CHIPS.filter(f => f === '전체' || expChipCount(f) > 0).map((f) => (
                    <button
                      key={f}
                      onClick={() => { setActiveFilter(f); if (view === "paste") setView("list"); }}
                      className={cn(
                        "px-3 py-2 text-[12px] flex items-center gap-1 border-b-2 whitespace-nowrap transition-colors shrink-0",
                        activeFilter === f && view !== "paste"
                          ? "text-blue-600 font-semibold border-blue-500"
                          : "border-transparent text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {f}
                      <span className={cn("tabular-nums text-[10px]", activeFilter === f && view !== "paste" ? "text-blue-400" : "text-muted-foreground/40")}>
                        {expChipCount(f)}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="ml-auto pl-3 pb-1 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setView((v) => v === "paste" ? "list" : "paste")}
                        className={cn(
                          "inline-flex items-center justify-center w-6 h-6 rounded border transition-colors",
                          view === "paste"
                            ? "bg-accent text-accent-foreground border-accent"
                            : "border-border text-muted-foreground hover:text-foreground hover:bg-muted",
                        )}
                        aria-label="복붙 보기"
                      >
                        <Clipboard className="w-3 h-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">복붙 보기 (핀 고정 항목)</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* 배치 액션 바 */}
              {selected.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-1.5 mb-3">
                  <span className="text-[12px] font-medium text-blue-700 shrink-0">{selected.size}개 선택됨</span>
                  <span className="w-px h-3.5 bg-blue-200 mx-1 shrink-0" />
                  <button
                    onClick={() => confirmDelete([...selected])}
                    className="text-[12px] text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors font-medium"
                  >
                    삭제
                  </button>
                  <button className="text-[12px] text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors font-medium">
                    유형 변경
                  </button>
                  <button className="text-[12px] text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors font-medium">
                    내보내기
                  </button>
                  <button
                    onClick={() => setSelected(new Set())}
                    className="ml-auto text-blue-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-100 transition-colors"
                    aria-label="선택 해제"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

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
                  <table className="w-full min-w-full text-[13px] table-fixed">
                    {/* colgroup — table-fixed의 컬럼 너비 기준 명시, thead/tbody 정렬 보장 */}
                    <colgroup>
                      <col style={{ width: 48 }} />
                      {isVisible("type") && <col style={{ width: colW.type }} />}
                      {isVisible("name") && <col style={{ width: colW.name }} />}
                      {isVisible("org") && <col style={{ width: colW.org }} />}
                      {isVisible("period") && <col style={{ width: colW.period }} />}
                      {isVisible("keywords") && <col style={{ width: colW.keywords }} />}
                      {isVisible("importance") && <col style={{ width: colW.importance }} />}
                      {isVisible("updated") && <col style={{ width: colW.updated }} />}
                      {isVisible("manage") && <col style={{ width: colW.manage }} />}
                      <col style={{ width: 56 }} />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-border bg-[#F8FAFC] text-[13px] text-muted-foreground font-normal select-none">
                        <th className="w-12 pl-1 pr-3 py-3">
                          <div className="ml-5">
                            <Checkbox
                              checked={allFilteredSelected}
                              onCheckedChange={toggleSelectAll}
                              className="h-3.5 w-3.5"
                            />
                          </div>
                        </th>
                        {isVisible("type") && (
                          <ResizableHead
                            label="유형"
                            width={colW.type}
                            onResize={onResize("type")}
                            sortDir={colSort?.key === "type" ? colSort.dir : null}
                            onSort={() => toggleColSort("type")}
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
                            sortDir={colSort?.key === "name" ? colSort.dir : null}
                            onSort={() => toggleColSort("name")}
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
                            sortDir={colSort?.key === "org" ? colSort.dir : null}
                            onSort={() => toggleColSort("org")}
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
                            sortDir={colSort?.key === "period" ? colSort.dir : null}
                            onSort={() => toggleColSort("period")}
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
                            sortDir={colSort?.key === "keywords" ? colSort.dir : null}
                            onSort={() => toggleColSort("keywords")}
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
                          <ResizableHead
                            label="중요도"
                            width={colW.importance}
                            onResize={onResize("importance")}
                            sortDir={colSort?.key === "importance" ? colSort.dir : null}
                            onSort={() => toggleColSort("importance")}
                          />
                        )}
                        {isVisible("updated") && (
                          <ResizableHead
                            label="최근 수정"
                            width={colW.updated}
                            onResize={onResize("updated")}
                            sortDir={colSort?.key === "updated" ? colSort.dir : null}
                            onSort={() => toggleColSort("updated")}
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
                            sortDir={colSort?.key === "manage" ? colSort.dir : null}
                            onSort={() => toggleColSort("manage")}
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
                        <th className="w-14 bg-[#F8FAFC]" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedFiltered.map((i) => {
                        const { org, period } = readMeta(i);
                        return (
                          <tr
                            key={i.id}
                            className={cn(
                              "h-11 border-b border-border/50 hover:bg-accent/40 transition-colors group cursor-pointer relative",
                              selected.has(i.id) && "bg-accent/30",
                            )}
                            onClick={() => setDetailId(i.id)}
                          >
                            {/* 그립 버튼 + 체크박스 */}
                            <td className="relative w-12 pl-1 pr-3 py-2.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <ExpRowContextMenu
                                item={{ updatedAt: i.updatedAt }}
                                jobs={[]}
                                onEdit={() => setDetailId(i.id)}
                                onDuplicate={() => duplicateItem(i.id)}
                                onLinkJob={() => {}}
                                onDelete={() => confirmDelete([i.id])}
                              />
                              <div className="ml-5">
                                <Checkbox
                                  checked={selected.has(i.id)}
                                  onCheckedChange={() => toggleSelect(i.id)}
                                  className="h-3.5 w-3.5"
                                />
                              </div>
                            </td>
                            {isVisible("type") && (
                              <td className="px-4 py-2.5 overflow-hidden">
                                <TypeChip type={i.type} />
                              </td>
                            )}
                            {isVisible("name") && (
                              <td className="px-4 py-2.5 text-sm font-semibold text-gray-900 overflow-hidden">
                                <span className="flex items-center gap-1.5 min-w-0">
                                  <span className="truncate">{i.name}</span>
                                </span>
                              </td>
                            )}
                            {isVisible("org") && (
                              <td className="px-4 py-2.5 text-[13px] text-gray-500 overflow-hidden">
                                <span className="block truncate">{org || "—"}</span>
                              </td>
                            )}
                            {isVisible("period") && (
                              <td className="px-4 py-2.5 text-[13px] text-gray-500 tabular-nums overflow-hidden">
                                <span className="block truncate">{period || "—"}</span>
                              </td>
                            )}
                            {isVisible("keywords") && (
                              <td className="px-4 py-2.5 overflow-hidden">
                                <div className="flex flex-nowrap gap-1 overflow-hidden">
                                  {i.keywords.slice(0, 3).map((k) => (
                                    <span
                                      key={k}
                                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-500 border border-gray-100 shrink-0"
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
                              <td className="px-4 py-2.5 text-[13px] text-gray-500 overflow-hidden">
                                <span className="block truncate">{i.importance ?? "—"}</span>
                              </td>
                            )}
                            {isVisible("updated") && (
                              <td className="px-4 py-2.5 text-[13px] text-gray-500 overflow-hidden">
                                <span className="block truncate">{i.updatedAt ?? "—"}</span>
                              </td>
                            )}
                            {isVisible("manage") && (
                              <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                                <ManageIndicator
                                  item={i}
                                  onMerge={() => {
                                    setDetailId(i.id);
                                    setMergeOpen(true);
                                  }}
                                />
                              </td>
                            )}
                            <ExpRowActionCell
                              onEdit={() => setDetailId(i.id)}
                            />
                          </tr>
                        );
                      })}
                      {sortedFiltered.length === 0 && (
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
                          />
                        </div>
                        <p className="text-sm font-semibold text-foreground mt-1.5">{i.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {org || "—"} {period && `· ${period}`}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {i.keywords.map((k) => (
                            <span key={k} className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-500 border border-gray-100">
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

import { RepExperienceGrid, InfoRow } from './experiences/RepExperienceViews';

import { DetailEditor } from './experiences/DetailEditor';

import { ResizableHead, HeaderFilter, ManageIndicator, type ColFilterShape } from './experiences/tableWidgets';
import { ExpRowContextMenu, ExpRowActionCell } from "@/components/pickd/RowContextMenu";
