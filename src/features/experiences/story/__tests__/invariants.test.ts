// ────────────────────────────────────────────────────────────────
// 탭2 — 절대 깨지면 안 되는 불변식 (기획서 6부 "절대 타협하지 않는 것")
//
// 이 테스트가 존재하는 이유:
//  규칙을 문서에만 적어두면 6개월 뒤 리팩터링에서 조용히 깨진다.
//  태거를 LLM으로 바꾸든 스토어를 서버로 바꾸든, 아래 4가지는 계속 참이어야 한다.
// ────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach } from "vitest";
import { tab2Api } from "../api";
import { buildCoverage, liveTags, NCS, type Story } from "../model";
import { __resetStore, getStories, upsertStories, softDeleteStories, patchStory } from "../store";
import { COLD_CHIPS, GAP_CHIPS } from "../entryOptions";
import { NARRATIVE_TYPES } from "../../model/presets";
import { AIDS_ROLE, AIDS_TROUBLE, BLANK } from "../writingAids";

const SAMPLE =
  "동아리 총무를 맡아 회비를 관리했어요. 정산이 매번 밀려서, 엑셀 양식을 만들어 매주 정리하게 바꿨어요. 덕분에 마감이 3주에서 5일로 줄었어요.";

const makeStory = (over: Partial<Story> = {}): Story => ({
  id: over.id ?? Math.random().toString(36).slice(2),
  activityId: "a1",
  headline: "h",
  body: SAMPLE,
  rawExcerpt: SAMPLE,
  status: "user_confirmed",
  origin: "ai",
  competencies: [],
  createdAt: 0,
  updatedAt: 0,
  ...over,
});

describe("① 근거 없는 역량 태그 금지", () => {
  it("모든 evidenceText는 원문의 부분 문자열이다", () => {
    const tags = tab2Api.tagCompetencies(SAMPLE);
    expect(tags.length).toBeGreaterThan(0);
    tags.forEach((t) => expect(SAMPLE.includes(t.evidenceText)).toBe(true));
  });

  it("근거를 댈 수 없는 텍스트에는 태그가 붙지 않는다", () => {
    expect(tab2Api.tagCompetencies("열심히 했습니다.")).toHaveLength(0);
    expect(tab2Api.tagCompetencies("")).toHaveLength(0);
  });

  it("태그는 최대 3개다", () => {
    const 잡탕 =
      "회비 예산 정산을 했고 발표와 보고서 작성도 했고 설문 집계도 했고 엑셀도 썼고 팀원과 협업했고 규정도 지켰어요. 그래서 바꿨어요.";
    expect(tab2Api.tagCompetencies(잡탕).length).toBeLessThanOrEqual(3);
  });

  it("competency는 NCS 10축 안에 있다 (축을 발명하지 않는다)", () => {
    tab2Api.tagCompetencies(SAMPLE).forEach((t) => expect(NCS).toContain(t.competency));
  });

  it("남용 역량(문제해결)은 게이트를 통과해야만 붙는다", () => {
    // 문제 서술만 있고 해소 행동이 없으면 붙지 않는다
    const 문제만 = "정산이 매번 밀렸어요. 힘들었어요.";
    const has = tab2Api.tagCompetencies(문제만).some((t) => t.competency === "문제해결");
    expect(has).toBe(false);
  });
});

describe("② 승격 최소 조건", () => {
  it("행동+결과가 있어야 소재가 된다", () => {
    expect(tab2Api.checkSufficient(SAMPLE)).toBe(true);
    expect(tab2Api.checkSufficient("열심히 노력했습니다.")).toBe(false);
    expect(tab2Api.checkSufficient("총무였어요.")).toBe(false);
  });
});

describe("③ STAR는 발췌지 생성이 아니다", () => {
  it("모든 구간은 본문의 부분 문자열이다", () => {
    const hint = tab2Api.extractStarHint(SAMPLE);
    Object.values(hint).forEach((v) => {
      if (v) expect(SAMPLE.includes(v)).toBe(true);
    });
  });
});

