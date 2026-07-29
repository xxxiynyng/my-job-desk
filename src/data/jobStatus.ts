// 전형 단계·최종 결과의 단일 정본 (2026-07-28 통합).
// 탭1 테이블·상태 관리 모달·캘린더·행 컨텍스트 메뉴가 모두 여기서 파생한다.
// 각 소비처의 기존 이름(StatusType·AppStage·ApplicationStatus·JobMenuStatus 등)은 별칭으로 유지.

export type JobStage = "작성중" | "지원완료" | "서류전형" | "필기전형" | "면접전형" | "전형완료";

export const JOB_STAGES: JobStage[] = ["작성중", "지원완료", "서류전형", "필기전형", "면접전형", "전형완료"];

/** 진행 중 5단계 / 완료 1단계 — 칸반 열 구성과 "활성 공고" 판정에 쓴다. JOB_STAGES에서 파생. */
export const ACTIVE_STAGES: JobStage[] = JOB_STAGES.slice(0, 5);
export const COMPLETED_STAGES: JobStage[] = JOB_STAGES.slice(5);

export type FinalResult = "합격" | "불합격" | "보류" | null;

export const FINAL_RESULT_LABEL: Record<NonNullable<FinalResult>, string> = {
  합격: "최종합격",
  불합격: "불합격",
  보류: "보류",
};

/** 선택지 목록 — 라벨 맵에서 파생한다(키 삽입 순서 = 합격/불합격/보류). */
export const FINAL_RESULT_OPTIONS = Object.keys(FINAL_RESULT_LABEL) as NonNullable<FinalResult>[];
