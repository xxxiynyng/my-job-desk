// ────────────────────────────────────────────────────────────────
// 탭2 v2 — 목(mock) 처리 레이어
// 서버가 붙기 전까지 화면이 "진짜 흐름"으로 동작하게 하는 자리.
// CLAUDE.md §1 "백엔드 없음" 유지 — fetch 없이 setTimeout으로 지연만 흉내낸다.
//
// ⚠️ 실제 백엔드로 교체할 때 이 파일만 갈아끼우면 된다.
//    화면은 아래 시그니처에만 의존한다 (기획서 4.2 작업 상태 계약).
// ────────────────────────────────────────────────────────────────

import { NCS_SUB, uid, type Competency, type StoryCompetency, type Story, type StarHint } from "./model";
// 타입 계약은 api.ts 가 정본 — 여기는 그 구현이다 (import type 이라 런타임 순환 없음)
import type { InterviewMode, InterviewTurn, InterviewDraft, ExtractJob, ExtractUnit } from "./api";
import { COLD_CHIPS, GAP_CHIPS, type ChipOption } from "./entryOptions";
import { roleAids, troubleAids } from "./writingAids";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ── 1. 규칙 기반 태거 ────────────────────────────────────────
   근거 문장은 반드시 원문에서 "그대로" 잘라낸다.
   → evidenceText ⊂ rawExcerpt 검증(기획서 4.4 검증 1번)이 항상 통과하도록.
   실서비스에서는 LLM이 이 자리를 대신하되, 검증 코드는 그대로 남는다.        */

type Rule = { competency: Competency; sub: string; any: string[]; gate?: string[] };

const RULES: Rule[] = [
  // 남용 역량에는 게이트를 건다 (기획서 5.2 ④)
  // 한국어 활용형을 어간 단위로 담는다 (밀려/밀렸, 줄었/줄여, 바꿨/바꿔 …)
  { competency: "문제해결", sub: "문제처리", any: ["문제", "안 되", "안되", "실패", "오류", "지연", "밀려", "밀렸", "밀리", "막혀", "막히", "불만", "줄었", "줄여", "줄이", "개선", "바꿨", "바꿔", "바꾸", "고쳤", "고치", "해결"], gate: ["바꿨", "바꿔", "바꾸", "개선", "해결", "줄었", "줄여", "줄이", "고쳤", "고치", "다시", "새로"] },
  { competency: "의사소통", sub: "문서작성", any: ["작성", "글", "카드뉴스", "보고서", "기획서", "공지", "게시"] },
  { competency: "의사소통", sub: "의사표현", any: ["발표", "설득", "제안", "브리핑"] },
  { competency: "의사소통", sub: "경청", any: ["인터뷰", "설문", "의견", "물어보", "들었"] },
  { competency: "자원관리", sub: "예산", any: ["예산", "회비", "정산", "비용", "지출", "돈"] },
  { competency: "자원관리", sub: "시간", any: ["일정", "스케줄", "마감", "기한", "타임라인", "주기"] },
  { competency: "자원관리", sub: "물적자원", any: ["재고", "발주", "물품", "비품", "장비"] },
  { competency: "대인관계", sub: "팀워크", any: ["팀원", "같이", "함께", "협업", "분담"] },
  { competency: "대인관계", sub: "리더십", any: ["팀장", "회장", "총무", "이끌", "주도", "맡아"] },
  { competency: "대인관계", sub: "갈등관리", any: ["갈등", "다툼", "의견 차", "조율", "중재"] },
  { competency: "수리", sub: "기초통계", any: ["설문", "집계", "통계", "평균", "비율", "%", "명", "건"] },
  { competency: "정보", sub: "컴퓨터활용", any: ["엑셀", "스프레드시트", "노션", "피그마", "데이터", "정리했", "양식"] },
  { competency: "조직이해", sub: "업무이해", any: ["부서", "기관", "규정", "절차", "매뉴얼", "인수인계"] },
  { competency: "직업윤리", sub: "공동체윤리", any: ["봉사", "책임", "약속", "성실", "지켰"] },
  { competency: "자기개발", sub: "경력개발", any: ["자격증", "공부", "준비했", "배우", "독학", "수료"] },
];