describe("④ 커버리지 집계 규칙", () => {
  it("ai_draft 소재는 커버리지에 들어가지 않는다", () => {
    const draft = makeStory({
      status: "ai_draft",
      competencies: [
        { competency: "자원관리", evidenceText: SAMPLE, confidence: "high", userVerdict: "unset", taggedBy: "ai" },
      ],
    });
    const rows = buildCoverage([draft], { 자원관리: 2 }, 3);
    expect(rows.find((r) => r.competency === "자원관리")!.storyCount).toBe(0);
  });

  it("거부된 태그는 세지 않는다", () => {
    const s = makeStory({
      competencies: [
        { competency: "자원관리", evidenceText: SAMPLE, confidence: "high", userVerdict: "rejected", taggedBy: "ai" },
      ],
    });
    expect(liveTags(s)).toHaveLength(0);
    const rows = buildCoverage([s], { 자원관리: 2 }, 3);
    expect(rows.find((r) => r.competency === "자원관리")!.storyCount).toBe(0);
  });

  it("요구가 있는데 소재가 0이면 갭이다 — 요구가 없으면 갭이 아니다", () => {
    const rows = buildCoverage([], { 자원관리: 2 }, 3);
    expect(rows.find((r) => r.competency === "자원관리")!.isGap).toBe(true);
    expect(rows.find((r) => r.competency === "기술")!.isGap).toBe(false);
  });

  it("요구도 내림차순으로 정렬된다 (갭이 위로 온다)", () => {
    const rows = buildCoverage([], { 문제해결: 3, 자원관리: 1 }, 3);
    expect(rows[0].competency).toBe("문제해결");
  });
});

describe("⑤ 스토어 — 소프트 삭제", () => {
  beforeEach(() => __resetStore([]));

  it("삭제는 레코드를 지우지 않고 감춘다 (14일 복원 가능)", () => {
    upsertStories([makeStory({ id: "s1" })]);
    expect(getStories()).toHaveLength(1);
    softDeleteStories(["s1"]);
    expect(getStories()).toHaveLength(0);
  });

  it("patchStory는 updatedAt을 갱신한다", () => {
    upsertStories([makeStory({ id: "s2", updatedAt: 0 })]);
    patchStory("s2", { headline: "바뀐 제목" });
    const s = getStories().find((x) => x.id === "s2")!;
    expect(s.headline).toBe("바뀐 제목");
    expect(s.updatedAt).toBeGreaterThan(0);
  });
});

describe("⑥ 인터뷰 칩 ↔ 유형 프리셋 연결", () => {
  it("서술형 프리셋 8종 모두에 도달할 수 있다", () => {
    const covered = new Set(COLD_CHIPS.map((c) => c.category));
    NARRATIVE_TYPES.forEach((t) => expect(covered.has(t as never)).toBe(true));
    expect(covered.size).toBe(NARRATIVE_TYPES.length);
  });

  it("칩의 category는 전부 실제 프리셋 유형이다 (문자열 추측 금지)", () => {
    const all = [...COLD_CHIPS, ...Object.values(GAP_CHIPS).flat().filter(Boolean)];
    all.forEach((c) => expect(NARRATIVE_TYPES).toContain(c!.category));
  });

  it("갭 칩은 라벨이 중복되지 않는다 (선택 토글이 라벨 기준)", () => {
    Object.values(GAP_CHIPS).forEach((list) => {
      if (!list) return;
      const labels = list.map((c) => c.label);
      expect(new Set(labels).size).toBe(labels.length);
    });
  });
});

describe("⑦ 입력 보조는 문장을 대신 써주지 않는다", () => {
  const ALL_AIDS = [AIDS_ROLE, AIDS_TROUBLE];

  it("말머리·낱말은 종결어미로 끝나지 않는다 (그대로 제출 못 하게)", () => {
    // "…했어요" 같은 완성 문장을 넣어주면 사용자가 그대로 보내 버린다.
    // 그러면 실제로 안 한 일이 소재가 된다 (원칙 ③ · 과장 방지)
    const 종결 = /(어요|습니다|았다|었다|해요|이다)$/;
    ALL_AIDS.forEach((a) => {
      [...a.starters, ...a.words].forEach((t) => expect(t).not.toMatch(종결));
    });
  });

  it("보조어는 짧다 — 문장이 아니라 조각이다", () => {
    // 10자는 "제일 힘들었던 건"(9자) 같은 자연스러운 말머리를 허용하면서
    // 완성 문장은 걸러내는 선. 종결어미 검사와 함께 봐야 의미가 있다.
    ALL_AIDS.forEach((a) => {
      [...a.starters, ...a.words].forEach((t) => expect(t.length).toBeLessThanOrEqual(10));
    });
  });

  it("숫자 틀은 빈칸 자리표시자를 쓴다", () => {
    expect(AIDS_TROUBLE.units?.length).toBeGreaterThan(0);
    expect(BLANK).toBe("__");
  });

  it("보조어에 중복이 없다", () => {
    ALL_AIDS.forEach((a) => {
      const all = [...a.starters, ...a.words];
      expect(new Set(all).size).toBe(all.length);
    });
  });
});
