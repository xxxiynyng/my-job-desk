/**
 * Onboarding.tsx — Pickd 온보딩 v2.1 (하이브리드: 필수 2단계 + 점진 수집)
 *
 * v2 → v2.1
 * - 데이터셋 분리·확장: onboardingData.ts (학교 118, 전공 100+, 직무 12군 78종, 산업 16) — DATA_VERSION 관리
 * - 관심 직무 검색: 카테고리 트리 + 전체 직무 검색 필드
 * - 졸업년도 동적 생성(현재년도 ±6), 프로필 타입(PickdProfileV1) 적용
 * - 디자인 폴리시: 입력 포커스 링 통일, 픽 카드 칩 +N 캡, 선택 직무 요약 칩
 *
 * 통합 규칙 (CLAUDE.md · 디자인 시스템 SSOT)
 * - 페이지 default export / 보조 named export, sonner "~어요" 체, 데스크톱 전용
 * - shadcn 시맨틱 토큰만 사용 / radius: 버튼·입력 rounded-lg(8px), 카드 rounded-xl(12px), 선택 칩 pill
 *
 * localStorage 키 — v1과 호환
 * - pickd.onboarding.state.v1 / pickd.onboarding.done.v1 / pickd.profile.v1 / specs.info.values.v2
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, ChevronLeft, Search, Sparkles, X } from "lucide-react";
import {
  CAREER_YEARS, CORP_TYPES, DATA_VERSION, DEGREES, FOCUSES, INDUSTRIES, JOB_TREE, MAJORS,
  PERSONAS, REGIONS, SCHOOLS, STUDENT_PERSONAS, TIMINGS, gradYears, type PickdProfileV1,
} from "./onboardingData";

const LS = {
  state: "pickd.onboarding.state.v1",
  done: "pickd.onboarding.done.v1",
  profile: "pickd.profile.v1",
  infoValues: "specs.info.values.v2",
} as const;

type Step = "login" | "terms" | "me" | "pick" | "complete";
const ONB_STEPS: Step[] = ["me", "pick"];

interface OnbState {
  step: Step;
  googleEmail: string;
  googleName: string;
  agree: { age: boolean; tos: boolean; priv: boolean; mkt: boolean };
  nickname: string;
  persona: string;
  careerYears: string;
  school: string;
  major: string;
  gradY: string;
  jobCat: string;
  jobs: string[];
  inds: string[];
  timing: string;
  workRegions: string[];
  docs: { resume: boolean; essay: boolean; portfolio: boolean };
}

const INITIAL: OnbState = {
  step: "login",
  googleEmail: "", googleName: "",
  agree: { age: false, tos: false, priv: false, mkt: false },
  nickname: "", persona: "", careerYears: "",
  school: "", major: "", gradY: "",
  jobCat: Object.keys(JOB_TREE)[0], jobs: [], inds: [], timing: "",
  workRegions: [],
  docs: { resume: false, essay: false, portfolio: false },
};

function loadState(): OnbState {
  try {
    const raw = localStorage.getItem(LS.state);
    if (raw) return { ...INITIAL, ...JSON.parse(raw) };
  } catch { /* 손상된 상태는 초기화 */ }
  return INITIAL;
}

/* ─────────────────────── 구글 로그인 (GIS) ─────────────────────── */

declare global {
  interface Window { google?: any }
}

function useGoogleLogin(onSuccess: (email: string, name: string) => void) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const btnRef = useRef<HTMLDivElement>(null);
  const [gisReady, setGisReady] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    if (window.google?.accounts?.id) { setGisReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => setGisReady(true);
    document.head.appendChild(s);
  }, [clientId]);

  useEffect(() => {
    if (!clientId || !gisReady || !btnRef.current) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (res: { credential: string }) => {
        try {
          const payload = JSON.parse(atob(res.credential.split(".")[1]));
          onSuccess(payload.email ?? "", payload.name ?? "");
        } catch {
          toast.error("로그인 정보를 읽지 못했어요. 다시 시도해 주세요.");
        }
      },
    });
    window.google.accounts.id.renderButton(btnRef.current, {
      theme: "outline", size: "large", width: 320, text: "continue_with", locale: "ko",
    });
  }, [clientId, gisReady, onSuccess]);

  return { clientId, btnRef };
}

