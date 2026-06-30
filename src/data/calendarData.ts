export type TaskPriority = "high" | "medium" | "low";
export type TaskType = "서류" | "면접" | "자소서" | "기타";
export type EventType = "interview" | "deadline" | "personal" | "task";
export type ApplicationStatus =
  | "서류작성중" | "지원완료" | "서류합격"
  | "필기진행" | "면접진행" | "최종합격" | "불합격";
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
  status: ApplicationStatus;
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
const fmt = (date: Date) => date.toISOString().split("T")[0];

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

export const mockCalEvents: CalendarEvent[] = [
  { id: "e1", date: fmt(new Date(y, m, d)), title: "삼성전자 서류", type: "deadline", company: "삼성전자", postingId: "a1" },
  { id: "e2", date: fmt(new Date(y, m, d)), title: "자소서 수정", type: "task" },
  { id: "e3", date: fmt(new Date(y, m, d + 1)), title: "SK 면접", type: "interview", company: "SK하이닉스", postingId: "a2" },
  { id: "e4", date: fmt(new Date(y, m, d + 2)), title: "네이버 마감", type: "deadline", company: "네이버", postingId: "a3" },
  { id: "e5", date: fmt(new Date(y, m, d + 2)), title: "스터디 모임", type: "personal" },
  { id: "e6", date: fmt(new Date(y, m, d + 2)), title: "카카오 서류", type: "deadline", company: "카카오", postingId: "a4" },
  { id: "e7", date: fmt(new Date(y, m, d + 5)), title: "카카오 필기", type: "interview", company: "카카오", postingId: "a4" },
  { id: "e8", date: fmt(new Date(y, m, d + 7)), title: "LG전자 발표", type: "deadline", company: "LG전자", postingId: "a5" },
  { id: "e9", date: fmt(new Date(y, m, d + 10)), title: "현대차 면접", type: "interview", company: "현대자동차" },
  { id: "e10", date: fmt(new Date(y, m, d - 1)), title: "토익 시험", type: "personal" },
  { id: "e11", date: fmt(new Date(y, m, d + 3)), title: "운동", type: "personal" },
  { id: "e12", date: fmt(new Date(y, m, d + 4)), title: "한전 마감", type: "deadline", company: "한국전력공사", postingId: "a6" },
];

export const mockCalApplications: CalApplication[] = [
  {
    id: "a1", company: "삼성전자", position: "DX부문 마케팅", status: "서류합격", deadline: fmt(new Date(y, m, d)), stage: "서류합격", starred: true, brandColor: "#0066CC",
    recruitmentStart: fmt(new Date(y, m, d - 7)), recruitmentEnd: fmt(new Date(y, m, d + 8)),
    keyDates: [{ date: fmt(new Date(y, m, d)), label: "서류 마감" }, { date: fmt(new Date(y, m, d + 8)), label: "결과 발표" }],
  },
  {
    id: "a2", company: "SK하이닉스", position: "HR", status: "면접진행", deadline: fmt(new Date(y, m, d + 1)), stage: "면접진행", starred: true, brandColor: "#FF0000",
    recruitmentStart: fmt(new Date(y, m, d - 5)), recruitmentEnd: fmt(new Date(y, m, d + 10)),
    keyDates: [{ date: fmt(new Date(y, m, d + 1)), label: "1차 면접" }, { date: fmt(new Date(y, m, d + 10)), label: "최종 면접" }],
  },
  {
    id: "a3", company: "네이버", position: "프론트엔드 개발", status: "서류합격", deadline: fmt(new Date(y, m, d + 2)), stage: "서류합격", starred: false, brandColor: "#03C75A",
    recruitmentStart: fmt(new Date(y, m, d - 3)), recruitmentEnd: fmt(new Date(y, m, d + 5)),
    keyDates: [{ date: fmt(new Date(y, m, d + 2)), label: "서류 마감" }],
  },
  {
    id: "a4", company: "카카오", position: "백엔드 개발", status: "필기진행", deadline: fmt(new Date(y, m, d + 5)), stage: "필기진행", starred: false, brandColor: "#FEE500",
    recruitmentStart: fmt(new Date(y, m, d - 2)), recruitmentEnd: fmt(new Date(y, m, d + 12)),
    keyDates: [{ date: fmt(new Date(y, m, d + 5)), label: "필기 시험" }, { date: fmt(new Date(y, m, d + 12)), label: "결과 발표" }],
  },
  {
    id: "a5", company: "LG전자", position: "AI 연구", status: "서류작성중", deadline: fmt(new Date(y, m, d + 7)), stage: "서류작성중", starred: false, brandColor: "#A50034",
    recruitmentStart: fmt(new Date(y, m, d)), recruitmentEnd: fmt(new Date(y, m, d + 14)),
    keyDates: [{ date: fmt(new Date(y, m, d + 7)), label: "서류 마감" }],
  },
  {
    id: "a6", company: "한국전력공사", position: "사무직", status: "서류합격", deadline: fmt(new Date(y, m, d + 4)), stage: "서류합격", starred: false, brandColor: "#005BAC",
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

export function getDday(deadlineStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(deadlineStr);
  deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

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
    dates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export type PostingFilterValue = "all" | "personal" | string;

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "서류작성중", "지원완료", "서류합격",
  "필기진행", "면접진행", "최종합격", "불합격",
];
