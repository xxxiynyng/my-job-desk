import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Download,
  X,
  Sparkles,
  Search,
  Columns3,
  Check,
  LayoutList,
  LayoutGrid,
  Upload,
  RotateCcw,
  Pencil,
  Filter,
  FilePlus,
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
} from "@/components/ui/dropdown-menu";
import { useResizableCols } from "@/hooks/useResizableCols";
import { ColumnDivider } from "@/components/table/ColumnDivider";
import { DragHandle } from "@/components/table/DragHandle";
import { BatchActionBar } from "@/components/table/BatchActionBar";
import { useSearchParams } from "react-router-dom";
import { BasicInfoPanel } from "@/components/pickd/BasicInfoPanel";
import { FilesPanel } from "@/components/pickd/FilesPanel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  type ItemType,
  type Item,
  ALL_TYPES,
  SHARED_EXP_KEY,
  makeFromPreset,
} from "./experiences/presets";

// Pickd accent 팔레트 (2026-07-02, 브랜드 스티커 accent) — 유형 칩에 시범 적용.
// 칩은 항목명보다 약한 보조 요소(SSOT 5-2)라 accent 원색을 그대로 채우지 않고
// 소프트 배경(원색 저알파) + 진하게 조정한 글자 + 얕은 테두리로 파스텔화한다.
const ACCENT = {
  sky: "#62aef0",
  purple: "#d6b6f6",
  pink: "#ff64c8",
  orange: "#dd5b00",
  teal: "#2a9d99",
  green: "#1aae39",
  brown: "#523410",
} as const;
const NEUTRAL_CHIP = "#6b7280"; // 스펙형·폴백용 중립 회색

// 유형 → accent hex. narrative는 accent 컬러, spec은 중립(값 관리 중심이라 저강조).
const TYPE_CHIP_ACCENT: Record<string, string> = {
  프로젝트: ACCENT.sky,
  대외활동: ACCENT.green,
  "경력/인턴": ACCENT.purple,
  공모전: ACCENT.orange,
  봉사활동: ACCENT.teal,
  해외경험: ACCENT.pink,
  알바: ACCENT.brown,
  학부연구생: ACCENT.purple,
  어학: NEUTRAL_CHIP,
  자격증: NEUTRAL_CHIP,
  수상: NEUTRAL_CHIP,
  수강과목: NEUTRAL_CHIP,
  "교육 이수": NEUTRAL_CHIP,
};

