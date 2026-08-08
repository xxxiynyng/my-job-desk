import { toISODate } from "@/lib/date";
import { JOB_STAGES, type JobStage } from "./jobStatus";
import { getRegistrations, getRegisteredPosition } from "./jobStore";
import type { StageType } from "./postings.seed";

export type TaskPriority = "high" | "medium" | "low";

/** 우선순위 표기 — ContextPanel·DetailModal 공용 정본 */
export const PRIORITY_LABEL: Record<TaskPriority, string> = { high: "긴급", medium: "보통", low: "낮음" };
export const PRIORITY_STYLE: Record<TaskPriority, string> = {
  high: "bg-red-100 text-red-600 border-red-200",
  medium: "bg-primary/10 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
};
export type TaskType = "서류" | "면접" | "자소서" | "기타";
export type EventType = "interview" | "deadline" | "personal" | "task";
export type ScheduleType = "posting" | "personal";

export interface CalTask {
  id: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  type: TaskType;
  linkedPosting?: string;
  linkedPostingId?: string;
  deadline?: string;
  dueTime?: string;
  carriedOver?: boolean;
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: EventType;
  company?: string;
  postingId?: string;
}

export interface CalApplication {
  id: string;
  company: string;
  position: string;
  status: JobStage;
  deadline: string;
  stage: string;
  starred?: boolean;
  brandColor?: string;
  keyDates?: { date: string; label: string }[];
  recruitmentStart?: string;
  recruitmentEnd?: string;
}

export interface CalSchedule {
  id: string;
  title: string;
  date: string;
  time?: string;
  scheduleType: ScheduleType;
  linkedPosting?: string;
  linkedPostingId?: string;
  type?: string;
}

const today = new Date();
const y = today.getFullYear();
const m = today.getMonth();
const d = today.getDate();
const fmt = toISODate;

export const mockCalTasks: CalTask[] = [
  { id: "t1", title: "삼성전자 자소서 최종 검토", completed: false, priority: "high", type: "자소서", linkedPosting: "삼성전자", linkedPostingId: "a1", deadline: fmt(new Date(y, m, d)), dueTime: "18:00" },
  { id: "t2", title: "SK하이닉스 면접 자료 정리", completed: false, priority: "high", type: "면접", linkedPosting: "SK하이닉스", linkedPostingId: "a2", deadline: fmt(new Date(y, m, d)), dueTime: "16:00" },
  { id: "t3", title: "네이버 기업 분석 보완", completed: false, priority: "medium", type: "기타", linkedPosting: "네이버", linkedPostingId: "a3", deadline: fmt(new Date(y, m, d + 1)), dueTime: "14:00" },
  { id: "t4", title: "카카오 기업 분석 완료", completed: true, priority: "medium", type: "기타", linkedPosting: "카카오", linkedPostingId: "a4" },
  { id: "t5", title: "포트폴리오 PDF 업데이트", completed: false, priority: "low", type: "기타", deadline: fmt(new Date(y, m, d + 2)) },
  { id: "t6", title: "한국전력공사 제출서류 점검", completed: false, priority: "high", type: "서류", linkedPosting: "한국전력공사", linkedPostingId: "a6", deadline: fmt(new Date(y, m, d)), dueTime: "17:00" },
];

export const mockCalCarriedOverTasks: CalTask[] = [
  { id: "ct1", title: "LG전자 자기소개서 수정", completed: false, priority: "high", type: "자소서", linkedPosting: "LG전자", linkedPostingId: "a5", carriedOver: true, dueTime: "13:00" },
  { id: "ct2", title: "현대자동차 면접 예상질문 정리", completed: false, priority: "medium", type: "면접", linkedPosting: "현대자동차", carriedOver: true, dueTime: "15:00" },
];

export const mockCalSchedules: CalSchedule[] = [
  { id: "s1", title: "서류 제출 마감", date: fmt(new Date(y, m, d)), time: "18:00", scheduleType: "posting", linkedPosting: "삼성전자", linkedPostingId: "a1", type: "마감" },
  { id: "s2", title: "1차 면접", date: fmt(new Date(y, m, d + 1)), time: "14:00", scheduleType: "posting", linkedPosting: "SK하이닉스", linkedPostingId: "a2", type: "면접" },
  { id: "s3", title: "서류 제출 마감", date: fmt(new Date(y, m, d + 2)), time: "23:59", scheduleType: "posting", linkedPosting: "네이버", linkedPostingId: "a3", type: "마감" },
  { id: "s4", title: "필기 시험", date: fmt(new Date(y, m, d + 5)), time: "10:00", scheduleType: "posting", linkedPosting: "카카오", linkedPostingId: "a4", type: "시험" },
  { id: "s5", title: "결과 발표", date: fmt(new Date(y, m, d + 7)), time: "10:00", scheduleType: "posting", linkedPosting: "LG전자", linkedPostingId: "a5", type: "발표" },
  { id: "s6", title: "토익 시험", date: fmt(new Date(y, m, d + 3)), time: "09:00", scheduleType: "personal", type: "시험" },
  { id: "s7", title: "스터디 모임", date: fmt(new Date(y, m, d + 2)), time: "19:00", scheduleType: "personal", type: "모임" },
  { id: "s8", title: "운동", date: fmt(new Date(y, m, d + 3)), time: "18:00", scheduleType: "personal" },
  { id: "s9", title: "가족 모임", date: fmt(new Date(y, m, d + 6)), time: "19:00", scheduleType: "personal", type: "모임" },
  { id: "s10", title: "서류 제출 마감", date: fmt(new Date(y, m, d + 4)), time: "18:00", scheduleType: "posting", linkedPosting: "한국전력공사", linkedPostingId: "a6", type: "마감" },
];

