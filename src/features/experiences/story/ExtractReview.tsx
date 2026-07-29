// ────────────────────────────────────────────────────────────────
// 탭2 v2 — 확인 화면 (기획서 1.10)
// 저장 전 유일한 관문. 원칙 ④(사용자 승인)가 실제로 일어나는 곳이고,
// 추출 승인율 지표(7부)의 수집 지점이다.
// ────────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CompetencyChip, EvidenceBody } from "./StoryBits";
import { liveTags, type Story } from "./model";

export type ReviewGroup = {
  tempId: string;
  title: string;
  category: string;
  meta?: string;
  isDuplicateCandidate?: boolean;
  stories: Story[];
};

export function ExtractReview({
  open,
  groups,
  sourceText,
  onClose,
  onSave,
}: {
  open: boolean;
  groups: ReviewGroup[];
  sourceText?: string;
  onClose: () => void;
  onSave: (selected: ReviewGroup[]) => void;
}) {
  const allStoryIds = useMemo(() => groups.flatMap((g) => g.stories.map((s) => s.id)), [groups]);
  const [checkedGroups, setCheckedGroups] = useState<Set<string>>(new Set(groups.map((g) => g.tempId)));
  const [checkedStories, setCheckedStories] = useState<Set<string>>(new Set(allStoryIds));
  const [verdicts, setVerdicts] = useState<Record<string, Record<number, "accepted" | "rejected">>>({});
  const [evidence, setEvidence] = useState<string | null>(null);
  const [showInsufficient, setShowInsufficient] = useState(false);

  // groups가 바뀌면 선택 초기화
  useMemo(() => {
    setCheckedGroups(new Set(groups.map((g) => g.tempId)));
    setCheckedStories(new Set(groups.flatMap((g) => g.stories.map((s) => s.id))));
    setVerdicts({});
    setEvidence(null);
  }, [groups]);

  const sufficient = groups.map((g) => ({ ...g, stories: g.stories.filter((s) => !s.insufficient) }));
  const insufficientStories = groups.flatMap((g) => g.stories.filter((s) => s.insufficient));

  const counts = {
    activities: groups.length,
    stories: groups.flatMap((g) => g.stories).filter((s) => !s.insufficient).length,
  };
  const selectedCount =
    [...checkedGroups].length + [...checkedStories].filter((id) => allStoryIds.includes(id)).length;

  const toggleGroup = (id: string, on: boolean) => {
    setCheckedGroups((p) => {
      const n = new Set(p);
      on ? n.add(id) : n.delete(id);
      return n;
    });
    // 활동 해제 → 하위 소재도 함께 해제 (부모 없는 소재는 저장 불가)
    const g = groups.find((x) => x.tempId === id);
    if (g) {
      setCheckedStories((p) => {
        const n = new Set(p);
        g.stories.forEach((s) => (on ? n.add(s.id) : n.delete(s.id)));
        return n;
      });
    }
  };

  const setVerdict = (storyId: string, idx: number, v: "accepted" | "rejected") =>
    setVerdicts((p) => ({ ...p, [storyId]: { ...(p[storyId] ?? {}), [idx]: v } }));

  const applyVerdicts = (s: Story): Story => ({
    ...s,
    competencies: s.competencies.map((c, i) => ({ ...c, userVerdict: verdicts[s.id]?.[i] ?? c.userVerdict })),
  });

  const handleSave = () => {
    const out = sufficient
      .filter((g) => checkedGroups.has(g.tempId))
      .map((g) => ({
        ...g,
        stories: g.stories.filter((s) => checkedStories.has(s.id)).map(applyVerdicts),
      }));
    onSave(out);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[860px] w-[92vw] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col [&>button]:hidden">
        <DialogHeader className="px-6 py-4 border-b border-border text-left space-y-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-title font-semibold">이렇게 정리했어요</DialogTitle>
              <DialogDescription className="text-body text-muted-foreground mt-1">
                활동 {counts.activities}개, 소재 {counts.stories}개를 찾았어요.
              </DialogDescription>
            </div>
            <button aria-label="닫기" onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        <div className={cn("flex-1 overflow-hidden grid", evidence ? "grid-cols-[1fr_320px]" : "grid-cols-[1fr_0px]")}>
          <div className="overflow-y-auto px-6 py-4 space-y-3">
            {sufficient.map((g) => (
              <div key={g.tempId} className="border border-border rounded-xl bg-card">
                {/* 활동 행 */}
                <label className="flex items-start gap-3 px-4 py-3 cursor-pointer">
                  <Checkbox
                    checked={checkedGroups.has(g.tempId)}
                    onCheckedChange={(v) => toggleGroup(g.tempId, !!v)}
                    className="mt-0.5"
                    aria-label={g.title}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-1.5 py-0.5 text-chip font-medium rounded-md bg-gray-50 text-gray-500 border border-gray-100">
                        {g.category}
                      </span>
                      <span className="text-sm font-medium text-foreground">{g.title}</span>
                      {g.isDuplicateCandidate ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-mini font-semibold rounded-full bg-violet-50 text-violet-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                          기존과 비슷함 — 확인해 주세요
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-mini font-semibold rounded-full bg-blue-50 text-primary">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          새로 찾음
                        </span>
                      )}
                    </div>
                    {g.meta && <p className="text-chip text-muted-foreground mt-1">{g.meta}</p>}
                  </div>
                </label>

                {/* 소재 목록 */}
                {g.stories.length > 0 && (
                  <div className="pl-10 pr-4 pb-3 space-y-2">
                    {g.stories.map((s) => (
                      <div key={s.id} className="border-l border-border pl-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <Checkbox
                            checked={checkedStories.has(s.id)}
                            disabled={!checkedGroups.has(g.tempId)}
                            onCheckedChange={(v) =>
                              setCheckedStories((p) => {
                                const n = new Set(p);
                                v ? n.add(s.id) : n.delete(s.id);
                                return n;
                              })
                            }
                            className="mt-0.5"
                            aria-label={s.headline}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-body font-medium text-foreground">{s.headline}</p>
                            <p className="text-body text-muted-foreground mt-0.5 line-clamp-2">{s.body}</p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {liveTags(applyVerdicts(s)).map((t) => {
                                const idx = s.competencies.indexOf(
                                  s.competencies.find((c) => c.competency === t.competency)!,
                                );
                                return (
                                  <CompetencyChip
                                    key={t.competency}
                                    tag={{ ...t, userVerdict: verdicts[s.id]?.[idx] ?? "unset" }}
                                    active={evidence === t.evidenceText}
                                    onClick={() => setEvidence((p) => (p === t.evidenceText ? null : t.evidenceText))}
                                    onAccept={() => setVerdict(s.id, idx, "accepted")}
                                    onReject={() => setVerdict(s.id, idx, "rejected")}
                                  />
                                );
                              })}
                              {liveTags(applyVerdicts(s)).length === 0 && (
                                <span className="text-chip text-muted-foreground">역량 태그가 없어요</span>
                              )}
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {sufficient.every((g) => g.stories.length === 0) && insufficientStories.length === 0 && (
              <div className="border border-dashed border-border rounded-xl px-5 py-8 text-center">
                <p className="text-body text-foreground">이 글에서는 소재를 찾지 못했어요</p>
                <p className="text-chip text-muted-foreground mt-1.5">
                  구체적인 행동과 그 결과가 함께 적힌 문단이 있어야 소재로 만들 수 있어요.
                </p>
              </div>
            )}

            {/* 부족 그룹 — 버리지 않고 접어둔다 (기획서 3.1) */}
            {insufficientStories.length > 0 && (
              <div className="border border-border rounded-xl bg-card">
                <button
                  onClick={() => setShowInsufficient((v) => !v)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left"
                >
                  {showInsufficient ? (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span className="text-body text-muted-foreground">
                    조금 더 채우면 소재가 되는 것 {insufficientStories.length}개
                  </span>
                </button>
                {showInsufficient && (
                  <div className="px-4 pb-3 space-y-2">
                    {insufficientStories.map((s) => (
                      <div key={s.id} className="border border-border rounded-lg px-3 py-2">
                        <p className="text-body text-foreground">{s.headline}</p>
                        <p className="text-chip text-muted-foreground mt-1">{s.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 근거 패널 */}
          {evidence && (
            <aside className="border-l border-border bg-card overflow-y-auto">
              <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">이 문장이 근거예요</p>
                <button onClick={() => setEvidence(null)} aria-label="닫기" className="p-1 rounded hover:bg-muted">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              <div className="px-4 py-3">
                <EvidenceBody text={sourceText || evidence} evidence={evidence} />
              </div>
            </aside>
          )}
        </div>

        <div className="px-6 py-3 border-t border-border flex items-center justify-between">
          <span className="text-chip text-muted-foreground">{selectedCount}개 선택됨</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>
              나중에
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs bg-action hover:bg-action-hover text-white"
              disabled={selectedCount === 0}
              onClick={handleSave}
            >
              선택 저장하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
