// ────────────────────────────────────────────────────────────────
// 탭2 v2 — 확인 화면 (기획서 1.10)
// 저장 전 유일한 관문. 원칙 ④(사용자 승인)가 실제로 일어나는 곳이고,
// 추출 승인율 지표(7부)의 수집 지점이다.
// ────────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronDown, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { CompetencyChip, EvidenceBody } from "./StoryBits";
import { liveTags, type Story } from "./model";
import { tab2Api } from "./api";
import { readAnswerSignal } from "./writingAids";

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
  const [showInsufficient, setShowInsufficient] = useState(true);
  /** 부족한 소재를 이 화면에서 바로 채우는 입력 — storyId → 덧붙인 문장 */
  const [patches, setPatches] = useState<Record<string, string>>({});
  /**
   * 열릴 때 소재가 부족했는가. 보강 입력이 충분 기준을 넘는 순간 화면이 통째로
   * 바뀌면 Textarea가 언마운트돼 문장을 쓰다 만 채로 커서를 잃는다. 그래서 모드는
   * **열린 시점에 한 번만** 정하고, 저장을 누를 때까지 유지한다.
   */
  const [startedInsufficient, setStartedInsufficient] = useState(false);

  // groups가 바뀌면 선택 초기화
  useMemo(() => {
    setCheckedGroups(new Set(groups.map((g) => g.tempId)));
    setCheckedStories(new Set(groups.flatMap((g) => g.stories.map((s) => s.id))));
    setVerdicts({});
    setEvidence(null);
    setPatches({});
    const only = groups.length === 1 && groups[0].stories.length <= 1 ? groups[0] : null;
    setStartedInsufficient(!!only?.stories[0]?.insufficient);
  }, [groups]);

  /**
   * 보강 입력을 반영한 소재.
   * 덧붙인 문장은 body와 rawExcerpt **양쪽에** 들어간다 — 그래야 재태깅이 만드는
   * 근거 문장이 원문의 부분 문자열이라는 불변식(타협 불가 ①)이 유지된다.
   * 채워져서 승격되면 그 자리에서 역량 태그도 다시 붙는다.
   */
  const resolve = (s: Story): Story => {
    const add = (patches[s.id] ?? "").trim();
    if (!add) return s;
    const body = `${s.body} ${add}`.trim();
    const rawExcerpt = `${s.rawExcerpt} ${add}`.trim();
    const nowEnough = tab2Api.checkSufficient(body);
    return {
      ...s,
      body,
      rawExcerpt,
      insufficient: !nowEnough,
      competencies: nowEnough ? tab2Api.tagCompetencies(rawExcerpt) : s.competencies,
    };
  };

  const resolved = groups.map((g) => ({ ...g, stories: g.stories.map(resolve) }));
  const sufficient = resolved.map((g) => ({ ...g, stories: g.stories.filter((s) => !s.insufficient) }));
  const insufficientStories = resolved.flatMap((g) => g.stories.filter((s) => s.insufficient));

  const savedStoryIds = sufficient.flatMap((g) =>
    checkedGroups.has(g.tempId) ? g.stories.filter((s) => checkedStories.has(s.id)).map((s) => s.id) : [],
  );
  const counts = {
    activities: [...checkedGroups].length,
    stories: savedStoryIds.length,
  };
  /** 저장 버튼 활성 판정 — 실제로 저장될 것의 개수여야 한다 */
  const selectedCount = counts.activities + counts.stories;

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

  /**
   * 🆕 결과가 1건이면(인터뷰 경로) 목록·체크박스를 쓰지 않는다.
   * 활동 1개 + 소재 1개를 읽고 [저장] 한 번 누르는 화면이 되어야 한다 —
   * 체크박스는 고를 것이 여럿일 때만 의미가 있고, 하나뿐일 때는 잡일이 된다.
   */
  const single = resolved.length === 1 && resolved[0].stories.length <= 1 ? resolved[0] : null;
  const singleStory = single?.stories[0] ?? null;
  /** 채우기 화면을 유지할 것인가 — 지금 부족하거나, 열릴 때 부족했으면 유지한다 */
  const fillMode = !!singleStory && (singleStory.insufficient || startedInsufficient);

  /** 무엇이 없어서 소재가 못 됐는지 짚어준다 — "부족해요"만으로는 뭘 할지 모른다 */
  const missingReason = (body: string): string => {
    const sig = readAnswerSignal(body);
    if (!sig.hasAction && !sig.hasResult)
      return "무엇을 했는지와 그래서 어떻게 됐는지가 함께 있어야 해요.";
    if (!sig.hasResult) return "무엇을 했는지는 있는데, 「그래서 어떻게 됐는지」가 없어요.";
    return "결과는 있는데, 「무엇을 했는지」가 없어요.";
  };

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
      <DialogContent className="max-w-[53.75rem] w-[92vw] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col [&>button]:hidden">
        <DialogHeader className="px-6 py-4 border-b border-border text-left space-y-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-title font-semibold">이렇게 이해했는데, 맞나요?</DialogTitle>
              <DialogDescription className="text-body text-muted-foreground mt-1">
                {single
                  ? singleStory && !singleStory.insufficient
                    ? "맞으면 저장할게요. 자소서 쓸 때 여기서 그대로 꺼내 씁니다."
                    : "조금만 더 채우면 자소서에 쓸 수 있는 이야기가 돼요."
                  : counts.stories > 0
                    ? `맞는 것만 남기고 저장하면, 자소서 쓸 때 여기서 꺼내 써요. 지금 소재 ${counts.stories}개.`
                    : "맞는 것만 남기고 저장하면, 자소서 쓸 때 여기서 꺼내 써요."}
              </DialogDescription>
            </div>
            <button aria-label="닫기" onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        <div className={cn("flex-1 overflow-hidden grid", evidence ? "grid-cols-[1fr_20rem]" : "grid-cols-[1fr_0px]")}>
          {single ? (
            /* 🆕 단건 모드 — 읽고 저장하는 화면. 체크박스를 쓰지 않는다.
               이 화면의 값은 "미완성 활동을 등록하는 것"이 아니라 **소재를 성립시키는 것**이다.
               그래서 활동은 한 줄로만 두고, 소재를 화면의 주인공으로 올린다. */
            <div className="overflow-y-auto px-6 py-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-1.5 py-0.5 text-chip font-medium rounded-md bg-gray-50 text-gray-500 border border-gray-100">
                  {single.category}
                </span>
                <span className="text-sm font-medium text-foreground">{single.title}</span>
              </div>
              <p className="text-chip text-muted-foreground mt-1.5">이력서에 한 줄로 적히는 활동이에요</p>

              <div className="h-px bg-border my-5" />

              {singleStory && !fillMode ? (
                <>
                  <p className="text-chip font-medium text-muted-foreground uppercase tracking-wide">
                    자소서에 쓸 소재
                  </p>
                  <p className="text-title font-semibold text-foreground mt-1.5">{singleStory.headline}</p>
                  <p className="text-body text-foreground mt-2 leading-relaxed whitespace-pre-wrap">
                    {singleStory.body}
                  </p>

                  <p className="text-chip text-muted-foreground mt-5">
                    읽어낸 역량 — 칩을 누르면 근거 문장을 보여줘요. 아니라고 생각되면 빼주세요.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {liveTags(applyVerdicts(singleStory)).map((t) => {
                      const idx = singleStory.competencies.findIndex((c) => c.competency === t.competency);
                      return (
                        <CompetencyChip
                          key={t.competency}
                          tag={{ ...t, userVerdict: verdicts[singleStory.id]?.[idx] ?? "unset" }}
                          active={evidence === t.evidenceText}
                          onClick={() => setEvidence((p) => (p === t.evidenceText ? null : t.evidenceText))}
                          onAccept={() => setVerdict(singleStory.id, idx, "accepted")}
                          onReject={() => setVerdict(singleStory.id, idx, "rejected")}
                        />
                      );
                    })}
                    {liveTags(applyVerdicts(singleStory)).length === 0 && (
                      <span className="text-chip text-muted-foreground">읽어낸 역량이 없어요</span>
                    )}
                  </div>
                </>
              ) : singleStory ? (
                <>
                  {/* 부족한 경우 — "부족해요"로 끝내지 않고 무엇이 없는지 짚고 그 자리에서 받는다.
                      다 채워져도 이 화면을 유지한다(위 startedInsufficient 주석 참고). */}
                  <p className="text-title font-semibold text-foreground">
                    {singleStory.insufficient ? "한 줄만 더 있으면 소재가 돼요" : "이제 소재가 됐어요"}
                  </p>
                  <p className="text-body text-muted-foreground mt-1.5">
                    {singleStory.insufficient ? missingReason(singleStory.body) : "저장하면 자소서 쓸 때 여기서 꺼내 써요."}
                  </p>

                  <div className="mt-4 border border-border rounded-lg px-3.5 py-3 bg-muted/30">
                    <p className="text-chip text-muted-foreground">지금까지 적은 것</p>
                    <p className="text-body text-foreground mt-1 whitespace-pre-wrap">{singleStory.body}</p>
                  </div>

                  <Textarea
                    value={patches[singleStory.id] ?? ""}
                    onChange={(e) => setPatches((p) => ({ ...p, [singleStory.id]: e.target.value }))}
                    placeholder="예: 그래서 매주 정리하게 바꿨더니 미납이 3명으로 줄었어요"
                    className="mt-3 min-h-[4.75rem] text-sm resize-none"
                  />
                  {singleStory.insufficient ? (
                    <p className="text-chip text-muted-foreground mt-2">
                      여기에 적으면 바로 소재가 돼요. 지금 넘어가도 활동은 저장되고, 나중에 채울 수 있어요.
                    </p>
                  ) : (
                    <p className="text-chip text-primary mt-2 inline-flex items-center gap-1">
                      <Check className="w-3 h-3" /> 소재로 저장할 수 있어요. 더 적어도 괜찮아요.
                    </p>
                  )}
                </>
              ) : (
                <div className="border border-dashed border-border rounded-xl px-5 py-6 bg-muted/30">
                  <p className="text-body font-medium text-foreground">활동만 저장돼요</p>
                  <p className="text-chip text-muted-foreground mt-1.5 leading-relaxed">
                    자소서에 쓸 이야기는 아직 없어요. 목록에서 이 활동을 열어 언제든 추가할 수 있어요.
                  </p>
                </div>
              )}
            </div>
          ) : (
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
                      {/* 중복 후보일 때만 배지를 단다. 전에는 아닐 때 "새로 찾음"을 띄웠는데,
                          중복 검사가 아직 없는 지금은 모든 항목에 붙어 아무 정보도 주지 않았다. */}
                      {g.isDuplicateCandidate && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-mini font-semibold rounded-full bg-violet-50 text-violet-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                          기존과 비슷함 — 확인해 주세요
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

            {sufficient.every((g) => g.stories.length === 0) && (
              <div className="border border-dashed border-border rounded-xl px-5 py-6 bg-muted/30">
                <p className="text-body font-medium text-foreground">아직 소재는 없어요</p>
                <p className="text-chip text-muted-foreground mt-1.5 leading-relaxed">
                  활동만 저장해도 목록에는 남아요. 다만 <strong className="text-foreground">소재</strong>가 있어야
                  자소서 문항에 넣을 이야기가 되고, 공고가 묻는 역량과도 맞춰볼 수 있어요.
                  <br />
                  소재가 되려면 <strong className="text-foreground">무엇을 했는지</strong>와{" "}
                  <strong className="text-foreground">그래서 어떻게 됐는지</strong>가 한 덩어리로 있어야 해요.
                </p>
                {insufficientStories.length > 0 && (
                  <p className="text-chip text-primary mt-2">
                    아래 「조금 더 채우면 소재가 되는 것」에 한 줄만 더 적으면 바로 소재가 돼요.
                  </p>
                )}
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
                    {/* 여기가 이 화면의 두 번째 목적이다 — 확인만 하는 곳이 아니라,
                        모자란 소재를 그 자리에서 완성하는 곳. 인터뷰를 다시 열지 않아도 된다. */}
                    {insufficientStories.map((s) => (
                      <div key={s.id} className="border border-border rounded-lg px-3 py-2.5">
                        <p className="text-body text-foreground">{s.headline}</p>
                        <p className="text-chip text-muted-foreground mt-1">{s.body}</p>
                        <Textarea
                          value={patches[s.id] ?? ""}
                          onChange={(e) => setPatches((p) => ({ ...p, [s.id]: e.target.value }))}
                          placeholder="그래서 어떻게 됐는지 한 줄만 더 — 예: 그래서 매주 정리하게 바꿨더니 미납이 3명으로 줄었어요"
                          className="mt-2 min-h-[3.25rem] text-sm resize-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          )}

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
          <span className="text-chip text-muted-foreground">
            {single
              ? counts.stories > 0
                ? "활동 1개 · 소재 1개가 저장돼요"
                : "활동만 저장돼요 · 소재는 나중에"
              : counts.stories > 0
                ? `활동 ${counts.activities}개 · 소재 ${counts.stories}개 저장`
                : `활동 ${counts.activities}개 저장 · 소재 없음`}
          </span>
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
              {single ? "저장하기" : "선택 저장하기"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
