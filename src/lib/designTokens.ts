/**
 * 디자인 토큰 단일 출처 (코드 정본).
 *
 * 폰트 크기 토큰은 오직 이 파일에서만 정의한다. tailwind.config.ts(유틸 클래스 생성)와
 * lib/utils.ts(tailwind-merge classGroup 등록)가 이 객체를 import해 파생하므로,
 * 여기 한 곳만 고치면 두 곳에 자동 반영된다.
 *
 * ⚠️ 토큰을 두 곳에 손으로 맞춰 적던 구조가 2026-07-05 사고(cn()이 크기 토큰을
 * 런타임 삭제)의 뿌리였다. 새 폰트 토큰은 반드시 이 객체에만 추가한다.
 * (CLAUDE.md §1 등록 규칙 · 디자인 SSOT §3 타이포 스케일과 미러)
 */

/**
 * UI 전역 배율 노브 (2026-07-30 도입).
 *
 * 화면 전체가 한 단계 작다는 판단으로 브라우저 110% 확대와 같은 밀도를 기본값으로 삼았다.
 * - 여백·크기·라운드: index.css의 `--ui-scale`이 루트 폰트(rem)와 px 변수를 함께 끌어올린다.
 *   Tailwind 기본 유틸(p-4·gap-3·h-10·rounded-lg …)은 전부 rem이라 자동으로 따라온다.
 * - 폰트: 반픽셀을 남기지 않기로 해서 아래 FONT_SIZE에 ×1.1 반올림 정수를 박아 둔다.
 *   즉 이 상수를 바꿔도 폰트는 따라오지 않는다 — 배율을 바꾸려면 FONT_SIZE도 다시 반올림할 것.
 *
 * ⚠️ index.css의 `--ui-scale`과 항상 같은 값이어야 한다(test/design-tokens.test.ts가 검증).
 */
export const UI_SCALE = 1.1;

/**
 * 폰트 크기 토큰 — 값은 1.0배 기준 스케일(10·11·13·15·22·26·30)에 ×1.1 반올림한 결과다.
 * 참고: text-xs·text-sm은 Tailwind 기본 토큰이라 여기가 아니라 아래
 * TW_BASE_FONT_SIZE_OVERRIDE에서 덮어쓴다(기본 font-size 그룹에 이미 등록돼 있어서
 * tailwind-merge에 다시 등록하면 안 된다).
 */
export const FONT_SIZE = {
  mini: "11px",    // 최소 (구 10)
  chip: "12px",    // 태그·칩·필터 (구 11)
  body: "14px",    // 데이터 행 기본 (구 13)
  title: "17px",   // 모달·섹션 제목 (구 15)
  h2: "24px",      // 중형 헤딩 (구 22)
  heading: "29px", // 페이지 H1 (구 26)
  display: "33px", // 대형 디스플레이 (구 30)
} as const;

/**
 * Tailwind 기본 폰트 토큰 재정의 — text-xs(12)·text-sm(14)도 같은 ×1.1 반올림을 적용한다.
 * shadcn/ui 벤더 컴포넌트가 text-xs·text-sm을 대량으로 쓰기 때문에, 이걸 빼면
 * 버튼·인풋·드롭다운만 옛 크기로 남아 화면이 섞인다.
 *
 * line-height를 함께 적는 이유(§1 "토큰에 line-height 금지"의 유일한 예외):
 * Tailwind 기본값이 원래 [크기, 줄간격] 쌍이라 크기만 덮어쓰면 줄간격이 사라져
 * 벤더 컴포넌트의 세로 리듬이 바뀐다. 값은 rem으로 두어 --ui-scale을 그대로 탄다
 * (1rem = 17.6px, 1.25rem = 22px — 각각 기존 16·20px의 1.1배).
 */
export const TW_BASE_FONT_SIZE_OVERRIDE = {
  xs: ["13px", "1rem"],      // 구 12px / 16px
  sm: ["15px", "1.25rem"],   // 구 14px / 20px
} as const;

export type FontSizeToken = keyof typeof FONT_SIZE;
