import { useEffect, useRef, useState } from "react";
import type { ReactNode, CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowLeftRight, ArrowRight, Check, ChevronDown, ChevronRight, Maximize2, Minimize2, MoreHorizontal, RefreshCw,
  Send, SpellCheck as SpellCheckIcon, Sparkles, X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PickdSidebar } from "@/components/layout/PickdSidebar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DdayChip } from "@/components/ds/DdayChip";
import { EssayStatus } from "@/components/ds/EssayStatus";
import { TONES, type Tone } from "@/components/ds/StatusBadge";
import { ddayLabel, ddayCls } from "@/lib/dday";
import { PageTitle } from "@/components/PageTitle";
import { JOBS, EXPERIENCES, SWOT_META, type Question, type Talent, type Job, type Exp } from "./model/aiCoverMock";
import { SPELL_RULES } from "./model/spellRules";

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


// ⚠️ 공고·문항·인재상·voice·수치 전부 목업 예시 (멘토링 §8에서 언급된 부산 공공기관들로 구성)



// 탭2 경험 목업 (실서비스: pickd.experiences.items 연동 + 공고별 SWOT 재산출)

// 맞춤법 확인 (목업 — 자주 틀리는 표기 규칙 기반. 실서비스는 맞춤법 검사 API/사전 연동)
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
// 스텝 플로우('공고 선택→…→초안→완성')는 제거(2026-07-29) — '초안' 단계 의미가 직관적이지 않고,
// 진행 정보는 화면 요소(문항 페이저·상태 칩·AI 초안 생성 버튼)가 이미 보여줘 중복이었음.

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

// primary 스트로크 버튼 클래스 (JobDetail 색 가이드 §3 — solid 남발 방지)
const PRIMARY_STROKE = "border-primary/40 text-primary hover:bg-primary/5 hover:text-primary";

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
        <span className="text-sm font-semibold text-foreground tracking-tight">{title}</span>
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
      {open && <div className="px-5 pb-5">{children}</div>}
    </section>
  );
}

// 긴 콘텐츠 크게 보기 — 실데이터에선 분석·인재상이 훨씬 길고 복잡해질 것에 대비한 확대 뷰(모달)
function ZoomView({ title, trigger, children }: { title: string; trigger: ReactNode; children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-title font-semibold text-foreground">{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-1 space-y-3">{children}</div>
      </DialogContent>
    </Dialog>
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
      <span className="mt-1.5 block text-body text-muted-foreground leading-snug">{exp.reason}</span>
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
  written: number; total: number; finished: boolean; texts: string[];
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
    written, total: job.questions.length, finished: cached?.finished ?? false, texts,
    preview, curNo: job.questions[curIdx].no, curLen: (texts[curIdx] ?? "").length, curLimit: job.questions[curIdx].limit,
  };
}

// 대시보드 카드형(DocumentStatusList 카드)과 동일 해부도 — 탭1 계열과 한 언어.
// D-day는 대시보드 카드와 같은 글자색 규칙(§5-4-1 예외 계열), 진행은 바 없이 N/M 텍스트만(§0-10).

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
      className="bg-card border border-border rounded-lg px-5 py-4 hover:bg-muted/20 hover:border-primary/40 transition-colors flex flex-col text-left"
    >
      {/* 제목 행 */}
      <p className="text-sm font-semibold text-foreground leading-snug">
        {job.org} <span className="font-normal text-muted-foreground">{job.role}</span>
      </p>

      {/* 서브라인: 자소서 · D-day (대시보드 카드의 '지원서 · D-N' 문법) */}
      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground">자소서</span>
        <span className="text-muted-foreground/40 text-xs">·</span>
        <span className={cn("text-xs tabular-nums", ddayCls(job.dday))}>{ddayLabel(job.dday)}</span>
      </div>

      {/* 문항 수 — 선 없이 크고 직관적으로 (2026-07-27: 가로선·작은 글자 피드백) */}
      <p className="mt-3 text-title font-semibold text-foreground tabular-nums">
        문항 {p.total}개
        {writing && <span className="text-muted-foreground font-normal"> · {p.written}개 작성</span>}
      </p>

      {/* 마감일 · CTA */}
      <div className="mt-3 flex items-center justify-between gap-2 text-xs tabular-nums w-full">
        <span className="text-muted-foreground">마감 {deadlineOf(job.dday)}</span>
        <span className={cn("font-medium", writing && !p.finished ? "text-primary" : "text-muted-foreground")}>
          {p.finished ? "수정" : writing ? "이어서 작성하기" : "작성하기"}
        </span>
      </div>
    </button>
  );
}

