import { type Item, makeFromPreset } from "./presets";

export const INITIAL_EXPERIENCES: Item[] = [
  {
    ...makeFromPreset("프로젝트", "경식이 AI 전화 서비스", {
      pinned: true,
      importance: "높음",
      keywords: ["문제해결", "사용자조사", "기획력"],
      competencies: ["문제해결", "기획력"],
      updatedAt: "어제",
      status: "완료",
      values: {
        ptype: "사이드 프로젝트",
        org: "사이드 프로젝트",
        period: "2025.03 ~ 2025.08",
        role: "PM / 기획",
        teamSize: "4명",
        stack: "Figma, Notion",
      },
      document: `고령층의 사회적 고립을 줄이기 위해 AI 전화 서비스를 기획했습니다.\n서비스 기획자로서 20명의 사용자 인터뷰를 주도하고 프로토타입을 3회 반복했습니다.\n베타 100명을 대상으로 한 테스트에서 만족도 4.5/5를 받았습니다.\n사용자 관점에서 문제를 정의하는 것이 가장 중요하다는 것을 배웠습니다.`,
    }),
  },
  {
    ...makeFromPreset("대외활동", "업비트 서포터즈", {
      pinned: true,
      importance: "보통",
      keywords: ["기획력", "소통"],
      competencies: ["기획력", "소통"],
      updatedAt: "3일 전",
      status: "작성중",
      values: { org: "업비트", period: "2024.08 ~ 2024.11", role: "콘텐츠 기획" },
    }),
  },
  {
    ...makeFromPreset("교환학생", "파리정치대학 교환학생", {
      pinned: true,
      keywords: ["글로벌", "팀워크"],
      competencies: ["글로벌"],
      updatedAt: "1주 전",
      status: "작성중",
      values: { country: "프랑스", univ: "파리정치대학", period: "2024.02 ~ 2024.07" },
    }),
  },
  {
    ...makeFromPreset("수상", "부산대학교 IT융합 해커톤 우수상", {
      pinned: true,
      keywords: ["문제해결", "협업"],
      linkedExperiences: [],
      status: "완료",
      values: { name: "부산대학교 IT융합 해커톤 우수상", level: "우수상", host: "부산대학교", awardedAt: "2025.08" },
    }),
  },
  {
    ...makeFromPreset("자격증", "컴퓨터활용능력 1급", {
      pinned: true,
      keywords: ["데이터 분석"],
      status: "완료",
      values: { name: "컴퓨터활용능력 1급", grade: "1급", issuer: "대한상공회의소", issuedAt: "2025.02" },
    }),
  },
  {
    ...makeFromPreset("수강과목", "Digital Marketing", {
      keywords: ["기획력", "데이터 분석"],
      competencies: ["기획력"],
      status: "작성중",
      values: { course: "Digital Marketing", school: "고려대학교", semester: "2024 2학기" },
    }),
  },
  {
    ...makeFromPreset("어학", "TOEIC 945", {
      pinned: true,
      keywords: ["글로벌"],
      competencies: ["글로벌"],
      status: "완료",
      values: { exam: "TOEIC", score: "945", issuedAt: "2025.01", issuer: "ETS", expireAt: "2027.01" },
    }),
  },
  {
    ...makeFromPreset("프로젝트", "고령층 인터뷰 경험", {
      keywords: ["사용자조사"],
      status: "병합 필요",
      updatedAt: "방금",
      values: { period: "2025.04 ~ 2025.05", role: "리서처" },
    }),
  },
];