/**
 * 일정(CalSchedule) → 달력 칸 배지(CalendarEvent) 파생 — 캘린더 데이터 소스 단일화
 * (기획 §8-2 #7, 2026-08-04).
 *
 * 전에는 달력 격자가 `mockCalEvents`라는 **별도 목록**을 그리고 오른쪽 패널만
 * `scheduleList`를 그려서, 사용자가 추가한 일정이 오른쪽에는 뜨는데 달력에는
 * 안 찍혔다. 이제 두 화면이 같은 목록(scheduleList)에서 파생한다 —
 * 일정을 하나 추가하면 양쪽에 동시에 나타난다.
 *
 * 파생이므로 저장 대상이 아니다. 저장되는 것은 CalSchedule 쪽뿐(cal.schedules.v1).
 */
const SCHEDULE_TYPE_TO_EVENT: Record<string, EventType> = {
  // 전형에 직접 참석하는 일정 — 파랑 계열 배지
  면접: "interview",
  시험: "interview",
  검사: "interview",
  // 날짜를 지키는 일정(마감·결과) — 빨강 계열 배지
  마감: "deadline",
  접수: "deadline",
  서류: "deadline",
  발표: "deadline",
  입사: "deadline",
};

export function schedulesToEvents(schedules: CalSchedule[]): CalendarEvent[] {
  return schedules.map((s) => ({
    id: `ev-${s.id}`,
    date: s.date,
    // 달력 칸은 좁아 배지가 잘린다 — 공고 일정은 "회사명 + 유형"으로 줄이고,
    // 개인 일정은 사용자가 적은 제목을 그대로 보여준다.
    title: s.scheduleType === "posting" && s.linkedPosting
      ? `${s.linkedPosting} ${s.type ?? ""}`.trim()
      : s.title,
    type: s.scheduleType === "personal"
      ? "personal"
      : (s.type ? SCHEDULE_TYPE_TO_EVENT[s.type] : undefined) ?? "deadline",
    company: s.linkedPosting,
    postingId: s.linkedPostingId,
  }));
}

export const mockCalApplications: CalApplication[] = [
  {
    id: "a1", company: "삼성전자", position: "DX부문 마케팅", status: "서류전형", deadline: fmt(new Date(y, m, d)), stage: "서류전형", starred: true, brandColor: "#0066CC",
    recruitmentStart: fmt(new Date(y, m, d - 7)), recruitmentEnd: fmt(new Date(y, m, d + 8)),
    keyDates: [{ date: fmt(new Date(y, m, d)), label: "서류 마감" }, { date: fmt(new Date(y, m, d + 8)), label: "결과 발표" }],
  },
  {
    id: "a2", company: "SK하이닉스", position: "HR", status: "면접전형", deadline: fmt(new Date(y, m, d + 1)), stage: "면접전형", starred: true, brandColor: "#FF0000",
    recruitmentStart: fmt(new Date(y, m, d - 5)), recruitmentEnd: fmt(new Date(y, m, d + 10)),
    keyDates: [{ date: fmt(new Date(y, m, d + 1)), label: "1차 면접" }, { date: fmt(new Date(y, m, d + 10)), label: "최종 면접" }],
  },
  {
    id: "a3", company: "네이버", position: "프론트엔드 개발", status: "서류전형", deadline: fmt(new Date(y, m, d + 2)), stage: "서류전형", starred: false, brandColor: "#03C75A",
    recruitmentStart: fmt(new Date(y, m, d - 3)), recruitmentEnd: fmt(new Date(y, m, d + 5)),
    keyDates: [{ date: fmt(new Date(y, m, d + 2)), label: "서류 마감" }],
  },
  {
    id: "a4", company: "카카오", position: "백엔드 개발", status: "필기전형", deadline: fmt(new Date(y, m, d + 5)), stage: "필기전형", starred: false, brandColor: "#FEE500",
    recruitmentStart: fmt(new Date(y, m, d - 2)), recruitmentEnd: fmt(new Date(y, m, d + 12)),
    keyDates: [{ date: fmt(new Date(y, m, d + 5)), label: "필기 시험" }, { date: fmt(new Date(y, m, d + 12)), label: "결과 발표" }],
  },
  {
    id: "a5", company: "LG전자", position: "AI 연구", status: "작성중", deadline: fmt(new Date(y, m, d + 7)), stage: "작성중", starred: false, brandColor: "#A50034",
    recruitmentStart: fmt(new Date(y, m, d)), recruitmentEnd: fmt(new Date(y, m, d + 14)),
    keyDates: [{ date: fmt(new Date(y, m, d + 7)), label: "서류 마감" }],
  },
  {
    id: "a6", company: "한국전력공사", position: "사무직", status: "서류전형", deadline: fmt(new Date(y, m, d + 4)), stage: "서류전형", starred: false, brandColor: "#005BAC",
    recruitmentStart: fmt(new Date(y, m, d - 4)), recruitmentEnd: fmt(new Date(y, m, d + 15)),
    keyDates: [{ date: fmt(new Date(y, m, d + 4)), label: "서류 마감" }, { date: fmt(new Date(y, m, d + 15)), label: "필기 시험" }],
  },
];

