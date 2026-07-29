// ────────────────────────────────────────────────────────────────
// 탭2 v2 — 활동 상세 안의 소재 섹션 (기획서 1.12 ⓓ)
// 자유 편집(본문)은 그대로 두고, 구조는 이 섹션이 담는다.
// ────────────────────────────────────────────────────────────────

import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StoryCard, StoryEmpty } from "./StoryBits";
import { uid, type Story } from "./model";
import { useStories, upsertStories, patchStory, softDeleteStories } from "./store";
import { tab2Api } from "./api";
import type { Item } from "../model/presets";

export function StorySection({
  item,
  onRequestInterview,
}: {
  item: Item;
  onRequestInterview?: () => void;
}) {
  // 스토어 구독 — 컴포넌트가 localStorage를 직접 읽지 않는다
  const stories = useStories().filter((s) => s.activityId === item.id);

  const setVerdict = (storyId: string, idx: number, v: "accepted" | "rejected") => {
    const target = stories.find((s) => s.id === storyId);
    if (!target) return;
    patchStory(storyId, {
      competencies: target.competencies.map((c, i) => (i === idx ? { ...c, userVerdict: v } : c)),
    });
    toast.success(v === "accepted" ? "확인했어요" : "알겠어요. 이 역량은 빼둘게요");
  };

  /** 본문에서 소재를 찾아본다 — 재분석 1회 (기획서 3.6) */
  const findFromBody = () => {
    const body = (item.document ?? "").trim();
    if (body.replace(/\s/g, "").length < 30) {
      toast("본문이 아직 짧아요");
      return;
    }
    const chunks = body
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.replace(/\s/g, "").length > 20)
      .slice(0, 3);
    const list = (chunks.length ? chunks : [body]).map<Story>((c) => ({
      id: uid(),
      activityId: item.id,
      headline: c.split(/[.\n]/)[0].slice(0, 40),
      body: c,
      rawExcerpt: c,
      starHint: tab2Api.extractStarHint(c),
      status: "user_confirmed",
      origin: "ai",
      insufficient: !tab2Api.checkSufficient(c),
      competencies: tab2Api.tagCompetencies(c),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    upsertStories(list);
    toast.success(`소재 ${list.length}개를 찾았어요`);
  };

  const addManual = () => {
    const s: Story = {
      id: uid(),
      activityId: item.id,
      headline: "새 소재",
      body: "",
      rawExcerpt: "",
      status: "user_confirmed",
      origin: "manual",
      insufficient: true,
      competencies: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    upsertStories([s]);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <p className="text-chip font-medium text-muted-foreground uppercase tracking-wide">
          소재 {stories.length > 0 ? `${stories.length}개` : ""}
        </p>
        {stories.length > 0 && (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-6 text-chip px-2" onClick={findFromBody}>
              <RefreshCw className="w-3 h-3" /> 본문에서 다시 찾기
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-chip px-2" onClick={addManual}>
              <Plus className="w-3 h-3" /> 직접 추가
            </Button>
          </div>
        )}
      </div>

      {stories.length === 0 ? (
        <StoryEmpty
          onInterview={() => (onRequestInterview ? onRequestInterview() : findFromBody())}
          onManual={addManual}
        />
      ) : (
        <div className="space-y-2.5">
          {stories.map((s) => (
            <StoryCard
              key={s.id}
              story={s}
              matchedQuestionCount={s.competencies.some((c) => c.competency === "문제해결") ? 2 : 0}
              onVerdict={(idx, v) => setVerdict(s.id, idx, v)}
              onDelete={() => {
                softDeleteStories([s.id]);
                toast.success("휴지통으로 옮겼어요 · 14일 안에 복원할 수 있어요");
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
