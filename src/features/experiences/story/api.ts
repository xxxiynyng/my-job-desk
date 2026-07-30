// ────────────────────────────────────────────────────────────────
// 탭2 — 서버 경계 (교체 지점)
//
// 화면은 **이 파일이 export 하는 `tab2Api` 하나만** 본다.
// 백엔드가 붙으면 `api.server.ts`를 만들어 아래 인터페이스를 구현하고,
// 맨 아래 한 줄만 바꾸면 된다. 화면 코드는 손대지 않는다.
//
//   기획서 4.1 서버 경계 / 4.2 작업 상태 계약 / 4.3 LLM 호출 경계
//
// ⚠️ 지금은 목 구현이다. `CLAUDE.md` §1 "백엔드 없음"을 아직 지킨다.
//    실서버 구현을 붙이기 전에 그 규칙을 먼저 개정할 것.
// ────────────────────────────────────────────────────────────────

import type { Competency, Story, StoryCompetency } from "./model";
import type { ChipOption } from "./entryOptions";
import type { WritingAids } from "./writingAids";
import * as mock from "./api.mock";

/* ── 인터뷰 ───────────────────────────────────────────────────── */

export type InterviewMode = "cold_start" | "gap";

export type InterviewTurn = {
  turnNo: number;
  /** chips = 타이핑 0으로 넘어가는 턴 (피로 설계 ①) */
  kind: "chips" | "text";
  question: string;
  hint?: string;
  chips?: ChipOption[];
  placeholder?: string;
  /** 서술 턴의 입력 보조 — 말머리·낱말·단위 (백지 방지) */
  aids?: WritingAids;
  /** 직전 답변에 대한 1줄 리액션 (피로 설계 ⑤) */
  reaction?: string;
  isLast: boolean;
};

export type DraftActivity = { activityTitle: string; activityCategory: string };

/**
 * 인터뷰 1회의 결과 — **활동 하나 + 소재 하나**.
 * 2026-07-30에 1턴을 단일 선택으로 되돌리면서 primary/extras 구조를 걷어냈다.
 * 여러 개를 고르게 하면 소재 0개인 빈 활동이 목록에 쌓여 "정리해야 할 짐"이 됐다(구 부록 C-17).
 */
export type InterviewDraft = DraftActivity & { story: Story };

/* ── 추출 작업 ────────────────────────────────────────────────── */

export type ExtractStatus = "queued" | "running" | "partial" | "done" | "failed";

export type ExtractCandidate = {
  tempId: string;
  kind: "activity" | "story";
  parentTempId?: string;
  title: string;
  body?: string;
  rawExcerpt?: string;
  competencies?: StoryCompetency[];
  insufficient?: boolean;
  meta?: string;
};

/** 프론트 상태 기계가 소비하는 계약 — 기획서 4.2 */
export type ExtractJob = {
  jobId: string;
  status: ExtractStatus;
  step: string;
  progress: { done: number; total: number };
  candidates: ExtractCandidate[];
  sourceText: string;
  errorCode?: string;
  failedUnits?: number[];
};

export type ExtractUnit = { question?: string; answer: string };

/* ── 인터페이스 ───────────────────────────────────────────────── */

export interface Tab2Api {
  /** 다음 질문 1개. 동기 경로(수 초) — 기획서 4.2 경로 A */
  nextInterviewTurn(opts: {
    mode: InterviewMode;
    targetCompetency?: Competency;
    turnNo: number;
    answers: string[];
    /** 1턴에서 고른 칩 — 서술 턴의 입력 보조를 유형에 맞게 고르는 데 쓴다 */
    picked?: ChipOption[];
  }): Promise<InterviewTurn>;

  /** 답변들 → 활동·소재 초안. 저장하지 않는다(사용자 승인 전) */
  buildInterviewDraft(opts: {
    mode: InterviewMode;
    answers: string[];
    picked: ChipOption[];
    activityId: string;
  }): Promise<InterviewDraft>;

  /** 자소서 추출 시작 → jobId 즉시 반환. 비동기 경로 — 기획서 4.2 경로 B */
  startExtraction(units: ExtractUnit[]): string;
  pollExtraction(jobId: string): ExtractJob | undefined;

  /** 텍스트 → NCS 역량 태그. 근거 문장은 반드시 원문의 부분 문자열 */
  tagCompetencies(rawExcerpt: string): StoryCompetency[];

  /** 소재 승격 최소 조건 — 기획서 3.1 */
  checkSufficient(text: string): boolean;

  /** 본문에서 STAR 4구간 발췌 (생성하지 않는다 — 원칙 ③) */
  extractStarHint(body: string): ReturnType<typeof mock.extractStarHint>;
}

const mockApi: Tab2Api = {
  nextInterviewTurn: mock.nextInterviewTurn,
  buildInterviewDraft: mock.buildInterviewDraft,
  startExtraction: mock.startExtraction,
  pollExtraction: mock.pollExtraction,
  tagCompetencies: mock.tagCompetencies,
  checkSufficient: mock.checkSufficient,
  extractStarHint: mock.extractStarHint,
};

// ⬇⬇ 서버가 붙으면 이 한 줄만 바꾼다 ⬇⬇
export const tab2Api: Tab2Api = mockApi;
