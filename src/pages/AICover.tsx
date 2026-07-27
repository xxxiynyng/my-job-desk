import { useEffect, useRef, useState } from "react";
import type { ReactNode, CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Check, ChevronDown, ChevronRight, RefreshCw, SpellCheck as SpellCheckIcon, Sparkles, X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PickdSidebar } from "@/components/pickd/PickdSidebar";
import { Button } from "@/components/ui/button";
import { DdayChip } from "@/components/pickd/ds/DdayChip";
import { TONES, type Tone } from "@/components/pickd/ds/StatusBadge";

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
 */

/* ───────── 타입 · 목업 예시 데이터 ───────── */

type Question = {
  no: number; limit: number; text: string; intent: string; keywords: string[];
  initial: string; closings: [string, string];
};
type Talent = { line: string; tags: string[]; voice: string; voiceFrom: string; source: string };
type Job = { id: string; org: string; role: string; dday: number; questions: Question[]; talent: Talent };

// ⚠️ 공고·문항·인재상·voice·수치 전부 목업 예시 (멘토링 §8에서 언급된 부산 공공기관들로 구성)
const JOBS: Job[] = [
  {
    id: "busan-ccei",
    org: "부산창조경제혁신센터",
    role: "창업지원 코디네이터(청년인턴)",
    dday: 6,
    talent: {
      line: "지역과 함께 성장하는 실행가",
      tags: ["지역애착", "실행우선", "개방·협업"],
      voice: "완벽한 스펙보다, 지역에서 실제로 움직여 본 사람이 서류에서 눈에 띄어요.",
      voiceFrom: "현직자 인터뷰 중",
      source: "현직자 인터뷰 3명 · 합격 자소서 5건 분석 기반",
    },
    questions: [
      {
        no: 1, limit: 800,
        text: "우리 기관에 지원한 동기와 입사 후 이루고 싶은 목표를, 본인의 경험과 연결하여 서술하시오.",
        intent:
          "기관과 지역에 대한 이해, 그리고 경험에 근거한 동기와 목표가 한 흐름으로 이어지는지를 봐요. 문항 속 핵심 단어(동기·목표·경험)를 본문에서 그대로 짚어 주면 읽는 사람이 흐름을 따라가기 쉬워요.",
        keywords: ["지원동기", "입사 후 목표", "경험 연결", "지역 이해"],
        initial:
          "저는 부산에서 나고 자라며 동네의 작은 가게와 브랜드가 생기고 사라지는 과정을 가까이에서 지켜봤습니다. 로컬 브랜드 팝업을 기획하면서는, 좋은 아이디어가 자리를 잡으려면 곁에서 함께 뛰는 사람이 필요하다는 것을 배웠습니다.",
        closings: [
          "이런 경험을 바탕으로, 창업가의 시도가 실행으로 이어지도록 곁에서 지원하며 지역과 함께 성장하는 코디네이터가 되고 싶습니다.",
          "입사 후에는 이 경험을 바탕으로, 부산의 창업가가 첫 고객을 만나기까지의 과정을 가장 가까이에서 지원하고 싶습니다.",
        ],
      },
      {
        no: 2, limit: 600,
        text: "창업지원 코디네이터 직무에 필요한 본인의 강점과, 그 강점을 발휘했던 경험을 서술하시오.",
        intent: "직무와 맞닿은 강점을 실제 경험으로 증명하는지를 봐요.",
        keywords: ["직무 강점", "근거 경험", "실행력"],
        initial: "",
        closings: [
          "이 강점이 창업지원 현장에서 창업가에게 실질적인 도움이 되도록 계속 다듬어 가겠습니다.",
          "이 강점을 바탕으로, 창업지원 현장에서 바로 움직이는 코디네이터가 되겠습니다.",
        ],
      },
      {
        no: 3, limit: 500,
        text: "여럿이 함께 일하는 과정에서 어려움을 겪고, 이를 조율했던 경험을 서술하시오.",
        intent: "협업에서의 태도와 조율 과정을 구체적으로 봐요.",
        keywords: ["협업", "조율", "태도"],
        initial: "",
        closings: [
          "이 경험처럼, 서로 다른 입장을 잇는 조율자의 역할을 창업지원 현장에서도 이어가고 싶습니다.",
          "이때 배운 조율의 감각을, 창업가와 기관 사이를 잇는 일에서도 발휘하고 싶습니다.",
        ],
      },
    ],
  },
  {
    id: "btp",
    org: "부산테크노파크",
    role: "지역산업 육성 지원(청년인턴)",
    dday: 12,
    talent: {
      line: "현장에서 답을 찾는 협력가",
      tags: ["현장중심", "협력", "문제해결"],
      voice: "보고서 문장보다, 현장에서 부딪혀 본 이야기를 담아 온 지원자가 기억에 남아요.",
      voiceFrom: "현직자 인터뷰 중",
      source: "현직자 인터뷰 2명 · 합격 자소서 3건 분석 기반",
    },
    questions: [
      {
        no: 1, limit: 600,
        text: "우리 원에 지원한 동기와 관심 있는 지역산업 분야를 서술하시오.",
        intent: "지역산업에 대한 관심이 실제 경험·관찰에서 나온 것인지를 봐요.",
        keywords: ["지원동기", "지역산업", "관심 분야"],
        initial: "",
        closings: [
          "이 관심을 바탕으로, 지역 기업의 성장을 현장에서 지원하는 일을 하고 싶습니다.",
          "관심에서 멈추지 않고, 현장에서 지역 기업과 함께 답을 찾는 사람이 되겠습니다.",
        ],
      },
      {
        no: 2, limit: 500,
        text: "여러 이해관계자와 협력해 일을 진행했던 경험을 서술하시오.",
        intent: "서로 다른 입장 사이에서 협력을 만들어 낸 과정을 봐요.",
        keywords: ["협력", "이해관계자", "조율"],
        initial: "",
        closings: [
          "이 경험처럼, 기관과 기업 사이를 잇는 협력의 접점 역할을 하고 싶습니다.",
          "이때 배운 협력의 감각을 지역산업 현장에서 이어가고 싶습니다.",
        ],
      },
    ],
  },
  {
    id: "bdc",
    org: "부산디자인진흥원",
    role: "디자인산업 지원 코디네이터(청년인턴)",
    dday: 3,
    talent: {
      line: "디자인으로 지역의 일상을 바꾸는 사람",
      tags: ["지역감각", "창의", "실행"],
      voice: "화려한 포트폴리오보다, 지역을 관찰해 온 시선이 담긴 글이 눈에 들어와요.",
      voiceFrom: "현직자 인터뷰 중",
      source: "현직자 인터뷰 2명 · 합격 자소서 2건 분석 기반",
    },
    questions: [
      {
        no: 1, limit: 600,
        text: "우리 원에 지원한 동기와, 디자인이 지역에 기여할 수 있다고 생각하는 지점을 서술하시오.",
        intent: "디자인과 지역을 연결해 본 자기만의 관점이 있는지를 봐요.",
        keywords: ["지원동기", "지역", "디자인 관점"],
        initial: "",
        closings: [
          "이 관점을 바탕으로, 지역 소상공인과 디자인을 잇는 지원 업무를 하고 싶습니다.",
          "디자인이 지역의 일상을 바꾸는 과정을 가장 가까이에서 돕고 싶습니다.",
        ],
      },
      {
        no: 2, limit: 500,
        text: "직접 기획하거나 만들어 본 경험 중 가장 기억에 남는 것을 서술하시오.",
        intent: "기획부터 실행까지의 과정을 스스로 끌고 간 경험인지를 봐요.",
        keywords: ["기획", "실행", "경험"],
        initial: "",
        closings: [
          "이 경험처럼, 기획을 실행으로 옮기는 힘을 지원 현장에서 발휘하고 싶습니다.",
          "만들어 본 사람의 감각으로, 만드는 사람들을 돕고 싶습니다.",
        ],
      },
    ],
  },
];

