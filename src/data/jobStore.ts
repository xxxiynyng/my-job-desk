// ─────────────────────────────────────────────────────────────
// 공고 등록(담기) 스토어 — 탭1 검색 기반 등록의 상태 저장소
//
// 사용자가 "담은" 공고는 { postingId, positionId } 참조만 저장한다(사본 금지).
// 표시용 필드(기업명·마감·직무…)는 렌더 시점에 postings.seed에서 파생한다.
// localStorage: pickd.jobs.registrations.v1
// ─────────────────────────────────────────────────────────────

import {
  POSTINGS,
  getPostingById,
  calcPostingDday,
  type Posting,
  type Position,
  type ScheduleEvent,
} from "./postings.seed";

export interface JobRegistration {
  postingId: string;
  positionId: string;
  registeredAt: string; // YYYY-MM-DD
}

const LS_KEY = "pickd.jobs.registrations.v1";
export const REGISTRATIONS_EVENT = "pickd:registrations-changed";

function read(): JobRegistration[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as JobRegistration[]) : [];
  } catch {
    return [];
  }
}

function write(list: JobRegistration[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(REGISTRATIONS_EVENT));
}

export function getRegistrations(): JobRegistration[] {
  return read();
}

export function getRegistration(postingId: string): JobRegistration | undefined {
  return read().find((r) => r.postingId === postingId);
}

export function isRegistered(postingId: string): boolean {
  return read().some((r) => r.postingId === postingId);
}

/** 담기 — 이미 담은 공고면 false 반환(동일 공고 중복지원 불가 규정과 일치) */
export function addRegistration(postingId: string, positionId: string): boolean {
  const list = read();
  if (list.some((r) => r.postingId === postingId)) return false;
  list.push({
    postingId,
    positionId,
    registeredAt: new Date().toISOString().slice(0, 10),
  });
  write(list);
  return true;
}

export function removeRegistration(postingId: string) {
  write(read().filter((r) => r.postingId !== postingId));
}

// ── 파생 헬퍼 ─────────────────────────────────────────────────

export function getRegisteredPosition(reg: JobRegistration): { posting: Posting; position: Position } | null {
  const posting = getPostingById(reg.postingId);
  if (!posting) return null;
  const position = posting.positions.find((p) => p.id === reg.positionId) ?? posting.positions[0];
  return { posting, position };
}

/** 일정 기간 표기 — "2026-08-10 ~ 2026-08-24" / 단일일은 "2026-08-25" / 시각 있으면 병기 */
export function formatEventSchedule(ev: ScheduleEvent): string {
  if (!ev.confirmed) return ""; // JobDetail이 빈 문자열을 '미정'으로 표기
  const same = ev.startDate === ev.endDate;
  const base = same ? ev.startDate : `${ev.startDate} ~ ${ev.endDate}`;
  return ev.endTime ? `${base} ${ev.endTime}` : base;
}

/** 접수 마감 표기 — "2026-08-07 15:00" (시각 없으면 날짜만) */
export function formatApplyEnd(posting: Posting): string {
  const d = new Date(posting.applyEnd);
  const date = posting.applyEnd.slice(0, 10);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const hasTime = !(d.getHours() === 0 && d.getMinutes() === 0);
  return hasTime ? `${date} ${hh}:${mm}` : date;
}

/** 등록 → 탭1 테이블 Job 행 파생값 (JobPostingTable의 Job 타입에 맞춰 사용) */
export function registrationRowSeed(reg: JobRegistration) {
  const rp = getRegisteredPosition(reg);
  if (!rp) return null;
  const { posting, position } = rp;
  return {
    id: `reg-${posting.id}`,
    slug: posting.slug,
    company: posting.orgName,
    title: posting.title,
    role: position.jobTitle,
    employType: position.recruitType,
    industry: posting.orgCategory,
    deadline: posting.applyEnd.slice(0, 10),
    dday: calcPostingDday(posting.applyEnd),
    linkedSchedules: posting.scheduleEvents.length,
    registeredAt: reg.registeredAt,
    url: posting.applyUrl,
  };
}

