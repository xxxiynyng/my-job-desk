import React, { useState } from "react";
import { GripVertical, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ── 공통 그립 트리거 버튼 — forwardRef (Radix asChild 필수) ────────
const GripTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>((props, ref) => (
  <button
    ref={ref}
    aria-label="행 메뉴 열기"
    {...props}
    onClick={(e) => {
      e.stopPropagation();
      props.onClick?.(e);
    }}
    className={cn(
      "opacity-0 group-hover:opacity-100 transition-opacity",
      "absolute left-0.5 top-1/2 -translate-y-1/2",
      "p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600",
      "cursor-pointer z-10",
      props.className,
    )}
  >
    <GripVertical className="w-3.5 h-3.5" />
  </button>
));
GripTrigger.displayName = "GripTrigger";

// ── 검색 인풋 ─────────────────────────────────────────────────────
function MenuSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="px-2 pt-1.5 pb-1">
      <Input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        placeholder="작업을 검색하세요"
        className="h-7 text-xs border-blue-300 focus-visible:ring-1 focus-visible:ring-blue-200"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab1 — 공고 행 컨텍스트 메뉴
// ─────────────────────────────────────────────────────────────────

export type JobMenuStatus =
  | "작성중"
  | "지원예정"
  | "지원완료"
  | "서류전형"
  | "서류합격"
  | "필기전형"
  | "면접전형"
  | "최종합격"
  | "불합격"
  | "보류";

const JOB_STATUS_OPTIONS: JobMenuStatus[] = [
  "작성중",
  "지원예정",
  "지원완료",
  "서류전형",
  "서류합격",
  "필기전형",
  "면접전형",
  "최종합격",
  "불합격",
  "보류",
];

export function JobRowContextMenu({
  job,
  onStar,
  onEdit,
  onDuplicate,
  onChangeStatus,
  onDelete,
}: {
  job: {
    starred: boolean;
    updatedAt: string;
    url?: string;
    status: JobMenuStatus;
  };
  onStar: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onChangeStatus: (s: JobMenuStatus) => void;
  onDelete: () => void;
}) {
  const [search, setSearch] = useState("");

  const q = search.toLowerCase();
  const show = (label: string) => !q || label.toLowerCase().includes(q);

  const starLabel = job.starred ? "즐겨찾기 해제" : "즐겨찾기 토글";
  const starIcon = job.starred ? "★" : "☆";

  return (
    <DropdownMenu onOpenChange={(open) => { if (!open) setSearch(""); }}>
      <DropdownMenuTrigger asChild>
        <GripTrigger />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4} className="w-56 p-0">
        <MenuSearch value={search} onChange={setSearch} />

        <DropdownMenuLabel className="px-3 py-0.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
          공고
        </DropdownMenuLabel>

        {show(starLabel) && (
          <DropdownMenuItem onSelect={() => onStar()} className="gap-2.5 text-[13px]">
            <span className="w-4 text-center shrink-0">{starIcon}</span>
            {starLabel}
          </DropdownMenuItem>
        )}
        {show("공고 편집") && (
          <DropdownMenuItem onSelect={() => onEdit()} className="gap-2.5 text-[13px]">
            <span className="w-4 text-center shrink-0">✏️</span>
            공고 편집
          </DropdownMenuItem>
        )}
        {show("공고 URL 열기") && (
          <DropdownMenuItem
            onSelect={() => { if (job.url) window.open(job.url, "_blank", "noopener,noreferrer"); }}
            className={cn("gap-2.5 text-[13px]", !job.url && "opacity-40 pointer-events-none")}
          >
            <span className="w-4 text-center shrink-0">🔗</span>
            공고 URL 열기
          </DropdownMenuItem>
        )}
        {show("복제") && (
          <DropdownMenuItem onSelect={() => onDuplicate()} className="gap-2.5 text-[13px]">
            <span className="w-4 text-center shrink-0">📄</span>
            복제
          </DropdownMenuItem>
        )}
        {show("상태 변경") && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2.5 text-[13px]">
              <span className="w-4 text-center shrink-0">→</span>
              상태 변경
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-40">
              {JOB_STATUS_OPTIONS.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onSelect={() => onChangeStatus(s)}
                  className={cn(
                    "text-[13px]",
                    job.status === s && "font-semibold text-primary",
                  )}
                >
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {show("삭제") && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onDelete()}
              className="gap-2.5 text-[13px] text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <span className="w-4 text-center shrink-0">🗑</span>
              삭제
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <div className="px-3 py-2 text-[10px] text-muted-foreground leading-relaxed select-none">
          <div>최종 편집</div>
          <div className="opacity-60">{job.updatedAt}</div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab2 — 경험 행 컨텍스트 메뉴
// ─────────────────────────────────────────────────────────────────

export function ExpRowContextMenu({
  item,
  jobs,
  onEdit,
  onDuplicate,
  onLinkJob,
  onDelete,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  item: {
    updatedAt?: string;
  };
  jobs: { id: string; company: string; title: string }[];
  onEdit: () => void;
  onDuplicate: () => void;
  onLinkJob: (jobId: string) => void;
  onDelete: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [search, setSearch] = useState("");

  const q = search.toLowerCase();
  const show = (label: string) => !q || label.toLowerCase().includes(q);

  const handleOpenChange = (o: boolean) => {
    if (!o) setSearch("");
    controlledOnOpenChange?.(o);
  };

  return (
    <DropdownMenu
      open={controlledOpen}
      onOpenChange={controlledOpen !== undefined ? handleOpenChange : (o) => { if (!o) setSearch(""); }}
    >
      <DropdownMenuTrigger asChild>
        <GripTrigger />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4} className="w-56 p-0">
        <MenuSearch value={search} onChange={setSearch} />

        <DropdownMenuLabel className="px-3 py-0.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
          경험
        </DropdownMenuLabel>

        {show("경험 편집") && (
          <DropdownMenuItem onSelect={() => onEdit()} className="gap-2.5 text-[13px]">
            <span className="w-4 text-center shrink-0">✏️</span>
            경험 편집
          </DropdownMenuItem>
        )}
        {show("복제") && (
          <DropdownMenuItem onSelect={() => onDuplicate()} className="gap-2.5 text-[13px]">
            <span className="w-4 text-center shrink-0">📄</span>
            복제
          </DropdownMenuItem>
        )}
        {show("공고에 연결") && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2.5 text-[13px]">
              <span className="w-4 text-center shrink-0">→</span>
              공고에 연결
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-52">
              {jobs.length === 0 ? (
                <div className="px-3 py-2.5 text-xs text-muted-foreground">
                  연결 가능한 공고가 없어요.
                </div>
              ) : (
                jobs.map((j) => (
                  <DropdownMenuItem
                    key={j.id}
                    onSelect={() => onLinkJob(j.id)}
                    className="text-[13px]"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-xs truncate">{j.company}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{j.title}</div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {show("삭제") && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onDelete()}
              className="gap-2.5 text-[13px] text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <span className="w-4 text-center shrink-0">🗑</span>
              삭제
            </DropdownMenuItem>
          </>
        )}

        {item.updatedAt && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2 text-[10px] text-muted-foreground leading-relaxed select-none">
              <div>최종 편집</div>
              <div className="opacity-60">{item.updatedAt}</div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────────────────────────────────────────────────
// 공통 RowActionCell — 행 우측 끝 MoreHorizontal 드롭다운 (탭1·탭2 공유)
// ─────────────────────────────────────────────────────────────────

function RowActionGutter({ children }: { children: React.ReactNode }) {
  return (
    <td
      className="relative w-14 px-1 py-2 align-middle"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute inset-0 bg-gradient-to-l from-gray-50 via-gray-50/95 to-transparent pointer-events-none" />
        {children}
      </div>
    </td>
  );
}

export function RowEditCell({ onEdit }: { onEdit: () => void }) {
  return (
    <RowActionGutter>
      <button
        className="relative p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="편집"
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </RowActionGutter>
  );
}

// 탭별 alias — callers 변경 없이 공용 컴포넌트 공유
export const JobRowActionCell = RowEditCell;
export const ExpRowActionCell = RowEditCell;
