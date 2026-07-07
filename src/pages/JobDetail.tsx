import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ChevronRight,
  ExternalLink,
  PenLine,
  ArrowLeft,
  Copy,
  Check,
  X,
  Highlighter,
  AlertCircle,
  CalendarDays,
  ScrollText,
  Plus,
} from "lucide-react";
import { PickdSidebar } from "@/components/pickd/PickdSidebar";
import { Button } from "@/components/ui/button";
import { StatusBadge, STATUS_MAP } from "@/components/pickd/ds/StatusBadge";
import { DdayChip } from "@/components/pickd/ds/DdayChip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// TODO: MOCK_DATA - 실제 API 연결 시 제거. API: GET /job-postings/:id
const jobDetails: Record<string, any> = {
  samsung: {
    company: "삼성전자",
    division: "DX부문",
    title: "2026 상반기 DX부문 SW 엔지니어 신입 채용",
    role: "SW 엔지니어 (풀스택)",
    period: "2026-04-01 ~ 2026-04-20",
    deadline: "2026-04-20 23:59",
    deadlineDate: new Date("2026-04-20T23:59:00"),
    dday: 8, // TODO: MOCK_DATA - 실제 API 연결 시 getDday(job.deadline) 로 교체
    expired: false,
    status: "작성중",
    location: "경기 수원시 영통구 삼성로 129 (수원사업장)",
    employment: "정규직 (3개월 수습)",
    docsInProgress: [
      { id: "samsung-essay-1", name: "삼성전자 자기소개서", progress: 60 },
      { id: "samsung-resume", name: "삼성전자 이력서", progress: 100 },
    ],
    sourceUrl: "https://www.samsungcareers.com/recruit/2026-spring",
    basic: {
      기업명: "삼성전자 주식회사",
      공고명: "2026 상반기 DX부문 SW 엔지니어 신입 채용",
      "모집 직무": "SW 엔지니어 (Frontend / Backend / Full-stack)",
      근무지: "경기 수원시 영통구 삼성로 129 (수원사업장)",
      "채용 형태": "정규직 (3개월 수습)",
      "접수 시작일": "2026-04-01 (월) 10:00",
      "접수 마감일": "2026-04-20 (일) 23:59",
      "D-day": "D-8",
      등록일: "2026-03-30",
      "최근 수정일": "2026-04-12",
    },
    eligibility: {
      "지원 자격": [
        "2026년 8월 이전 학사 이상 학위 취득(예정)자",
        "병역필 또는 면제자로 해외 여행에 결격사유가 없는 자",
        "영어 회화 가능자 (OPIc IM2 이상 또는 동등 수준)",
      ],
      "필수 조건": [
        "Computer Science 또는 관련 전공자",
        "1개 이상 프로그래밍 언어 실무 활용 가능 (Java, C++, Python 등)",
        "자료구조 / 알고리즘 / 운영체제 기본 지식 보유",
      ],
      우대사항: [
        "오픈소스 프로젝트 기여 경험",
        "대규모 트래픽 서비스 개발 경험",
        "AI / ML 관련 프로젝트 경험",
        "관련 분야 인턴 또는 현장 실습 경험",
      ],
      "가산점 요소": [
        "정보처리기사 자격증 보유자",
        "삼성 SW 역량테스트 Pro 등급 이상",
        "특허 출원 / 등록 경험",
      ],
      "제출 서류": [
        "이력서 (자사 양식)",
        "자기소개서 (4문항)",
        "성적증명서 1부",
        "졸업(예정)증명서 1부",
        "어학 성적 증빙 (해당자)",
      ],
    },
    process: [
      { step: "서류 전형", schedule: "2026-04-21 ~ 2026-04-28", detail: "이력서 / 자기소개서 평가", note: "합격자 개별 통보" },
      { step: "SW 역량테스트", schedule: "2026-05-09 (토)", detail: "온라인 코딩 테스트 (3시간)", note: "별도 환경 안내 예정" },
      { step: "직무 면접", schedule: "2026-05-18 ~ 2026-05-22", detail: "기술 면접 + PT 면접", note: "수원 사업장" },
      { step: "임원 면접", schedule: "2026-06-01 ~ 2026-06-05", detail: "인성 / 가치관 평가", note: "대면" },
      { step: "건강검진 / 최종 발표", schedule: "2026-06-15 (월)", detail: "최종 합격자 발표", note: "이메일 통보" },
    ],
    essays: [
      {
        no: 1,
        question: "삼성전자에 지원한 동기와 입사 후 이루고 싶은 목표를 본인의 경험과 연계하여 작성해 주십시오.",
        charLimit: 700,
        status: "작성중",
        updated: "2시간 전",
        preview: "저는 대학 시절 스마트홈 플랫폼 프로젝트를 진행하면서 삼성전자의 SmartThings 생태계에...",
        docId: "samsung-essay-1",
      },
      {
        no: 2,
        question: "지원 직무와 관련하여 가장 도전적이었던 프로젝트 경험을 작성해 주십시오.",
        charLimit: 1000,
        status: "초안",
        updated: "어제",
        preview: "대학원 재학 중 실시간 데이터 처리 파이프라인을 구축하는 프로젝트를 맡았습니다...",
        docId: "samsung-essay-2",
      },
      {
        no: 3,
        question: "협업 과정에서 갈등을 해결한 경험을 작성해 주십시오.",
        charLimit: 700,
        status: "미작성",
        updated: null,
        preview: null,
        docId: "samsung-essay-3",
      },
      {
        no: 4,
        question: "최근 관심 있는 기술 트렌드와 그 이유를 작성해 주십시오.",
        charLimit: 500,
        status: "미작성",
        updated: null,
        preview: null,
        docId: "samsung-essay-4",
      },
    ],
    jobDescription:
      "DX부문 내 모바일 / TV / 가전 제품의 SW 플랫폼 및 서비스 개발을 담당합니다. 사용자 경험 개선을 위한 신규 기능 기획·구현, 글로벌 시장 대상 안정적 서비스 운영, 그리고 차세대 AI 기반 기능 연구·개발에 참여하게 됩니다.",
    competencies: [
      "Frontend / Backend 개발 역량",
      "대규모 분산 시스템 이해",
      "협업 및 커뮤니케이션 능력",
      "글로벌 협업 경험 (영문 문서 작성·리뷰)",
    ],
    rawSource: `[삼성전자] 2026년 상반기 DX부문 SW 엔지니어 신입사원 채용 공고

■ 모집부문
  - DX부문 SW 엔지니어 (Frontend / Backend / Full-stack)

■ 지원 자격
  - 2026년 8월 이전 학사 이상 학위 취득(예정)자
  - 병역필 또는 면제자로 해외 여행에 결격사유가 없는 자
  - 영어 회화 가능자

■ 우대 사항
  - 오픈소스 프로젝트 기여 경험
  - 대규모 트래픽 서비스 개발 경험
  - AI / ML 관련 프로젝트 경험

■ 전형 절차
  서류 전형 → SW 역량테스트 → 직무 면접 → 임원 면접 → 건강검진 → 최종 합격

■ 접수 기간
  2026-04-01 (월) 10:00 ~ 2026-04-20 (일) 23:59

■ 제출 서류
  이력서, 자기소개서, 성적증명서, 졸업(예정)증명서, 어학 성적

■ 자기소개서 문항
  1. 지원 동기와 입사 후 목표 (700자)
  2. 가장 도전적이었던 프로젝트 경험 (1000자)
  3. 협업 과정에서 갈등을 해결한 경험 (700자)
  4. 관심 있는 기술 트렌드 (500자)

■ 문의
  채용 홈페이지 1:1 문의 게시판 이용
`,
  },
};