const SWOT_META: Record<string, { label: string; tone: Tone }> = {
  SO: { label: "핵심 강점", tone: "success" },
  WO: { label: "성장 기회", tone: "brand" },
  ST: { label: "차별화", tone: "warning" },
  WT: { label: "보완", tone: "neutral" },
};

type Exp = {
  id: string; name: string; type: string;
  swot: keyof typeof SWOT_META; score: number; reason: string; line: string; lineAlt: string;
};

// 탭2 경험 목업 (실서비스: pickd.experiences.items 연동 + 공고별 SWOT 재산출)
const EXPERIENCES: Exp[] = [
  {
    id: "popup", name: "부산 로컬 브랜드 팝업 기획", type: "대외활동", swot: "SO", score: 92,
    reason: "'지역과 함께 성장하는 실행가'를 가장 잘 보여주는 경험이에요.",
    line: "부산 로컬 브랜드 팝업을 기획하며, 아이디어를 실행으로 옮길 때 비로소 지역에 작은 변화가 생긴다는 것을 경험했습니다.",
    lineAlt: "로컬 브랜드 팝업을 기획하며 머릿속 계획을 현장에서 검증해 보는 과정의 어려움과 즐거움을 배웠습니다.",
  },
  {
    id: "intern", name: "교환학생 중 로컬 스타트업 인턴", type: "해외경험", swot: "ST", score: 84,
    reason: "'개방·협업' 가치를 낯선 환경에서 증명한 경험이에요.",
    line: "교환학생 시절 로컬 스타트업에서 인턴으로 일하며 낯선 환경에서도 열린 자세로 협업하는 방식을 익혔습니다.",
    lineAlt: "교환학생 시절 로컬 스타트업 인턴으로 합류해, 서로 다른 배경의 동료들과 빠르게 맞춰 일하는 경험을 쌓았습니다.",
  },
  {
    id: "cafe", name: "카페 매니저 아르바이트", type: "알바", swot: "WO", score: 71,
    reason: "'실행 우선' 태도로 넓혀 쓸 수 있는 경험이에요.",
    line: "카페 매니저로 일하며 매일의 현장을 안정적으로 지키는 책임감을 익혔습니다.",
    lineAlt: "카페 매니저로 현장을 운영하며, 작은 문제를 그날그날 해결해 나가는 습관을 들였습니다.",
  },
];

