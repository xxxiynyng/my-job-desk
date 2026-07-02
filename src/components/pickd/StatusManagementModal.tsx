import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Building2, ChevronRight, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 전형 단계 6개 (2026-07-02 재편) — 최종합격/불합격/보류는 "전형완료" + 세부 결과(FinalResult)로 표현
export type AppStage = "작성중" | "지원완료" | "서류전형" | "필기전형" | "면접전형" | "전형완료";
export type FinalResult = "합격" | "불합격" | "포기" | null;

const STAGE_FLOW: AppStage[] = ["작성중", "지원완료", "서류전형", "필기전형", "면접전형", "전형완료"];

const FINAL_RESULT_OPTIONS: NonNullable<FinalResult>[] = ["합격", "불합격", "포기"];

const finalResultStyles: Record<NonNullable<FinalResult>, string> = {
  합격: "bg-pickd-green-light text-pickd-green border-pickd-green/30",
  불합격: "bg-pickd-red-light text-pickd-red border-pickd-red/30",
  포기: "bg-muted text-muted-foreground border-border",
};

type ItemType = "일정" | "할 일";
type ItemStatus = "예정" | "진행 중" | "완료" | "지연";

type RowItem = {
  id: string;
  type: ItemType;
  title: string;
  datetime: string;
  status: ItemStatus;
};

