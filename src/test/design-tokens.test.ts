import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";
import { FONT_SIZE, UI_SCALE } from "@/lib/designTokens";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

/**
 * UI 배율 노브는 CSS(index.css --ui-scale)와 TS(designTokens UI_SCALE) 두 곳에 필요하다
 * (CSS는 렌더 첫 프레임부터 필요하고, TS는 localStorage px 마이그레이션에 필요).
 * 두 값이 갈라지면 여백만 커지고 저장 폭은 그대로 남는 식으로 조용히 어긋나므로 여기서 묶어 둔다.
 */
describe("--ui-scale 단일 값 유지", () => {
  it("index.css의 --ui-scale과 designTokens의 UI_SCALE이 같다", () => {
    const css = readFileSync(resolve(__dirname, "../index.css"), "utf8");
    const m = css.match(/--ui-scale:\s*([0-9.]+)\s*;/);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBe(UI_SCALE);
  });

  it("폰트 토큰은 정수 px이고 최소 11px 이상이다(반픽셀 금지)", () => {
    for (const [name, v] of Object.entries(FONT_SIZE)) {
      expect(v, name).toMatch(/^[0-9]+px$/);
      expect(parseInt(v, 10), name).toBeGreaterThanOrEqual(11);
    }
  });
});

/**
 * rounded-ds-*(tailwind.config.ts borderRadius)는 font-size 토큰과 달리 cn()의
 * extendTailwindMerge classGroups에 등록돼 있지 않다(2026-08 헬스체크에서 발견,
 * 폰트 토큰 사고와 같은 유형의 구조적 gap). 등록이 안 됐다는 뜻은 tailwind-merge가
 * rounded-lg와 rounded-ds-md를 "같은 그룹"으로 보지 않는다는 것 — 그래서 지금은
 * 조용히 삭제되는 대신 **둘 다 살아남는다**(충돌 인식 자체가 안 됨). 폰트 토큰
 * 사고처럼 위험하진 않지만, 나중에 실수로 등록하면서 규칙을 잘못 적으면 이번엔
 * 반대로 조용히 삭제되는 쪽으로 바뀔 수 있다 — 그 변화를 여기서 고정해 감지한다.
 */
describe("rounded-ds-* borderRadius classGroup 미등록 상태 고정(회귀 감시)", () => {
  const config = readFileSync(resolve(__dirname, "../../tailwind.config.ts"), "utf8");
  const dsRadiusKeys = [...config.matchAll(/"(ds-[a-z]+)":\s*"var\(--radius-[a-z]+\)"/g)].map((m) => m[1]);

  it("tailwind.config.ts에서 ds-* 라운드 토큰을 찾는다(테스트 자체가 낡지 않았는지 확인)", () => {
    expect(dsRadiusKeys.length).toBeGreaterThan(0);
  });

  for (const key of dsRadiusKeys) {
    it(`rounded-${key}가 기본 rounded-lg와 같은 cn() 호출에서 삭제되지 않는다`, () => {
      const merged = cn(`rounded-lg rounded-${key}`);
      expect(merged).toContain("rounded-lg");
      expect(merged).toContain(`rounded-${key}`);
    });
  }
});