// 맞춤법 확인 (목업 — 자주 틀리는 표기 규칙 기반. 실서비스는 맞춤법 검사 API/사전 연동)
const SPELL_RULES: { from: string; to: string; label?: string }[] = [
  { from: "됬", to: "됐" },
  { from: "몇일", to: "며칠" },
  { from: "어떻해", to: "어떻게" },
  { from: "금새", to: "금세" },
  { from: "왠만", to: "웬만" },
  { from: "역활", to: "역할" },
  { from: "  ", to: " ", label: "띄어쓰기 두 번 → 한 번" },
];
type SpellIssue = { from: string; to: string; label: string; count: number };
function findSpellIssues(text: string): SpellIssue[] {
  return SPELL_RULES.filter((r) => text.includes(r.from)).map((r) => ({
    from: r.from,
    to: r.to,
    label: r.label ?? `'${r.from}' → '${r.to}'`,
    count: text.split(r.from).length - 1,
  }));
}

const PIPELINE_NODES = ["문항 분석", "경험 매칭", "초안 생성", "검토"];
const STEPS = ["공고 선택", "문항", "경험 매칭", "초안", "완성"];

// 공고별 작성 상태 세션 캐시 — 화면 전환에도 유지 (실서비스: localStorage `pickd.essay.<slug>.vN`)
type EssayCache = {
  qIdx: number; texts: string[]; variants: number[]; suggestionOpen: boolean[];
  selected: string[]; finished: boolean;
};
const essayCache: Record<string, EssayCache> = {};

/* ───────── 소품 컴포넌트 ───────── */

// 태그·키워드 칩 — 무채색·외곽선 저강조 (SSOT 5-2)
function KeywordChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 text-chip font-medium bg-gray-50 text-gray-500 border border-gray-100 rounded-md">
      {children}
    </span>
  );
}

// 자소서 상태 dot+라벨 — JobDetail ESSAY_STATE와 동일 팔레트 (공용 승격 후보)
const ESSAY_STATE: Record<string, { chip: string; dot: string }> = {
  완료: { chip: "bg-pickd-green-light text-pickd-green", dot: "bg-pickd-green" },
  작성중: { chip: "bg-blue-50 text-blue-700", dot: "bg-primary" },
  초안: { chip: "bg-pickd-orange-light text-pickd-orange", dot: "bg-pickd-orange" },
  미작성: { chip: "text-muted-foreground", dot: "bg-muted-foreground/40" },
};
function EssayStatus({ status }: { status: string }) {
  const s = ESSAY_STATE[status] ?? ESSAY_STATE["미작성"];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-mini font-semibold px-2 py-0.5 rounded-full whitespace-nowrap", s.chip)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />
      {status}
    </span>
  );
}

// primary 스트로크 버튼 클래스 (JobDetail 색 가이드 §3 — solid 남발 방지)
const PRIMARY_STROKE = "border-primary/40 text-primary hover:bg-primary/5 hover:text-primary";