// hex → {r,g,b}
const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
};
// 글자용: 흰 배경에서 읽히도록 accent를 어둡게(0.55배). 이미 어두운 색(brown 등)은 거의 그대로.
const darken = (hex: string, f = 0.55) => {
  const { r, g, b } = hexToRgb(hex);
  const d = (v: number) => Math.round(v * f);
  return `rgb(${d(r)}, ${d(g)}, ${d(b)})`;
};
const rgba = (hex: string, a: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

function typeChipStyle(type: string): React.CSSProperties {
  const accent = TYPE_CHIP_ACCENT[type] ?? NEUTRAL_CHIP;
  return {
    backgroundColor: rgba(accent, 0.12),
    color: darken(accent),
    border: `1px solid ${rgba(accent, 0.22)}`,
  };
}

function TypeChip({ type }: { type: ItemType }) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 text-chip font-medium rounded-md whitespace-nowrap"
      style={typeChipStyle(type)}
    >
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

// 컬럼 순서 드래그(탭1과 동일 패턴) — 유형·항목명은 정체성 컬럼이라 고정, 나머지만 이동 가능
const EXP_FIXED_COLS: ColumnKey[] = ["type", "name"];
const EXP_TAIL_COLS: ColumnKey[] = ["org", "period", "keywords", "importance", "updated", "manage"];
const LS_EXP_COL_ORDER = "pickd.experiences.colOrder";
const LS_EXP_COL_PINNED = "pickd.experiences.colPinned";
const COL_LABEL: Record<ColumnKey, string> = Object.fromEntries(
  ALL_COLUMNS.map((c) => [c.key, c.label]),
) as Record<ColumnKey, string>;

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

// 컬럼 최대 너비 — 내용보다 훨씬 넓게 드래그해서 헤더·본문 사이에 큰 빈 공백이
// 남는 것을 방지. 저장된 값이 이보다 크면 useResizableCols가 자동으로 clamp한다.
const MAX_EXP_WIDTHS: Record<string, number> = {
  type: 160,
  name: 420,
  org: 280,
  period: 220,
  keywords: 340,
  importance: 160,
  updated: 170,
  manage: 140,
};

// 유형 탭 표기 순서 — 13개 프리셋 기준(상세 서술형 → 스펙·증빙형). 데이터에 있는(count>0) 유형만 노출,
// 목록에 없는 커스텀 유형은 뒤에 이어 붙인다(SSOT 8-3: 더보기 없음, 가로 스크롤).
const TYPE_TAB_ORDER = [
  "프로젝트", "대외활동", "경력/인턴", "공모전", "봉사활동", "해외경험", "알바", "학부연구생",
  "어학", "자격증", "수상", "수강과목", "교육 이수",
];

// 구 유형명 → 정본 (2026-07-02 프리셋 개편) — localStorage 저장분 로드 시 정규화
const LEGACY_TYPE_MAP: Record<string, string> = {
  "인턴": "경력/인턴",
  "교환학생": "해외경험",
};
const normalizeItemTypes = (list: Item[]): Item[] =>
  list.map((i) => (LEGACY_TYPE_MAP[i.type] ? { ...i, type: LEGACY_TYPE_MAP[i.type] as Item["type"] } : i));

// ────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────

const EXTRACT_MOCK_CANDIDATES: { id: string; type: ItemType; name: string; summary: string }[] = [
  { id: "ec1", type: "프로젝트", name: "캡스톤 디자인 프로젝트", summary: "2024.09 ~ 2025.01 · PM / 기획" },
  { id: "ec2", type: "경력/인턴", name: "여름 마케팅 인턴십", summary: "2024.07 ~ 2024.08 · 마케팅팀" },
  { id: "ec3", type: "대외활동", name: "청년 창업 서포터즈", summary: "2024.03 ~ 2024.06 · 기획 파트" },
];

function SortableExpRow({
  item,
  selected,
  isVisible,
  orderedTailCols,
  setDetailId,
  toggleSelect,
  duplicateItem,
  changeItemType,
  confirmDelete,
  setMergeOpen,
  readMeta,
  stickyProps,
  toggleImportant,
}: {
  item: Item;
  selected: Set<string>;
  isVisible: (k: ColumnKey) => boolean;
  orderedTailCols: ColumnKey[];
  setDetailId: (id: string) => void;
  toggleSelect: (id: string) => void;
  duplicateItem: (id: string) => void;
  changeItemType: (id: string, type: ItemType) => void;
  toggleImportant: (id: string) => void;
  confirmDelete: (ids: string[]) => void;
  setMergeOpen: (open: boolean) => void;
  readMeta: (i: Item) => { org: string; period: string };
  stickyProps: (key: string, header?: boolean) => { style?: React.CSSProperties; className?: string };
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1 : undefined,
  };

  const { org, period } = readMeta(item);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "h-11 border-b border-border/50 hover:bg-gray-50 transition-colors group cursor-pointer relative",
        selected.has(item.id) && "bg-accent/30",
      )}
      onClick={() => setDetailId(item.id)}
    >
      <td
        className={cn("relative w-12 pl-1 pr-3 py-2.5 whitespace-nowrap", stickyProps("__gutter__").className)}
        style={stickyProps("__gutter__").style}
        onClick={(e) => e.stopPropagation()}
      >
        <DragHandle
          ref={setActivatorNodeRef}
          {...listeners}
          icon={null}
          onClick={() => setMenuOpen(true)}
          className="absolute left-0.5 top-1/2 -translate-y-1/2 w-6 h-6 z-20 rounded"
        />
        <ExpRowContextMenu
          open={menuOpen}
          onOpenChange={setMenuOpen}
          item={{ updatedAt: item.updatedAt }}
          jobs={[]}
          typeOptions={ALL_TYPES}
          currentType={item.type}
          onEdit={() => setDetailId(item.id)}
          onDuplicate={() => duplicateItem(item.id)}
          onLinkJob={() => {}}
          onChangeType={(t) => changeItemType(item.id, t as ItemType)}
          onDelete={() => confirmDelete([item.id])}
        />
        <div className="ml-5">
          <Checkbox
            checked={selected.has(item.id)}
            onCheckedChange={() => toggleSelect(item.id)}
            className="h-3.5 w-3.5"
          />
        </div>
      </td>
      {isVisible("type") && (
        <td className={cn("px-4 py-2.5 overflow-hidden", stickyProps("type").className)} style={stickyProps("type").style}>
          <TypeChip type={item.type} />
        </td>
      )}
      {isVisible("name") && (
        <td
          className={cn("px-4 py-2.5 text-sm font-medium text-foreground overflow-hidden", stickyProps("name").className)}
          style={stickyProps("name").style}
        >
          <span className="flex items-center gap-1.5 min-w-0">
            <span className="truncate">{item.name}</span>
          </span>
        </td>
      )}
      {/* 이동 가능한 tail 컬럼 셀 — 헤더 orderedTailCols와 동일 순서로 렌더 */}
      {orderedTailCols.map((key) => {
        const sp = stickyProps(key);
        switch (key) {
          case "org":
            return (
              <td key="org" className={cn("px-4 py-2.5 text-body text-gray-500 overflow-hidden", sp.className)} style={sp.style}>
                <span className="block truncate">{org || "—"}</span>
              </td>
            );
          case "period":
            return (
              <td key="period" className={cn("px-4 py-2.5 text-body text-gray-500 tabular-nums overflow-hidden", sp.className)} style={sp.style}>
                <span className="block truncate">{period || "—"}</span>
              </td>
            );
          case "keywords":
            return (
              <td key="keywords" className={cn("px-4 py-2.5 overflow-hidden", sp.className)} style={sp.style}>
                <div className="flex flex-nowrap gap-1 overflow-hidden">
                  {item.keywords.slice(0, 3).map((k) => (
                    <span key={k} className="text-chip px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-500 border border-gray-100 shrink-0">
                      {k}
                    </span>
                  ))}
                  {item.keywords.length > 3 && (
                    <span className="text-chip text-muted-foreground shrink-0">+{item.keywords.length - 3}</span>
                  )}
                </div>
              </td>
            );
          case "importance":
            return (
              <td key="importance" className={cn("px-4 py-2.5", sp.className)} style={sp.style} onClick={(e) => e.stopPropagation()}>
                <StarToggle
                  active={item.importance === "높음"}
                  onToggle={() => toggleImportant(item.id)}
                  label="중요 항목"
                />
              </td>
            );
          case "updated":
            return (
              <td key="updated" className={cn("px-4 py-2.5 text-body text-gray-500 overflow-hidden", sp.className)} style={sp.style}>
                <span className="block truncate">{item.updatedAt ?? "—"}</span>
              </td>
            );
          case "manage":
            return (
              <td key="manage" className={cn("px-4 py-2.5", sp.className)} style={sp.style} onClick={(e) => e.stopPropagation()}>
                <ManageIndicator
                  item={item}
                  onMerge={() => {
                    setDetailId(item.id);
                    setMergeOpen(true);
                  }}
                />
              </td>
            );
          default:
            return null;
        }
      })}
      <ExpRowActionCell onEdit={() => setDetailId(item.id)} />
    </tr>
  );
}

