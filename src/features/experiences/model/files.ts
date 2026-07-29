// ─────────────────────────────────────────────────────────────
// 파일함 — 타입과 저장 키의 단일 정본.
// FilesPanel 과 BasicInfoPanel 이 같은 localStorage 키를 각각 리터럴로 들고 있었다.
// 한쪽만 버전을 올리면 조용히 어긋나는 구조라 여기로 모았다(2026-07-29).
// ─────────────────────────────────────────────────────────────

/** 프리셋 9종 + 사용자 지정 종류(직접 입력) 허용 → 안 맞는 '다른 파일'도 제자리 폴더를 갖는다. */
export type FileKind = string;

export type FileItem = {
  id: string;
  kind: FileKind;
  name: string;
  fileKind: "pdf" | "image";
  url?: string;
};

export const FILE_KINDS: FileKind[] = [
  "증명사진",
  "성적증명서",
  "졸업증명서",
  "재학증명서",
  "어학 성적표",
  "자격증 사본",
  "수상 증빙",
  "교육 수료증",
  "기타 제출서류",
];

export const LS_FILES = "specs.files.v2";
export const LS_PHOTO_ID = "specs.basicPhoto.id";
export const LS_PHOTO_SHOWN = "specs.basicPhoto.shown";
