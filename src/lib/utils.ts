import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { FONT_SIZE } from "./designTokens";

// 커스텀 폰트 크기 토큰을 tailwind-merge에 등록 — 단일 출처(designTokens.ts)에서 파생.
// 이걸 안 하면 tailwind-merge가 text-mini 등을 font-size로 인식하지 못해,
// 같은 cn()에 색 클래스(text-gray-400 등)가 함께 오면 크기 토큰을 충돌로 보고 삭제한다
// (→ 배지·D-day 크기가 화면에 반영 안 되던 근본 원인, 2026-07-05).
// FONT_SIZE에 토큰을 추가하면 여기·tailwind.config 양쪽에 자동 반영된다.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: Object.keys(FONT_SIZE) }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
