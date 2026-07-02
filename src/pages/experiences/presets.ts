// ────────────────────────────────────────────────────────────────
// 경험 Types & Constants
// ────────────────────────────────────────────────────────────────

// 2026-07-02 기획 확정: 경력(재직여부)은 "경력/인턴"에 통합(연봉은 MVP 제외),
// 비학업 해외경험(워킹홀리데이 등)은 "해외경험"으로 일반화 (구 인턴·교환학생에서 개명)
export type ItemType =
  | "프로젝트"
  | "대외활동"
  | "경력/인턴"
  | "공모전"
  | "봉사활동"
  | "해외경험"
  | "알바"
  | "학부연구생"
  | "어학"
  | "자격증"
  | "수상"
  | "수강과목"
  | "교육 이수";

export type Status = "작성중" | "완료" | "병합 필요";
export type FieldType = "text" | "textarea" | "date" | "file" | "link" | "tags";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  hidden?: boolean;
  custom?: boolean;
};

export type Item = {
  id: string;
  type: ItemType;
  name: string;
  status: Status;
  pinned?: boolean;
  importance?: "높음" | "보통" | "낮음";
  keywords: string[];
  competencies: string[];
  linkedExperiences?: string[];
  fields: FieldDef[];
  values: Record<string, string>;
  document?: string;
  documentExpanded?: boolean;
  updatedAt?: string;
  hasMergeCandidate?: boolean;
  hasUnansweredAiQuestion?: boolean;
  sortOrder?: number;
};

export const SHARED_EXP_KEY = "pickd.experiences.items";

export const NARRATIVE_TYPES: ItemType[] = ["프로젝트", "대외활동", "경력/인턴", "공모전", "봉사활동", "해외경험", "알바", "학부연구생"];
export const SPEC_TYPES: ItemType[] = ["어학", "자격증", "수상", "수강과목", "교육 이수"];
export const ALL_TYPES: ItemType[] = [...NARRATIVE_TYPES, ...SPEC_TYPES];

export const KEYWORD_OPTIONS = [
  "문제해결",
  "기획력",
  "소통",
  "실행력",
  "데이터 분석",
  "글로벌",
  "팀워크",
  "사용자조사",
  "리더십",
  "창업",
  "공익성",
];

// ────────────────────────────────────────────────────────────────
// 경험 Presets
// ────────────────────────────────────────────────────────────────

export type Preset = {
  fields: FieldDef[];
  editorOpenByDefault: boolean;
  writingGuide: string[];
  aiQuestions: string[];
};

export const withTail = (rows: FieldDef[]): FieldDef[] => [
  ...rows,
  { key: "keywords", label: "주요 키워드", type: "tags" },
  { key: "importance", label: "중요도", type: "text" },
];

export const EXTRA_COMMON: FieldDef[] = [
  { key: "links", label: "관련 링크", type: "link" },
  { key: "portfolio", label: "포트폴리오 링크", type: "link" },
  { key: "official", label: "공식 링크", type: "link" },
  { key: "press", label: "관련 기사", type: "link" },
  { key: "evidence", label: "증빙 파일", type: "file" },
  { key: "teamSize", label: "팀 규모", type: "text" },
  { key: "stack", label: "사용 도구/기술", type: "text" },
  { key: "detail", label: "상세 메모", type: "textarea" },
  { key: "related", label: "관련 자료", type: "link" },
];

