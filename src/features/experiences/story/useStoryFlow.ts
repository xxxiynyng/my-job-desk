// ────────────────────────────────────────────────────────────────
// 탭2 — 페이지 배선 훅
//
// 왜 훅으로 뺐나 (지속가능성):
//  · Experiences.tsx는 이미 1,600줄이다. 여기에 인터뷰·추출·역량 상태까지
//    얹으면 손댈 수 없는 파일이 된다. 소재 도메인의 상태·전이는 전부 이 훅에 모은다.
//  · 페이지는 "무엇을 그릴지"만 알고, "언제 무엇이 바뀌는지"는 훅이 안다.
//  · 활동(Item) 생성은 페이지 소관이라 콜백으로 주입받는다 — 훅이 Item 타입을
//    모르게 해서 두 도메인이 서로를 끌고 다니지 않게 한다.
// ────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { uid, type Competency, type Story } from "./model";
import { useStories, upsertStories } from "./store";
import { tab2Api, type ExtractJob, type ExtractUnit, type InterviewDraft, type InterviewMode } from "./api";
import type { ReviewGroup } from "./ExtractReview";

export type DbView = "list" | "competency";

export function useStoryFlow(opts: {
  /** 활동 레코드를 만들고 id를 돌려준다 (페이지가 Item 스토어를 소유) */
  createActivity: (title: string, category: string) => string;
}) {
  const stories = useStories();

  const [dbView, setDbView] = useState<DbView>("list");
  /** 프로토타입: 담은 공고 유무. 실제로는 탭1 등록 스토어에서 파생한다 */
  const [hasPostings, setHasPostings] = useState(true);

  /* ── 인터뷰 ──────────────────────────────────────────────── */
  const [interview, setInterview] = useState<{ open: boolean; mode: InterviewMode; target?: Competency }>({
    open: false,
    mode: "cold_start",
  });

  const openInterview = useCallback((mode: InterviewMode, target?: Competency) => {
    setDbView("list");
    setInterview({ open: true, mode, target });
  }, []);
  const closeInterview = useCallback(() => setInterview((s) => ({ ...s, open: false })), []);

  /* ── 확인 화면 ───────────────────────────────────────────── */
  const [review, setReview] = useState<{ open: boolean; groups: ReviewGroup[]; sourceText: string }>({
    open: false,
    groups: [],
    sourceText: "",
  });
  const closeReview = useCallback(() => setReview((r) => ({ ...r, open: false })), []);

  const handleInterviewComplete = useCallback(
    (d: InterviewDraft) => {
      closeInterview();
      setReview({
        open: true,
        sourceText: d.primary.story.rawExcerpt,
        groups: [
          {
            tempId: d.primary.story.activityId,
            title: d.primary.activityTitle,
            category: d.primary.activityCategory,
            meta: "질문에 답해서 만든 활동이에요",
            stories: [d.primary.story],
          },
          // 함께 고른 나머지 — 활동만. 소재는 나중에 만들 수 있다
          ...d.extras.map((e) => ({
            tempId: uid(),
            title: e.activityTitle,
            category: e.activityCategory,
            meta: "함께 고른 활동이에요 · 소재는 나중에 만들 수 있어요",
            stories: [],
          })),
        ],
      });
    },
    [closeInterview],
  );

  /** 확인 화면 저장 — 여기서만 활동·소재가 실제로 만들어진다 (원칙 ④) */
  const saveReview = useCallback(
    (groups: ReviewGroup[]) => {
      const newStories: Story[] = [];
      let activityCount = 0;
      groups.forEach((g) => {
        const activityId = opts.createActivity(g.title, g.category);
        activityCount += 1;
        g.stories.forEach((s) =>
          newStories.push({ ...s, activityId, status: "user_confirmed", updatedAt: Date.now() }),
        );
      });
      if (newStories.length) upsertStories(newStories);
      setReview({ open: false, groups: [], sourceText: "" });
      toast.success(
        newStories.length
          ? `활동 ${activityCount}개, 소재 ${newStories.length}개를 저장했어요`
          : `활동 ${activityCount}개를 저장했어요`,
      );
    },
    [opts],
  );

  /* ── 자소서 추출 (비동기 작업) — 기획서 4.2 경로 B ────────── */
  const [importOpen, setImportOpen] = useState(false);
  const [job, setJob] = useState<ExtractJob | null>(null);
  const pollRef = useRef<number | null>(null);
  /** 실패 시 되돌려줄 원문 — 다시 붙여넣게 하지 않는다 */
  const [lastUnits, setLastUnits] = useState<ExtractUnit[]>([]);

  const stopPolling = () => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startExtraction = useCallback((units: ExtractUnit[]) => {
    setImportOpen(false);
    setLastUnits(units);
    const jobId = tab2Api.startExtraction(units);
    setJob({
      jobId,
      status: "queued",
      step: "보내는 중이에요",
      progress: { done: 0, total: units.length },
      candidates: [],
      sourceText: units.map((u) => u.answer).join("\n\n"),
    });
  }, []);

  useEffect(() => {
    if (!job || job.status === "done" || job.status === "failed") return;
    stopPolling();
    pollRef.current = window.setInterval(() => {
      const next = tab2Api.pollExtraction(job.jobId);
      if (next) setJob(next);
    }, 700);
    return stopPolling;
  }, [job?.jobId, job?.status]);

  /** 작업이 끝나면 확인 화면 후보로 변환 */
  const openExtractReview = useCallback(() => {
    if (!job) return;
    const groups: ReviewGroup[] = job.candidates
      .filter((c) => c.kind === "activity")
      .map((a) => ({
        tempId: a.tempId,
        title: a.title,
        category: "대외활동",
        meta: a.meta,
        stories: job.candidates
          .filter((c) => c.kind === "story" && c.parentTempId === a.tempId)
          .map<Story>((c) => ({
            id: c.tempId,
            activityId: a.tempId,
            headline: c.title,
            body: c.body ?? "",
            rawExcerpt: c.rawExcerpt ?? c.body ?? "",
            starHint: tab2Api.extractStarHint(c.body ?? ""),
            status: "ai_draft",
            origin: "ai",
            insufficient: c.insufficient,
            competencies: c.competencies ?? [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })),
      }));
    setReview({ open: true, groups, sourceText: job.sourceText });
    setJob(null);
  }, [job]);

  // 완료되면 자동으로 확인 화면을 연다
  useEffect(() => {
    if (job?.status === "done") openExtractReview();
  }, [job?.status, openExtractReview]);

  const retryExtraction = useCallback(() => {
    setJob(null);
    setImportOpen(true);
  }, []);

  return {
    stories,
    dbView,
    setDbView,
    hasPostings,
    setHasPostings,

    interview,
    openInterview,
    closeInterview,
    handleInterviewComplete,

    review,
    closeReview,
    saveReview,

    importOpen,
    setImportOpen,
    job,
    startExtraction,
    retryExtraction,
    dismissJob: () => setJob(null),
    lastUnits,

    newActivityId: () => uid(),
  };
}
