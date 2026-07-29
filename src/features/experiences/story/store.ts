// ────────────────────────────────────────────────────────────────
// 탭2 — 소재 스토어 (단일 출처)
//
// 왜 이렇게 만들었나 (지속가능성):
//  · 컴포넌트가 localStorage를 직접 읽지 않는다. 읽기 경로가 하나여야
//    "화면마다 다른 값이 보이는" 종류의 버그가 구조적으로 안 생긴다.
//  · 구독은 useSyncExternalStore — React 18 공식 외부 스토어 연결 방식이라
//    동시성 모드에서도 tearing이 없다. 커스텀 이벤트 + useEffect 조합보다 안전하다.
//  · 나중에 서버 상태로 옮길 때 이 파일의 subscribe/getSnapshot만 바꾸면 되고
//    화면은 그대로 둔다. (React Query 등으로 교체해도 훅 시그니처 유지)
//
// 저장소 키를 바꿀 때는 CLAUDE.md 규칙대로 `.vN`을 올린다.
// ────────────────────────────────────────────────────────────────

import { useSyncExternalStore } from "react";
import type { Story } from "./model";

export const STORY_KEY = "pickd.stories.v1";

let cache: Story[] | null = null;
const listeners = new Set<() => void>();

function load(): Story[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Story[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(list: Story[]) {
  cache = list;
  try {
    localStorage.setItem(STORY_KEY, JSON.stringify(list));
  } catch {
    /* quota 초과 등 — 메모리 캐시는 유지되므로 화면은 계속 동작한다 */
  }
  listeners.forEach((l) => l());
}

/* ── 외부 스토어 계약 ─────────────────────────────────────────── */

function subscribe(cb: () => void) {
  listeners.add(cb);
  // 다른 탭에서 바뀐 경우도 반영
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORY_KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** 스냅샷은 반드시 안정적인 참조여야 한다(무한 렌더 방지) → cache에 고정 */
function getSnapshot(): Story[] {
  if (cache === null) cache = load();
  return cache;
}

const EMPTY: Story[] = [];
const getServerSnapshot = () => EMPTY;

/* ── 읽기 ─────────────────────────────────────────────────────── */

/** 삭제되지 않은 소재 전체 */
export function useStories(): Story[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot).filter((s) => !s.deletedAt);
}

/** 훅 밖(이벤트 핸들러 등)에서의 읽기 */
export function getStories(): Story[] {
  return getSnapshot().filter((s) => !s.deletedAt);
}

export function getStoriesOf(activityId: string): Story[] {
  return getStories().filter((s) => s.activityId === activityId);
}

/* ── 쓰기 ─────────────────────────────────────────────────────── */

export function upsertStories(next: Story[]) {
  const byId = new Map(getSnapshot().map((s) => [s.id, s]));
  next.forEach((s) => byId.set(s.id, s));
  persist([...byId.values()]);
}

export function patchStory(id: string, patch: Partial<Story>) {
  const cur = getSnapshot();
  const found = cur.find((s) => s.id === id);
  if (!found) return;
  persist(cur.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s)));
}

/** 소프트 삭제 — 휴지통 규칙(14일)과 같은 결 */
export function softDeleteStories(ids: string[]) {
  const now = Date.now();
  persist(getSnapshot().map((s) => (ids.includes(s.id) ? { ...s, deletedAt: now } : s)));
}

export function restoreStories(ids: string[]) {
  persist(getSnapshot().map((s) => (ids.includes(s.id) ? { ...s, deletedAt: undefined } : s)));
}

/** 활동이 지워지면 그 아래 소재도 함께 (기획서 4.5 삭제 범위) */
export function softDeleteByActivity(activityIds: string[]) {
  const now = Date.now();
  persist(getSnapshot().map((s) => (activityIds.includes(s.activityId) ? { ...s, deletedAt: now } : s)));
}

/** 테스트·초기화 전용 */
export function __resetStore(seed: Story[] = []) {
  persist(seed);
}
