// 전역 통합 휴지통 스토어 (2026-07-07)
// 탭2 경험·파일함 파일의 소프트 삭제를 한 곳(pickd.trash.v1)에 스냅샷으로 보관.
// 14일 경과분은 loadTrash()/purgeExpired() 호출 시점에 자동 영구 삭제.
// 공고(job)는 아직 목데이터(localStorage 미저장)라 복원 대상에서 제외 — 저장 이전 후 편입 예정.

export type TrashKind = "experience" | "file" | "job";

export type TrashEntry = {
  trashId: string;
  kind: TrashKind;
  deletedAt: number; // epoch ms
  name: string;
  sub?: string; // 부가정보(유형·종류 등)
  payload: unknown; // 복원용 원본 스냅샷
};

const KEY = "pickd.trash.v1";
export const TRASH_RETENTION_DAYS = 14;
const RETENTION_MS = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

// 복원 시 스냅샷을 되돌릴 소스 localStorage 키. null이면 현재 복원 불가(job).
const SOURCE_KEY: Record<TrashKind, string | null> = {
  experience: "pickd.experiences.items",
  file: "specs.files.v2",
  job: null,
};

export const TRASH_KIND_LABEL: Record<TrashKind, string> = {
  experience: "경험",
  file: "파일",
  job: "공고",
};

function read(): TrashEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TrashEntry[]) : [];
  } catch {
    return [];
  }
}

function write(list: TrashEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
}

// 만료(14일 경과) 항목을 실제로 제거. 제거된 개수 반환.
export function purgeExpired(): number {
  const now = Date.now();
  const list = read();
  const kept = list.filter((e) => now - e.deletedAt < RETENTION_MS);
  if (kept.length !== list.length) write(kept);
  return list.length - kept.length;
}

// 만료 스윕 후 최신 삭제순으로 반환.
export function loadTrash(): TrashEntry[] {
  purgeExpired();
  return read().sort((a, b) => b.deletedAt - a.deletedAt);
}

export function trashCount(): number {
  purgeExpired();
  return read().length;
}

// 스냅샷 추가. 생성된 엔트리(실행취소 참조용) 반환.
export function pushTrash(
  items: Array<Pick<TrashEntry, "kind" | "name" | "payload"> & { sub?: string }>,
): TrashEntry[] {
  const now = Date.now();
  const created: TrashEntry[] = items.map((it, idx) => ({
    trashId: `${now}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
    kind: it.kind,
    name: it.name,
    sub: it.sub,
    payload: it.payload,
    deletedAt: now,
  }));
  write([...created, ...read()]);
  return created;
}

// 지정 엔트리를 휴지통에서 제거(영구삭제·복원 후 정리·실행취소 공용).
export function removeTrash(trashIds: string[]): void {
  const set = new Set(trashIds);
  write(read().filter((e) => !set.has(e.trashId)));
}

// 스냅샷을 원 소스 localStorage 배열 앞에 되돌리고 휴지통에서 제거. 성공 여부 반환.
// 소스 페이지는 마운트 시 localStorage를 다시 읽으므로 재진입하면 반영됨.
export function restoreEntry(entry: TrashEntry): boolean {
  const key = SOURCE_KEY[entry.kind];
  if (!key) return false;
  try {
    const arr = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown[];
    arr.unshift(entry.payload);
    localStorage.setItem(key, JSON.stringify(arr));
    removeTrash([entry.trashId]);
    return true;
  } catch {
    return false;
  }
}

export function canRestore(kind: TrashKind): boolean {
  return SOURCE_KEY[kind] !== null;
}

// 남은 보관 일수(0 = 오늘 삭제 예정). 표시용.
export function daysLeft(deletedAt: number): number {
  const remain = deletedAt + RETENTION_MS - Date.now();
  return Math.max(0, Math.ceil(remain / (24 * 60 * 60 * 1000)));
}

export function daysLeftLabel(deletedAt: number): string {
  const d = daysLeft(deletedAt);
  return d <= 0 ? "오늘 삭제 예정" : `${d}일 후 삭제`;
}