// 스텝 플로우 — 유동 정보라 가벼운 텍스트 표기만 (§0-8), 진행 바 아님
function StepFlow({ currentIdx }: { currentIdx: number }) {
  return (
    <ol className="flex items-center gap-1.5" aria-label="작성 단계">
      {STEPS.map((s, i) => {
        const done = i < currentIdx;
        const cur = i === currentIdx;
        return (
          <li key={s} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/40" />}
            <span
              className={cn(
                "flex items-center gap-1 text-xs whitespace-nowrap",
                cur ? "font-semibold text-primary" : done ? "text-muted-foreground" : "text-muted-foreground/50",
              )}
            >
              {done && <Check className="w-3 h-3 text-pickd-green" />}
              {s}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// 문항 숫자 페이저 — 문항 수만큼 1..N 버튼, 언제든 이동. 내용 있는 문항은 번호 위 dot
function QuestionPager({
  count, currentIdx, hasContent, onSelect,
}: {
  count: number; currentIdx: number; hasContent: boolean[]; onSelect: (i: number) => void;
}) {
  return (
    <nav className="flex items-center gap-1" aria-label="문항 이동">
      {Array.from({ length: count }, (_, i) => {
        const cur = i === currentIdx;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`문항 ${i + 1}로 이동`}
            aria-current={cur ? "page" : undefined}
            className={cn(
              "relative w-8 h-8 rounded-md text-body tabular-nums transition-colors",
              cur ? "bg-accent text-accent-foreground font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {i + 1}
            {hasContent[i] && !cur && <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-primary/50" aria-hidden />}
          </button>
        );
      })}
    </nav>
  );
}

// 우측 패널 섹션 — JobDetail Section 번호 헤더 축소판. 헤더 전체가 접기 토글
function PanelSection({
  n, title, sub, tinted, defaultOpen = true, children,
}: {
  n: number; title: string; sub?: ReactNode; tinted?: boolean; defaultOpen?: boolean; children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={tinted ? "bg-muted/30" : undefined}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full px-5 py-3.5 flex items-center gap-2.5 text-left group"
      >
        <span className="w-5 h-5 rounded-md bg-muted text-muted-foreground text-mini font-bold flex items-center justify-center tabular-nums shrink-0">
          {n}
        </span>
        <span className="text-body font-semibold text-foreground tracking-tight">{title}</span>
        <span className="ml-auto flex items-center gap-2 min-w-0">
          {sub}
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 shrink-0 text-muted-foreground/60 group-hover:text-muted-foreground transition-transform",
              !open && "-rotate-90",
            )}
          />
        </span>
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </section>
  );
}

// 길어질 수 있는 텍스트 — 2줄 넘으면 접고 '더 보기'로 펼침
function TruncText({ text, className = "" }: { text: string; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 70;
  return (
    <>
      <p className={cn(className, long && !expanded && "line-clamp-2")}>{text}</p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors"
        >
          {expanded ? "접기" : "더 보기"}
        </button>
      )}
    </>
  );
}

// 경험 카드 — 카드 전체가 토글. 정보 3줄: 이름+체크 / 역할 라벨+적합도 / 왜 좋은지 한 줄
function ExpCard({ exp, checked, onToggle }: { exp: Exp; checked: boolean; onToggle: () => void }) {
  const meta = SWOT_META[exp.swot];
  const tone = TONES[meta.tone];
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={cn(
        "w-full text-left rounded-xl border px-3.5 py-3 transition-all",
        checked ? "border-blue-100 bg-blue-50/40" : "border-border bg-white hover:bg-muted/30",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground truncate">{exp.name}</span>
        <span
          className={cn(
            "w-[18px] h-[18px] rounded-full shrink-0 flex items-center justify-center transition-colors",
            checked ? "text-white" : "border-2 border-border",
          )}
          style={checked ? { background: "var(--brand)" } : undefined}
          aria-hidden
        >
          {checked && <Check className="w-3 h-3" />}
        </span>
      </span>
      <span className="mt-1 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-mini font-semibold" style={{ color: tone.fg } as CSSProperties}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: tone.dot }} />
          {meta.label}
        </span>
        <span className="text-mini text-muted-foreground tabular-nums shrink-0">적합도 {exp.score}</span>
      </span>
      <span className="mt-1.5 block text-xs text-muted-foreground leading-snug">{exp.reason}</span>
    </button>
  );
}

// 경험 전부 해제 시 — 격려형 카피 (부담 지표 금지, §0-9)
function AddExperienceNotice() {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2.5 mb-2">
      <p className="text-xs text-muted-foreground leading-relaxed">
        아직 고른 경험이 없어요. 탭2에 정리해 두면 여기서 바로 이어 쓸 수 있어요.
      </p>
      <Link to="/experiences" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
        경험·스펙 DB로 이동
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

// LangGraph 노드 순차 점등 — 생성 중에만 노출
function PipelineView({ activeIdx }: { activeIdx: number }) {
  return (
    <ol className="mt-2.5 flex flex-col gap-1.5" aria-label="초안 생성 단계">
      {PIPELINE_NODES.map((n, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <li key={n} className="flex items-center gap-2">
            <span
              className={cn("w-1.5 h-1.5 rounded-full shrink-0", active && "animate-pulse")}
              style={{ background: done ? "var(--green-500)" : active ? "var(--brand)" : "var(--slate-300)" }}
            />
            <span className={cn("text-xs", active ? "font-semibold text-primary" : done ? "text-muted-foreground" : "text-muted-foreground/50")}>
              {n}
            </span>
            {done && <Check className="w-3 h-3 text-pickd-green" />}
          </li>
        );
      })}
    </ol>
  );
}

// 인라인 AI 초안 제안 — 비파괴(닫기·반영은 사용자 선택). solid CTA는 여기 '이 문장 반영' 하나뿐
function SuggestionBlock({
  text, onApply, onRegenerate, onClose, regenerating,
}: {
  text: string; onApply: () => void; onRegenerate: () => void; onClose: () => void; regenerating: boolean;
}) {
  return (
    <div className="relative mt-5 rounded-xl bg-blue-50/40 border border-blue-100/70 px-5 py-4" role="region" aria-label="AI 초안 제안">
      <button
        type="button"
        onClick={onClose}
        aria-label="제안 닫기"
        className="absolute right-3 top-3 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/80 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="flex items-center gap-2 flex-wrap">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-body font-semibold text-primary">AI 초안 제안</span>
        <span className="inline-flex items-center px-2 py-0.5 text-mini font-semibold rounded-full bg-white border border-blue-200 text-primary">
          인재상 반영
        </span>
      </div>
      <p className={cn("mt-2.5 text-sm text-foreground leading-[1.8] select-text transition-opacity", regenerating ? "opacity-40" : "opacity-100")}>
        {text}
      </p>
      <p className="mt-3 text-xs text-muted-foreground">내가 쓴 문장은 그대로 둡니다. 반영을 누르면 이어서 붙어요.</p>
      <div className="mt-3 flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5" onClick={onRegenerate} disabled={regenerating}>
          <RefreshCw className="w-3.5 h-3.5" />
          다르게
        </Button>
        <Button size="sm" className="h-8 px-3 text-xs" onClick={onApply} disabled={regenerating}>
          이 문장 반영
        </Button>
      </div>
    </div>
  );
}

/* ───────── ① 자소서 메인 화면 — "쓰던 글을 이어 쓰는 작업대" ─────────
   자소서 작성자의 실제 여정: ⑴ 쓰다 만 글에 복귀(가장 잦음) ⑵ 새 공고 시작.
   그래서 공고 카탈로그가 아니라 '내 글' 중심 — JobDetail 자소서 섹션과 같은 언어
   (상태 dot·내가 쓴 문장 미리보기·'이어서 작성하기'/'작성하기' CTA 위계). 마감 임박 순 정렬. */

type JobProgress = {
  written: number; total: number; finished: boolean;
  preview: string; curNo: number; curLen: number; curLimit: number;
};
function getProgress(job: Job): JobProgress {
  const cached = essayCache[job.id];
  const texts = cached?.texts ?? job.questions.map((q) => q.initial);
  const written = texts.filter((t) => t.trim().length > 0).length;
  const firstIdx = texts.findIndex((t) => t.trim().length > 0);
  const curIdx = cached?.qIdx ?? (firstIdx >= 0 ? firstIdx : 0);
  const preview = (texts[curIdx]?.trim() || (firstIdx >= 0 ? texts[firstIdx].trim() : "")).replace(/\s+/g, " ");
  return {
    written, total: job.questions.length, finished: cached?.finished ?? false,
    preview, curNo: job.questions[curIdx].no, curLen: (texts[curIdx] ?? "").length, curLimit: job.questions[curIdx].limit,
  };
}

// 대시보드 카드형(DocumentStatusList 카드)과 동일 해부도 — 탭1 계열과 한 언어.
// D-day는 대시보드 카드와 같은 글자색 규칙(§5-4-1 예외 계열), 진행은 바 없이 N/M 텍스트만(§0-10).
const ddayLabel = (dday: number) => (dday > 0 ? `D-${dday}` : dday === 0 ? "D-Day" : `D+${Math.abs(dday)}`);
const ddayCls = (dday: number) =>
  dday <= 0
    ? "text-muted-foreground/50"
    : dday <= 3
      ? "text-pickd-red font-semibold"
      : dday <= 7
        ? "text-pickd-orange"
        : "text-foreground/60";

// 마감일 목데이터 — dday와 항상 일치하도록 오늘 기준 파생 (탭1 대시보드 mockDeadline 방식)
function deadlineOf(dday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dday);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function JobCard({ job, p, onSelect }: { job: Job; p: JobProgress; onSelect: () => void }) {
  const writing = p.written > 0 || p.finished;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${job.org} 자소서 작성`}
      className="bg-card border border-border rounded-lg px-4 py-3.5 hover:bg-muted/20 hover:border-primary/40 transition-colors flex flex-col text-left"
    >
      {/* 제목 행 */}
      <p className="text-body font-semibold text-foreground leading-tight">
        {job.org} {job.role}
      </p>

      {/* 서브라인: 자소서 · D-day (대시보드 카드의 '지원서 · D-N'과 동일 문법) */}
      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
        <span className="text-chip text-muted-foreground">자소서</span>
        <span className="text-muted-foreground/40 text-mini">·</span>
        <span className={cn("text-chip tabular-nums", ddayCls(job.dday))}>{ddayLabel(job.dday)}</span>
      </div>

      {/* 문항 작성 현황 — 진행 바 대신 N/M 텍스트 (§0-10) */}
      <div className="mt-2.5 flex items-center justify-between text-mini text-muted-foreground tabular-nums">
        <span>문항</span>
        <span>{writing ? `${p.written}/${p.total} 작성` : `${job.questions.length}개`}</span>
      </div>

      {/* 마감일 · CTA */}
      <div className="mt-2 flex items-center justify-between text-mini tabular-nums">
        <span className="text-muted-foreground">마감 {deadlineOf(job.dday)}</span>
        <span className={cn("font-medium", writing && !p.finished ? "text-primary" : "text-muted-foreground")}>
          {p.finished ? "수정" : writing ? "이어서 작성하기" : "작성하기"}
        </span>
      </div>
    </button>
  );
}

function JobSelect({ onSelect }: { onSelect: (id: string) => void }) {
  // 공고 기준 카드 그리드 — 마감 임박 순 (탭1 대시보드 카드형과 동일 구조, 2026-07-27 확정)
  const rows = JOBS.map((job) => ({ job, p: getProgress(job) })).sort((a, b) => a.job.dday - b.job.dday);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <PickdSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-10 py-8">
          <h1 className="text-heading font-bold text-foreground tracking-[-0.04em] leading-tight">AI 자소서</h1>
          <p className="text-sm text-muted-foreground mt-1.5">공고를 누르면 바로 문항 작성으로 들어가요.</p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {rows.map(({ job, p }) => (
              <JobCard key={job.id} job={job} p={p} onSelect={() => onSelect(job.id)} />
            ))}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            새 공고는{" "}
            <Link to="/" className="text-primary hover:underline">지원 대시보드</Link>
            에서 등록해요. 공고를 등록하면 여기에 자동으로 나타나요.
          </p>
        </div>
      </main>
    </div>
  );
}

/* ───────── ② 문항 에디터 화면 ───────── */

function EssayEditor({ job, onBack }: { job: Job; onBack: () => void }) {
  const cached = essayCache[job.id];
  const [qIdx, setQIdx] = useState(cached?.qIdx ?? 0);
  const [texts, setTexts] = useState<string[]>(cached?.texts ?? job.questions.map((q) => q.initial));
  const [variants, setVariants] = useState<number[]>(cached?.variants ?? job.questions.map(() => 0));
  const [suggestionOpen, setSuggestionOpen] = useState<boolean[]>(cached?.suggestionOpen ?? job.questions.map(() => false));
  const [selected, setSelected] = useState<Set<string>>(new Set(cached?.selected ?? ["popup", "intern"]));
  const [finished, setFinished] = useState(cached?.finished ?? false);
  const [genNode, setGenNode] = useState(-1); // -1 = 대기, 0~3 = 진행 중 노드
  const [spellIssues, setSpellIssues] = useState<SpellIssue[] | null>(null); // null = 닫힘
  const taRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const q = job.questions[qIdx];
  const text = texts[qIdx];
  const running = genNode >= 0;
  const selCount = selected.size;
  const over = text.length > q.limit;
  const stepIdx = finished ? 4 : suggestionOpen[qIdx] ? 3 : selCount > 0 ? 2 : 1;
  const essayStatus = finished ? "완료" : text.length > 0 ? "작성중" : "미작성";

  // 공고별 작성 상태를 세션 캐시에 유지 (선택 화면 왕복에도 보존)
  useEffect(() => {
    essayCache[job.id] = { qIdx, texts, variants, suggestionOpen, selected: [...selected], finished };
  }, [job.id, qIdx, texts, variants, suggestionOpen, selected, finished]);

  useEffect(() => {
    const el = taRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.max(240, el.scrollHeight)}px`;
    }
  }, [text, qIdx]);

  useEffect(() => () => timerRef.current.forEach(clearTimeout), []);
  useEffect(() => setSpellIssues(null), [qIdx]); // 문항 이동 시 맞춤법 패널 닫기

  function buildSuggestion(idx: number, variant: number): string {
    const lines = EXPERIENCES.filter((e) => selected.has(e.id)).map((e) => (variant === 0 ? e.line : e.lineAlt));
    return [...lines, job.questions[idx].closings[(variant % 2) as 0 | 1]].join(" ");
  }

  // 초안 생성 — 노드 순차 점등 후 '제안'만 (자동 반영 없음)
  function generate(regen = false) {
    if (running || selCount === 0) return;
    if (regen) setVariants((v) => v.map((x, i) => (i === qIdx ? (x + 1) % 2 : x)));
    setGenNode(0);
    const stepMs = regen ? 420 : 650;
    PIPELINE_NODES.forEach((_, i) => {
      timerRef.current.push(
        setTimeout(() => {
          if (i < PIPELINE_NODES.length - 1) setGenNode(i + 1);
          else {
            setGenNode(-1);
            setSuggestionOpen((s) => s.map((x, j) => (j === qIdx ? true : x)));
          }
        }, stepMs * (i + 1)),
      );
    });
  }

  // 반영 = 본문 끝에 이어붙임 (비파괴 — 기존 문장 수정·삭제 금지)
  function applySuggestion() {
    const sug = buildSuggestion(qIdx, variants[qIdx]);
    setTexts((t) => t.map((x, i) => (i === qIdx ? (x.trim().length > 0 ? `${x.trimEnd()}\n\n${sug}` : sug) : x)));
    setSuggestionOpen((s) => s.map((x, i) => (i === qIdx ? false : x)));
    toast("제안 문장을 이어 붙였어요 · 내가 쓴 글은 그대로예요");
  }

  // 맞춤법 확인 — 발견 시 목록 제시, 반영은 사용자가 항목별로 선택(자동 수정 없음)
  function runSpellCheck() {
    const issues = findSpellIssues(text);
    if (issues.length === 0) toast("맞춤법에서 걸리는 곳을 찾지 못했어요");
    else setSpellIssues(issues);
  }
  function applySpellRule(issue: SpellIssue) {
    const newText = text.split(issue.from).join(issue.to);
    setTexts((t) => t.map((x, i) => (i === qIdx ? newText : x)));
    const remain = findSpellIssues(newText);
    if (remain.length === 0) {
      setSpellIssues(null);
      toast("맞춤법을 모두 반영했어요");
    } else setSpellIssues(remain);
  }
  function applySpellAll() {
    let newText = text;
    (spellIssues ?? []).forEach((i) => { newText = newText.split(i.from).join(i.to); });
    setTexts((t) => t.map((x, i) => (i === qIdx ? newText : x)));
    setSpellIssues(null);
    toast("맞춤법을 모두 반영했어요");
  }

  function finishAll() {
    setFinished(true);
    toast("작성 완료로 표시했어요 · 탭1 공고에 반영돼요");
  }

  const suggestion = suggestionOpen[qIdx] ? buildSuggestion(qIdx, variants[qIdx]) : null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <PickdSidebar />

      <div className="flex-1 flex overflow-hidden">
        {/* ── 가운데: 작성 캔버스 (JobDetail과 동일한 bg-white 컬럼) ── */}
        <div className="flex-1 overflow-y-auto bg-white">
          {/* Sticky top bar — JobDetail 패턴. 'AI 자소서'를 누르면 공고 선택으로 */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border/60">
            <div className="mx-auto max-w-[760px] px-8 py-3 flex items-center justify-between gap-4">
              <nav className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                <Link to="/" className="hover:text-foreground transition-colors shrink-0">지원 대시보드</Link>
                <ChevronRight className="w-3 h-3 shrink-0" />
                <button type="button" onClick={onBack} className="hover:text-foreground transition-colors shrink-0">
                  AI 자소서
                </button>
                <ChevronRight className="w-3 h-3 shrink-0" />
                <span className="text-foreground font-medium truncate">{job.org}</span>
              </nav>
              <StepFlow currentIdx={stepIdx} />
            </div>
          </div>

          {/* Centered content column */}
          <div className="mx-auto max-w-[760px] px-8 pt-9 pb-24">
            {/* 얇은 문서 헤더 — 태그 무채색, 컬러는 D-day 하나만 */}
            <header className="mb-7">
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                <span className="text-sm font-semibold text-foreground">{job.org}</span>
                <span className="text-border">·</span>
                <span>{job.role}</span>
                <KeywordChip>공공기관</KeywordChip>
                <DdayChip days={job.dday} size="sm" />
              </div>
            </header>

            {/* 문항 헤더 — Q번호 중립 텍스트 + 우측 숫자 페이저(상시 이동) */}
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="text-chip font-semibold text-muted-foreground tabular-nums">Q{q.no}</span>
                <EssayStatus status={essayStatus} />
                <span className="text-chip text-muted-foreground">{q.limit.toLocaleString()}자</span>
              </div>
              <QuestionPager
                count={job.questions.length}
                currentIdx={qIdx}
                hasContent={texts.map((t) => t.trim().length > 0)}
                onSelect={setQIdx}
              />
            </div>
            <h1 className="text-title font-semibold text-foreground leading-relaxed select-text">{q.text}</h1>

            {/* 글자수(N/M 텍스트만 — 진행 바 미사용) + 자동 저장 + 맞춤법 확인 */}
            <div className="mt-3 pb-4 border-b border-border flex items-center gap-3">
              <span className={cn("text-xs tabular-nums", over ? "text-pickd-red font-medium" : "text-muted-foreground")}>
                {text.length.toLocaleString()} / {q.limit.toLocaleString()}자{over && " · 글자수를 조금 줄여 볼까요?"}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="w-3 h-3 text-pickd-green" />
                자동 저장됨
              </span>
              <button
                type="button"
                onClick={runSpellCheck}
                className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <SpellCheckIcon className="w-3.5 h-3.5" />
                맞춤법 확인
              </button>
            </div>

            {/* 맞춤법 확인 결과 — 발견 항목만 목록으로, 반영은 사용자가 선택 */}
            {spellIssues && (
              <div className="mt-3 rounded-xl border border-border bg-muted/30 px-4 py-3" role="region" aria-label="맞춤법 확인 결과">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-body font-semibold text-foreground flex items-center gap-1.5">
                    <SpellCheckIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    맞춤법 확인 — {spellIssues.reduce((a, i) => a + i.count, 0)}곳을 살펴보세요
                  </span>
                  <button
                    type="button"
                    onClick={() => setSpellIssues(null)}
                    aria-label="맞춤법 결과 닫기"
                    className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {spellIssues.map((i) => (
                    <li key={i.from} className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-foreground">
                        {i.label}
                        {i.count > 1 && <span className="ml-1 text-muted-foreground tabular-nums">×{i.count}</span>}
                      </span>
                      <button type="button" onClick={() => applySpellRule(i)} className="font-medium text-primary hover:underline shrink-0">
                        반영
                      </button>
                    </li>
                  ))}
                </ul>
                {spellIssues.length > 1 && (
                  <div className="mt-2.5 flex justify-end">
                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs" onClick={applySpellAll}>모두 반영</Button>
                  </div>
                )}
              </div>
            )}

            {/* 에디터 — 내가 쓴 글 (화면에서 가장 큰 글자, 읽기 편한 행간) */}
            <textarea
              ref={taRef}
              value={text}
              onChange={(e) => setTexts((t) => t.map((x, i) => (i === qIdx ? e.target.value : x)))}
              placeholder="여기에 나의 이야기를 자유롭게 써 보세요. 문체는 그대로, 다듬는 건 함께 해요."
              className="mt-5 w-full resize-none border-0 bg-transparent p-0 text-title text-foreground leading-[1.8] outline-none placeholder:text-muted-foreground/50"
              style={{ minHeight: 240 }}
              aria-label={`문항 ${q.no} 답변`}
            />

            {/* 인라인 AI 초안 제안 */}
            {suggestion && (
              <SuggestionBlock
                text={suggestion}
                onApply={applySuggestion}
                onRegenerate={() => generate(true)}
                onClose={() => setSuggestionOpen((s) => s.map((x, i) => (i === qIdx ? false : x)))}
                regenerating={running}
              />
            )}

            {/* 하단 액션 — 이동은 상단 숫자 페이저, 여기는 저장·완료만 (기본 화면 solid 0개) */}
            <div className="mt-8 pt-5 border-t border-border/60 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" className="h-9 px-4" onClick={() => toast("저장됐어요")}>저장</Button>
              <Button variant="outline" size="sm" className={cn("h-9 px-4 gap-1.5", PRIMARY_STROKE)} onClick={finishAll}>
                작성 완료
                <Check className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* ── 우측 380px 패널 — 플랫 섹션(divide-y) + 하단 고정 컨트롤 ── */}
        <aside className="w-[380px] border-l border-border bg-white flex flex-col shrink-0" aria-label="문항 보조 패널">
          <div className="px-5 py-3 border-b border-border flex items-baseline justify-between gap-3 shrink-0">
            <p className="text-body font-semibold text-foreground leading-tight">작성 도우미</p>
            <p className="text-chip text-muted-foreground truncate">문항 {q.no} / {job.questions.length}</p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {/* 1. 문항 분석 */}
            <PanelSection n={1} title="문항 분석">
              <TruncText text={q.intent} className="text-body text-foreground leading-relaxed" />
              <div className="mt-2.5 flex flex-wrap gap-1">
                {q.keywords.map((k) => <KeywordChip key={k}>{k}</KeywordChip>)}
              </div>
            </PanelSection>

            {/* 2. 이 기관의 인재상 — ★ Pickd 기관 DB (차별점). 유일한 틴트 섹션, 색은 배지·링크에만 */}
            <PanelSection
              n={2}
              title="이 기관의 인재상"
              tinted
              sub={
                <span className="inline-flex items-center px-2 py-0.5 text-mini font-semibold rounded-full bg-white border border-border text-primary whitespace-nowrap">
                  Pickd 기관 DB
                </span>
              }
            >
              <p className="text-sm font-semibold text-foreground leading-relaxed select-text">“{job.talent.line}”</p>
              <p className="mt-1.5 text-xs text-muted-foreground">{job.talent.tags.map((t) => `#${t}`).join(" · ")}</p>
              <blockquote className="mt-2.5 border-l-2 border-border pl-2.5">
                <TruncText text={`“${job.talent.voice}”`} className="text-xs text-foreground leading-relaxed select-text" />
                <p className="mt-0.5 text-mini text-muted-foreground">— {job.talent.voiceFrom}</p>
              </blockquote>
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="text-mini text-muted-foreground">{job.talent.source}</span>
                <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline whitespace-nowrap">
                  기관 DB 더 보기
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </PanelSection>

            {/* 3. 이 문항에 담을 경험 — 카드 전체 클릭으로 담기/빼기 (SWOT 시맨틱 매칭) */}
            <PanelSection
              n={3}
              title="이 문항에 담을 경험"
              sub={
                <span className="text-mini text-muted-foreground whitespace-nowrap">
                  {selCount > 0 ? `${selCount}개 담았어요` : "카드를 누르면 담겨요"}
                </span>
              }
            >
              {selCount === 0 && <AddExperienceNotice />}
              <div className="flex flex-col gap-2">
                {EXPERIENCES.map((exp) => (
                  <ExpCard
                    key={exp.id}
                    exp={exp}
                    checked={selected.has(exp.id)}
                    onToggle={() =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (next.has(exp.id)) next.delete(exp.id);
                        else next.add(exp.id);
                        return next;
                      })
                    }
                  />
                ))}
              </div>
            </PanelSection>
          </div>

          {/* 4. AI 초안 생성 — 하단 고정, primary 스트로크 (solid 아님) */}
          <div className="shrink-0 border-t border-border px-5 py-4">
            {running && <PipelineView activeIdx={genNode} />}
            <Button
              variant="outline"
              className={cn("w-full h-9 gap-1.5", PRIMARY_STROKE, running && "mt-3")}
              onClick={() => generate(false)}
              disabled={running || selCount === 0}
            >
              <Sparkles className="w-4 h-4" />
              {running ? "제안 만드는 중…" : "AI 초안 생성"}
            </Button>
            <p className="mt-2 text-mini text-muted-foreground text-center">
              {selCount > 0
                ? `선택한 경험 ${selCount}개로 제안만 해요 · 내가 쓴 글은 바꾸지 않아요`
                : "경험을 선택하면 초안을 제안해 드려요"}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ───────── 라우트 루트: 공고 선택 ↔ 에디터 ───────── */

export default function AICover() {
  const [jobId, setJobId] = useState<string | null>(null);
  const job = JOBS.find((j) => j.id === jobId);
  return job ? (
    <EssayEditor key={job.id} job={job} onBack={() => setJobId(null)} />
  ) : (
    <JobSelect onSelect={setJobId} />
  );
}