const LS_SORT_MODE = "pickd.experiences.sortMode";

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
    if (typeof window === "undefined") return INITIAL_EXPERIENCES.map((i, idx) => ({ ...i, sortOrder: idx }));
    try {
      const raw = localStorage.getItem(SHARED_EXP_KEY);
      if (raw) {
        const parsed = normalizeItemTypes(JSON.parse(raw) as Item[]);
        if (Array.isArray(parsed) && parsed.length) {
          if (parsed.some((i) => i.sortOrder === undefined)) {
            return parsed.map((i, idx) => ({ ...i, sortOrder: i.sortOrder ?? idx }));
          }
          return parsed;
        }
      }
    } catch {}
    return INITIAL_EXPERIENCES.map((i, idx) => ({ ...i, sortOrder: idx }));
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
  const { widths: colW, onMouseDown: onResize, resizingKey } = useResizableCols(
    "pickd.experiences.colWidths.v2",
    DEFAULT_EXP_WIDTHS,
    MIN_EXP_WIDTHS,
    MAX_EXP_WIDTHS,
  );

  // 컬럼 순서 (드래그로 변경, 탭1 pickd.jobs.colOrder와 동일 패턴) — 이동 가능한 tail 컬럼만 저장
  const [colOrder, setColOrder] = useState<ColumnKey[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_EXP_COL_ORDER) ?? "[]") as ColumnKey[];
      if (saved.length === EXP_TAIL_COLS.length && saved.every((k) => EXP_TAIL_COLS.includes(k))) return saved;
    } catch {}
    return [...EXP_TAIL_COLS];
  });
  useEffect(() => {
    try {
      localStorage.setItem(LS_EXP_COL_ORDER, JSON.stringify(colOrder));
    } catch {}
  }, [colOrder]);

  // 컬럼 고정 — 고정된 tail 컬럼은 이동 그룹 맨 앞으로(왼쪽) 모아 유지(탭1·탭2 공통 규칙)
  const [pinnedCols, setPinnedCols] = useState<Set<ColumnKey>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(LS_EXP_COL_PINNED) ?? "[]") as ColumnKey[]);
    } catch {
      return new Set();
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(LS_EXP_COL_PINNED, JSON.stringify([...pinnedCols]));
    } catch {}
  }, [pinnedCols]);
  const togglePinCol = (k: ColumnKey) =>
    setPinnedCols((p) => {
      const n = new Set(p);
      if (n.has(k)) n.delete(k); else n.add(k);
      return n;
    });

  // 표시 순서: 보이는 tail 중 고정 먼저, 그다음 일반 (각 그룹 내부는 colOrder 순서 유지)
  const orderedTailCols = useMemo(() => {
    const visible = colOrder.filter((k) => visibleCols.has(k));
    return [...visible.filter((k) => pinnedCols.has(k)), ...visible.filter((k) => !pinnedCols.has(k))];
  }, [colOrder, visibleCols, pinnedCols]);
  // 화면 표시 순서 전체: 고정(유형·항목명) + 이동 가능 tail
  const displayCols = useMemo(
    () => [...EXP_FIXED_COLS.filter((k) => visibleCols.has(k)), ...orderedTailCols],
    [visibleCols, orderedTailCols],
  );

  // ── sticky 컬럼 고정 — 고정 컬럼 + 좌측 블록(체크박스·유형·항목명)을 왼쪽에 얼림 ──
  // 고정이 하나라도 있으면 [체크박스][유형][항목명][고정 tail…]까지 sticky. 가로 스크롤해도 붙어 있음.
  // 스크롤 시 드리프트되는 세로선 오버레이(z-20)는 sticky 셀의 불투명 배경+z-30이 덮어 가린다.
  const EXP_GUTTER_W = 48;
  const frozenMap = useMemo(() => {
    if (pinnedCols.size === 0) return null;
    const keys: ColumnKey[] = [
      ...(["type", "name"] as ColumnKey[]).filter((k) => visibleCols.has(k)),
      ...orderedTailCols.filter((k) => pinnedCols.has(k)),
    ];
    const map = new Map<string, { left: number; last: boolean }>();
    let x = EXP_GUTTER_W;
    map.set("__gutter__", { left: 0, last: keys.length === 0 });
    keys.forEach((k, i) => {
      map.set(k, { left: x, last: i === keys.length - 1 });
      x += colW[k] ?? DEFAULT_EXP_WIDTHS[k] ?? 100;
    });
    return map;
  }, [pinnedCols, orderedTailCols, visibleCols, colW]);

  const stickyProps = (key: string, header = false): { style?: React.CSSProperties; className?: string } => {
    const f = frozenMap?.get(key);
    if (!f) return {};
    return {
      style: { position: "sticky", left: f.left, zIndex: 30 },
      className: cn(header ? "bg-slate-50" : "bg-card group-hover:bg-gray-50", f.last && "border-r border-border"),
    };
  };

  // 컬럼 경계 세로 구분선 — 계산값이 아니라 실제 렌더된 th 경계를 실측(useTableDividers, 탭1·탭2 공용)
  // table-fixed에서 남는 공간이 컬럼에 배분되면 계산값과 실제 경계가 어긋나던 문제 해결(2026-07-02)
  const expTableWrapRef = useRef<HTMLDivElement>(null);
  const dividerBounds = useTableDividers(expTableWrapRef, [colW, displayCols]);
  const dividers = dividerBounds.map((b) => ({
    key: b.key,
    left: b.left,
    onResizeMouseDown: onResize(b.key),
    active: resizingKey === b.key,
  }));

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
      if (n.has(k)) n.delete(k); else n.add(k);
      return n;
    });
  const toggleSelect = (id: string) =>
    setSelected((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id); else n.add(id);
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
  // 중요도 별 토글 — 켜짐="높음", 꺼짐=미설정(탭1 즐겨찾기와 동일한 별 UX)
  const toggleImportant = (id: string) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, importance: i.importance === "높음" ? undefined : "높음" } : i)));

  // CSV 내보내기 — 유형/항목명/기관/기간/키워드 (SSOT 9-2)
  const exportItems = (list: Item[]) => {
    if (!list.length) return;
    exportCsv(
      `경험스펙_${new Date().toISOString().slice(0, 10)}`,
      ["유형", "항목명", "기관/소속", "기간", "주요 키워드", "중요도"],
      list.map((i) => {
        const { org, period } = readMeta(i);
        return [i.type, i.name, org, period, i.keywords.join(" · "), i.importance === "높음" ? "★" : ""];
      }),
    );
    toast(`${list.length}개를 CSV로 내보냈어요`, { duration: 1500 });
  };
  const deleteItems = (ids: string[]) => {
    setItems((p) => p.filter((i) => !ids.includes(i.id)));
    setSelected(new Set());
    toast.success(`${ids.length}개 항목을 삭제했어요`);
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

  // 유형 변경 — 유형만 교체(입력값·본문은 보존). 프리셋 필드 구조 상이 시 데이터 유실 방지 위해 값은 유지
  const changeItemType = (id: string, type: ItemType) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, type } : i)));
    toast(`유형을 '${type}'(으)로 바꿨어요`, { duration: 1500 });
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

  // 유형 탭 — 보유(count>0) 유형 전부 노출: 프리셋 순서 우선, 목록 밖 커스텀 유형은 뒤에 추가
  const typeTabs = useMemo(() => {
    const owned = new Set<string>(items.map((i) => i.type));
    const ordered = TYPE_TAB_ORDER.filter((t) => owned.has(t));
    const extras = Array.from(owned).filter((t) => !TYPE_TAB_ORDER.includes(t)).sort();
    return ["전체", ...ordered, ...extras];
  }, [items]);

  const [colSort, setColSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [sortMode, setSortMode] = useState<"custom" | null>(() => {
    try {
      return localStorage.getItem(LS_SORT_MODE) === "custom" ? "custom" : null;
    } catch {
      return null;
    }
  });
  useEffect(() => {
    try {
      if (sortMode === "custom") localStorage.setItem(LS_SORT_MODE, "custom");
      else localStorage.removeItem(LS_SORT_MODE);
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

  // 컬럼별 헤더 필터 종류 — importance(중요도)는 값 종류가 적어 필터 제외
  const EXP_FILTER_KIND: Partial<Record<ColumnKey, "select" | "text">> = {
    type: "select",
    name: "text",
    org: "select",
    period: "text",
    keywords: "select",
    updated: "text",
    manage: "select",
  };
  const filterPropsFor = (key: ColumnKey): ColumnFilterProps | undefined => {
    const kind = EXP_FILTER_KIND[key];
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return;
      // 컬럼 헤더 그립 드래그 — tail 컬럼 순서 변경 (행 드래그와 같은 DndContext, id로 구분)
      if (EXP_TAIL_COLS.includes(String(active.id) as ColumnKey)) {
        setColOrder((prev) => {
          const oldIdx = prev.findIndex((k) => k === active.id);
          const newIdx = prev.findIndex((k) => k === over.id);
          if (oldIdx === -1 || newIdx === -1) return prev;
          return arrayMove(prev, oldIdx, newIdx);
        });
        return;
      }
      // 행 그립 드래그 — 커스텀 정렬로 전환
      setItems((prev) => {
        const oldIdx = prev.findIndex((i) => i.id === String(active.id));
        const newIdx = prev.findIndex((i) => i.id === String(over.id));
        if (oldIdx === -1 || newIdx === -1) return prev;
        return arrayMove(prev, oldIdx, newIdx).map((item, idx) => ({ ...item, sortOrder: idx }));
      });
      setSortMode("custom");
      setColSort(null);
    },
    [],
  );

  const sortedFiltered = useMemo(() => {
    if (sortMode === "custom") {
      return [...filtered].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
    if (!colSort) return filtered;
    return [...filtered].sort((a, b) => {
      const av = getColValue(a, colSort.key);
      const bv = getColValue(b, colSort.key);
      const astr = Array.isArray(av) ? av.join(",") : String(av);
      const bstr = Array.isArray(bv) ? bv.join(",") : String(bv);
      const cmp = astr.localeCompare(bstr, "ko", { numeric: true });
      return colSort.dir === "asc" ? cmp : -cmp;
    });
  }, [filtered, colSort, sortMode]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen bg-background overflow-hidden">
        <PickdSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="px-10 pt-8 pb-10 max-w-[1400px] mx-auto space-y-3">
            {/* ── 페이지 헤더 ───────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-heading font-bold text-foreground tracking-[-0.04em] leading-tight">경험·스펙 DB</h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  경험과 스펙을 한 곳에서 정리하고, 자소서·면접에 바로 꺼내 쓰세요.
                </p>
              </div>
              {activeTab === "db" && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-xs px-3 rounded-md" onClick={() => setImportOpen(true)}>
                    <Sparkles className="w-3 h-3" /> 자소서에서 추출
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs px-3 rounded-md" onClick={() => setExcelOpen(true)}>
                    <Download className="w-3 h-3" /> Excel 내보내기
                  </Button>
                </div>
              )}
            </div>

            {/* ── 탭 허브: 경험·스펙 DB / 기본정보 / 파일함 ─────────────── */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-9 bg-muted/60">
                <TabsTrigger value="db" className="text-body">경험·스펙 DB</TabsTrigger>
                <TabsTrigger value="basic-info" className="text-body">기본정보</TabsTrigger>
                <TabsTrigger value="files" className="text-body">파일함</TabsTrigger>
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
                      className="h-7 w-36 pl-6 text-xs border-border"
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
                              <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-primary text-primary-foreground text-micro leading-[14px] text-center">
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
                      <DropdownMenuLabel className="text-chip text-muted-foreground font-normal">
                        활성 필터
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {activeFilterCount === 0 ? (
                        <div className="px-2 py-3 text-chip text-muted-foreground">적용된 필터가 없어요.</div>
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
                        <DropdownMenuLabel className="text-chip text-muted-foreground font-normal">
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
                  {typeTabs.map((f) => (
                    <button
                      key={f}
                      onClick={() => { setActiveFilter(f); if (view === "paste") setView("list"); }}
                      className={cn(
                        "px-3 py-2 text-xs flex items-center gap-1 border-b-2 whitespace-nowrap transition-colors shrink-0",
                        activeFilter === f && view !== "paste"
                          ? "text-blue-600 font-semibold border-blue-500"
                          : "border-transparent text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {f}
                      <span className={cn("tabular-nums text-mini", activeFilter === f && view !== "paste" ? "text-blue-400" : "text-muted-foreground/40")}>
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

              {/* 배치 액션 바 — 공용 컴포넌트, 액션 항목만 탭2 전용 */}
              <BatchActionBar
                count={selected.size}
                className="border rounded-lg mb-3"
                actions={[
                  { label: "삭제", onClick: () => confirmDelete([...selected]), tone: "danger" },
                  { label: "유형 변경" },
                  { label: "내보내기", onClick: () => exportItems(items.filter((i) => selected.has(i.id))) },
                ]}
                onClear={() => setSelected(new Set())}
              />

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
                <div ref={expTableWrapRef} className="bg-card border border-border rounded-xl overflow-hidden relative">
                  {dividers.map((d) => (
                    <ColumnDivider key={d.key} left={d.left} onResizeMouseDown={d.onResizeMouseDown} active={d.active} />
                  ))}
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <table className="w-full min-w-full text-body table-fixed">
                    {/* colgroup — table-fixed의 컬럼 너비 기준 명시, thead/tbody 정렬 보장 */}
                    <colgroup>
                      <col style={{ width: 48 }} />
                      {displayCols.map((k) => (
                        <col key={k} style={{ width: colW[k] }} />
                      ))}
                      <col style={{ width: 56 }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-slate-50 text-xs font-medium text-gray-600 select-none border-b border-border">
                        <th
                          className={cn("w-12 pl-1 pr-3 py-3", stickyProps("__gutter__", true).className)}
                          style={stickyProps("__gutter__", true).style}
                        >
                          <div className="ml-5">
                            <Checkbox
                              checked={allFilteredSelected}
                              onCheckedChange={toggleSelectAll}
                              className="h-3.5 w-3.5"
                            />
                          </div>
                        </th>
                        {isVisible("type") && (
                          <HeaderCell
                            label="유형"
                            colKey="type"
                            sortDir={colSort?.key === "type" ? colSort.dir : null}
                            onSort={() => toggleColSort("type")}
                            onSortChange={(d) => setSortDirect("type", d)}
                            filter={filterPropsFor("type")}
                            className={stickyProps("type", true).className}
                            style={stickyProps("type", true).style}
                          />
                        )}
                        {isVisible("name") && (
                          <HeaderCell
                            label="항목명"
                            colKey="name"
                            sortDir={colSort?.key === "name" ? colSort.dir : null}
                            onSort={() => toggleColSort("name")}
                            onSortChange={(d) => setSortDirect("name", d)}
                            filter={filterPropsFor("name")}
                            className={stickyProps("name", true).className}
                            style={stickyProps("name", true).style}
                          />
                        )}
                        {/* 이동 가능한 tail 컬럼 — 그립 드래그로 순서 변경(탭1과 동일 패턴), 클릭 시 정렬 드롭다운 */}
                        <SortableContext items={orderedTailCols} strategy={horizontalListSortingStrategy}>
                          {orderedTailCols.map((key) => (
                            <SortableColumnHeader
                              key={key}
                              colKey={key}
                              label={COL_LABEL[key]}
                              sortDir={colSort?.key === key ? colSort.dir : null}
                              onSortToggle={() => toggleColSort(key)}
                              onSortChange={(d) => setSortDirect(key, d)}
                              filter={filterPropsFor(key)}
                              pinned={pinnedCols.has(key)}
                              onTogglePin={() => togglePinCol(key)}
                              onDelete={() => toggleCol(key)}
                              stickyStyle={stickyProps(key).style}
                              stickyClassName={stickyProps(key, true).className}
                            />
                          ))}
                        </SortableContext>
                        <th className="w-14 bg-slate-50" />
                      </tr>
                    </thead>
                    <SortableContext items={sortedFiltered.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                      <tbody>
                        {sortedFiltered.map((i) => (
                          <SortableExpRow
                            key={i.id}
                            item={i}
                            selected={selected}
                            isVisible={isVisible}
                            orderedTailCols={orderedTailCols}
                            setDetailId={setDetailId}
                            toggleSelect={toggleSelect}
                            duplicateItem={duplicateItem}
                            changeItemType={changeItemType}
                            confirmDelete={confirmDelete}
                            stickyProps={stickyProps}
                            toggleImportant={toggleImportant}
                            setMergeOpen={setMergeOpen}
                            readMeta={readMeta}
                          />
                        ))}
                        {sortedFiltered.length === 0 && (
                          <tr>
                            <td colSpan={20} className="px-4 py-10 text-center text-xs text-muted-foreground">
                              해당하는 항목이 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </SortableContext>
                  </table>
                  </DndContext>
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
                          <TypeChip type={i.type} />
                          <ManageIndicator
                            item={i}
                            onMerge={() => {
                              setDetailId(i.id);
                              setMergeOpen(true);
                            }}
                          />
                        </div>
                        <p className="text-sm font-semibold text-foreground mt-1.5">{i.name}</p>
                        <p className="text-chip text-muted-foreground mt-0.5">
                          {org || "—"} {period && `· ${period}`}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {i.keywords.map((k) => (
                            <span key={k} className="text-chip px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-500 border border-gray-100">
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
                    <p className="text-chip text-muted-foreground mt-1">PDF, DOCX, TXT</p>
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
                      <span className="text-chip text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                        {c.type}
                      </span>
                      <span className="text-sm font-medium truncate">{c.name}</span>
                    </div>
                    <p className="text-chip text-muted-foreground mt-0.5">{c.summary}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-chip text-muted-foreground">{checkedCandidates.size}개 선택됨</span>
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
                    toast.success(`${newItems.length}개 경험을 추가했어요`);
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
                  exportItems(filtered);
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

import { RepExperienceGrid } from './experiences/RepExperienceViews';

import { DetailEditor } from './experiences/DetailEditor';

import { ManageIndicator } from './experiences/tableWidgets';
import { HeaderCell } from "@/components/table/HeaderCell";
import { SortableColumnHeader } from "@/components/table/SortableColumnHeader";
import { type ColumnFilterProps } from "@/components/table/HeaderFilter";
import { useTableDividers } from "@/components/table/useTableDividers";
import { StarToggle } from "@/components/table/StarToggle";
import { exportCsv } from "@/lib/csv";
import { ExpRowContextMenu, ExpRowActionCell } from "@/components/pickd/RowContextMenu";