function getJob(slug: string | undefined) {
  if (slug && jobDetails[slug]) return jobDetails[slug];
  return jobDetails.samsung;
}

// ---------- Highlight key helpers ----------
function hlKey(section: string, group: string, idx: number) {
  return `${section}::${group}::${idx}`;
}

// ---------- Essay state palette (JobDetail 색 가이드) ----------
// 단일 accent = primary 블루(진행/CTA). 상태는 dot+라벨(SSOT 상태 처리 패턴).
// blue=작성중(진행) · amber=초안 · green=완료 · gray=미작성. 오프브랜드 indigo 폐기.
const ESSAY_STATE: Record<string, { chip: string; dot: string }> = {
  완료: { chip: "bg-pickd-green-light text-pickd-green", dot: "bg-pickd-green" },
  작성중: { chip: "bg-pickd-blue-light text-pickd-blue", dot: "bg-pickd-blue" },
  초안: { chip: "bg-pickd-orange-light text-pickd-orange", dot: "bg-pickd-orange" },
  미작성: { chip: "text-muted-foreground", dot: "bg-muted-foreground/40" },
};

// ---------- Essay status chip (dot + 라벨) ----------
function EssayStatus({ status }: { status: string }) {
  const s = ESSAY_STATE[status] ?? ESSAY_STATE["미작성"];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-mini font-semibold px-2 py-0.5 rounded-full whitespace-nowrap", s.chip)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />
      {status}
    </span>
  );
}

