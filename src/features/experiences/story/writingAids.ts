// ────────────────────────────────────────────────────────────────
// 탭2 — 인터뷰 서술 턴의 입력 보조 (기획서 1.8 피로 설계 ①의 연장)
//
// 1턴은 칩만 고르면 되지만 2·3턴은 여전히 백지다. 거기서 손이 멈춘다.
// "무슨 말로 시작하지?"를 없애는 게 이 파일의 목적.
//
// ⚠️ 지켜야 하는 선 — 완성된 문장을 넣어주지 않는다.
//   AI가 문장을 만들어 주면 (a) 원칙 ③(생성하지 않는다) 위반이고
//   (b) 사용자가 그대로 제출해 버려서 "실제로 안 한 일"이 소재가 된다
//       (모두의 창업 §6 — 구직자는 경험을 부풀린다).
//   그래서 넣는 것은 **말머리·낱말·단위**까지다. 문장은 사용자가 완성한다.
//   invariants 테스트가 종결어미로 끝나는 보조어를 막는다.
//
// 2026-07-29 고도화 — 낱말이 고른 활동에 맞게 바뀐다.
//   전에는 무엇을 고르든 같은 12개(총무·회장·회비·정산…)가 나왔다.
//   「팀 프로젝트」를 고른 사람에게 "총무·회장"을 권하는 건 도움이 아니라 방해다.
//   이제 1턴에서 고른 유형(NarrativeType)으로 낱말 묶음을 고른다.
// ────────────────────────────────────────────────────────────────

import type { NarrativeType } from "./entryOptions";

export type WritingAids = {
  /** 말머리 — 문장의 첫 조각. 커서 위치에 삽입된다 */
  starters: string[];
  /** 자주 쓰는 낱말 — 명사만 */
  words: string[];
  /** 숫자 틀 — `__명` 처럼 넣고 빈칸을 선택 상태로 둔다 */
  units?: string[];
  /** 보조 영역 위에 한 줄로 붙는 안내 */
  tip?: string;
};

/** 빈칸 자리표시자 — 삽입 후 이 부분이 선택 상태가 된다 */
export const BLANK = "__";

/* ── 2턴: "…에서 뭘 맡았어요?" ───────────────────────────────── */

const ROLE_STARTERS = ["제가 맡은 건", "주로 한 일은", "직책은"];

/**
 * 유형별 역할 낱말.
 * `Record<NarrativeType, …>` 이라 8종을 빠짐없이 적어야 컴파일된다 —
 * 프리셋이 늘면 여기서 깨진다(entryOptions와 같은 장치).
 * 한 묶음은 8개까지만 — 더 늘리면 고르는 것 자체가 일이 된다.
 */
const ROLE_WORDS: Record<NarrativeType, string[]> = {
  대외활동: ["총무", "회장", "팀장", "기획", "운영", "홍보", "정산", "회계"],
  프로젝트: ["팀장", "기획", "자료 조사", "발표", "일정 관리", "정리", "디자인", "개발"],
  알바: ["매장", "고객 응대", "마감", "재고", "발주", "정산", "교육", "청소"],
  "경력/인턴": ["부서", "사수", "자료 정리", "보고서", "회의", "고객사", "매뉴얼", "업무 인수"],
  봉사활동: ["대상자", "인솔", "준비물", "프로그램", "안내", "기록", "정리", "안전"],
  공모전: ["주제 선정", "자료 조사", "기획서", "발표", "역할 분담", "마감", "수정", "심사"],
  해외경험: ["수업", "현지 학생", "언어", "적응", "숙소", "일정", "발표", "교류"],
  학부연구생: ["실험", "데이터", "논문", "세미나", "장비", "기록", "분석", "정리"],
};

const ROLE_TIP = "눌러서 넣고, 이어서 편하게 쓰면 돼요.";

/* ── 3턴: "제일 손이 많이 갔던 게 뭐예요?" ──────────────────── */

const TROUBLE_STARTERS = ["처음엔", "제일 힘들었던 건", "그래서", "덕분에"];

