// 전형 단계·최종 결과의 단일 정본 (2026-07-28 통합).
// 탭1 테이블·상태 관리 모달·캘린더·행 컨텍스트 메뉴가 모두 여기서 파생한다.
// 각 소비처의 기존 이름(StatusType·AppStage·ApplicationStatus·JobMenuStatus 등)은 별칭으로 유지.

export type JobStage = "작성중" | "지원완료" | "서류전형" | "필기전형" | "면접전형" | "전형완료";

export const JOB_STAGES: JobStage[] = ["작성중", "지원완료", "서류전형", "필기전형", "면접전형", "전형완료"];

export type FinalResult = "합격" | "불합격" | "보류" | null;

export const FINAL_RESULT_LABEL: Record<NonNullable<FinalResult>, string> = {
  합격: "최종합격",
  불합격: "불합격",
  보류: "보류",
};
