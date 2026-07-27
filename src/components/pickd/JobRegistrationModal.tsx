import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronLeft, MapPin, PenLine, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Posting, Position } from "@/data/postings.seed";
import { addRegistration, formatEventSchedule, isRegistered } from "@/data/jobStore";

interface JobRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posting: Posting | null;
  /** 검색에서 직무까지 선택하고 들어온 경우 미리 선택 */
  initialPositionId?: string;
}

/**
 * 공고 담기 2스텝 — ① 직무 선택 → ② 등록될 일정 확인.
 * 동일 공고 내 중복지원 불가(공공기관 공통 규정)이므로 직무는 1개만 선택 가능.
 */
export function JobRegistrationModal({
  open,
  onOpenChange,
  posting,
  initialPositionId,
}: JobRegistrationModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [positionId, setPositionId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setPositionId(initialPositionId ?? null);
    }
  }, [open, initialPositionId, posting?.id]);

  const alreadyRegistered = posting ? isRegistered(posting.id) : false;
  const selected: Position | undefined = useMemo(
    () => posting?.positions.find((p) => p.id === positionId),
    [posting, positionId],
  );

  if (!posting) return null;

  const events = posting.scheduleEvents;

  const handleRegister = () => {
    if (!positionId) return;
    const ok = addRegistration(posting.id, positionId);
    if (!ok) {
      toast("이미 담은 공고예요", { duration: 1500 });
      onOpenChange(false);
      return;
    }
    toast(`공고를 담았어요 — 일정 ${events.length}개가 캘린더에 등록됐어요`, { duration: 2500 });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-title leading-snug">
            {posting.orgName}
            <span className="block text-xs font-normal text-muted-foreground mt-0.5">
              {posting.title}
            </span>
          </DialogTitle>
        </DialogHeader>

        {alreadyRegistered ? (
          <div className="py-6 text-center space-y-3">
            <p className="text-sm text-foreground">이미 담은 공고예요</p>
            <p className="text-xs text-muted-foreground">
              같은 공고에는 한 직무만 지원할 수 있어요. 직무를 바꾸려면 먼저 공고를 빼주세요.
            </p>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              닫기
            </Button>
          </div>
        ) : step === 1 ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                지원할 직무를 선택해 주세요{" "}
                <span className="text-muted-foreground/60">— 1개만 선택할 수 있어요</span>
              </p>
              <span className="text-chip text-muted-foreground/70">1 / 2</span>
            </div>

            <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
              {posting.positions.map((p) => {
                const active = p.id === positionId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPositionId(p.id)}
                    className={cn(
                      "w-full text-left border rounded-xl px-4 py-3 transition-colors",
                      active
                        ? "border-primary bg-accent ring-1 ring-primary/30"
                        : "border-border hover:bg-muted/40",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                            active ? "border-primary bg-primary" : "border-muted-foreground/40",
                          )}
                        >
                          {active && <Check className="w-3 h-3 text-white" />}
                        </span>
                        <span className="text-sm font-medium text-foreground truncate">
                          {p.jobGroup ? `${p.jobGroup} · ` : ""}
                          {p.jobTitle}
                        </span>
                      </div>
                      <span className="text-chip text-muted-foreground shrink-0">{p.employmentType}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 pl-6 text-chip text-muted-foreground">
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
                    <p className="mt-1 pl-6 text-chip text-muted-foreground/80 line-clamp-2">
                      {p.qualification}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                취소
              </Button>
              <Button size="sm" disabled={!positionId} onClick={() => setStep(2)}>
                다음
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{selected?.jobTitle}</span> 직무로 담을게요 —
                아래 일정이 캘린더에 등록돼요
              </p>
              <span className="text-chip text-muted-foreground/70">2 / 2</span>
            </div>

            <div className="border border-border rounded-xl divide-y divide-border max-h-[42vh] overflow-y-auto">
              {events.map((ev, i) => {
                const schedule = formatEventSchedule(ev);
                return (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-body text-foreground truncate">{ev.label}</span>
                    </div>
                    {schedule ? (
                      <span className="text-xs tabular-nums text-muted-foreground shrink-0">{schedule}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/60 shrink-0">미정 — 확정되면 알려드릴게요</span>
                    )}
                  </div>
                );
              })}
            </div>

            {posting.essayQuestions.length > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <PenLine className="w-3.5 h-3.5" />
                자기소개서 문항 {posting.essayQuestions.length}개가 준비되어 있어요 — 담은 뒤 바로 작성할 수 있어요
              </p>
            )}

            <div className="flex justify-between mt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="gap-1">
                <ChevronLeft className="w-3.5 h-3.5" />
                직무 다시 선택
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  취소
                </Button>
                <Button size="sm" onClick={handleRegister}>
                  이 공고 담기
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