const TROUBLE_WORDS: Record<NarrativeType, string[]> = {
  대외활동: ["마감", "일정", "예산", "정산", "인원", "소통", "불참", "양식"],
  프로젝트: ["마감", "일정", "역할", "의견 차이", "오류", "재작업", "자료", "기준"],
  알바: ["대기", "불만", "재고", "실수", "인수인계", "혼잡", "매뉴얼", "교대"],
  "경력/인턴": ["기한", "요청", "누락", "양식", "확인", "수정", "보고", "협업"],
  봉사활동: ["인원", "날씨", "준비물", "안전", "돌발", "연령차", "동선", "기록"],
  공모전: ["마감", "주제", "자료", "분량", "피드백", "수정", "발표", "분담"],
  해외경험: ["언어", "수업", "과제", "적응", "일정", "비용", "소통", "문화 차이"],
  학부연구생: ["재현", "오차", "데이터", "장비", "일정", "기록 누락", "분석", "검증"],
};

/** 숫자 단위 — 정량 성과가 소재의 질을 가장 크게 바꾼다(기획서 3.1) */
const TROUBLE_UNITS = ["명", "%", "일", "주", "번", "시간", "원", "건"];

const TROUBLE_TIP = "숫자가 들어가면 훨씬 잘 읽혀요.";

/* ── 조립 ─────────────────────────────────────────────────────── */

/** 유형을 모를 때(직접 입력 등) 쓰는 기본값 — 어느 유형에나 통하는 낱말 묶음 */
const FALLBACK: NarrativeType = "프로젝트";

export function roleAids(category?: NarrativeType): WritingAids {
  return { starters: ROLE_STARTERS, words: ROLE_WORDS[category ?? FALLBACK], tip: ROLE_TIP };
}

export function troubleAids(category?: NarrativeType): WritingAids {
  return {
    starters: TROUBLE_STARTERS,
    words: TROUBLE_WORDS[category ?? FALLBACK],
    units: TROUBLE_UNITS,
    tip: TROUBLE_TIP,
  };
}

/** 유형 정보가 없는 호출부 호환용 (테스트·기존 import) */
export const AIDS_ROLE = roleAids();
export const AIDS_TROUBLE = troubleAids();

/** 낱말 묶음 전수 — 불변식 테스트가 8종 전부를 훑는다 */
export const ALL_AID_WORDS: string[][] = [...Object.values(ROLE_WORDS), ...Object.values(TROUBLE_WORDS)];
export const ALL_AID_STARTERS: string[] = [...ROLE_STARTERS, ...TROUBLE_STARTERS];

/* ── 답변이 소재가 될 준비가 됐는지 알려주는 신호 ─────────────── */

/**
 * ⚠️ 재촉이 아니라 **긍정 신호**만 준다 (피로 설계 ⑦ — 글자수 하한·재촉 문구 금지).
 * 아직 부족할 때는 **아무 말도 하지 않는다.** 채워졌을 때만 한 줄이 뜬다.
 * "아직 부족해요" 류의 문구를 여기에 추가하지 말 것 — 그 순간 이 화면은 검사가 된다.
 */
export type AnswerSignal = { hasAction: boolean; hasResult: boolean; hasNumber: boolean };

const ACTION_HINT = /(했|만들|맡|바꾸|바꿔|정리|운영|기획|준비|조사|설계|개선|진행|담당|관리)/;
const RESULT_HINT = /(줄|늘|올랐|낮췄|끝냈|완료|달성|수상|선정|해결|개선됐|받았|성공)/;
const NUMBER_HINT = /\d/;

export function readAnswerSignal(text: string): AnswerSignal {
  return {
    hasAction: ACTION_HINT.test(text),
    hasResult: RESULT_HINT.test(text),
    hasNumber: NUMBER_HINT.test(text),
  };
}

/** 신호가 켜졌을 때만 문구를 돌려준다. 아니면 null — 침묵이 기본값이다. */
export function signalMessage(s: AnswerSignal): string | null {
  if (!s.hasAction || !s.hasResult) return null;
  return s.hasNumber ? "한 일과 결과가 다 들어갔어요. 이대로 좋아요." : "한 일과 결과가 다 들어갔어요.";
}
