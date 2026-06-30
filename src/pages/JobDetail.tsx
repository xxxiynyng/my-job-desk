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
  Info,
  ClipboardList,
  ListChecks,
  BookOpen,
  ScrollText,
  Highlighter,
  AlertCircle,
  FileText,
} from "lucide-react";
import { PickdSidebar } from "@/components/pickd/PickdSidebar";
import { Button } from "@/components/ui/button";
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
    status: "서류 작성중",
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

// ---------- Essay status chip ----------
function EssayStatus({ status }: { status: string }) {
  const cls =
    status === "완료" ? "bg-pickd-green-light text-pickd-green" :
    status === "작성중" ? "bg-indigo-100 text-indigo-600" :
    status === "초안" ? "bg-pickd-orange-light text-pickd-orange" :
    "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap", cls)}>
      {status}
    </span>
  );
}

// ---------- Small utilities ----------
function CopyButton({ text, label = "복사" }: { text: string; label?: string }) {
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
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
      title="복사하기"
    >
      {copied ? <Check className="w-3 h-3 text-pickd-green" /> : <Copy className="w-3 h-3" />}
      {label}
    </button>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  rightSlot,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-[15px] font-semibold text-foreground tracking-tight">{title}</h2>
        {subtitle && <span className="text-[11px] text-muted-foreground ml-1">{subtitle}</span>}
      </div>
      {rightSlot}
    </div>
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
        "group/line flex items-start gap-2 px-3 py-1.5 -mx-3 rounded transition-colors",
        highlighted
          ? "bg-[var(--warning-subtle)]"
          : "hover:bg-muted/30"
      )}
    >
      {/* Highlight toggle button — visible on hover or when highlighted */}
      <button
        onClick={() => onToggle(lineKey)}
        title={highlighted ? "강조 해제" : "중요 표시"}
        className={cn(
          "shrink-0 mt-0.5 w-4 h-4 flex items-center justify-center rounded transition-all",
          highlighted
            ? "opacity-100 text-[var(--warning)]"
            : "opacity-0 group-hover/line:opacity-100 text-muted-foreground hover:text-[var(--warning)]"
        )}
      >
        <Highlighter className="w-3 h-3" />
      </button>

      {/* Bullet */}
      <span className="text-muted-foreground select-none shrink-0 mt-0.5 text-[11px]">•</span>

      {/* Text — semibold when highlighted */}
      <span
        className={cn(
          "text-[13px] leading-relaxed break-words flex-1",
          highlighted ? "text-foreground font-semibold" : "text-foreground"
        )}
      >
        {text}
      </span>
    </li>
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

  // 자소서 문항 ref — 작성중인 서류에서 진입 시 마지막 작업 문항으로 스크롤
  const essayRefs = useRef<(HTMLLIElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fromDoclist = new URLSearchParams(location.search).get("from") === "doclist";
    if (!fromDoclist) return;
    // 마지막으로 작업 중인 문항(작성중 or 초안) 찾기
    const lastActiveIdx = [...job.essays]
      .map((e: any, i: number) => ({ i, status: e.status }))
      .filter(({ status }: any) => status === "작성중" || status === "초안")
      .pop()?.i ?? 0;
    const el = essayRefs.current[lastActiveIdx];
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
    }
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

  // Navigate to Tab3 (AI Cover) immediately — no confirmation
  const goToTab3 = (essayNo: number) => {
    navigate(`/ai-cover?from=job&slug=${slug ?? "samsung"}&essay=${essayNo}`);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <PickdSidebar />

      <div className="flex-1 flex overflow-hidden">
        {/* Main scroll area */}
        <div className="flex-1 overflow-y-auto">

          {/* Sticky top bar */}
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
            <div className="px-8 py-3 flex items-center justify-between">
              <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link to="/" className="hover:text-foreground transition-colors">
                  지원 대시보드
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">{job.company} {job.division ?? ""}</span>
              </nav>

              <div className="flex items-center gap-2">
                {/* 원문 보기 — triggers right slide panel */}
                <Button
                  variant={rawOpen ? "default" : "outline"}
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

          {/* Expired / D-3 notice */}
          {(job.expired || (!job.expired && job.dday !== null && job.dday <= 3)) && (
            <div className="px-8 pt-4">
              <div className={cn(
                "flex items-center gap-2 text-[13px] rounded-lg px-4 py-2.5",
                job.expired
                  ? "bg-muted/40 text-muted-foreground"
                  : "bg-[var(--pickd-red-light,#fff1f2)] text-pickd-red"
              )}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                {job.expired
                  ? "마감된 공고입니다"
                  : `마감 D-${job.dday} · 서류 제출 기한이 얼마 남지 않았습니다`}
              </div>
            </div>
          )}

          {/* Document header — title area */}
          <div className="px-8 pt-6 pb-5 border-b border-border">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                <span className="font-medium text-foreground">{job.company}</span>
                {job.division && (
                  <>
                    <span className="text-border">·</span>
                    <span>{job.division}</span>
                  </>
                )}
                <span className="text-border">·</span>
                <span>{job.role}</span>
              </div>
              <h1 className="text-[26px] font-bold text-foreground tracking-[-0.04em] leading-tight">
                {job.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                <SummaryItem label="지원 기간" value={job.period} />
                <SummaryItem
                  label="마감"
                  value={
                    <span className={cn("font-medium", job.dday !== null && job.dday <= 3 ? "text-pickd-red" : "text-foreground")}>
                      {job.deadline}
                    </span>
                  }
                />
                <SummaryItem
                  label="D-day"
                  value={
                    <span className={cn("font-semibold tabular-nums", job.dday !== null && job.dday <= 3 ? "text-pickd-red" : "text-foreground")}>
                      D-{job.dday}
                    </span>
                  }
                />
                <SummaryItem label="지원 상태" value={
                  <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                    {job.status}
                  </span>
                } />
              </div>

              {/* Essay progress summary */}
              {job.essays.length > 0 && (() => {
                const doneCount = job.essays.filter((e: any) => e.status === "완료").length;
                return (
                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">자소서</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {job.essays.map((e: any) => (
                        <div
                          key={e.no}
                          title={`Q${e.no}: ${e.status}`}
                          className={cn(
                            "w-2.5 h-2.5 rounded-full transition-colors",
                            e.status === "완료" ? "bg-pickd-green" :
                            e.status === "작성중" ? "bg-indigo-500" :
                            e.status === "초안" ? "bg-pickd-orange" :
                            "bg-border"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {doneCount}/{job.essays.length} 완료
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-6 space-y-10 max-w-[900px]">

            {/* Section 1. 기본 정보 */}
            <section>
              <SectionHeader icon={Info} title="1. 기본 정보" subtitle="기본 정보" />
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(job.basic).map(([k, v], i) => (
                      <tr
                        key={k}
                        className={cn(
                          "group border-b border-border/60 last:border-b-0 hover:bg-muted/20",
                          i % 2 === 1 && "bg-muted/10"
                        )}
                      >
                        <td className="w-[160px] px-4 py-2.5 text-xs text-muted-foreground font-medium align-top">
                          {k}
                        </td>
                        <td className="px-4 py-2.5 text-[13px] leading-relaxed">
                          <div className="flex items-start justify-between gap-3">
                            <span className={cn(
                              "break-words",
                              k === "D-day" && job.dday !== null && job.dday <= 3
                                ? "text-pickd-red font-semibold"
                                : "text-foreground"
                            )}>
                              {String(v)}
                            </span>
                            <CopyButton text={String(v)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 2. 지원 핵심 정보 — 중요 표시 기능 포함 */}
            <section>
              <SectionHeader
                icon={ClipboardList}
                title="2. 지원 핵심 정보"
                subtitle="지원 요건"
                rightSlot={
                  highlights.size > 0 && (
                    <button
                      onClick={() => setHighlights(new Set())}
                      className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      강조 {highlights.size}개 초기화
                    </button>
                  )
                }
              />

              {/* Highlight hint — shown once until first highlight */}
              {highlights.size === 0 && (
                <p className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Highlighter className="w-3 h-3" />
                  줄에 마우스를 올리면 중요 표시 버튼이 나타납니다
                </p>
              )}

              <div className="border border-border rounded-lg overflow-hidden">
                {Object.entries(job.eligibility).map(([groupKey, items]: any, i) => (
                  <div
                    key={groupKey}
                    className={cn(
                      "grid grid-cols-[160px_1fr] border-b border-border/60 last:border-b-0",
                      i % 2 === 1 && "bg-muted/10"
                    )}
                  >
                    <div className="px-4 py-3 text-xs font-medium text-muted-foreground border-r border-border/60 self-start pt-3.5">
                      {groupKey}
                    </div>
                    <div className="px-4 py-2">
                      <ul className="space-y-0.5">
                        {items.map((text: string, idx: number) => {
                          const key = hlKey("eligibility", groupKey, idx);
                          return (
                            <HighlightableLine
                              key={idx}
                              lineKey={key}
                              text={text}
                              highlighted={isHighlighted(key)}
                              onToggle={toggleHighlight}
                            />
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3. 전형 정보 */}
            <section>
              <SectionHeader icon={ListChecks} title="3. 전형 정보" subtitle="전형 절차" />
              <div className="relative pl-6">
                {/* 수직 타임라인 선 */}
                <div className="absolute left-2.5 top-3 bottom-3 w-px bg-border" />
                <div className="space-y-3">
                  {job.process.map((p: any, i: number) => (
                    <div key={i} className="relative flex items-start gap-4 group">
                      {/* 스텝 번호 */}
                      <div className="absolute -left-6 flex items-center justify-center w-5 h-5 rounded-full bg-background border-2 border-border group-hover:border-indigo-400 transition-colors mt-2.5">
                        <span className="text-[10px] font-bold text-muted-foreground group-hover:text-indigo-500 transition-colors">{i + 1}</span>
                      </div>
                      <div className="flex-1 border border-border rounded-lg px-4 py-3 hover:bg-muted/20 hover:border-indigo-200 transition-all">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-foreground">{p.step}</p>
                            <p className="text-[12px] text-muted-foreground mt-0.5">{p.detail}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[12px] tabular-nums text-foreground/80">{p.schedule}</p>
                            {p.note && <p className="text-[11px] text-muted-foreground mt-0.5">{p.note}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Section 4. 직무 설명 · 요구 역량 — 중요 표시 포함 */}
            <section>
              <SectionHeader icon={BookOpen} title="4. 직무 설명 · 요구 역량" subtitle="직무 설명" />
              <div className="grid grid-cols-2 gap-3">
                {/* 직무 설명 */}
                <div className="border border-border rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2">직무 설명</h3>
                  <div
                    className={cn(
                      "group/line flex items-start gap-2 px-2 py-1.5 -mx-2 rounded transition-colors",
                      isHighlighted("jd::desc::0")
                        ? "bg-[var(--warning-subtle)]"
                        : "hover:bg-muted/30"
                    )}
                  >
                    <button
                      onClick={() => toggleHighlight("jd::desc::0")}
                      title={isHighlighted("jd::desc::0") ? "강조 해제" : "중요 표시"}
                      className={cn(
                        "shrink-0 mt-0.5 w-4 h-4 flex items-center justify-center rounded transition-all",
                        isHighlighted("jd::desc::0")
                          ? "opacity-100 text-[var(--warning)]"
                          : "opacity-0 group-hover/line:opacity-100 text-muted-foreground hover:text-[var(--warning)]"
                      )}
                    >
                      <Highlighter className="w-3 h-3" />
                    </button>
                    <p className={cn(
                      "text-[13px] leading-relaxed flex-1",
                      isHighlighted("jd::desc::0") ? "text-foreground font-semibold" : "text-foreground"
                    )}>
                      {job.jobDescription}
                    </p>
                  </div>
                </div>

                {/* 요구 역량 */}
                <div className="border border-border rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2">요구 역량</h3>
                  <ul className="space-y-0.5">
                    {job.competencies.map((c: string, i: number) => {
                      const key = hlKey("jd", "competency", i);
                      return (
                        <HighlightableLine
                          key={i}
                          lineKey={key}
                          text={c}
                          highlighted={isHighlighted(key)}
                          onToggle={toggleHighlight}
                        />
                      );
                    })}
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 5. 자소서 문항 */}
            <section>
              <SectionHeader
                icon={PenLine}
                title="5. 자소서 문항"
                subtitle={`${job.essays.length}문항`}
              />

              {job.essays.length === 0 ? (
                <div className="border border-border rounded-lg px-4 py-6 text-center">
                  <p className="text-[13px] text-muted-foreground">이 공고는 별도 문항이 없어요</p>
                </div>
              ) : (
                <ol className="space-y-3">
                  {job.essays.map((e: any, idx: number) => (
                    <li
                      key={e.no}
                      ref={(el) => { essayRefs.current[idx] = el; }}
                      className={cn(
                        "rounded-xl border bg-card transition-shadow hover:shadow-sm",
                        e.status === "작성중" && "border-indigo-200 bg-indigo-50/30",
                        e.status === "초안" && "border-pickd-orange/30 bg-orange-50/20",
                        e.status === "완료" && "border-pickd-green/30 bg-green-50/20",
                        e.status === "미작성" && "border-border",
                      )}
                    >
                      <div className="p-5">
                        {/* 상단: 번호 + 상태 + 메타 + 버튼 */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold",
                              e.status === "완료" ? "bg-pickd-green text-white" :
                              e.status === "작성중" ? "bg-indigo-500 text-white" :
                              e.status === "초안" ? "bg-pickd-orange text-white" :
                              "bg-muted text-muted-foreground"
                            )}>
                              {e.status === "완료" ? <Check className="w-3.5 h-3.5" /> : e.no}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <EssayStatus status={e.status} />
                              <span className="text-[11px] text-muted-foreground tabular-nums">{e.charLimit.toLocaleString()}자 이내</span>
                              {e.updated && <span className="text-[11px] text-muted-foreground/50">수정 {e.updated}</span>}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={e.status === "미작성" ? "outline" : "default"}
                            className={cn(
                              "shrink-0 h-7 text-xs gap-1 whitespace-nowrap rounded-md",
                              e.status !== "미작성" && "bg-indigo-600 hover:bg-indigo-700 text-white border-0"
                            )}
                            onClick={() => goToTab3(e.no)}
                          >
                            <PenLine className="w-3 h-3" />
                            {e.status === "미작성" ? "작성하기" : "이어서 작성하기"}
                          </Button>
                        </div>

                        {/* 문항 */}
                        <p className="text-[14px] font-medium text-foreground leading-relaxed pl-9">
                          {e.question}
                        </p>

                        {/* 작성 내용 미리보기 */}
                        {e.preview && (
                          <div className="mt-3 pl-9">
                            <div className="relative bg-background border border-border/60 rounded-lg px-4 py-3">
                              <div className="absolute top-3 left-3 w-0.5 h-[calc(100%-24px)] bg-indigo-300 rounded-full" />
                              <p className="pl-3 text-[13px] text-foreground/75 leading-relaxed line-clamp-3">
                                {e.preview}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 미작성 안내 */}
                        {!e.preview && e.status === "미작성" && (
                          <p className="mt-2 pl-9 text-[12px] text-muted-foreground/50">아직 작성된 내용이 없어요</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <div className="h-12" />
          </div>
        </div>

        {/* Right slide panel: raw source */}
        <aside
          className={cn(
            "border-l border-border flex flex-col shrink-0 transition-all duration-300 overflow-hidden",
            rawOpen ? "w-[440px]" : "w-0"
          )}
        >
          {rawOpen && (
            <div className="flex flex-col h-full w-[440px]">
              {/* Panel header */}
              <div className="px-5 py-3.5 border-b border-border bg-muted/30 flex items-center justify-between shrink-0 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                    <ScrollText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground leading-tight">원문 공고</p>
                    <p className="text-[11px] text-muted-foreground truncate">{job.company} · 원본 채용공고문</p>
                  </div>
                </div>
                <button
                  onClick={() => setRawOpen(false)}
                  className="w-7 h-7 rounded-md hover:bg-muted border border-transparent hover:border-border text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
                <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                  {/* Mini toolbar */}
                  <div className="px-4 py-2 border-b border-border/60 bg-muted/20 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                      {job.rawSource.length.toLocaleString()}자
                    </span>
                    <CopyButton text={job.rawSource} label="전체 복사" />
                  </div>
                  {/* Raw text */}
                  <pre className="p-5 text-[12px] leading-[1.85] text-foreground/80 whitespace-pre-wrap font-mono select-text">
                    {job.rawSource}
                  </pre>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-border bg-muted/30 shrink-0 flex items-center justify-between gap-2">
                <p className="text-[11px] text-muted-foreground">원본 공고 출처</p>
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
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

function SummaryItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
