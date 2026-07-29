// 맞춤법 치환 규칙. AICoverPage.tsx 안에 있던 것을 그대로 옮겼다(2026-07-29).
export const SPELL_RULES: { from: string; to: string; label?: string }[] = [
  { from: "됬", to: "됐" },
  { from: "몇일", to: "며칠" },
  { from: "어떻해", to: "어떻게" },
  { from: "금새", to: "금세" },
  { from: "왠만", to: "웬만" },
  { from: "역활", to: "역할" },
  { from: "  ", to: " ", label: "띄어쓰기 두 번 → 한 번" },
];

// 맞춤법 확인 (목업 — 자주 틀리는 표기 규칙 기반. 실서비스는 맞춤법 검사 API/사전 연동)
// findSpellIssues는 AICoverPage.tsx에서 규칙과 같은 파일로 이동(2026-07-29).
export type SpellIssue = { from: string; to: string; label: string; count: number };
export function findSpellIssues(text: string): SpellIssue[] {
  return SPELL_RULES.filter((r) => text.includes(r.from)).map((r) => ({
    from: r.from,
    to: r.to,
    label: r.label ?? `'${r.from}' → '${r.to}'`,
    count: text.split(r.from).length - 1,
  }));
}