function JobSelect({ onSelect }: { onSelect: (id: string, qIdx?: number) => void }) {
  // 공고 기준 카드 그리드 — 마감 임박 순, 전폭 사용(탭1과 동일한 컨테이너 감각, 좌우 빈공간 최소화)
  const rows = JOBS.map((job) => ({ job, p: getProgress(job) })).sort((a, b) => a.job.dday - b.job.dday);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <PickdSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1320px] mx-auto px-8 py-7">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <div>
              <PageTitle>AI 자소서</PageTitle>
              <p className="text-sm text-muted-foreground mt-1.5">공고나 문항을 누르면 바로 작성으로 들어가요.</p>
            </div>
            <p className="text-xs text-muted-foreground">
              새 공고는{" "}
              <Link to="/" className="text-primary hover:underline">지원 대시보드</Link>
              에서 등록해요.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 xl:grid-cols-3 gap-3.5">
            {rows.map(({ job, p }) => (
              <JobCard key={job.id} job={job} p={p} onSelect={() => onSelect(job.id)} />
            ))}
          </div>
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
  // 우측 패널 폭 — 왼쪽 가장자리 드래그로 조절(내용이 많을 때 크게 보기, 2026-07-27 요청)
  const [panelW, setPanelW] = useState(430);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── 분할 뷰(2026-07-29): 도구 창에 [작성 도우미|공고 정보|AI 챗] 선택, ⇄로 좌우 교체,
  //    드래그로 최대 60%(반반 이상)까지 — 노트북 스플릿 뷰처럼 참고하며 쓰기
  const [rightView, setRightView] = useState<"helper" | "job" | "ai">("helper");
  const [reversed, setReversed] = useState(false); // true = 도구 창이 왼쪽
  const RIGHT_VIEWS: { key: "helper" | "job" | "ai"; label: string }[] = [
    { key: "helper", label: "작성 도우미" },
    { key: "job", label: "공고 정보" },
    { key: "ai", label: "AI 챗" },
  ];

  // AI 챗 (목업 — 실서비스는 자소서 특화 생성형 AI 연결. 응답은 기존 목업 로직 재사용, 없는 사실 생성 없음)
  const [chat, setChat] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "안녕하세요! 문항·인재상·담은 경험을 같이 보면서 도와드릴게요. 아래 질문을 눌러 시작해도 좋아요. (목업 응답이에요)" },
  ]);
  const [chatInput, setChatInput] = useState("");
  function aiReply(msg: string): string {
    if (msg.includes("초안")) {
      return selCount > 0
        ? `이 문항이라면 담은 경험으로 이렇게 이어 볼 수 있어요.\n\n${buildSuggestion(qIdx, variants[qIdx])}\n\n마음에 드는 문장만 골라 본문에 이어 붙여도 좋아요.`
        : "먼저 작성 도우미에서 이 문항에 담을 경험을 골라 주세요. 그 경험으로 초안을 제안해 드릴게요.";
    }
    if (msg.includes("첫 문장")) {
      const first = EXPERIENCES.find((e) => selected.has(e.id)) ?? EXPERIENCES[0];
      return `'${job.talent.line}'과 내 경험이 만나는 지점에서 시작해 보세요. 예를 들면 — "${first.line}"`;
    }
    if (msg.includes("강점")) {
      return "지금 글은 경험에서 배운 점을 또렷하게 말하고 있어요. 여기에 '그래서 이 기관에서 무엇을 하고 싶은지' 한 문장을 이어 주면 흐름이 완성돼요.";
    }
    return `${q.intent} 이 기준에 맞춰, 담고 싶은 경험 하나를 골라 구체적인 장면부터 적어 보세요.`;
  }
  function sendChat(msgRaw?: string) {
    const msg = (msgRaw ?? chatInput).trim();
    if (!msg) return;
    setChatInput("");
    setChat((c) => [...c, { role: "user", text: msg }]);
    timerRef.current.push(setTimeout(() => setChat((c) => [...c, { role: "ai", text: aiReply(msg) }]), 500));
  }

  function startPanelResize(e: React.PointerEvent) {
    e.preventDefault();
    const rev = reversed;
    const onMove = (ev: PointerEvent) => {
      const w = rev ? ev.clientX : window.innerWidth - ev.clientX;
      setPanelW(Math.min(Math.floor(window.innerWidth * 0.6), Math.max(340, w)));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const q = job.questions[qIdx];
  const text = texts[qIdx];
  const running = genNode >= 0;
  const selCount = selected.size;
  const over = text.length > q.limit;
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

      <div className={cn("flex-1 flex overflow-hidden", reversed && "flex-row-reverse")}>
        {/* ── 에디터 창 (⇄로 좌우 교체 가능) ── */}
        <div className="flex-1 min-w-0 overflow-y-auto bg-white">
          {/* Sticky top bar — JobDetail 패턴. 'AI 자소서'를 누르면 공고 선택으로 */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border/60">
            {/* h-12 고정 — 오른쪽 도구 창 헤더와 같은 높이로 상단 선이 이어지게 (2026-07-29) */}
            <div className="mx-auto max-w-[820px] px-8 h-12 flex items-center gap-4">
              {/* 브레드크럼 3단 폐기 → ← + 기관명 하나만 (2026-07-29 확정) */}
              <nav className="flex items-center gap-1.5 min-w-0">
                <button
                  type="button"
                  onClick={onBack}
                  aria-label="AI 자소서 목록으로 돌아가기"
                  title="목록으로"
                  className="w-7 h-7 -ml-1.5 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold text-foreground truncate">{job.org}</span>
              </nav>
            </div>
          </div>

          {/* Centered content column */}
          <div className="mx-auto max-w-[820px] px-8 pt-9 pb-24">
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

        {/* ── 도구 창 — [작성 도우미|공고 정보|AI 챗] 선택 + ⇄ 좌우 교체 + 가장자리 드래그로 폭 조절(최대 60%) ── */}
        <aside
          className={cn("relative bg-white flex flex-col shrink-0", reversed ? "border-r border-border" : "border-l border-border")}
          style={{ width: panelW }}
          aria-label="보조 창"
        >
          {/* 리사이즈 핸들 */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="창 너비 조절"
            title="드래그해서 창 크기 조절 (반반까지 넓힐 수 있어요)"
            onPointerDown={startPanelResize}
            className={cn(
              "absolute top-0 bottom-0 w-1.5 cursor-col-resize z-10 hover:bg-primary/25 active:bg-primary/40 transition-colors",
              reversed ? "right-0 -mr-0.5" : "left-0 -ml-0.5",
            )}
          />
          {/* 창 선택 탭 + 좌우 교체 */}
          {/* h-12 고정(왼쪽 상단 바와 정렬) + 세그먼트 컨트롤(회색 트랙+활성 흰 카드)로 탭임을 명확히 (2026-07-29) */}
          <div className="px-3 h-12 border-b border-border flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-0.5 min-w-0 bg-muted/70 rounded-lg p-0.5" role="tablist" aria-label="보조 창 선택">
              {RIGHT_VIEWS.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  role="tab"
                  aria-selected={rightView === v.key}
                  onClick={() => setRightView(v.key)}
                  className={cn(
                    "px-2.5 h-7 rounded-md text-xs whitespace-nowrap transition-all",
                    rightView === v.key
                      ? "bg-white text-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
            {/* ⇄ 아이콘 단독 → ⋯ 메뉴로 (기능이 라벨로 보이게, 2026-07-29 확정). '문항 N/M'은 페이저와 중복이라 제거 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="창 옵션"
                  title="창 옵션"
                  className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 data-[state=open]:bg-muted data-[state=open]:text-foreground"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setReversed((v) => !v)} className="gap-2 text-body">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-muted-foreground" />
                  좌우 위치 바꾸기
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPanelW(Math.floor(window.innerWidth * 0.5))} className="gap-2 text-body">
                  <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
                  화면 반반으로
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPanelW(430)} className="gap-2 text-body">
                  <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" />
                  기본 크기로
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {rightView === "helper" && (<>
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {/* 1. 문항 분석 */}
            <PanelSection n={1} title="문항 분석">
              <TruncText text={q.intent} className="text-sm text-foreground leading-relaxed" />
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1 min-w-0">
                  {q.keywords.map((k) => <KeywordChip key={k}>{k}</KeywordChip>)}
                </div>
                {/* 실데이터에선 분석이 훨씬 길어짐 — 모달로 크게 보기 */}
                <ZoomView
                  title={`문항 분석 · Q${q.no}`}
                  trigger={
                    <button type="button" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0">
                      <Maximize2 className="w-3 h-3" />
                      크게 보기
                    </button>
                  }
                >
                  <p className="text-title font-semibold text-foreground leading-relaxed">{q.text}</p>
                  <p className="text-title text-foreground leading-[1.8]">{q.intent}</p>
                  <div className="flex flex-wrap gap-1">
                    {q.keywords.map((k) => <KeywordChip key={k}>{k}</KeywordChip>)}
                  </div>
                </ZoomView>
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
              <p className="text-title font-semibold text-foreground leading-relaxed select-text">“{job.talent.line}”</p>
              <p className="mt-1.5 text-xs text-muted-foreground">{job.talent.tags.map((t) => `#${t}`).join(" · ")}</p>
              <blockquote className="mt-2.5 border-l-2 border-border pl-2.5">
                <TruncText text={`“${job.talent.voice}”`} className="text-body text-foreground leading-relaxed select-text" />
                <p className="mt-0.5 text-mini text-muted-foreground">— {job.talent.voiceFrom}</p>
              </blockquote>
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="text-mini text-muted-foreground">{job.talent.source}</span>
                {/* 기관 DB 상세 — 실데이터(인터뷰 전문·합격 포인트)가 길어져도 모달에서 크게 */}
                <ZoomView
                  title="이 기관의 인재상 — Pickd 기관 DB"
                  trigger={
                    <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline whitespace-nowrap">
                      기관 DB 더 보기
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  }
                >
                  <p className="text-h2 font-semibold text-foreground leading-snug">“{job.talent.line}”</p>
                  <p className="text-sm text-muted-foreground">{job.talent.tags.map((t) => `#${t}`).join(" · ")}</p>
                  <blockquote className="border-l-2 border-border pl-3">
                    <p className="text-title text-foreground leading-[1.8] select-text">“{job.talent.voice}”</p>
                    <p className="mt-1 text-xs text-muted-foreground">— {job.talent.voiceFrom}</p>
                  </blockquote>
                  <p className="text-xs text-muted-foreground">{job.talent.source}</p>
                </ZoomView>
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
              <div className="flex flex-col gap-2.5">
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
          </>)}

          {/* ── 공고 정보 뷰 — 공고 요강을 보면서 쓰기 (탭1 연동 전 목업 요약) ── */}
          {rightView === "job" && (
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              <div>
                <p className="text-sm font-semibold text-foreground">{job.org}</p>
                <div className="mt-1 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                  <span>{job.role}</span>
                  <KeywordChip>공공기관</KeywordChip>
                  <DdayChip days={job.dday} size="sm" />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">자기소개서 문항 {job.questions.length}개</p>
                <ol className="divide-y divide-border/40">
                  {job.questions.map((qq, i) => (
                    <li key={qq.no}>
                      <button
                        type="button"
                        onClick={() => setQIdx(i)}
                        className="w-full text-left py-2.5 flex items-start gap-2 hover:bg-muted/30 rounded-md px-2 -mx-2 transition-colors"
                        aria-label={`문항 ${qq.no}로 이동`}
                      >
                        <span className="text-chip font-semibold text-muted-foreground tabular-nums shrink-0 mt-0.5">Q{qq.no}</span>
                        <span className="min-w-0">
                          <span className={cn("block text-sm leading-relaxed text-foreground", i === qIdx && "font-medium")}>{qq.text}</span>
                          <span className="mt-0.5 block text-chip text-muted-foreground tabular-nums">
                            {qq.limit.toLocaleString()}자{(texts[i] ?? "").trim() && ` · ${texts[i].length.toLocaleString()}자 작성 중`}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">인재상</p>
                <p className="text-sm font-semibold text-foreground">“{job.talent.line}”</p>
                <p className="mt-1 text-xs text-muted-foreground">{job.talent.tags.map((t) => `#${t}`).join(" · ")}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                자격요건·우대사항 등 공고 전문은 탭1 공고 연동 시 여기에 표시돼요.{" "}
                <Link to="/" className="text-primary hover:underline">지원 대시보드로 이동</Link>
              </p>
            </div>
          )}

          {/* ── AI 챗 뷰 — 생성형 AI와 대화하며 쓰기 (목업 응답) ── */}
          {rightView === "ai" && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {chat.map((m, i) =>
                  m.role === "ai" ? (
                    <div key={i} className="flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-1" />
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap min-w-0">{m.text}</p>
                    </div>
                  ) : (
                    <div key={i} className="flex justify-end">
                      <p className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm text-foreground leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    </div>
                  ),
                )}
              </div>
              <div className="shrink-0 border-t border-border px-4 py-3">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {["이 문항 초안 제안해 줘", "첫 문장만 잡아 줘", "내 글의 강점 짚어 줘"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendChat(s)}
                      className="px-2 py-1 rounded-md border border-border bg-white text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) sendChat(); }}
                    placeholder="글에 대해 무엇이든 물어보세요"
                    className="flex-1 h-9 rounded-md border border-input bg-white px-3 text-sm outline-none focus:border-primary/50"
                    aria-label="AI 챗 입력"
                  />
                  <Button variant="outline" size="sm" className={cn("h-9 px-3", PRIMARY_STROKE)} onClick={() => sendChat()} aria-label="보내기">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

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
