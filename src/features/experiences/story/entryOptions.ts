// ────────────────────────────────────────────────────────────────
// 탭2 — 인터뷰 1턴 칩 카탈로그 (프리셋 ↔ 칩의 단일 출처)
//
// 왜 이 파일이 생겼나:
//   전에는 칩이 그냥 문자열 배열이었고, 고른 라벨을 정규식으로 추측해
//   유형을 정했다("동아리"가 들어 있으면 대외활동…). 그래서
//     · 해외경험·학부연구생 프리셋에는 도달할 방법이 아예 없었고
//     · 라벨 문구를 바꾸면 유형 매칭이 조용히 깨졌다.
//   이제 칩이 category를 데이터로 들고 다니고, 아래 타입이 narrative 8종을
//   전부 덮도록 강제한다. 프리셋을 추가하면 여기서 컴파일이 깨진다.
// ────────────────────────────────────────────────────────────────

import type { ItemType } from "../model/presets";
import type { Competency } from "./model";

/** 서술형(narrative) 프리셋 8종 — 소재가 나올 수 있는 유형 */
export type NarrativeType =
  | "프로젝트"
  | "대외활동"
  | "경력/인턴"
  | "공모전"
  | "봉사활동"
  | "해외경험"
  | "알바"
  | "학부연구생";

export type ChipOption = { label: string; category: NarrativeType };

/**
 * 콜드스타트 1턴 칩.
 * Record<NarrativeType, …> 이므로 **8종을 빠짐없이** 적어야 컴파일된다.
 */
const COLD_BY_TYPE: Record<NarrativeType, string> = {
  대외활동: "동아리·학생회",
  프로젝트: "팀 프로젝트",
  알바: "아르바이트",
  "경력/인턴": "인턴·현장실습",
  봉사활동: "봉사활동",
  공모전: "공모전",
  해외경험: "교환학생·해외경험",
  학부연구생: "학부연구생·연구실",
};

/** 화면에 보이는 순서 — 학생이 떠올리기 쉬운 순 */
const COLD_ORDER: NarrativeType[] = [
  "대외활동",
  "프로젝트",
  "알바",
  "경력/인턴",
  "봉사활동",
  "공모전",
  "해외경험",
  "학부연구생",
];

export const COLD_CHIPS: ChipOption[] = COLD_ORDER.map((category) => ({
  label: COLD_BY_TYPE[category],
  category,
}));

/**
 * 갭 모드 1턴 칩 — 역량별로 "그 역량이 나올 만한 자리"를 예시로 준다.
 * 라벨은 역량 언어가 아니라 생활 언어여야 한다 (기획서 1.1 번역 문제).
 */
export const GAP_CHIPS: Partial<Record<Competency, ChipOption[]>> = {
  자원관리: [
    { label: "동아리 회비·정산", category: "대외활동" },
    { label: "팀 프로젝트 일정 관리", category: "프로젝트" },
    { label: "알바 재고·발주", category: "알바" },
    { label: "행사 예산 짜기", category: "대외활동" },
  ],
  조직이해: [
    { label: "인턴·현장실습", category: "경력/인턴" },
    { label: "학과 학생회", category: "대외활동" },
    { label: "기관 서포터즈", category: "대외활동" },
    { label: "회사 아르바이트", category: "알바" },
  ],
  대인관계: [
    { label: "팀 프로젝트", category: "프로젝트" },
    { label: "동아리 운영", category: "대외활동" },
    { label: "고객 응대 알바", category: "알바" },
    { label: "멘토링·튜터", category: "대외활동" },
  ],
  의사소통: [
    { label: "발표·PT", category: "프로젝트" },
    { label: "카드뉴스·게시물 작성", category: "대외활동" },
    { label: "보고서·기획서", category: "경력/인턴" },
    { label: "설문·인터뷰", category: "프로젝트" },
  ],
  문제해결: [
    { label: "잘 안 되던 걸 바꾼 일", category: "프로젝트" },
    { label: "마감이 밀렸던 일", category: "프로젝트" },
    { label: "불만·클레임 처리", category: "알바" },
  ],
  수리: [
    { label: "설문 집계", category: "프로젝트" },
    { label: "매출·정산 계산", category: "알바" },
    { label: "데이터 정리", category: "학부연구생" },
  ],
  정보: [
    { label: "엑셀·스프레드시트", category: "경력/인턴" },
    { label: "노션·협업툴 세팅", category: "프로젝트" },
    { label: "자료 조사", category: "학부연구생" },
  ],
  기술: [
    { label: "장비·기기 다룬 일", category: "경력/인턴" },
    { label: "개발·제작", category: "프로젝트" },
    { label: "실험·실습", category: "학부연구생" },
  ],
  자기개발: [
    { label: "자격증 준비", category: "프로젝트" },
    { label: "독학·스터디", category: "대외활동" },
    { label: "교육 수료", category: "대외활동" },
  ],
  직업윤리: [
    { label: "봉사활동", category: "봉사활동" },
    { label: "약속·규정을 지킨 일", category: "대외활동" },
  ],
};

/** ItemType 으로 안전하게 좁히기 — 목록 테이블·프리셋과 같은 어휘를 쓴다 */
export function toItemType(c: string): ItemType {
  return (COLD_ORDER as string[]).includes(c) ? (c as ItemType) : "대외활동";
}
