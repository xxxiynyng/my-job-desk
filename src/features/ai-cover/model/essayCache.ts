import type { Job } from "./aiCoverMock";

// 공고별 작성 상태 세션 캐시 — 화면 전환에도 유지 (실서비스: localStorage `pickd.essay.<slug>.vN`)
// AICoverPage.tsx 모듈 상수를 그대로 분리(2026-07-29) — 단일 인스턴스(모듈 싱글턴) 동작 동일.
export type EssayCache = {
  qIdx: number; texts: string[]; variants: number[]; suggestionOpen: boolean[];
  selected: string[]; finished: boolean;
};
export const essayCache: Record<string, EssayCache> = {};

export type JobProgress = {
  written: number; total: number; finished: boolean; texts: string[];
  preview: string; curNo: number; curLen: number; curLimit: number;
};
export function getProgress(job: Job): JobProgress {
  const cached = essayCache[job.id];
  const texts = cached?.texts ?? job.questions.map((q) => q.initial);
  const written = texts.filter((t) => t.trim().length > 0).length;
  const firstIdx = texts.findIndex((t) => t.trim().length > 0);
  const curIdx = cached?.qIdx ?? (firstIdx >= 0 ? firstIdx : 0);
  const preview = (texts[curIdx]?.trim() || (firstIdx >= 0 ? texts[firstIdx].trim() : "")).replace(/\s+/g, " ");
  return {
    written, total: job.questions.length, finished: cached?.finished ?? false, texts,
    preview, curNo: job.questions[curIdx].no, curLen: (texts[curIdx] ?? "").length, curLimit: job.questions[curIdx].limit,
  };
}
