import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  loadTrash,
  removeTrash,
  restoreEntry,
  daysLeft,
  daysLeftLabel,
  TRASH_KIND_LABEL,
  TRASH_RETENTION_DAYS,
  type TrashEntry,
  type TrashKind,
} from "@/lib/trash";

type Filter = "all" | TrashKind;

const FILTER_ORDER: TrashKind[] = ["job", "experience", "file"];

export function TrashPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [entries, setEntries] = useState<TrashEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  useEffect(() => {
    if (open) {
      setEntries(loadTrash());
      setFilter("all");
      setConfirmEmpty(false);
    }
  }, [open]);

  const reload = () => setEntries(loadTrash());
  const countOf = (k: TrashKind) => entries.filter((e) => e.kind === k).length;
  const shown = filter === "all" ? entries : entries.filter((e) => e.kind === filter);

  const restore = (e: TrashEntry) => {
    if (!restoreEntry(e)) {
      toast("이 항목은 아직 복원할 수 없어요", { duration: 1500 });
      return;
    }
    reload();
    toast("복원했어요 · 원래 위치에서 확인하세요", { duration: 2000 });
  };

  const purgeOne = (e: TrashEntry) => {
    removeTrash([e.trashId]);
    reload();
    toast("완전히 삭제했어요", { duration: 1500 });
  };

  const emptyNow = () => {
    removeTrash(shown.map((e) => e.trashId));
    setConfirmEmpty(false);
    reload();
    toast("휴지통을 비웠어요", { duration: 1500 });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[640px]">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-base flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-muted-foreground" /> 휴지통
            </DialogTitle>
            {shown.length > 0 &&
              (confirmEmpty ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-chip text-muted-foreground">
                    {shown.length}개 완전 삭제?
                  </span>
                  <Button size="sm" variant="ghost" className="h-6 text-chip px-2" onClick={() => setConfirmEmpty(false)}>
                    취소
                  </Button>
                  <Button size="sm" variant="destructive" className="h-6 text-chip px-2" onClick={emptyNow}>
                    비우기
                  </Button>
                </div>
              ) : (
                <button
                  className="text-chip text-muted-foreground hover:text-destructive transition-colors"
                  onClick={() => setConfirmEmpty(true)}
                >
                  {filter === "all" ? "비우기" : "이 종류 비우기"}
                </button>
              ))}
          </div>
          <DialogDescription className="text-chip">
            삭제한 항목은 {TRASH_RETENTION_DAYS}일간 보관되고, 지나면 자동으로 완전히 삭제돼요.
          </DialogDescription>
        </DialogHeader>

        {/* 종류 필터 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="전체" count={entries.length} />
          {FILTER_ORDER.filter((k) => countOf(k) > 0).map((k) => (
            <FilterChip
              key={k}
              active={filter === k}
              onClick={() => setFilter(k)}
              label={TRASH_KIND_LABEL[k]}
              count={countOf(k)}
            />
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="py-14 text-center text-muted-foreground">
            <Trash2 className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p className="text-sm">휴지통이 비어 있어요.</p>
          </div>
        ) : (
          <div className="max-h-[52vh] overflow-y-auto -mx-1 px-1">
            <table className="w-full text-body">
              <thead>
                <tr className="bg-slate-50 text-xs font-medium text-gray-600 border-b border-border">
                  <th className="text-left font-medium px-3 py-2 w-[64px]">종류</th>
                  <th className="text-left font-medium px-2 py-2">이름</th>
                  <th className="text-left font-medium px-2 py-2 w-[104px]">남은 기간</th>
                  <th className="text-right font-medium px-3 py-2 w-[128px]">관리</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((e) => {
                  const urgent = daysLeft(e.deletedAt) <= 1;
                  return (
                    <tr key={e.trashId} className="border-b border-border/60 hover:bg-muted/40">
                      <td className="px-3 py-2.5 align-middle">
                        <span className="text-chip px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {TRASH_KIND_LABEL[e.kind]}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 align-middle">
                        <div className="text-xs text-foreground truncate max-w-[240px]">{e.name}</div>
                        {e.sub && <div className="text-mini text-muted-foreground/70 truncate max-w-[240px]">{e.sub}</div>}
                      </td>
                      <td className={cn("px-2 py-2.5 align-middle text-chip", urgent ? "text-amber-600" : "text-muted-foreground")}>
                        {daysLeftLabel(e.deletedAt)}
                      </td>
                      <td className="px-3 py-2.5 align-middle text-right whitespace-nowrap">
                        <button
                          className="text-chip text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mr-3"
                          onClick={() => restore(e)}
                        >
                          <RotateCcw className="w-3 h-3" /> 복원
                        </button>
                        <button
                          className="text-chip text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
                          onClick={() => purgeOne(e)}
                        >
                          <Trash2 className="w-3 h-3" /> 영구삭제
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FilterChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-chip px-2.5 py-1 rounded-md border transition-colors",
        active
          ? "border-primary/40 bg-primary/5 text-primary"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {label} {count}
    </button>
  );
}
