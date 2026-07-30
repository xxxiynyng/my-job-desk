// 탭1 공고 행 타입 — 목록·칸반·서류현황이 공유한다. JobPostingTable.tsx 안에 있던 것을 옮겼다(2026-07-29).
import type { JobStage, FinalResult } from "@/data/jobStatus";

export type Job = {
  id: string;
  slug: string;
  company: string;
  title: string;
  role: string;
  employType: string;
  industry?: string;     // 산업 (사기업 목데이터 전용 — 공공기관 공고는 비어 있다)
  orgCategory?: string;  // 기관유형 (공기업/준정부기관/기타공공기관 — 담은 공고 전용)
  workLocation?: string; // 근무지 — position.workLocation 을 " · " 로 이은 값
  deadline: string;      // YYYY-MM-DD — 편집·정렬용
  deadlineAt?: string;   // 시각 포함 ISO — 있으면 표시·D-day 계산의 기준
  dday: number;
  status: JobStage;
  finalResult: FinalResult;
  linked: { schedules: number; todos: number };
  starred: boolean;
  updatedAt: string;     // 표시용 상대 표기("2시간 전")
  updatedMinsAgo?: number; // 정렬 전용 — 표시 문자열은 정렬이 틀린다("2시간 전" > "3일 전")
  registeredAt: string;
  stage: JobStage;
  completedAt?: string;
  url?: string;
};