// ---------- Copy button (복붙/오려두기 도우미) ----------
function CopyButton({ text, label = "복사", always = false }: { text: string; label?: string; always?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          toast("복사했어요");
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-chip text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0",
        !always && "opacity-0 group-hover:opacity-100"
      )}
      title="복사하기"
    >
      {copied ? <Check className="w-3 h-3 text-pickd-green" /> : <Copy className="w-3 h-3" />}
      {label}
    </button>
  );
}

// ---------- Numbered section (clear stage separation, no heavy box) ----------
function Section({
  n,
  title,
  subtitle,
  right,
  children,
}: {
  n: number;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5 last:mb-0">
      <div className="group bg-card border border-border rounded-2xl px-6 py-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="shrink-0 w-5 h-5 rounded-md bg-muted text-muted-foreground text-mini font-bold flex items-center justify-center tabular-nums">
              {n}
            </span>
            <h2 className="text-title font-semibold text-foreground tracking-tight">{title}</h2>
            {subtitle && <span className="text-chip text-muted-foreground">{subtitle}</span>}
          </div>
          {right}
        </div>
        {children}
      </div>
    </section>
  );
}

// ---------- HighlightableLine ----------
interface HighlightableLineProps {
  lineKey: string;
  text: string;
  highlighted: boolean;
  onToggle: (key: string) => void;
}

function HighlightableLine({ lineKey, text, highlighted, onToggle }: HighlightableLineProps) {
  return (
    <li
      className={cn(
        "group/line flex items-start gap-2 px-2 py-1.5 -mx-2 rounded transition-colors",
        highlighted ? "bg-[var(--warning-subtle)]" : "hover:bg-muted/30"
      )}
    >
      <button
        onClick={() => onToggle(lineKey)}
        title={highlighted ? "강조 해제" : "중요 표시"}
        className={cn(
          "shrink-0 mt-0.5 w-4 h-4 flex items-center justify-center rounded transition-all",
          "opacity-0 group-hover/line:opacity-100",
          highlighted
            ? "text-[var(--warning)]"
            : "text-muted-foreground hover:text-[var(--warning)]"
        )}
      >
        <Highlighter className="w-3 h-3" />
      </button>
      <span className="text-muted-foreground select-none shrink-0 mt-0.5 text-chip">•</span>
      <span
        className={cn(
          "text-body leading-relaxed break-words flex-1 select-text",
          highlighted ? "text-foreground font-semibold" : "text-foreground"
        )}
      >
        {text}
      </span>
    </li>
  );
}

// ---------- Requirement group (seamless list + 그룹 통째 복사) ----------
function ReqGroup({
  label,
  items,
  section,
  isHighlighted,
  onToggle,
}: {
  label: string;
  items: string[];
  section: string;
  isHighlighted: (key: string) => boolean;
  onToggle: (key: string) => void;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground mb-1">{label}</h3>
      <ul className="space-y-0.5">
        {items.map((text, idx) => {
          const key = hlKey(section, label, idx);
          return (
            <HighlightableLine
              key={idx}
              lineKey={key}
              text={text}
              highlighted={isHighlighted(key)}
              onToggle={onToggle}
            />
          );
        })}
      </ul>
    </div>
  );
}

