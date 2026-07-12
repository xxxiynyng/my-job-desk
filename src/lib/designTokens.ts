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
 *
 * 참고: text-xs(12)·text-sm(14)은 Tailwind 기본 토큰이라 여기 넣지 않는다
 * (이미 tailwind-merge 기본 font-size 그룹에 등록돼 있음).
 */
export const FONT_SIZE = {
  mini: "10px",    // 최소
  chip: "11px",    // 태그·칩·필터
  body: "13px",    // 데이터 행 기본
  title: "15px",   // 모달·섹션 제목
  h2: "22px",      // 중형 헤딩 (온보딩 픽카드·질문 H1)
  heading: "26px", // 페이지 H1
  display: "30px", // 대형 디스플레이 (온보딩 완료 대제목)
} as const;

export type FontSizeToken = keyof typeof FONT_SIZE;