export const PRESETS: Record<ItemType, Preset> = {
  프로젝트: {
    editorOpenByDefault: true,
    fields: withTail([
      { key: "title", label: "프로젝트명", type: "text" },
      { key: "ptype", label: "유형", type: "text" },
      { key: "org", label: "소속 / 팀", type: "text" },
      { key: "period", label: "기간", type: "text", placeholder: "2025.03 ~ 2025.08" },
      { key: "role", label: "나의 역할", type: "text" },
    ]),
    writingGuide: [
      "프로젝트 개요",
      "문제/배경",
      "목표",
      "나의 역할",
      "실행 과정",
      "협업 방식",
      "결과",
      "수치 성과",
      "배운 점",
      "직무 관련성",
    ],
    aiQuestions: [
      "이 프로젝트는 어떤 문제를 풀려고 했나요?",
      "본인의 구체적인 역할은 무엇이었나요?",
      "어떤 행동을 했고 어떤 과정을 거쳤나요?",
      "결과를 수치로 표현할 수 있나요?",
      "지원하려는 직무와 어떻게 연결되나요?",
    ],
  },
  대외활동: {
    editorOpenByDefault: true,
    fields: withTail([
      { key: "title", label: "활동명", type: "text" },
      { key: "atype", label: "유형", type: "text" },
      { key: "org", label: "주관기관 / 운영사", type: "text" },
      { key: "period", label: "기간", type: "text" },
      { key: "role", label: "나의 역할", type: "text" },
    ]),
    writingGuide: [
      "활동 개요",
      "참여 동기",
      "나의 역할",
      "주요 활동",
      "어려움/도전",
      "실행 과정",
      "결과",
      "배운 점",
      "직무 관련성",
    ],
    aiQuestions: [
      "이 활동에서 본인의 역할은 무엇이었나요?",
      "가장 주도적으로 한 일은 무엇인가요?",
      "어려움이나 갈등은 있었나요?",
      "이 활동의 결과나 성과는 무엇인가요?",
      "이 경험은 어떤 역량을 보여줄 수 있나요?",
    ],
  },
  "경력/인턴": {
    editorOpenByDefault: true,
    fields: withTail([
      { key: "company", label: "회사명", type: "text" },
      { key: "dept", label: "부서", type: "text" },
      { key: "position", label: "직무 / 포지션", type: "text" },
      { key: "period", label: "근무 기간", type: "text" },
      { key: "empType", label: "고용 형태", type: "text", placeholder: "정규직 / 계약직 / 인턴" },
      { key: "employed", label: "재직 여부", type: "text", placeholder: "재직 중 / 퇴사" },
      { key: "tasks", label: "담당 업무", type: "text" },
    ]),
    writingGuide: [
      "회사/부서 개요",
      "주요 업무",
      "프로젝트 경험",
      "문제 상황",
      "나의 역할",
      "실행 과정",
      "협업",
      "결과",
      "현장에서 배운 점",
      "직무 관련성",
    ],
    aiQuestions: [
      "근무 기간 동안 가장 주요했던 업무는 무엇이었나요?",
      "어떤 문제를 해결했거나 개선했나요?",
      "팀원들과 어떻게 협업했나요?",
      "결과를 수치로 표현할 수 있나요?",
      "현장에서 배운 점은 무엇인가요?",
    ],
  },
  공모전: {
    editorOpenByDefault: true,
    fields: withTail([
      { key: "title", label: "공모전명", type: "text" },
      { key: "host", label: "주관기관", type: "text" },
      { key: "period", label: "참가 기간", type: "text" },
      { key: "team", label: "팀 / 개인 여부", type: "text" },
      { key: "role", label: "나의 역할", type: "text" },
      { key: "awardYn", label: "수상 여부", type: "text" },
      { key: "submit", label: "제출 파일", type: "file" },
    ]),
    writingGuide: [
      "공모 주제",
      "문제 정의",
      "아이디어 전개",
      "나의 역할",
      "실행 과정",
      "차별화 포인트",
      "결과/수상",
      "배운 점",
      "자소서 활용 포인트",
    ],
    aiQuestions: [
      "공모 주제는 어떤 문제에 집중했나요?",
      "아이디어는 어떻게 발전시켰나요?",
      "팀 안에서 본인의 기여는 무엇이었나요?",
      "다른 팀과 어떤 점이 달랐나요?",
      "이 경험을 자소서에 어떻게 녹일 수 있을까요?",
    ],
  },
  봉사활동: {
    editorOpenByDefault: true,
    fields: withTail([
      { key: "title", label: "활동명", type: "text" },
      { key: "org", label: "기관 / 단체", type: "text" },
      { key: "period", label: "활동 기간", type: "text" },
      { key: "location", label: "활동 지역", type: "text" },
      { key: "role", label: "나의 역할", type: "text" },
      { key: "hours", label: "활동 시간", type: "text" },
    ]),
    writingGuide: [
      "활동 개요",
      "참여 동기",
      "나의 역할",
      "활동 과정",
      "기억에 남는 순간",
      "어려움/도전",
      "배운 점",
      "개인 가치관",
      "직무 관련성",
    ],
    aiQuestions: [
      "어떤 계기로 이 봉사활동에 참여했나요?",
      "본인의 구체적인 역할은 무엇이었나요?",
      "가장 의미 있었던 순간은 언제였나요?",
      "어려움은 없었나요?",
      "이 경험이 보여주는 가치관은 무엇인가요?",
    ],
  },
  해외경험: {
    editorOpenByDefault: true,
    fields: withTail([
      { key: "country", label: "국가", type: "text" },
      { key: "univ", label: "학교 / 기관명", type: "text" },
      { key: "period", label: "기간", type: "text" },
      { key: "major", label: "전공 / 수강 분야", type: "text" },
      { key: "courses", label: "수강 과목", type: "text" },
      { key: "activity", label: "활동 유형", type: "text", placeholder: "교환학생 / 어학연수 / 워킹홀리데이" },
    ]),
    writingGuide: [
      "참여 이유",
      "수강 과목 및 학업 경험",
      "문화 차이 경험",
      "커뮤니케이션 경험",
      "문제 해결 경험",
      "협업 경험",
      "성장 포인트",
      "직무 관련성",
    ],
    aiQuestions: [
      "이 해외 경험에서 가장 성장한 부분은 무엇인가요?",
      "문화/언어 차이는 어떻게 다뤘나요?",
      "지원 직무와 연결되는 수업/프로젝트가 있었나요?",
      "어떤 커뮤니케이션 경험을 강조할 수 있나요?",
    ],
  },
  알바: {
    editorOpenByDefault: true,
    fields: withTail([
      { key: "company", label: "근무처명", type: "text" },
      { key: "bizType", label: "업종 / 매장 유형", type: "text" },
      { key: "period", label: "근무 기간", type: "text" },
      { key: "empType", label: "근무 형태", type: "text" },
      { key: "tasks", label: "담당 업무", type: "text" },
      { key: "customer", label: "고객 응대 여부", type: "text" },
    ]),
    writingGuide: [
      "근무 배경",
      "담당 업무",
      "고객 응대 경험",
      "문제 상황",
      "해결 과정",
      "협업 경험",
      "책임감 / 성실성",
      "배운 점",
      "직무 관련성",
    ],
    aiQuestions: [
      "이 알바에서 가장 기억에 남는 경험은 무엇인가요?",
      "어떤 어려움이 있었고 어떻게 해결했나요?",
      "책임감이나 성실성을 보여줄 수 있는 사례가 있나요?",
      "이 경험이 지원 직무와 어떻게 연결되나요?",
    ],
  },
  학부연구생: {
    editorOpenByDefault: true,
    fields: withTail([
      { key: "lab", label: "연구실명", type: "text" },
      { key: "org", label: "소속 기관", type: "text" },
      { key: "period", label: "참여 기간", type: "text" },
      { key: "topic", label: "연구 주제", type: "text" },
      { key: "role", label: "담당 역할", type: "text" },
      { key: "output", label: "주요 결과물", type: "text" },
    ]),
    writingGuide: [
      "연구 배경 및 목표",
      "나의 역할",
      "연구 방법",
      "주요 과정",
      "결과물 / 성과",
      "어려움과 극복",
      "배운 점",
      "직무 관련성",
    ],
    aiQuestions: [
      "이 연구에서 본인의 구체적인 역할은 무엇이었나요?",
      "가장 어려웠던 부분과 어떻게 극복했나요?",
      "연구 결과물이나 성과를 수치로 표현할 수 있나요?",
      "이 경험이 지원 직무와 어떻게 연결되나요?",
    ],
  },
  어학: {
    editorOpenByDefault: false,
    fields: withTail([
      { key: "exam", label: "시험명", type: "text" },
      { key: "score", label: "점수 / 등급", type: "text" },
      { key: "testDate", label: "응시일", type: "date" },
      { key: "issuedAt", label: "취득일", type: "date" },
      { key: "expireAt", label: "유효기간", type: "date" },
      { key: "issuer", label: "시행기관", type: "text" },
    ]),
    writingGuide: [],
    aiQuestions: [],
  },
  자격증: {
    editorOpenByDefault: false,
    fields: withTail([
      { key: "name", label: "자격증명", type: "text" },
      { key: "grade", label: "급수 / 등급", type: "text" },
      { key: "issuer", label: "발급기관", type: "text" },
      { key: "issuedAt", label: "취득일", type: "date" },
      { key: "expireAt", label: "유효기간", type: "date" },
      { key: "certNo", label: "자격번호", type: "text" },
      { key: "certFile", label: "증빙서류", type: "file" },
    ]),
    writingGuide: ["취득 이유", "학습 과정", "어려움", "직무 관련성", "지원에 활용하는 방법"],
    aiQuestions: [],
  },
  수상: {
    editorOpenByDefault: true,
    fields: withTail([
      { key: "name", label: "수상명", type: "text" },
      { key: "level", label: "수상 등급", type: "text" },
      { key: "host", label: "주관기관", type: "text" },
      { key: "awardedAt", label: "수상일", type: "date" },
      { key: "linkedExp", label: "관련 활동 / 프로젝트", type: "text" },
      { key: "team", label: "팀 / 개인 여부", type: "text" },
    ]),
    writingGuide: ["수상 배경", "평가 기준", "나의 기여", "차별화 포인트", "결과", "자소서 활용 포인트"],
    aiQuestions: [
      "이 수상의 배경에는 어떤 활동이 있었나요?",
      "평가 기준에서 어떤 점이 강점이었나요?",
      "본인의 기여를 한 문장으로 정리하면요?",
    ],
  },
  수강과목: {
    editorOpenByDefault: false,
    fields: withTail([
      { key: "course", label: "과목명", type: "text" },
      { key: "school", label: "학교 / 기관", type: "text" },
      { key: "semester", label: "수강 학기", type: "text" },
      { key: "credit", label: "학점", type: "text" },
      { key: "grade", label: "성적", type: "text" },
      { key: "skill", label: "관련 역량", type: "text" },
    ]),
    writingGuide: ["배운 점", "주요 과제", "팀 프로젝트", "직무 관련성", "이 수업이 보여주는 역량"],
    aiQuestions: [],
  },
  "교육 이수": {
    editorOpenByDefault: false,
    fields: withTail([
      { key: "program", label: "교육명", type: "text" },
      { key: "org", label: "운영기관", type: "text" },
      { key: "period", label: "교육 기간", type: "text" },
      { key: "status", label: "수료 여부", type: "text" },
      { key: "field", label: "교육 분야", type: "text" },
      { key: "hours", label: "이수 시간", type: "text" },
    ]),
    writingGuide: ["참여 이유", "배운 점", "프로젝트/실습 경험", "직무 관련성", "지원에 활용하는 방법"],
    aiQuestions: [],
  },
};

export const makeFromPreset = (type: ItemType, name: string, extra: Partial<Item> = {}): Item => {
  const preset = PRESETS[type];
  return {
    id: String(Date.now() + Math.random()),
    type,
    name,
    status: "작성중",
    keywords: [],
    competencies: [],
    fields: preset.fields.map((f) => ({ ...f })),
    values: {},
    documentExpanded: preset.editorOpenByDefault,
    document: "",
    ...extra,
  };
};