export const DAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];
export const MONTHS_KO = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

export function formatKoreanDate(date: Date): string {
  const dayName = DAYS_KO[date.getDay()];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${dayName})`;
}

export function formatShortKoreanDate(date: Date): string {
  const dayName = DAYS_KO[date.getDay()];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${dayName}요일`;
}

// D-day 계산 정본은 ds/DdayChip.calcDday — 여기선 재수출만 (구 자체 구현 제거, 2026-07-06)
export { calcDday as getDday } from "@/lib/dday";

export function getDdayStyle(dday: number): string {
  if (dday === 0) return "bg-red-500 text-white font-bold animate-pulse";
  if (dday >= 1 && dday <= 3) return "text-red-500 font-semibold";
  if (dday >= 4 && dday <= 7) return "text-orange-500 font-semibold";
  if (dday > 7) return "text-gray-500";
  return "text-gray-400";
}

export function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start);
  const endDate = new Date(end);
  cur.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  while (cur <= endDate) {
    dates.push(toISODate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export type PostingFilterValue = "all" | "personal" | string;

export const APPLICATION_STATUSES: JobStage[] = JOB_STAGES;

// ── 담은 공고 → 캘린더 파생 (jobStore 등록 참조 기반) ──────────────
// 담기 시 "캘린더에 등록됐어요"를 실제로 지키는 셀렉터. Calendar·TodayPanel이 소비한다.

const STAGE_TO_SCHEDULE_TYPE: Partial<Record<StageType, string>> = {
  APPLY: "마감",
  DOC_RESULT: "발표",
  WRITTEN_EXAM: "시험",
  WRITTEN_RESULT: "발표",
  PERSONALITY_TEST: "검사",
  EVIDENCE_SUBMIT: "서류",
  INTERVIEW: "면접",
  FINAL_RESULT: "발표",
  JOIN: "입사",
  PHYSICAL_TEST: "시험",
  PRACTICAL_TEST: "시험",
  APTITUDE_TEST: "시험",
};

/** 담은 공고 → 캘린더 지원현황 카드 */
export function registeredCalApplications(): CalApplication[] {
  return getRegistrations().flatMap((reg) => {
    const rp = getRegisteredPosition(reg);
    if (!rp) return [];
    const { posting, position } = rp;
    const events = posting.scheduleEvents.filter((e) => e.stageType !== "ANNOUNCE");
    return [{
      id: `reg-${posting.id}`,
      company: posting.orgName,
      position: position.jobTitle,
      status: "작성중" as JobStage,
      deadline: posting.applyEnd.slice(0, 10),
      stage: "작성중",
      recruitmentStart: posting.applyStart.slice(0, 10),
      recruitmentEnd: posting.applyEnd.slice(0, 10),
      keyDates: events
        .filter((e) => e.confirmed && e.stageType !== "APPLY")
        .map((e) => ({ date: e.startDate, label: e.label })),
    }];
  });
}

/** 담은 공고 → 캘린더 일정 (접수 시작·마감은 각각의 날짜에, 나머지 단계는 시작일에) */
export function registeredCalSchedules(): CalSchedule[] {
  const out: CalSchedule[] = [];
  getRegistrations().forEach((reg) => {
    const rp = getRegisteredPosition(reg);
    if (!rp) return;
    const { posting } = rp;
    const linkedPostingId = `reg-${posting.id}`;
    posting.scheduleEvents.forEach((e, i) => {
      if (e.stageType === "ANNOUNCE" || !e.confirmed) return;
      if (e.stageType === "APPLY") {
        out.push({
          id: `${linkedPostingId}-ev${i}-start`, title: "지원서 접수 시작", date: e.startDate,
          time: e.startTime, scheduleType: "posting", linkedPosting: posting.orgName, linkedPostingId, type: "접수",
        });
        out.push({
          id: `${linkedPostingId}-ev${i}-end`, title: "지원서 접수 마감", date: e.endDate,
          time: e.endTime, scheduleType: "posting", linkedPosting: posting.orgName, linkedPostingId, type: "마감",
        });
        return;
      }
      out.push({
        id: `${linkedPostingId}-ev${i}`, title: e.label, date: e.startDate,
        time: e.startTime ?? e.endTime, scheduleType: "posting",
        linkedPosting: posting.orgName, linkedPostingId,
        type: STAGE_TO_SCHEDULE_TYPE[e.stageType] ?? "기타",
      });
    });
  });
  return out;
}

