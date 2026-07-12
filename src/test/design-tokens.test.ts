import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";
import { FONT_SIZE } from "@/lib/designTokens";

/**
 * 회귀 방지: 커스텀 폰트 토큰이 tailwind-merge에 등록돼 있어야
 * cn()이 같은 호출의 색 클래스와 충돌로 보고 크기 토큰을 삭제하지 않는다
 * (2026-07-05 사고). FONT_SIZE 원천을 순회하므로 토큰이 바뀌어도 낡지 않는다.
 */
describe("cn() 폰트 토큰 보존 (single source of truth)", () => {
  for (const token of Object.keys(FONT_SIZE)) {
    it(`text-${token}가 색 클래스와 병합돼도 살아남는다`, () => {
      expect(cn(`text-${token} text-gray-400`)).toContain(`text-${token}`);
    });
  }

  it("크기 토큰끼리는 마지막 것만 남는다(정상 병합)", () => {
    expect(cn("text-body text-heading")).toBe("text-heading");
  });
});