// ---------- Main component ----------
export default function JobDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const job = getJob(slug);

  const [rawOpen, setRawOpen] = useState(false);
  const [highlights, setHighlights] = useState<Set<string>>(new Set());

  // 제출 서류 확인 체크 상태 (localStorage 지속)
  const submitDocs: string[] = job.eligibility["제출 서류"] ?? [];
  const reqGroups = Object.entries(job.eligibility).filter(([k]) => k !== "제출 서류") as [string, string[]][];
  const docsKey = `pickd.jobs.${slug ?? "samsung"}.docsChecked.v1`;
  const [checkedDocs, setCheckedDocs] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(docsKey);
      setCheckedDocs(raw ? new Set(JSON.parse(raw)) : new Set());
    } catch {}
  }, [docsKey]);

  const toggleDoc = (d: string) => {
    setCheckedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      try {
        localStorage.setItem(docsKey, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  // 공고 외 직접 준비하는 제출 서류(포트폴리오·경력증명서 등)를 사용자가 추가 — localStorage 지속
  const customDocsKey = `pickd.jobs.${slug ?? "samsung"}.customDocs.v1`;
  const [customDocs, setCustomDocs] = useState<string[]>([]);
  const [newDoc, setNewDoc] = useState("");
  const [addingDoc, setAddingDoc] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(customDocsKey);
      setCustomDocs(raw ? JSON.parse(raw) : []);
    } catch {}
  }, [customDocsKey]);
  const persistCustomDocs = (next: string[]) => {
    setCustomDocs(next);
    try { localStorage.setItem(customDocsKey, JSON.stringify(next)); } catch {}
  };
  const addCustomDoc = () => {
    const v = newDoc.trim();
    if (!v) return;
    if ([...submitDocs, ...customDocs].includes(v)) { toast("이미 있는 서류예요"); setNewDoc(""); return; }
    persistCustomDocs([...customDocs, v]);
    setNewDoc("");
    toast("서류를 추가했어요");
  };
  const removeCustomDoc = (d: string) => {
    persistCustomDocs(customDocs.filter((x) => x !== d));
    setCheckedDocs((prev) => {
      const n = new Set(prev);
      n.delete(d);
      try { localStorage.setItem(docsKey, JSON.stringify([...n])); } catch {}
      return n;
    });
  };
  const allDocs = [...submitDocs, ...customDocs];

  // 자소서 문항 ref — 작성중인 서류에서 진입 시 마지막 작업 문항으로 스크롤
  const essayRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const fromDoclist = new URLSearchParams(location.search).get("from") === "doclist";
    if (!fromDoclist) return;
    const lastActiveIdx = [...job.essays]
      .map((e: any, i: number) => ({ i, status: e.status }))
      .filter(({ status }: any) => status === "작성중" || status === "초안")
      .pop()?.i ?? 0;
    const el = essayRefs.current[lastActiveIdx];
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
  }, []);

  const toggleHighlight = (key: string) => {
    setHighlights((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const isHighlighted = (key: string) => highlights.has(key);

  const goToTab3 = (essayNo: number) => {
    navigate(`/ai-cover?from=job&slug=${slug ?? "samsung"}&essay=${essayNo}`);
  };

  const urgent = !job.expired && job.dday !== null && job.dday <= 3;
  // 지원 상태 라벨 → 탭1 StatusBadge 상태 키 매핑(같은 배지로 통일)
  const statusKey = Object.entries(STATUS_MAP).find(([, v]) => v.label === job.status)?.[0] as
    | keyof typeof STATUS_MAP
    | undefined;

  // 섹션별 '복사' 포맷 — 라벨·불릿을 살려 붙여넣었을 때 서식 유지
  const basicCopy = Object.entries(job.basic).map(([k, v]) => `${k}: ${v}`).join("\n");
  const jdCopy = `[직무 설명]\n${job.jobDescription}\n\n[요구 역량]\n${job.competencies
    .map((c: string) => `· ${c}`)
    .join("\n")}`;
  const eligibilityCopy = reqGroups
    .map(([label, items]) => `[${label}]\n${items.map((t) => `· ${t}`).join("\n")}`)
    .join("\n\n");
  const docsCopy = allDocs.map((d) => `· ${d}`).join("\n");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <PickdSidebar />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-white">
        {/* Sticky top bar */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border/60">
          <div className="mx-auto max-w-[860px] px-8 py-3 flex items-center justify-between">
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
              <Link to="/" className="hover:text-foreground transition-colors shrink-0">지원 대시보드</Link>
              <ChevronRight className="w-3 h-3 shrink-0" />
              <span className="text-foreground font-medium truncate">{job.company} {job.division ?? ""}</span>
            </nav>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant={rawOpen ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs gap-1.5 rounded-md"
                onClick={() => setRawOpen((v) => !v)}
              >
                <ScrollText className="w-3.5 h-3.5" />
                {rawOpen ? "원문 닫기" : "원문 보기"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5 rounded-md"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                대시보드로
              </Button>
            </div>
          </div>
        </div>

        {/* Centered content column */}
        <div className="mx-auto max-w-[860px] px-8 pt-11 pb-24">

          {/* Title + minimal at-a-glance meta */}
          <header className="mb-8">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
              <span className="font-medium text-foreground">{job.company}</span>
              {job.division && (<><span className="text-border">·</span><span>{job.division}</span></>)}
              <span className="text-border">·</span>
              <span>{job.role}</span>
            </div>
            <h1 className="text-heading font-bold text-foreground tracking-[-0.04em] leading-tight">
              {job.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                마감 {job.deadline}
              </span>
              <DdayChip days={job.dday} size="sm" />
              {statusKey ? (
                <StatusBadge status={statusKey} size="sm" />
              ) : (
                <StatusBadge label={job.status} tone="neutral" size="sm" />
              )}
            </div>

            {(job.expired || urgent) && (
              <div className={cn(
                "mt-3 inline-flex items-center gap-1.5 text-chip rounded-md px-2.5 py-1",
                job.expired ? "bg-muted/50 text-muted-foreground" : "bg-pickd-red-light text-pickd-red"
              )}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {job.expired ? "마감된 공고입니다" : "제출 기한이 얼마 남지 않았어요"}
              </div>
            )}
          </header>

          {/* 1 · 기본 정보 — 복사하기 쉬운 정보 목록 */}
          <Section
            n={1}
            title="기본 정보"
            right={<CopyButton label="복사" text={basicCopy} />}
          >
            <dl className="divide-y divide-border/40">
              {Object.entries(job.basic).map(([k, v]) => (
                <div key={k} className="flex items-start gap-3 py-2">
                  <dt className="w-28 shrink-0 text-xs text-muted-foreground pt-0.5">{k}</dt>
                  <dd className={cn(
                    "flex-1 text-body leading-relaxed break-words select-text",
                    k === "D-day" && urgent ? "text-pickd-red font-semibold" : "text-foreground"
                  )}>
                    {String(v)}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>

          {/* 2 · 직무 설명 · 요구 역량 */}
          <Section n={2} title="직무 설명 · 요구 역량" right={<CopyButton label="복사" text={jdCopy} />}>
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-1">직무 설명</h3>
                <p className="text-body text-foreground leading-relaxed select-text">{job.jobDescription}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-1">요구 역량</h3>
                <ul className="space-y-0.5">
                  {job.competencies.map((c: string, i: number) => {
                    const key = hlKey("jd", "competency", i);
                    return (
                      <HighlightableLine key={i} lineKey={key} text={c} highlighted={isHighlighted(key)} onToggle={toggleHighlight} />
                    );
                  })}
                </ul>
              </div>
            </div>
          </Section>

          {/* 3 · 지원 자격 · 우대 · 가산점 */}
          <Section
            n={3}
            title="지원 자격 · 우대"
            right={
              <div className="flex items-center gap-2">
                {highlights.size > 0 && (
                  <button
                    onClick={() => setHighlights(new Set())}
                    className="text-chip text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    강조 {highlights.size}개 초기화
                  </button>
                )}
                <CopyButton label="복사" text={eligibilityCopy} />
              </div>
            }
          >
            <div className="space-y-5">
              {reqGroups.map(([label, items]) => (
                <ReqGroup
                  key={label}
                  label={label}
                  items={items}
                  section="eligibility"
                  isHighlighted={isHighlighted}
                  onToggle={toggleHighlight}
                />
              ))}
            </div>
          </Section>

          {/* 4 · 전형 절차 — 일정 미정도 흔하므로 '미정' 표기 대비 */}
          <Section
            n={4}
            title="전형 절차"
            right={<span className="text-chip text-muted-foreground/70">일정이 없으면 ‘미정’으로 표시돼요</span>}
          >
            <div>
              {job.process.map((p: any, i: number) => {
                const hasSchedule = !!(p.schedule && String(p.schedule).trim());
                return (
                  <div key={i} className="flex items-start gap-3.5 py-3 border-b border-border/40 last:border-0">
                    <span className="shrink-0 w-5 pt-0.5 text-body font-semibold text-muted-foreground/50 tabular-nums text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-body font-medium text-foreground">{p.step}</p>
                        {p.detail && <p className="text-xs text-muted-foreground mt-0.5">{p.detail}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        {hasSchedule ? (
                          <p className="text-xs tabular-nums text-foreground/80 select-text">{p.schedule}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground/60">일정 미정</p>
                        )}
                        {p.note ? (
                          <p className="text-chip text-muted-foreground mt-0.5">{p.note}</p>
                        ) : !hasSchedule ? (
                          <p className="text-chip text-muted-foreground/50 mt-0.5">확정되면 업데이트하세요</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* 5 · 제출 서류 — 확인 체크리스트 (+ 공고 외 직접 추가) */}
          <Section
            n={5}
            title="제출 서류"
            right={
              <div className="flex items-center gap-2">
                {allDocs.length > 0 && <CopyButton label="복사" text={docsCopy} />}
                <button
                  type="button"
                  onClick={() => setAddingDoc(true)}
                  title="준비 서류 추가"
                  aria-label="준비 서류 추가"
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/50"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            }
          >
            <ul className="space-y-0.5">
              {allDocs.map((d) => {
                const checked = checkedDocs.has(d);
                const isCustom = customDocs.includes(d);
                return (
                  <li key={d} className="group flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleDoc(d)}
                      className="flex-1 min-w-0 flex items-center gap-2.5 px-2 py-1.5 -mx-2 rounded text-left hover:bg-muted/30 transition-colors"
                    >
                      <span className={cn(
                        "shrink-0 w-4 h-4 rounded-[5px] border flex items-center justify-center transition-colors",
                        checked ? "bg-pickd-green border-pickd-green text-white" : "border-border bg-background"
                      )}>
                        {checked && <Check className="w-3 h-3" />}
                      </span>
                      <span className={cn("text-body leading-relaxed select-text truncate", checked ? "text-muted-foreground line-through" : "text-foreground")}>
                        {d}
                      </span>
                      {isCustom && <span className="shrink-0 text-chip text-muted-foreground/60">직접 추가</span>}
                    </button>
                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => removeCustomDoc(d)}
                        title="삭제"
                        aria-label="삭제"
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 w-6 h-6 flex items-center justify-center rounded text-muted-foreground/60 hover:text-destructive hover:bg-muted"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            {allDocs.length === 0 && !addingDoc && (
              <p className="text-chip text-muted-foreground/60 mt-1">
                공고에 명시된 제출 서류가 없어요. 우측 상단 <span className="inline-flex items-center align-middle"><Plus className="w-3 h-3" /></span> 로 직접 추가할 수 있어요.
              </p>
            )}

            {/* 공고에 없는 서류 직접 추가 — 목록 행처럼 자연스러운 입력 + 체크로 확인 */}
            {addingDoc && (
              <div className="flex items-center gap-2.5 px-2 py-1.5 -mx-2">
                <span className="shrink-0 w-4 h-4 rounded-[5px] border border-dashed border-border bg-background" />
                <input
                  autoFocus
                  value={newDoc}
                  onChange={(e) => setNewDoc(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addCustomDoc(); }
                    if (e.key === "Escape") { setNewDoc(""); setAddingDoc(false); }
                  }}
                  onBlur={() => { if (!newDoc.trim()) setAddingDoc(false); }}
                  placeholder="준비 서류 추가 (예: 포트폴리오, 경력증명서)"
                  className="flex-1 min-w-0 bg-transparent border-0 outline-none p-0 text-body text-foreground placeholder:text-muted-foreground/50"
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={addCustomDoc}
                  disabled={!newDoc.trim()}
                  aria-label="추가"
                  title="추가"
                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-pickd-green hover:bg-pickd-green-light transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </Section>

          {/* 6 · 자기소개서 (맨 아래) — 공고 원문은 상단 '원문 보기' 버튼 → 우측 슬라이드 패널 */}
          <Section
            n={6}
            title="자기소개서"
            subtitle={`${job.essays.length}문항`}
          >
            {job.essays.length === 0 ? (
              <p className="text-body text-muted-foreground px-2 py-3">이 공고는 별도 문항이 없어요</p>
            ) : (
              <ol className="divide-y divide-border">
                {job.essays.map((e: any, idx: number) => (
                  <li
                    key={e.no}
                    ref={(el) => { essayRefs.current[idx] = el; }}
                    className="py-5 first:pt-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-chip font-semibold text-muted-foreground tabular-nums">Q{e.no}</span>
                          <EssayStatus status={e.status} />
                          <span className="text-chip text-muted-foreground">
                            {e.charLimit.toLocaleString()}자{e.updated ? ` · 수정 ${e.updated}` : ""}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-relaxed select-text">{e.question}</p>
                        {e.preview ? (
                          <p className="mt-1.5 text-body text-muted-foreground leading-relaxed line-clamp-2 select-text">{e.preview}</p>
                        ) : e.status === "미작성" ? (
                          <p className="mt-1 text-xs text-muted-foreground/50">아직 작성된 내용이 없어요</p>
                        ) : null}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className={cn(
                          "shrink-0 h-8 text-xs gap-1 whitespace-nowrap rounded-md border-border",
                          (e.status === "작성중" || e.status === "초안")
                            ? "text-primary hover:text-primary"
                            : "text-muted-foreground"
                        )}
                        onClick={() => goToTab3(e.no)}
                      >
                        <PenLine className="w-3 h-3" />
                        {e.status === "완료" ? "수정" : e.status === "미작성" ? "작성하기" : "이어서 작성하기"}
                      </Button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Section>
        </div>
        </div>

        {/* Right slide panel: 공고 원문 (좌우 대조용) */}
        <aside
          className={cn(
            "border-l border-border flex flex-col shrink-0 transition-all duration-300 overflow-hidden bg-white",
            rawOpen ? "w-[440px]" : "w-0"
          )}
        >
          {rawOpen && (
            <div className="flex flex-col h-full w-[440px]">
              <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center justify-between shrink-0 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center shrink-0">
                    <ScrollText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-body font-semibold text-foreground leading-tight">공고 원문</p>
                    <p className="text-chip text-muted-foreground truncate">{job.company} · 추출된 원본</p>
                  </div>
                </div>
                <button
                  onClick={() => setRawOpen(false)}
                  aria-label="원문 닫기"
                  className="w-7 h-7 rounded-md hover:bg-muted border border-transparent hover:border-border text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
                <pre className="text-xs leading-[1.85] text-foreground/80 whitespace-pre-wrap font-mono select-text">
                  {job.rawSource}
                </pre>
              </div>

              <div className="px-5 py-3 border-t border-border bg-muted/20 shrink-0 flex items-center justify-between gap-2">
                <CopyButton always label="전체 복사" text={job.rawSource} />
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-chip text-primary hover:underline font-medium"
                >
                  원문 사이트 열기
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
