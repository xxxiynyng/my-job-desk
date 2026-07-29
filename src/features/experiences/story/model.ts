// ────────────────────────────────────────────────────────────────
// 탭2 v2 — 소재(story) 모델 · NCS 축 · 로컬 스토어
// 기획: claude/탭2_기획개발.md 2부(데이터 모델) · 1.6(공통 UI 규약)
// ⚠️ 이 파일은 **순수 모델**만 담는다 — 타입 · NCS 상수 · 부수효과 없는 셀렉터.
//    저장은 store.ts, 서버 호출은 api.ts 가 맡는다. 여기에 I/O를 넣지 않는다.
// ────────────────────────────────────────────────────────────────

/** NCS 직업기초능력 10개. 발명·변형하지 않는다 (기획서 1.2) */
export const NCS = [
  "의사소통",
  "수리",
  "문제해결",
  "자기개발",
  "자원관리",
  "대인관계",
  "정보",
  "기술",
  "조직이해",
  "직업윤리",
] as const;
export type Competency = (typeof NCS)[number];

export const NCS_LABEL: Record<Competency, string> = {
  의사소통: "의사소통능력",
  수리: "수리능력",
  문제해결: "문제해결능력",
  자기개발: "자기개발능력",
  자원관리: "자원관리능력",
  대인관계: "대인관계능력",
  정보: "정보능력",
  기술: "기술능력",
  조직이해: "조직이해능력",
  직업윤리: "직업윤리",
};

/** 하위능력 — 태깅 rubric (기획서 2.9) */
export const NCS_SUB: Record<Competency, string[]> = {
  의사소통: ["문서이해", "문서작성", "경청", "의사표현", "기초외국어"],
  수리: ["기초연산", "기초통계", "도표분석", "도표작성"],
  문제해결: ["사고력", "문제처리"],
  자기개발: ["자아인식", "자기관리", "경력개발"],
  자원관리: ["시간", "예산", "물적자원", "인적자원"],
  대인관계: ["팀워크", "리더십", "갈등관리", "협상", "고객서비스"],
  정보: ["컴퓨터활용", "정보처리"],
  기술: ["기술이해", "기술선택", "기술적용"],
  조직이해: ["경영이해", "체제이해", "업무이해", "국제감각"],
  직업윤리: ["근로윤리", "공동체윤리"],
};

export type StoryCompetency = {
  competency: Competency;
  subCompetency?: string;
  /** 근거 문장 — raw_excerpt의 부분 문자열이어야 한다 (타협 불가 ①) */
  evidenceText: string;
  confidence: "high" | "low";
  userVerdict: "unset" | "accepted" | "rejected";
  taggedBy: "ai" | "user";
};

export type StarHint = {
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
};

export type Story = {
  id: string;
  /** 부모는 항상 activity (기획서 2.1 규칙 1) */
  activityId: string;
  headline: string;
  body: string;
  /** 원문 발췌 원본 — 근거 검증·재분석·감사용 (타협 불가 ④) */
  rawExcerpt: string;
  starHint?: StarHint;
  starHintStale?: boolean;
  resultMetric?: string;
  status: "ai_draft" | "user_confirmed";
  origin: "ai" | "manual" | "split";
  splitFromStoryId?: string;
  /** 승격 최소 조건(기획서 3.1) 미달 */
  insufficient?: boolean;
  competencies: StoryCompetency[];
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
};

/* ── 파생 셀렉터 ─────────────────────────────────────────────── */

/** 태그가 유효한 것만 — 거부된 태그는 세지 않는다 */
export function liveTags(s: Story): StoryCompetency[] {
  return s.competencies.filter((c) => c.userVerdict !== "rejected");
}

export type CoverageRow = {
  competency: Competency;
  /** 확정된 소재 개수만 센다 (기획서 1.14 — ai_draft는 커버리지에 넣지 않는다) */
  storyCount: number;
  /** 담은 공고 중 이 역량을 묻는 곳 */
  demandCount: number;
  demandTotal: number;
  isGap: boolean;
};

export function buildCoverage(stories: Story[], demand: Record<string, number>, demandTotal: number): CoverageRow[] {
  const counts = new Map<Competency, number>();
  stories
    .filter((s) => s.status === "user_confirmed")
    .forEach((s) => {
      const seen = new Set<Competency>();
      liveTags(s).forEach((t) => {
        if (seen.has(t.competency)) return;
        seen.add(t.competency);
        counts.set(t.competency, (counts.get(t.competency) ?? 0) + 1);
      });
    });

  return NCS.map((c) => {
    const storyCount = counts.get(c) ?? 0;
    const demandCount = demand[c] ?? 0;
    return { competency: c, storyCount, demandCount, demandTotal, isGap: demandCount > 0 && storyCount === 0 };
  }).sort((a, b) => b.demandCount - a.demandCount || b.storyCount - a.storyCount);
}

/**
 * 담은 공고의 요구 분포.
 * 실제로는 탭1 essay_question.eval_criteria 집계 — 프로토타입은 시드 3건 기준 고정값.
 * (기획서 1.14 — 출처를 화면에 반드시 표기한다)
 */
export const DEMAND_SEED = {
  postingCount: 3,
  questionCount: 11,
  byCompetency: {
    문제해결: 3,
    의사소통: 3,
    직업윤리: 2,
    자원관리: 2,
    조직이해: 1,
    대인관계: 1,
  } as Record<string, number>,
};

/** 담은 공고 0건일 때의 회색 기준선 — 부울경 공공기관 문항 평균 분포(자리값) */
export const BASELINE_DEMAND: Record<string, number> = {
  문제해결: 3,
  의사소통: 3,
  대인관계: 2,
  직업윤리: 2,
  자원관리: 2,
  조직이해: 1,
  정보: 1,
  자기개발: 1,
};

export const uid = () => Math.random().toString(36).slice(2, 10);