/* ─────────────────────────── 페이지 ─────────────────────────── */

export default function Onboarding() {
  const navigate = useNavigate();
  const [s, setS] = useState<OnbState>(loadState);
  const [boostOpen, setBoostOpen] = useState(false);
  const [jobQuery, setJobQuery] = useState("");
  const nickRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(LS.state, JSON.stringify(s));
  }, [s]);

  useEffect(() => {
    if (s.step === "me") nickRef.current?.focus();
  }, [s.step]);

  const up = useCallback((patch: Partial<OnbState>) => setS(p => ({ ...p, ...patch })), []);
  const go = useCallback((step: Step) => { setS(p => ({ ...p, step })); window.scrollTo({ top: 0 }); }, []);

  const toggleIn = (arr: string[], v: string, max: number): string[] => {
    if (arr.includes(v)) return arr.filter(x => x !== v);
    if (arr.length >= max) { toast(`최대 ${max}개까지 선택할 수 있어요`); return arr; }
    return [...arr, v];
  };

  /* ── 파생 상태 ── */
  const isStudent = STUDENT_PERSONAS.includes(s.persona);
  const isCareer = s.persona === "경력";
  const nickOk = s.nickname.trim().length >= 2;
  const valid: Record<Step, boolean> = {
    login: true,
    terms: s.agree.age && s.agree.tos && s.agree.priv,
    me: nickOk && !!s.persona && !!s.school && !!s.major && (!isStudent || !!s.gradY) && (!isCareer || !!s.careerYears),
    pick: s.jobs.length > 0 && s.inds.length > 0 && !!s.timing,
    complete: true,
  };

  // 예상 매칭 공고 수 — 입력의 즉시 보상 (결정적 의사값, 백엔드 연동 시 교체 지점)
  const matchCount = useMemo(() => {
    if (s.jobs.length === 0) return 0;
    return s.jobs.length * 34 + s.inds.length * 11 + (s.timing ? 8 : 0);
  }, [s.jobs, s.inds, s.timing]);

  // 직무 검색 결과 (카테고리 횡단)
  const jobHits = useMemo(() => {
    const q = jobQuery.trim();
    if (!q) return [];
    const hits: { cat: string; job: string }[] = [];
    Object.entries(JOB_TREE).forEach(([cat, jobs]) => {
      jobs.forEach(j => { if (j.includes(q) || cat.includes(q)) hits.push({ cat, job: j }); });
    });
    return hits.slice(0, 20);
  }, [jobQuery]);

  const pickChips = useMemo(() => {
    const c: string[] = [];
    if (s.persona) c.push(`👤 ${s.persona}${isCareer && s.careerYears ? ` ${s.careerYears}` : ""}`);
    if (s.school) c.push(`🎓 ${s.school}`);
    if (s.major) c.push(s.major);
    s.jobs.forEach(j => c.push(j));
    s.inds.forEach(i => c.push(`#${i}`));
    if (s.timing) c.push(`🗓 ${s.timing}`);
    s.workRegions.forEach(r => c.push(`📍 ${r}`));
    return c;
  }, [s, isCareer]);

  /* ── 완료: 기존 데이터 구조에 병합 + pending 큐 생성 ── */
  const finish = useCallback(() => {
    // 1) specs.info.values.v2 비파괴 병합
    let info: Record<string, string> = {};
    try { info = JSON.parse(localStorage.getItem(LS.infoValues) ?? "{}"); } catch { /* noop */ }
    const merged: Record<string, string> = { ...info };
    const fill = (k: string, v: string) => { if (v && !merged[k]) merged[k] = v; };
    fill("name", s.nickname);
    fill("email", s.googleEmail);
    fill("school", s.school);
    fill("major", s.major);
    fill("gradYear", s.gradY);
    localStorage.setItem(LS.infoValues, JSON.stringify(merged));

    // 2) 점진 수집 대상 계산 (온보딩에서 받지 않은 항목)
    const pending: string[] = ["degree", "gpa", "region", "corps", "focus"];
    if (isStudent) pending.push("gradM");
    if (!s.gradY) pending.push("gradY");
    if (s.workRegions.length === 0) pending.push("workRegions");
    if (!s.docs.resume && !s.docs.essay && !s.docs.portfolio) pending.push("docs");

    const answered = 9 + (s.workRegions.length > 0 ? 1 : 0) + (s.docs.resume || s.docs.essay || s.docs.portfolio ? 1 : 0);
    const completeness = Math.round((answered / (answered + pending.length)) * 100);

    // 3) 프로필 저장 (v1 소비처 호환 필드 유지)
    const profile: PickdProfileV1 = {
      nickname: s.nickname,
      persona: s.persona,
      status: isCareer ? "졸업" : s.persona,           // v1 status 소비처 호환
      career: isCareer ? "경력" : "신입",               // v1 career 소비처 호환
      careerYears: s.careerYears,
      gradY: s.gradY,
      jobs: s.jobs, industries: s.inds,
      timing: s.timing,
      workRegions: s.workRegions, docs: s.docs,
      corpTypes: [], focus: [],                         // 점진 수집으로 채워짐
      marketingOptIn: s.agree.mkt,
      pending, snoozed: {}, completeness,
      completedAt: new Date().toISOString(),
      dataVersion: DATA_VERSION,
    };
    localStorage.setItem(LS.profile, JSON.stringify(profile));

    localStorage.setItem(LS.done, "1");
    localStorage.removeItem(LS.state);
    toast.success("픽 카드를 저장했어요");
    navigate("/", { replace: true });
  }, [s, isCareer, isStudent, navigate]);

  /* ─────────────────────── 공통 UI 조각 ─────────────────────── */

  const Progress = () => {
    const idx = ONB_STEPS.indexOf(s.step as (typeof ONB_STEPS)[number]);
    return (
      <div className="mb-8 flex items-center gap-3">
        <div className="flex flex-1 gap-1.5">
          {[0, 1].map(i => (
            <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= idx ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
        <span className="text-xs font-bold text-muted-foreground">{idx + 1} / 2</span>
      </div>
    );
  };

  const CHIP_CAP = 12;
  const PickCard = ({ standalone = false }: { standalone?: boolean }) => (
    <aside
      aria-label="내 픽 카드"
      className={cn(
        "rounded-xl bg-primary text-primary-foreground p-6 shadow-lg",
        standalone ? "w-[360px]" : "w-[300px] sticky top-6 shrink-0"
      )}
    >
      <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wide opacity-85">
        <Sparkles className="h-3.5 w-3.5" /> MY PICK CARD
      </h3>
      <div className="mt-2 min-h-[28px] text-xl font-extrabold">{s.nickname ? `${s.nickname}님` : " "}</div>
      {matchCount > 0 ? (
        <div className="text-xs opacity-90">지금 조건에 맞는 공고 <b>{matchCount}건</b>을 찾았어요</div>
      ) : (
        <div className="text-xs opacity-70">입력할수록 공고 추천이 정확해져요</div>
      )}
      <div className="mt-4 flex min-h-[32px] flex-wrap gap-1.5">
        {pickChips.length === 0 ? (
          <span className="py-1 text-xs opacity-60">아직 담긴 정보가 없어요</span>
        ) : (
          <>
            {pickChips.slice(0, CHIP_CAP).map(c => (
              <span key={c} className="rounded-full border border-primary-foreground/30 bg-primary-foreground/15 px-2.5 py-1 text-xs">{c}</span>
            ))}
            {pickChips.length > CHIP_CAP && (
              <span className="rounded-full bg-primary-foreground/25 px-2.5 py-1 text-xs font-bold">+{pickChips.length - CHIP_CAP}</span>
            )}
          </>
        )}
      </div>
      <div className="mt-4 border-t border-primary-foreground/20 pt-3 text-chip leading-relaxed opacity-75">
        여기 담긴 정보는 전부 내 자산이 돼요.<br />언제든 마이페이지에서 수정할 수 있어요.
      </div>
    </aside>
  );

  const NavRow = ({ prev, next, ok, reason }: { prev: Step; next: Step; ok: boolean; reason: string }) => (
    <div className="mt-8">
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => go(prev)}
          className="rounded-lg border border-border bg-background px-5 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-foreground/30"
        >
          <ChevronLeft className="-ml-1 mr-0.5 inline h-4 w-4" />이전
        </button>
        <button
          type="button"
          disabled={!ok}
          onClick={() => go(next)}
          className={cn(
            "flex-1 rounded-lg px-5 py-3 text-sm font-bold transition-colors",
            ok ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          다음
        </button>
      </div>
      {!ok && <p className="mt-2 text-right text-xs text-muted-foreground">{reason}</p>}
    </div>
  );

  const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        on ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border bg-background hover:border-primary/50"
      )}
    >
      {children}
    </button>
  );

  const Label = ({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) => (
    <div className="mb-2 flex items-baseline justify-between">
      <span className="text-sm font-bold">{children}</span>
      {right}
    </div>
  );

  const inputCls = "w-full rounded-lg border border-border bg-background px-3.5 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

  /* ─────────────────────────── 단계별 화면 ─────────────────────────── */

  const onGoogle = useCallback((email: string, name: string) => {
    setS(p => ({ ...p, googleEmail: email, googleName: name, step: "terms" }));
  }, []);
  const { clientId, btnRef } = useGoogleLogin(onGoogle);

  if (s.step === "login") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-3xl font-extrabold text-primary-foreground shadow-lg">P</div>
        <h1 className="text-3xl font-extrabold leading-snug tracking-tight">
          흩어진 취업 준비,<br />여기서 <span className="text-primary">픽</span>.
        </h1>
        <p className="mt-3 text-muted-foreground">1분이면 나에게 맞는 공고 추천이 시작돼요</p>

        {clientId ? (
          <div ref={btnRef} className="mt-10" />
        ) : (
          <button
            type="button"
            onClick={() => onGoogle("demo.user@gmail.com", "데모 사용자")}
            className="mt-10 inline-flex items-center gap-3 rounded-lg border border-border bg-background px-7 py-3.5 text-sm font-bold shadow-sm transition-shadow hover:shadow"
          >
            <GoogleG /> Google로 계속하기
          </button>
        )}
        <p className="mt-4 max-w-xs text-xs text-muted-foreground">
          {clientId ? "구글 계정으로 바로 시작할 수 있어요. 약관은 다음 단계에서 확인해요."
            : "데모 모드예요 — VITE_GOOGLE_CLIENT_ID를 설정하면 실제 구글 로그인이 붙어요."}
        </p>
        <div className="mt-14 flex gap-6 text-xs text-muted-foreground">
          <span><b className="text-foreground">공고·일정</b> 한눈에</span>
          <span><b className="text-foreground">경험</b>은 한 번만 정리</span>
          <span><b className="text-foreground">AI 자소서</b> 초안까지</span>
        </div>
      </div>
    );
  }

  if (s.step === "terms") {
    const a = s.agree;
    const all = a.age && a.tos && a.priv && a.mkt;
    const TermRow = ({ k, label, opt }: { k: keyof OnbState["agree"]; label: string; opt?: boolean }) => (
      <button type="button" onClick={() => up({ agree: { ...a, [k]: !a[k] } })} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm">
        <CheckBox on={a[k]} />
        <span className={cn("text-xs font-bold", opt ? "text-muted-foreground" : "text-primary")}>[{opt ? "선택" : "필수"}]</span>
        {label}
      </button>
    );
    return (
      <Shell>
        <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-8">
          <p className="mb-2 text-xs font-bold text-primary">시작하기 전에</p>
          <h1 className="text-2xl font-extrabold leading-snug">서비스 이용을 위해<br />약관에 동의해 주세요</h1>
          <div className="mt-6 space-y-1">
            <button
              type="button"
              onClick={() => { const v = !all; up({ agree: { age: v, tos: v, priv: v, mkt: v } }); }}
              className="flex w-full items-center gap-3 rounded-lg border border-primary bg-primary/10 px-4 py-3.5 text-sm font-extrabold"
            >
              <CheckBox on={all} /> 전체 동의할게요
            </button>
            <TermRow k="age" label="만 14세 이상이에요" />
            <TermRow k="tos" label="이용약관 동의" />
            <TermRow k="priv" label="개인정보 수집·이용 동의" />
            <TermRow k="mkt" label="합격에 도움되는 공고·일정 소식 받기" opt />
            {a.mkt && (
              <p className="ml-12 rounded-lg bg-muted px-3 py-2.5 text-xs text-muted-foreground">
                관심 직무의 새 공고, 마감 임박 알림, 채용 설명회 소식을 보내드려요. 언제든 끌 수 있어요.
              </p>
            )}
          </div>
          <NavRow prev="login" next="me" ok={valid.terms} reason="필수 항목 3개에 동의하면 계속할 수 있어요" />
        </div>
      </Shell>
    );
  }

  if (s.step === "complete") {
    const boostDone = s.workRegions.length > 0 || s.docs.resume || s.docs.essay || s.docs.portfolio;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-10">
        <PickCard standalone />
        <h1 className="mt-8 text-2xl font-extrabold">픽 카드 완성! 🎉</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {matchCount > 0 ? <>맞는 공고 <b className="text-foreground">{matchCount}건</b>이 기다리고 있어요.</> : "이 정보로 맞춤 공고를 찾아드릴게요."}
          <br />나머지 정보는 쓰면서 채워도 충분해요.
        </p>

        {/* 선택 부스트 — 건너뛰어도 시작 가능 */}
        <div className="mt-6 w-[360px] rounded-xl border border-border bg-card">
          <button
            type="button"
            onClick={() => setBoostOpen(o => !o)}
            className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-bold"
          >
            <span>⚡ 30초 부스트 <span className="ml-1 text-xs font-semibold text-muted-foreground">선택 · 추천이 더 정확해져요</span></span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", boostOpen && "rotate-180")} />
          </button>
          {boostOpen && (
            <div className="space-y-4 border-t border-border px-5 py-4">
              <div>
                <Label right={<span className="text-xs text-muted-foreground">최대 3개</span>}>희망 근무 지역</Label>
                <div className="flex flex-wrap gap-1.5">
                  {REGIONS.map(r => (
                    <Chip key={r} on={s.workRegions.includes(r)} onClick={() => up({ workRegions: toggleIn(s.workRegions, r, 3) })}>{r}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <Label>이미 갖고 있는 자료</Label>
                <div className="space-y-2">
                  {([["resume", "이력서"], ["essay", "자기소개서"], ["portfolio", "포트폴리오"]] as const).map(([k, l]) => (
                    <div key={k} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm">
                      {l}
                      <button
                        type="button" role="switch" aria-checked={s.docs[k]} aria-label={`${l} 보유`}
                        onClick={() => up({ docs: { ...s.docs, [k]: !s.docs[k] } })}
                        className={cn("relative h-6 w-11 rounded-full transition-colors", s.docs[k] ? "bg-primary" : "bg-muted")}
                      >
                        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all", s.docs[k] ? "left-[22px]" : "left-0.5")} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={finish}
          className="mt-6 w-[360px] rounded-lg bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {boostDone ? "Pickd 시작하기" : "이대로 시작하기"}
        </button>
      </div>
    );
  }

  /* ── 정보등록 2단계 (공통 2단 레이아웃: 폼 + 픽 카드) ── */
  return (
    <Shell>
      <Progress />
      <div className="flex items-start gap-8">
        <div className="min-w-0 flex-1 rounded-xl border border-border bg-card p-8">

          {s.step === "me" && (
            <>
              <StepHead n={1} q="먼저, 어떻게 불러드릴까요?" sub="학점·거주지역 같은 건 나중에 채워도 돼요. 딱 필요한 것만 물어볼게요." />
              <div className="mt-6 space-y-5">
                <div>
                  <Label>닉네임</Label>
                  <input
                    ref={nickRef} className={inputCls} maxLength={10} placeholder="2~10자"
                    value={s.nickname} onChange={e => up({ nickname: e.target.value })}
                    onKeyDown={e => { if (e.key === "Enter" && valid.me) go("pick"); }}
                  />
                  <p className={cn("mt-1.5 text-xs", !s.nickname ? "text-muted-foreground" : nickOk ? "text-primary" : "text-destructive")}>
                    {!s.nickname ? "서비스에서 표시될 이름이에요" : nickOk ? "사용할 수 있는 닉네임이에요" : "2자 이상 입력해 주세요"}
                  </p>
                </div>
                <div>
                  <Label>지금 상태</Label>
                  <div className="flex overflow-hidden rounded-lg border border-border">
                    {PERSONAS.map((p, i) => (
                      <button
                        key={p} type="button"
                        onClick={() => up({ persona: p, careerYears: p === "경력" ? s.careerYears : "", gradY: STUDENT_PERSONAS.includes(p) ? s.gradY : "" })}
                        className={cn(
                          "flex-1 py-2.5 text-sm transition-colors", i > 0 && "border-l border-border",
                          s.persona === p ? "bg-primary font-bold text-primary-foreground" : "bg-background hover:bg-muted"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                {isCareer && (
                  <div>
                    <Label>총 경력</Label>
                    <select className={inputCls} value={s.careerYears} onChange={e => up({ careerYears: e.target.value })}>
                      <option value="">선택해 주세요</option>
                      {CAREER_YEARS.map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label>학교명</Label>
                    <AutoComplete value={s.school} placeholder="학교명 검색" pool={SCHOOLS} onChange={v => up({ school: v })} inputCls={inputCls} />
                  </div>
                  <div>
                    <Label>전공</Label>
                    <AutoComplete value={s.major} placeholder="전공 검색" pool={MAJORS} onChange={v => up({ major: v })} inputCls={inputCls} />
                  </div>
                </div>
                <p className="-mt-3 text-xs text-muted-foreground">목록에 없다면 그대로 입력해도 돼요.</p>
                {isStudent && (
                  <div>
                    <Label>졸업 예정 년도</Label>
                    <select className={inputCls} value={s.gradY} onChange={e => up({ gradY: e.target.value })}>
                      <option value="">선택해 주세요</option>
                      {gradYears().map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <NavRow prev="terms" next="pick" ok={valid.me} reason="닉네임·상태·학교·전공을 입력하면 계속할 수 있어요" />
            </>
          )}

          {s.step === "pick" && (
            <>
              <StepHead n={2} q="어떤 일을 하고 싶으세요?" sub="이 선택으로 공고 적합도를 계산하고 맞춤 추천을 만들어요." />
              <div className="mt-6 space-y-5">
                <div>
                  <Label right={<span className="text-xs text-muted-foreground">1~5개 · 선택 {s.jobs.length}</span>}>관심 직무</Label>
                  {/* 직무 검색 — 카테고리 횡단 */}
                  <div className="relative mb-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      className={cn(inputCls, "py-2.5 pl-9")}
                      placeholder="직무 검색 (예: 마케터, 데이터)"
                      value={jobQuery}
                      onChange={e => setJobQuery(e.target.value)}
                    />
                  </div>
                  {jobQuery.trim() ? (
                    <div className="max-h-[290px] space-y-0.5 overflow-auto rounded-lg border border-border p-2.5">
                      {jobHits.length === 0 ? (
                        <p className="px-2.5 py-2 text-xs text-muted-foreground">검색 결과가 없어요 — 다른 키워드로 찾아보세요</p>
                      ) : jobHits.map(({ cat, job }) => (
                        <label key={`${cat}/${job}`} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-muted">
                          <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={s.jobs.includes(job)} onChange={() => up({ jobs: toggleIn(s.jobs, job, 5) })} />
                          <span>{job}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{cat}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="grid min-h-[250px] grid-cols-[160px_1fr] overflow-hidden rounded-lg border border-border">
                      <div className="flex max-h-[320px] flex-col overflow-y-auto border-r border-border bg-muted/50">
                        {Object.keys(JOB_TREE).map(c => (
                          <button
                            key={c} type="button" onClick={() => up({ jobCat: c })}
                            className={cn("shrink-0 border-b border-border px-3.5 py-3 text-left text-sm", s.jobCat === c && "bg-card font-bold text-primary shadow-[inset_3px_0_0] shadow-primary")}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                      <div className="max-h-[320px] space-y-0.5 overflow-auto p-2.5">
                        {(JOB_TREE[s.jobCat] ?? []).map(j => (
                          <label key={j} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-muted">
                            <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={s.jobs.includes(j)} onChange={() => up({ jobs: toggleIn(s.jobs, j, 5) })} />
                            {j}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* 선택된 직무 요약 — 어느 카테고리에 있든 한눈에 확인·해제 */}
                  {s.jobs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {s.jobs.map(j => (
                        <button
                          key={j} type="button"
                          onClick={() => up({ jobs: s.jobs.filter(x => x !== j) })}
                          className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                        >
                          {j} <X className="h-3 w-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label right={<span className="text-xs text-muted-foreground">1~3개</span>}>관심 산업</Label>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map(i => <Chip key={i} on={s.inds.includes(i)} onClick={() => up({ inds: toggleIn(s.inds, i, 3) })}>{i}</Chip>)}
                  </div>
                </div>
                <div>
                  <Label>지원 예정 시기</Label>
                  <div className="flex flex-wrap gap-2">
                    {TIMINGS.map(t => <Chip key={t} on={s.timing === t} onClick={() => up({ timing: t })}>{t}</Chip>)}
                  </div>
                </div>
              </div>
              <NavRow prev="me" next="complete" ok={valid.pick} reason="관심 직무·산업·지원 시기를 선택하면 계속할 수 있어요" />
            </>
          )}
        </div>
        <PickCard />
      </div>
    </Shell>
  );
}

/* ─────────────────────── 보조 컴포넌트 (named export 규칙) ─────────────────────── */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-5 py-6">
        <div className="mb-6 flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground">P</span>
          Pickd
        </div>
        {children}
      </div>
    </div>
  );
}

function StepHead({ n, q, sub }: { n: number; q: React.ReactNode; sub?: string }) {
  return (
    <>
      <p className="text-xs font-bold text-primary">온보딩 {n} / 2</p>
      <h1 className="mt-2 text-2xl font-extrabold leading-snug tracking-tight">{q}</h1>
      {sub && <p className="mt-1.5 text-sm text-muted-foreground">{sub}</p>}
    </>
  );
}

function CheckBox({ on }: { on: boolean }) {
  return (
    <span className={cn("flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border text-primary-foreground transition-colors", on ? "border-primary bg-primary" : "border-border")}>
      {on && <Check className="h-3.5 w-3.5" />}
    </span>
  );
}

function AutoComplete({ value, pool, placeholder, onChange, inputCls }: {
  value: string; pool: string[]; placeholder: string; onChange: (v: string) => void; inputCls: string;
}) {
  const [open, setOpen] = useState(false);
  const hits = value && pool.length ? pool.filter(p => p.includes(value)).slice(0, 8) : [];
  return (
    <div className="relative">
      <input
        className={inputCls} value={value} placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && value && pool.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-52 overflow-auto rounded-lg border border-border bg-popover shadow-lg">
          {hits.length ? hits.map(h => (
            <button key={h} type="button" className="block w-full px-3.5 py-2.5 text-left text-sm hover:bg-muted" onMouseDown={() => { onChange(h); setOpen(false); }}>
              {h}
            </button>
          )) : (
            <p className="px-3.5 py-2.5 text-xs text-muted-foreground">검색 결과가 없어요 — 입력한 그대로 저장돼요</p>
          )}
        </div>
      )}
    </div>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/>
    </svg>
  );
}
