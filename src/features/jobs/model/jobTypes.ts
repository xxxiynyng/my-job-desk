// 탭1 공고 행 타입 — 목록·칸반·서류현황이 공유한다. JobPostingTable.tsx 안에 있던 것을 옮겼다(2026-07-29).
import type { JobStage, FinalResult } from "@/data/jobStatus";

export type Job = {
  id: string;
  slug: string;
  company: string;
  title: string;
  role: string;
  employType: string;
  industry: string;
  deadline: string;      // YYYY-MM-DD — 편집·정렬용
  deadlineAt?: string;   // 시각 포함 ISO — 있으면 표시·D-day 계산의 기준
  dday: number;
  status: JobStage;
  finalResult: FinalResult;
  linked: { schedules: number; todos: number };
  starred: boolean;
  updatedAt: string;
  registeredAt: string;
  stage: JobStage;
  completedAt?: string;
  url?: string;
};