const STATUS_BADGE: Record<ItemStatus, string> = {
  예정: "bg-muted text-muted-foreground",
  "진행 중": "bg-accent text-accent-foreground",
  완료: "bg-pickd-green-light text-pickd-green",
  지연: "bg-pickd-red-light text-pickd-red",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: {
    company: string;
    title: string;
    role: string;
    deadline: string;
    dday: number;
  } | null;
  currentStage?: AppStage;
  currentFinalResult?: FinalResult;
  onStageChange?: (stage: AppStage) => void;
  onFinalResultChange?: (result: FinalResult) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-3 py-1.5 items-center">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-[13px] text-foreground">{children}</div>
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatusManagementModal({
  open,
  onOpenChange,
  job,
  currentStage = "작성중",
  currentFinalResult = null,
  onStageChange,
  onFinalResultChange,
}: Props) {
  const [stage, setStageLocal] = useState<AppStage>(currentStage);
  const [finalResult, setFinalResultLocal] = useState<FinalResult>(currentFinalResult);

  const activeStage = onStageChange ? currentStage : stage;
  const activeFinalResult = onFinalResultChange ? currentFinalResult : finalResult;

  const setStage = (s: AppStage) => {
    setStageLocal(s);
    onStageChange?.(s);
  };

  const setFinalResult = (r: FinalResult) => {
    setFinalResultLocal(r);
    onFinalResultChange?.(r);
  };

  const [memo, setMemo] = useState("자소서 1번 문항 키워드 정리 필요");
  const [items, setItems] = useState<RowItem[]>([
    { id: "1", type: "일정", title: "서류 마감", datetime: "5/20 18:00", status: "예정" },
    { id: "2", type: "할 일", title: "자소서 1번 수정", datetime: "5/18", status: "진행 중" },
    { id: "3", type: "할 일", title: "기업분석 정리", datetime: "5/19", status: "예정" },
    { id: "4", type: "일정", title: "면접 예정", datetime: "미정", status: "예정" },
  ]);

  if (!job) return null;

  const updateItem = (id: string, patch: Partial<RowItem>) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const deleteItem = (id: string) => setItems((p) => p.filter((i) => i.id !== id));
  const addItem = (type: ItemType) =>
    setItems((p) => [...p, { id: String(Date.now()), type, title: "새 항목", datetime: "", status: "예정" }]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[860px] w-[94vw] max-h-[90vh] p-0 gap-0 overflow-hidden bg-background border-border rounded-xl [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-border flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1.5">
              <span>지원 대시보드</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground">상태 관리</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                <Building2 className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-foreground leading-tight">{job.company}</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {job.title} · {job.role}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground -mt-1"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <DialogTitle className="sr-only">지원 상태 관리</DialogTitle>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-6 py-5 space-y-6 bg-muted/20">
          {/* 공고 기본 정보 */}
          <Section title="공고 기본 정보">
            <div className="bg-card border border-border rounded-lg px-4 py-2">
              <Field label="기업명">{job.company}</Field>
              <Field label="공고명">{job.title}</Field>
              <Field label="직무">{job.role}</Field>
              <Field label="마감일">
                <span className="tabular-nums">{job.deadline}</span>
                <span
                  className={cn(
                    "ml-2 text-[11px] tabular-nums",
                    job.dday <= 3 && job.dday > 0 ? "text-pickd-red" : "text-muted-foreground",
                  )}
                >
                  {job.dday > 0 ? `D-${job.dday}` : job.dday === 0 ? "D-Day" : `D+${Math.abs(job.dday)}`}
                </span>
              </Field>
            </div>
          </Section>

          {/* 전형 흐름 */}
          <Section title="전형 흐름">
            <div className="bg-card border border-border rounded-lg px-4 py-3 space-y-3">
              <div className="text-[12px] leading-relaxed flex flex-wrap gap-x-1.5 gap-y-1 items-center">
                {STAGE_FLOW.map((s, i) => (
                  <span key={s} className="inline-flex items-center gap-1.5">
                    <button
                      onClick={() => setStage(s)}
                      className={cn(
                        "px-1.5 py-0.5 rounded transition-colors",
                        s === activeStage
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                    >
                      {s}
                    </button>
                    {i < STAGE_FLOW.length - 1 && <span className="text-muted-foreground/40">→</span>}
                  </span>
                ))}
              </div>

            </div>
          </Section>

          {/* 일정 · 할 일 */}
          <Section
            title="일정 · 할 일"
            action={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted">
                    <Plus className="w-3 h-3" /> 추가
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-xs" onClick={() => addItem("일정")}>
                    일정 추가
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs" onClick={() => addItem("할 일")}>
                    할 일 추가
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          >
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[10px] text-muted-foreground bg-muted/30 border-b border-border">
                    <th className="text-left px-3 py-1.5 font-normal w-16">유형</th>
                    <th className="text-left px-3 py-1.5 font-normal">제목</th>
                    <th className="text-left px-3 py-1.5 font-normal w-24">날짜</th>
                    <th className="text-left px-3 py-1.5 font-normal w-20">상태</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-b border-border/50 last:border-0 group hover:bg-muted/30">
                      <td className="px-3 py-1.5 text-muted-foreground">{it.type}</td>
                      <td className="px-3 py-1.5">
                        <input
                          value={it.title}
                          onChange={(e) => updateItem(it.id, { title: e.target.value })}
                          className="bg-transparent w-full text-foreground focus:outline-none rounded px-1 -mx-1"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          value={it.datetime}
                          onChange={(e) => updateItem(it.id, { datetime: e.target.value })}
                          placeholder="-"
                          className="bg-transparent w-full text-muted-foreground tabular-nums focus:outline-none rounded px-1 -mx-1"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", STATUS_BADGE[it.status])}
                            >
                              {it.status}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="min-w-[100px]">
                            {(["예정", "진행 중", "완료", "지연"] as ItemStatus[]).map((s) => (
                              <DropdownMenuItem
                                key={s}
                                className="text-xs"
                                onClick={() => updateItem(it.id, { status: s })}
                              >
                                {s}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="px-2 py-1.5">
                        <button
                          onClick={() => deleteItem(it.id)}
                          aria-label="항목 삭제"
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-pickd-red"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-[11px] text-muted-foreground">
                        연결된 일정·할 일이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          {/* 메모 */}
          <Section title="메모">
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="이 공고에 대한 메모를 입력하세요"
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              rows={3}
            />
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