// ── JobDetail 어댑터 — 시드 공고를 상세 화면 데이터 형태로 변환 ──

export function postingToJobDetail(posting: Posting): Record<string, unknown> {
  const reg = getRegistration(posting.id);
  const position =
    posting.positions.find((p) => p.id === reg?.positionId) ?? posting.positions[0];

  const dday = calcPostingDday(posting.applyEnd);
  const essays = posting.essayQuestions
    .filter((q) => q.targetPositionIds === null || q.targetPositionIds.includes(position.id))
    .map((q, i) => ({
      no: i + 1,
      question: q.questionText,
      charLimit: q.charLimit,
      status: "미작성",
      updated: null,
      preview: null,
      docId: null,
      evalCriteria: q.evalCriteria ?? null,
    }));

  return {
    company: posting.orgName,
    division: position.jobGroup ?? posting.orgCategory,
    title: posting.title,
    role: position.jobTitle + (position.grade ? ` (${position.grade})` : ""),
    period: `${posting.applyStart.slice(0, 10)} ~ ${posting.applyEnd.slice(0, 10)}`,
    deadline: formatApplyEnd(posting),
    deadlineDate: new Date(posting.applyEnd),
    dday,
    expired: dday < 0,
    status: "작성중",
    location: position.workLocation.join(" · "),
    employment: position.employmentType,
    docsInProgress: [],
    sourceUrl: posting.sourceUrl,
    applyUrl: posting.applyUrl,
    reviewedAt: posting.reviewedAt,
    // basic 키는 목데이터(jobDetails)와 동일하게 유지 — 상세 화면 디자인 일관성 (검수 기준일은 등록일로 표기)
    basic: {
      기업명: `${posting.orgName} (${posting.orgCategory})`,
      공고명: posting.title,
      "모집 직무": position.jobTitle,
      근무지: position.workLocation.join(", "),
      "채용 형태": position.employmentType,
      "접수 시작일": posting.applyStart.slice(0, 10),
      "접수 마감일": formatApplyEnd(posting),
      "D-day": dday >= 0 ? `D-${dday}` : "마감",
      등록일: posting.reviewedAt,
      "최근 수정일": posting.reviewedAt,
    },
    eligibility: {
      "지원 자격": [
        position.qualification,
        ...(position.ageLimit ? [`연령: ${position.ageLimit}`] : []),
        ...(position.residencyRequirement ? [`거주요건: ${position.residencyRequirement}`] : []),
      ],
      "전형 안내": [
        `서류전형 방식: ${position.screeningMethod}`,
        position.writtenExam
          ? `필기시험 있음${position.writtenExamNote ? ` — ${position.writtenExamNote}` : ""}`
          : "필기시험 없음",
        ...(position.conversionNote ? [position.conversionNote] : []),
        ...(position.essayWeightNote ? [`자기소개서 평가: ${position.essayWeightNote}`] : []),
      ],
      우대사항: posting.preferences.map(
        (p) => `${p.category} — ${p.bonusRate} (${p.appliedStages.join("·")})${p.note ? ` · ${p.note}` : ""}`,
      ),
      "제출 서류": posting.attachments.map((a) => `${a.fileName} (${a.fileFormat})`),
    },
    process: posting.scheduleEvents
      .filter((ev) => ev.stageType !== "ANNOUNCE")
      .map((ev) => ({
        step: ev.label,
        schedule: formatEventSchedule(ev),
        detail: "",
        note: ev.confirmed ? "" : "확정되면 알려드릴게요",
      })),
    essays,
    essaySource: posting.essaySource,
    jobDescription: position.duties ?? "",
    competencies: position.competencies ?? [],
    rawSource: "",
  };
}

/** 검색 실패 시 안내용 — 진행중 공고 수 */
export function countOpenPostings(): number {
  return POSTINGS.filter((p) => calcPostingDday(p.applyEnd) >= 0).length;
}
