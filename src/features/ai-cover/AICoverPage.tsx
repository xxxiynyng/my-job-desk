import { useState } from "react";
import { JOBS } from "./model/aiCoverMock";
import { essayCache } from "./model/essayCache";
import { JobSelect } from "./components/JobSelectView";
import { EssayEditor } from "./components/EssayEditor";

/**
 * 탭3 — AI 자기소개서 (프론트 목업 통합판 v2, 2026-07-27)
 * ─────────────────────────────────────────────────────────────
 * 구조: ① 공고 선택 메인 화면 → ② 문항 에디터 (스텝 플로우의 '공고 선택'이 실제 첫 화면)
 * · 목업 데이터 기반 — 공고 3건·문항·인재상·현직자 voice는 예시 값(기관 DB·탭1/탭2 연동은 후속).
 *   문항·인재상 placeholder는 기획 확정 전 예시. AI 제안·맞춤법은 규칙 기반 목업.
 * · 작성 상태는 공고별로 세션 캐시(essayCache)에 유지 — 실서비스: localStorage `pickd.essay.<slug>.vN`.
 * · 원칙: 비파괴 반영 · 진행 바 없음(N/M 텍스트) · solid CTA 화면당 1개('이 문장 반영'만)
 *   · 색은 의미 신호에만 · Q번호 중립 텍스트 · 부담 카피 금지.
 * · 상세 결정 기록: 디자인 작업공간 docs/tasks/탭3-AI자소서_목업_가이드.md
 *
 * 파일 구성 (2026-07-29 분할 — 동작·렌더 동일, 찾기 쉬운 구조로만 재배치):
 *   AICoverPage.tsx              — 라우트 루트: 공고 선택 ↔ 에디터 전환 + openJob
 *   model/aiCoverMock.ts         — 공고·경험·SWOT 목업 데이터와 타입
 *   model/spellRules.ts          — 맞춤법 규칙 + findSpellIssues
 *   model/essayCache.ts          — 세션 캐시(essayCache) + 작성 진행 계산(getProgress)
 *   components/JobSelectView.tsx — ① 공고 선택 메인 (JobCard 포함)
 *   components/EssayEditor.tsx   — ② 문항 에디터 (분할 뷰·AI 챗·맞춤법 포함)
 *   components/PanelParts.tsx    — 도구 창 소품 (PanelSection·ZoomView·TruncText)
 *   components/ExpCard.tsx       — 경험 카드 + 경험 없음 안내
 *   components/QuestionPager.tsx — 문항 숫자 페이저
 *   components/PipelineView.tsx  — 초안 생성 노드 점등
 *   components/SuggestionBlock.tsx — 인라인 AI 초안 제안
 */

/* ───────── 라우트 루트: 공고 선택 ↔ 에디터 ───────── */

export default function AICover() {
  const [jobId, setJobId] = useState<string | null>(null);
  const job = JOBS.find((j) => j.id === jobId);

  // 메인 카드의 문항 행에서 특정 문항으로 바로 진입 — 캐시의 qIdx만 미리 지정
  function openJob(id: string, qIdx?: number) {
    if (qIdx != null) {
      const target = JOBS.find((j) => j.id === id);
      if (target) {
        const c = essayCache[id];
        essayCache[id] = c
          ? { ...c, qIdx }
          : {
              qIdx,
              texts: target.questions.map((q) => q.initial),
              variants: target.questions.map(() => 0),
              suggestionOpen: target.questions.map(() => false),
              selected: ["popup", "intern"],
              finished: false,
            };
      }
    }
    setJobId(id);
  }

  return job ? (
    <EssayEditor key={job.id} job={job} onBack={() => setJobId(null)} />
  ) : (
    <JobSelect onSelect={openJob} />
  );
}
