import { useCallback, useEffect, useState } from "react";
import {
  INFO_FIELDS,
  INFO_DEFAULTS,
  CORE_KEYS,
  DEFAULT_VISIBLE,
  LS_INFO_VALUES,
  LS_INFO_VISIBLE,
  INFO_VALUES_EVENT,
  type InfoKey,
} from "@/data/basicInfoFields";

export interface ProfileCompletion {
  /** 완성도 백분율 (0~100, 반올림) */
  pct: number;
  /** 값이 채워진 필드 수 */
  filled: number;
  /** 전체 필드 수 */
  total: number;
  /** 아직 비어 있는 필드 목록 (key + 라벨) — 점진 수집 유도용 */
  incomplete: { key: InfoKey; label: string }[];
  /** 100% 여부 */
  isComplete: boolean;
}

function readValues(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LS_INFO_VALUES);
    const stored = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    // BasicInfoPanel과 동일하게 기본값 병합 후 판정 (표시 값 = default ← stored)
    return { ...INFO_DEFAULTS, ...stored };
  } catch {
    return { ...INFO_DEFAULTS };
  }
}

function readVisibleKeys(): InfoKey[] {
  try {
    const raw = localStorage.getItem(LS_INFO_VISIBLE);
    return raw ? (JSON.parse(raw) as InfoKey[]) : DEFAULT_VISIBLE;
  } catch {
    return DEFAULT_VISIBLE;
  }
}

/**
 * 순수 계산 — 완성도 로직 단일 출처.
 * 분모 = 코어 필드 ∪ 표시(visible) 필드 (하이브리드). 코어는 표시 여부와 무관하게 항상 포함.
 * values는 기본값 병합된 Record<InfoKey,string>, visibleKeys는 사용자가 표시하기로 한 필드.
 */
export function computeProfileCompletion(
  values: Record<string, string>,
  visibleKeys: InfoKey[],
): ProfileCompletion {
  const denomKeys = new Set<InfoKey>([...CORE_KEYS, ...visibleKeys]);
  const fields = INFO_FIELDS.filter((f) => denomKeys.has(f.key));
  const incomplete = fields.filter((f) => !(values[f.key] || "").trim());
  const total = fields.length;
  const filled = total - incomplete.length;
  return {
    pct: total ? Math.round((filled / total) * 100) : 100,
    filled,
    total,
    incomplete,
    isComplete: incomplete.length === 0,
  };
}

/**
 * 기본정보(specs.info.values.v2) 기준 프로필 완성도 단일 출처.
 * 대시보드 배너·탭2 완성도 카드가 이 훅으로 같은 값을 공유한다.
 * BasicInfoPanel이 값 저장 시 INFO_VALUES_EVENT를 쏘면 즉시 재계산된다.
 */
export function useProfileCompletion(): ProfileCompletion {
  const [state, setState] = useState<ProfileCompletion>(() =>
    computeProfileCompletion(readValues(), readVisibleKeys()),
  );

  const refresh = useCallback(
    () => setState(computeProfileCompletion(readValues(), readVisibleKeys())),
    [],
  );

  useEffect(() => {
    // 같은 문서 내 편집(BasicInfoPanel) + 다른 탭 편집(storage) 모두 반영
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === LS_INFO_VALUES || e.key === LS_INFO_VISIBLE) refresh();
    };
    window.addEventListener(INFO_VALUES_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(INFO_VALUES_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  return state;
}