/** 원문에서 키워드를 포함한 "문장"을 그대로 잘라낸다 */
function sentenceContaining(raw: string, kw: string): string | null {
  const sentences = raw
    .split(/(?<=[.!?。])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const hit = sentences.find((s) => s.includes(kw));
  if (!hit) return null;
  return hit.length > 120 ? hit.slice(0, 120) : hit;
}

export function tagCompetencies(rawExcerpt: string): StoryCompetency[] {
  const found: StoryCompetency[] = [];
  for (const rule of RULES) {
    if (found.some((f) => f.competency === rule.competency)) continue; // 역량당 1개
    const kw = rule.any.find((k) => rawExcerpt.includes(k));
    if (!kw) continue;
    if (rule.gate && !rule.gate.some((g) => rawExcerpt.includes(g))) continue;
    const evidence = sentenceContaining(rawExcerpt, kw);
    if (!evidence) continue; // 근거를 못 대면 태그하지 않는다 (타협 불가 ①)
    found.push({
      competency: rule.competency,
      subCompetency: NCS_SUB[rule.competency].includes(rule.sub) ? rule.sub : undefined,
      evidenceText: evidence,
      confidence: rule.gate ? "high" : "low",
      userVerdict: "unset",
      taggedBy: "ai",
    });
  }
  return found.slice(0, 3); // 최대 3개 (기획서 5.2 ③)
}

/* ── 2. 소재 승격 최소 조건 (기획서 3.1) ────────────────────── */

const VAGUE = ["열심히", "노력했", "최선을", "성실히", "많이 배웠"];
const ACTION_HINT = ["했", "만들", "바꾸", "바꿔", "정리", "맡", "운영", "작성", "설계", "진행", "관리"];
const RESULT_HINT = ["됐", "되었", "줄었", "줄여", "늘었", "받았", "달성", "완료", "성공", "남았", "덕분", "%", "명", "건", "일로", "배"];

export function checkSufficient(text: string): boolean {
  const hasAction = ACTION_HINT.some((k) => text.includes(k)) && !VAGUE.every((v) => text.includes(v));
  const hasResult = RESULT_HINT.some((k) => text.includes(k));
  return hasAction && hasResult && text.replace(/\s/g, "").length >= 25;
}

/** 본문에서 STAR 4구간을 "발췌"한다. 생성하지 않는다 (원칙 ③) */
export function extractStarHint(body: string): StarHint {
  const parts = body
    .split(/(?<=[.!?。])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return {};
  const hint: StarHint = {};
  if (parts[0]) hint.situation = parts[0];
  if (parts.length >= 4) {
    hint.task = parts[1];
    hint.action = parts.slice(2, parts.length - 1).join(" ");
    hint.result = parts[parts.length - 1];
  } else if (parts.length === 3) {
    hint.task = parts[1];
    hint.result = parts[2];
  } else if (parts.length === 2) {
    hint.action = parts[1];
  }
  return hint;
}

/* ── 3. 인터뷰 ────────────────────────────────────────────────
   피로 설계(기획서 1.8):
   ① 1턴은 타이핑 0 — 칩 선택
   ② 최대 3턴, 남은 개수는 텍스트로만
   ③ 1턴만 답해도 결과가 남는다
   ④ 질문은 구어·구체·저추상 + 예시 병기
   ⑤ 답변마다 1줄 리액션 (취조감 제거)                          */



/**
 * ⑤ 답변마다 1줄 리액션 — 취조가 아니라 대화로 읽히게.
 * 단 "잘했다/훌륭하다" 같은 평가는 하지 않는다 (원칙 ⑤ 판단하지 않는다).
 * 사실 확인 + 어느 축으로 읽히는지 알려주는 선까지만.
 */
function reactionFor(answer: string): string {
  if (/총무|회비|예산|정산/.test(answer)) return "회비·예산을 직접 다뤘네요. 자원관리로 읽히는 부분이에요.";
  if (/팀장|회장|이끌|주도/.test(answer)) return "맡아서 진행한 자리였네요.";
  if (/설문|인터뷰|의견/.test(answer)) return "사람들 얘기를 직접 들었네요.";
  if (/\d/.test(answer)) return "숫자가 들어 있네요. 그대로 남겨둘게요.";
  if (answer.length > 40) return "적어둘게요.";
  return "네, 적어둘게요.";
}

export async function nextInterviewTurn(opts: {
  mode: InterviewMode;
  targetCompetency?: Competency;
  turnNo: number;
  answers: string[];
  picked?: ChipOption[];
}): Promise<InterviewTurn> {
  await wait(650 + Math.floor(Math.random() * 700));
  const { mode, targetCompetency, turnNo, answers, picked } = opts;
  const last = answers[answers.length - 1] ?? "";
  // 이야기를 듣는 대상은 첫 번째로 고른 것 — 보조 낱말도 그 유형을 따라간다
  const focus = picked?.[0]?.category;

  if (turnNo === 1) {
    if (mode === "gap" && targetCompetency) {
      return {
        turnNo: 1,
        kind: "chips",
        question: `${targetCompetency} — 이 중에 해본 게 있어요?`,
        hint: "생각나는 걸 하나 골라주세요. 없으면 넘어가도 돼요.",
        chips: GAP_CHIPS[targetCompetency] ?? [{ label: "비슷한 일을 해본 적 있어요", category: "대외활동" }],
        isLast: false,
      };
    }
    return {
      turnNo: 1,
      kind: "chips",
      question: "최근 1년 안에, 이 중에 해본 게 있어요?",
      hint: "거창하지 않아도 돼요.",
      chips: COLD_CHIPS,
      isLast: false,
    };
  }

  if (turnNo === 2) {
    return {
      turnNo: 2,
      kind: "text",
      reaction: reactionFor(last),
      // ⚠️ last 를 그대로 넣으면 안 된다 — 다중 선택 시절 답은 "팀 프로젝트 · 아르바이트"처럼
      //    이어져 있어 "팀 프로젝트 아르바이트에서 뭘 맡았어요?"로 문장이 깨졌다.
      //    이야기를 듣는 대상은 언제나 하나뿐이므로 고른 칩(없으면 첫 조각)만 쓴다.
      question: `${picked?.[0]?.label ?? last.split(" · ")[0]}에서 뭘 맡았어요?`,
      hint: "한 줄이면 충분해요.",
      placeholder: "예: 회비 관리랑 행사 예산 짜는 걸 맡았어요",
      aids: roleAids(focus),
      isLast: false,
    };
  }

  return {
    turnNo: 3,
    kind: "text",
    reaction: reactionFor(last),
    question: "하면서 제일 손이 많이 갔던 게 뭐예요?",
    hint: "귀찮았던 것, 잘 안 됐던 것도 좋아요. 그걸 어떻게 했는지까지 적어주시면 딱이에요.",
    placeholder: "예: 정산이 매번 밀려서, 엑셀 양식을 만들어 매주 정리하게 바꿨어요",
    aids: troubleAids(focus),
    isLast: true,
  };
}


export async function buildInterviewDraft(opts: {
  mode: InterviewMode;
  answers: string[];
  picked: ChipOption[];
  activityId: string;
}): Promise<InterviewDraft> {
  await wait(900);
  const [, role, detail] = opts.answers;
  const picked = opts.picked.length ? opts.picked : [{ label: "새 활동", category: "대외활동" as const }];
  const first = picked[0];

  // 사용자가 쓴 문장만 이어붙인다. 새 문장을 만들지 않는다 (원칙 ③)
  const body = [role, detail].filter(Boolean).join(" ");
  const raw = [first.label, role, detail].filter(Boolean).join("\n");
  const headline = (detail || role || first.label).split(/[.\n]/)[0].slice(0, 40);
  const now = Date.now();

  const story: Story = {
    id: uid(),
    activityId: opts.activityId,
    headline,
    body,
    rawExcerpt: raw,
    starHint: extractStarHint(body),
    status: "ai_draft",
    origin: "ai",
    insufficient: !checkSufficient(raw),
    competencies: tagCompetencies(raw),
    createdAt: now,
    updatedAt: now,
  };

  return {
    activityTitle: first.label,
    activityCategory: first.category,
    story,
  };
}


/* ── 4. 자소서 추출 (비동기 작업) — 기획서 4.2 경로 B ────────── */


const jobs = new Map<string, ExtractJob>();

export function startExtraction(units: ExtractUnit[]): string {
  const jobId = uid();
  const job: ExtractJob = {
    jobId,
    status: "queued",
    step: "문항을 나누고 있어요",
    progress: { done: 0, total: units.length },
    candidates: [],
    sourceText: units.map((u) => u.answer).join("\n\n"),
  };
  jobs.set(jobId, job);

  // 문항 단위로 순차 처리 — 끝나는 대로 부분 결과를 채운다
  (async () => {
    await wait(500);
    job.status = "running";
    for (let i = 0; i < units.length; i++) {
      job.step = `자소서를 읽고 있어요`;
      await wait(1400 + Math.floor(Math.random() * 900));
      const u = units[i];
      const actTemp = uid();
      job.candidates.push({
        tempId: actTemp,
        kind: "activity",
        title: guessTitle(u.answer, i),
        meta: u.question ? `문항 ${i + 1} · ${u.question.slice(0, 24)}` : `문항 ${i + 1}`,
      });
      splitStories(u.answer).forEach((chunk) => {
        job.candidates.push({
          tempId: uid(),
          kind: "story",
          parentTempId: actTemp,
          title: chunk.split(/[.\n]/)[0].slice(0, 40),
          body: chunk,
          rawExcerpt: chunk,
          competencies: tagCompetencies(chunk),
          insufficient: !checkSufficient(chunk),
        });
      });
      job.progress.done = i + 1;
      job.status = i + 1 < units.length ? "partial" : "done";
    }
    job.step = "다 읽었어요";
  })();

  return jobId;
}

export function pollExtraction(jobId: string): ExtractJob | undefined {
  const j = jobs.get(jobId);
  return j ? { ...j, candidates: [...j.candidates] } : undefined;
}

function guessTitle(text: string, idx: number): string {
  const m = text.match(/([가-힣A-Za-z0-9]+(?:\s?[가-힣A-Za-z0-9]+)?)\s?(동아리|서포터즈|프로젝트|인턴|공모전|학생회|봉사)/);
  if (m) return m[0].trim();
  return `자소서에서 찾은 활동 ${idx + 1}`;
}

/** 문단/문장 묶음을 소재 후보로 쪼갠다 (활동당 최대 3개 — 기획서 3.1 상한) */
function splitStories(text: string): string[] {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.replace(/\s/g, "").length > 20);
  if (paras.length >= 2) return paras.slice(0, 3);
  const sents = text
    .split(/(?<=[.!?。])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < sents.length; i += 2) out.push(sents.slice(i, i + 2).join(" "));
  return out.filter((s) => s.replace(/\s/g, "").length > 20).slice(0, 3);
}
