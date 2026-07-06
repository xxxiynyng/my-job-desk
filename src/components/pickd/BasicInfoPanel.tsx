import { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy, Pencil, Check, X, Eye, EyeOff, Plus,
  User, Mail, GraduationCap, School, Link2, ShieldCheck, Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  INFO_FIELDS, INFO_DEFAULTS, DEFAULT_VISIBLE, LS_INFO_VALUES, LS_INFO_VISIBLE,
  INFO_VALUES_EVENT, type InfoKey,
} from "@/data/basicInfoFields";

// ── Types & constants ──────────────────────────────────────────
// InfoKey / INFO_FIELDS / INFO_DEFAULTS / LS_INFO_VALUES 는 SSOT(@/data/basicInfoFields)로 이관.

// 뷰 모드 정보구조: 인적사항 / 연락처 / 학력 / 고등학교 / 온라인 프로필 / 어학 / IT활용능력 / 병역·면허
const FIELD_GROUPS: { title: string; keys: InfoKey[] }[] = [
  { title: "인적사항",      keys: ["name", "hanjaName", "engName", "birth", "gender", "nationality"] },
  { title: "연락처",        keys: ["email", "phone", "address"] },
  { title: "학력",          keys: ["school", "major", "grade", "dayNight", "campus", "enrollYear", "gradYear", "gpa", "majorGpa", "minor", "transfer"] },
  { title: "고등학교",      keys: ["hsSchool", "hsLocation", "hsEnroll", "hsGrad", "hsGradStatus"] },
  { title: "온라인 프로필", keys: ["portfolioUrl", "github", "linkedin", "blog"] },
  { title: "병역·면허",     keys: ["military", "veteran", "disability", "national", "driverLicense"] },
];

// 섹션 카드 아이콘 (뷰 모드 개편, 2026-07-02)
const GROUP_ICON: Record<string, LucideIcon> = {
  "인적사항": User,
  "연락처": Mail,
  "학력": GraduationCap,
  "고등학교": School,
  "온라인 프로필": Link2,
  "병역·면허": ShieldCheck,
};
// 프로필 헤더에 대표로 노출하는 필드 — 섹션 카드에서는 제외(중복 방지)
const HEADER_KEYS: InfoKey[] = ["name", "hanjaName", "engName"];

type FileItem = { id: string; kind: string; name: string; fileKind: "pdf" | "image"; url?: string };

const LS_PHOTO_SHOWN  = "specs.basicPhoto.shown";
const LS_PHOTO_ID     = "specs.basicPhoto.id";
const LS_FILES        = "specs.files.v1";
const LS_LANG_EXAMS   = "specs.info.langExams.v1";

function lsGet<T>(k: string, fallback: T): T {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback; }
  catch { return fallback; }
}
function lsSet(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

const MIL_OPTS       = ["해당 없음", "군필", "미필", "면제", "복무 중"];
const YES_NO         = ["해당 없음", "대상", "비대상"];
const LIC_OPTS       = ["없음", "1종 보통", "1종 대형", "2종 보통", "2종 소형", "기타"];
const TRANS_OPTS     = ["해당 없음", "편입"];
const GENDER_OPTS    = ["선택 안 함", "남성", "여성"];
const HS_GRAD_OPTS   = ["졸업", "졸업예정", "재학 중", "해당 없음"];

type LangExam = { id: string; lang: string; examName: string; score: string; date: string; expiry: string };

// ── Panel ─────────────────────────────────────────────────────
// 기본정보 탭 콘텐츠. 사이드바/페이지 셸은 호출하는 쪽(통합 허브)에서 처리합니다.

export function BasicInfoPanel() {
  const [infoVisible, setInfoVisible] = useState<InfoKey[]>(() => lsGet<InfoKey[]>(LS_INFO_VISIBLE, DEFAULT_VISIBLE));
  const [infoValues,  setInfoValues]  = useState<Record<string, string>>(() => ({ ...INFO_DEFAULTS, ...lsGet<Record<string, string>>(LS_INFO_VALUES, {}) }));
  const [photoShown,  setPhotoShown]  = useState<boolean>(() => lsGet<boolean>(LS_PHOTO_SHOWN, true));
  const [basicPhotoId, setBasicPhotoId] = useState<string>(() => lsGet<string>(LS_PHOTO_ID, "f0"));
  const [files, setFiles]             = useState<FileItem[]>(() => lsGet<FileItem[]>(LS_FILES, []));

  // 파일함(FilesPanel)에서 대표사진 지정·파일 변경 시 즉시 반영 — 같은 문서에선 storage 이벤트가
  // 안 뜨므로 커스텀 이벤트로 동기화(2026-07-02, 증명사진↔기본정보 연결 완성).
  useEffect(() => {
    const sync = () => {
      setBasicPhotoId(lsGet<string>(LS_PHOTO_ID, "f0"));
      setPhotoShown(lsGet<boolean>(LS_PHOTO_SHOWN, true));
      setFiles(lsGet<FileItem[]>(LS_FILES, []));
    };
    window.addEventListener("pickd:basicPhoto", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("pickd:basicPhoto", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const [langExams, setLangExams]     = useState<LangExam[]>(() => lsGet<LangExam[]>(LS_LANG_EXAMS, []));
  const [draftLangExams, setDraftLangExams] = useState<LangExam[]>([]);

  // 값만 마스킹하는 로컬 토글 (저장 불필요)
  const [masked, setMasked] = useState<Set<InfoKey>>(new Set());

  const [editMode, setEditMode]               = useState(false);
  const [draft, setDraft]                     = useState<Record<string, string>>(infoValues);
  const [draftVisible, setDraftVisible]       = useState<InfoKey[]>(infoVisible);
  const [draftPhotoShown, setDraftPhotoShown] = useState(photoShown);

  // 필드별 인라인 편집
  const [inlineKey,   setInlineKey]   = useState<InfoKey | null>(null);
  const [inlineDraft, setInlineDraft] = useState("");
  const inlineRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inlineKey) {
      inlineRef.current?.select();
      inlineRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [inlineKey]);

  const startInline = (k: InfoKey) => {
    setInlineKey(k);
    setInlineDraft(infoValues[k] ?? "");
  };
  const commitInline = () => {
    if (inlineKey) {
      setInfoValues((p) => ({ ...p, [inlineKey]: inlineDraft }));
      toast("저장됐어요", { duration: 900 });
    }
    setInlineKey(null);
  };
  const cancelInline = () => setInlineKey(null);

  useEffect(() => {
    lsSet(LS_INFO_VISIBLE, infoVisible);
    // 표시 필드가 완성도 분모에 영향 → 훅(배너·카드)에 즉시 반영
    window.dispatchEvent(new CustomEvent(INFO_VALUES_EVENT));
  }, [infoVisible]);
  useEffect(() => {
    lsSet(LS_INFO_VALUES, infoValues);
    // 완성도 훅(대시보드 배너·탭2 카드)에 즉시 반영
    window.dispatchEvent(new CustomEvent(INFO_VALUES_EVENT));
  }, [infoValues]);
  useEffect(() => lsSet(LS_PHOTO_SHOWN,  photoShown),  [photoShown]);
  useEffect(() => lsSet(LS_LANG_EXAMS,  langExams),   [langExams]);

  const copy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast("복사했어요", { duration: 1200 });
  };

  // 섹션 전체를 "라벨: 값" 여러 줄로 복사 — 지원서 폼에 붙여넣기 편하게(복붙 워크플로 핵심).
  const copySection = (title: string, fields: { key: InfoKey; label: string }[]) => {
    const lines = fields
      .filter((f) => infoValues[f.key])
      .map((f) => `${f.label}: ${infoValues[f.key]}`);
    if (lines.length === 0) { toast("복사할 값이 없어요", { duration: 1200 }); return; }
    navigator.clipboard.writeText(lines.join("\n"));
    toast(`${title} ${lines.length}개 항목을 복사했어요`, { duration: 1400 });
  };

  const toggleMask = (k: InfoKey) =>
    setMasked((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });

  const enterEdit = () => {
    setDraft({ ...infoValues });
    setDraftVisible([...infoVisible]);
    setDraftPhotoShown(photoShown);
    setDraftLangExams([...langExams]);
    setEditMode(true);
  };

  const save = () => {
    setInfoValues(draft);
    setInfoVisible(draftVisible);
    setPhotoShown(draftPhotoShown);
    setLangExams(draftLangExams);
    setEditMode(false);
    toast("저장됐어요", { duration: 1200 });
  };

  const cancel = () => setEditMode(false);

  const addLangExam = () =>
    setDraftLangExams((p) => [...p, { id: String(Date.now()), lang: "", examName: "", score: "", date: "", expiry: "" }]);
  const removeLangExam = (idx: number) =>
    setDraftLangExams((p) => p.filter((_, i) => i !== idx));
  const updateLangExam = (idx: number, field: keyof LangExam, val: string) =>
    setDraftLangExams((p) => p.map((e, i) => (i === idx ? { ...e, [field]: val } : e)));

  const dv       = (k: string) => draft[k] ?? "";
  const setDv    = (k: string, v: string) => setDraft((p) => ({ ...p, [k]: v }));
  const isVis    = (k: InfoKey) => draftVisible.includes(k);
  const toggleVis = (k: InfoKey) =>
    setDraftVisible((p) => p.includes(k) ? p.filter((x) => x !== k) : [...p, k]);

  const basicPhoto = useMemo(
    () => files.find((f) => f.kind === "증명사진" && f.id === basicPhotoId) ?? files.find((f) => f.kind === "증명사진"),
    [files, basicPhotoId],
  );

  const visibleGroups = FIELD_GROUPS.map((g) => ({
    title: g.title,
    // 표시 대상 필드 전부(값 없어도 '미입력'으로 노출). 헤더 대표 필드는 제외.
    fields: INFO_FIELDS.filter(
      (f) => g.keys.includes(f.key) && infoVisible.includes(f.key) && !HEADER_KEYS.includes(f.key),
    ),
  })).filter((g) => g.fields.length > 0);

  // 인적사항 = 프로필 카드로 통합(사진·이름·전체편집). 나머지 섹션은 일반 카드.
  const personalKeys = FIELD_GROUPS.find((g) => g.title === "인적사항")!.keys.filter((k) => !HEADER_KEYS.includes(k));
  const personalFields = INFO_FIELDS.filter((f) => personalKeys.includes(f.key) && infoVisible.includes(f.key));
  const otherGroups = visibleGroups.filter((g) => g.title !== "인적사항");

  // 섹션 카드 한 줄 — 라벨(상단 고정폭) + 값(줄바꿈, 클릭 복사). 값이 길어도 안 잘리고 아래로 wrap.
  const renderInfoRow = (f: { key: InfoKey; label: string }) => {
    const isMasked  = masked.has(f.key);
    const isEditing = inlineKey === f.key;
    const val       = infoValues[f.key] ?? "";
    return (
      <div key={f.key} className="group/row flex items-start gap-3 py-2 border-b border-border/40 last:border-0 min-w-0">
        <span className="text-xs text-muted-foreground w-[76px] shrink-0 leading-tight pt-[3px]" title={f.label}>{f.label}</span>
        <div className="flex-1 min-w-0 flex items-start gap-1">
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <input
                ref={inlineRef}
                value={inlineDraft}
                onChange={(e) => setInlineDraft(e.target.value)}
                onBlur={commitInline}
                onKeyDown={(e) => {
                  if (e.key === "Enter")  { e.preventDefault(); commitInline(); }
                  if (e.key === "Escape") { e.preventDefault(); cancelInline(); }
                }}
                className="flex-1 min-w-0 text-body text-foreground bg-transparent border-b border-primary/60 outline-none py-0.5"
              />
              <button onClick={commitInline} aria-label="저장" className="shrink-0 p-0.5 rounded text-emerald-500 hover:bg-emerald-50"><Check className="w-3 h-3" /></button>
              <button onClick={cancelInline} aria-label="취소" className="shrink-0 p-0.5 rounded text-muted-foreground hover:bg-muted"><X className="w-3 h-3" /></button>
            </div>
          ) : isMasked ? (
            <span className="flex-1 text-body text-muted-foreground/30 tracking-widest select-none">••••••</span>
          ) : val ? (
            // 클릭 = 복사. 값은 break-words로 줄바꿈되어 잘리지 않음
            <button
              onClick={() => copy(val)}
              title="클릭하면 복사돼요"
              className="flex-1 min-w-0 inline-flex items-start gap-1.5 text-body text-foreground text-left rounded-md px-1.5 -mx-1.5 py-0.5 hover:bg-muted transition-colors"
            >
              <span className="break-words min-w-0">{val}</span>
              <Copy className="w-3 h-3 mt-[3px] opacity-0 group-hover/row:opacity-60 shrink-0 transition-opacity text-muted-foreground" />
            </button>
          ) : (
            <button onClick={() => startInline(f.key)} className="flex-1 text-left text-xs text-muted-foreground/50 italic hover:text-primary inline-flex items-center gap-1">
              미입력 <Plus className="w-3 h-3" />
            </button>
          )}
          {!isEditing && !isMasked && val && (
            <button onClick={() => startInline(f.key)} title="편집" className="shrink-0 p-0.5 rounded text-muted-foreground/50 hover:text-foreground hover:bg-muted opacity-0 group-hover/row:opacity-100 transition-opacity">
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {!isEditing && val && (
            <button onClick={() => toggleMask(f.key)} aria-label={isMasked ? "값 보기" : "값 숨기기"} className={cn("w-5 h-5 flex items-center justify-center shrink-0 transition-all", isMasked ? "text-muted-foreground/50 opacity-100" : "text-muted-foreground/30 opacity-0 group-hover/row:opacity-100 hover:text-muted-foreground")}>
              {isMasked ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative">
        {/* ── 뷰 모드 ──────────────────────────────── */}
        {!editMode && (
          <div className="pt-6">
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>

              {/* 인적사항 = 프로필 카드 (사진·이름·전체편집 통합, 항상 표시) */}
              <div className="group/sec bg-card border border-border rounded-xl px-4 py-3.5">
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/50">
                  {photoShown && basicPhoto?.url ? (
                    <div className="w-12 h-[60px] rounded-lg border border-border overflow-hidden bg-muted/30 shrink-0">
                      <img src={basicPhoto.url} alt="증명사진" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-[60px] rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <User className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-title font-semibold text-foreground tracking-tight truncate">{infoValues.name || "이름 미입력"}</div>
                    {(infoValues.hanjaName || infoValues.engName) && (
                      <div className="text-chip text-muted-foreground truncate">{[infoValues.hanjaName, infoValues.engName].filter(Boolean).join(" · ")}</div>
                    )}
                  </div>
                  <button
                    onClick={enterEdit}
                    title="전체 편집"
                    aria-label="전체 편집"
                    className="shrink-0 w-7 h-7 rounded-lg border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                {personalFields.length > 0 ? (
                  <div>{personalFields.map(renderInfoRow)}</div>
                ) : (
                  <p className="text-chip text-muted-foreground/50 py-1">표시할 항목이 없어요. 전체 편집으로 추가하세요.</p>
                )}
              </div>

              {otherGroups.map((group) => {
                const Icon = GROUP_ICON[group.title] ?? User;
                const filled = group.fields.filter((f) => infoValues[f.key]).length;
                return (
                  <div key={group.title} className="group/sec bg-card border border-border rounded-xl px-4 py-3.5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <h3 className="text-body font-medium text-foreground">{group.title}</h3>
                      <div className="ml-auto flex items-center gap-1.5">
                        {filled > 0 && (
                          <button
                            onClick={() => copySection(group.title, group.fields)}
                            title="이 섹션 값을 라벨과 함께 복사"
                            className="opacity-0 group-hover/sec:opacity-100 transition-opacity shrink-0 inline-flex items-center gap-1 text-chip text-muted-foreground hover:text-primary px-1.5 py-0.5 rounded hover:bg-muted"
                          >
                            <Copy className="w-3 h-3" /> 복사
                          </button>
                        )}
                        <span className="text-chip text-muted-foreground tabular-nums">{filled} / {group.fields.length}</span>
                      </div>
                    </div>
                    <div>{group.fields.map(renderInfoRow)}</div>
                  </div>
                );
              })}

              {langExams.length > 0 && (
                <div className="group/sec bg-card border border-border rounded-xl px-4 py-3.5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                    <h3 className="text-body font-medium text-foreground">공인외국어시험</h3>
                    <div className="ml-auto flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const lines = langExams
                            .map((e) => [e.lang, e.examName, e.score, e.date].filter(Boolean).join(" "))
                            .filter(Boolean);
                          if (lines.length === 0) { toast("복사할 값이 없어요", { duration: 1200 }); return; }
                          navigator.clipboard.writeText(lines.join("\n"));
                          toast(`공인외국어시험 ${lines.length}개 항목을 복사했어요`, { duration: 1400 });
                        }}
                        title="어학 성적을 한 번에 복사"
                        className="opacity-0 group-hover/sec:opacity-100 transition-opacity shrink-0 inline-flex items-center gap-1 text-chip text-muted-foreground hover:text-primary px-1.5 py-0.5 rounded hover:bg-muted"
                      >
                        <Copy className="w-3 h-3" /> 복사
                      </button>
                      <span className="text-chip text-muted-foreground tabular-nums">{langExams.length}개</span>
                    </div>
                  </div>
                  <div>
                    {langExams.map((e) => (
                      <div key={e.id} className="flex items-center justify-between gap-2 py-2 border-b border-border/40 last:border-0">
                        <span className="text-body text-foreground truncate">{[e.lang, e.examName].filter(Boolean).join(" · ") || "—"}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{[e.score, e.date].filter(Boolean).join(" · ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* ── 편집 모드 ─────────────────────────────── */}
      {editMode && (
        <div className="pt-6 space-y-6">

          {/* 증명사진 */}
          <EditSection title="증명사진">
            <div className="flex items-center gap-5">
              <div className="w-[80px] h-[108px] rounded-xl border border-border overflow-hidden bg-muted/30 shrink-0 shadow-sm">
                {basicPhoto?.url
                  ? <img src={basicPhoto.url} alt="증명사진" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 text-mini">사진 없음</div>
                }
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-foreground/80 cursor-pointer">
                  <Checkbox checked={draftPhotoShown} onCheckedChange={(c) => setDraftPhotoShown(!!c)} className="h-3.5 w-3.5" />
                  기본정보에 증명사진 표시
                </label>
                <p className="text-chip text-muted-foreground/50">사진 업로드 및 교체는 파일함에서 관리하세요.</p>
              </div>
            </div>
          </EditSection>

          {/* 기본 인적사항 */}
          <EditSection title="기본 인적사항">
            <EditGrid>
              {(["name","hanjaName","engName","birth","email","phone","address","school","major","grade","gender","nationality"] as InfoKey[]).map((k) => (
                <FieldRow key={k} label={INFO_FIELDS.find((x) => x.key === k)!.label} visible={isVis(k)} onToggle={() => toggleVis(k)}>
                  {k === "gender"
                    ? <InlineSelect value={dv(k) || "선택 안 함"} options={GENDER_OPTS} onChange={(v) => setDv(k, v)} />
                    : <Input value={dv(k)} onChange={(e) => setDv(k, e.target.value)} className="h-8 text-xs" />
                  }
                </FieldRow>
              ))}
            </EditGrid>
          </EditSection>

          {/* 온라인 프로필 */}
          <EditSection title="온라인 프로필">
            <EditGrid>
              {(["portfolioUrl","github","linkedin","blog"] as InfoKey[]).map((k) => (
                <FieldRow key={k} label={INFO_FIELDS.find((x) => x.key === k)!.label} visible={isVis(k)} onToggle={() => toggleVis(k)}>
                  <Input value={dv(k)} onChange={(e) => setDv(k, e.target.value)} className="h-8 text-xs" placeholder="https://" />
                </FieldRow>
              ))}
            </EditGrid>
          </EditSection>

          {/* 학력 상세 */}
          <EditSection title="학력 상세">
            <EditGrid>
              {(["enrollYear","gradYear","gpa","majorGpa","minor"] as InfoKey[]).map((k) => (
                <FieldRow key={k} label={INFO_FIELDS.find((x) => x.key === k)!.label} visible={isVis(k)} onToggle={() => toggleVis(k)}>
                  <Input value={dv(k)} onChange={(e) => setDv(k, e.target.value)} className="h-8 text-xs" />
                </FieldRow>
              ))}
              <FieldRow label="주간 / 야간" visible={isVis("dayNight")} onToggle={() => toggleVis("dayNight")}>
                <InlineSelect value={dv("dayNight") || "주간"} options={["주간", "야간"]} onChange={(v) => setDv("dayNight", v)} />
              </FieldRow>
              <FieldRow label="본교 / 분교" visible={isVis("campus")} onToggle={() => toggleVis("campus")}>
                <InlineSelect value={dv("campus") || "본교"} options={["본교", "분교"]} onChange={(v) => setDv("campus", v)} />
              </FieldRow>
              <FieldRow label="편입 여부" visible={isVis("transfer")} onToggle={() => toggleVis("transfer")}>
                <InlineSelect value={dv("transfer") || "해당 없음"} options={TRANS_OPTS} onChange={(v) => setDv("transfer", v)} />
              </FieldRow>
            </EditGrid>
          </EditSection>

          {/* 고등학교 */}
          <EditSection title="고등학교">
            <EditGrid>
              <FieldRow label="학교명" visible={isVis("hsSchool")} onToggle={() => toggleVis("hsSchool")}>
                <Input value={dv("hsSchool")} onChange={(e) => setDv("hsSchool", e.target.value)} className="h-8 text-xs" />
              </FieldRow>
              <FieldRow label="소재지" visible={isVis("hsLocation")} onToggle={() => toggleVis("hsLocation")}>
                <Input value={dv("hsLocation")} onChange={(e) => setDv("hsLocation", e.target.value)} className="h-8 text-xs" />
              </FieldRow>
              <FieldRow label="입학년월" visible={isVis("hsEnroll")} onToggle={() => toggleVis("hsEnroll")}>
                <Input value={dv("hsEnroll")} onChange={(e) => setDv("hsEnroll", e.target.value)} className="h-8 text-xs" placeholder="YYYY.MM" />
              </FieldRow>
              <FieldRow label="졸업년월" visible={isVis("hsGrad")} onToggle={() => toggleVis("hsGrad")}>
                <Input value={dv("hsGrad")} onChange={(e) => setDv("hsGrad", e.target.value)} className="h-8 text-xs" placeholder="YYYY.MM" />
              </FieldRow>
              <FieldRow label="졸업여부" visible={isVis("hsGradStatus")} onToggle={() => toggleVis("hsGradStatus")}>
                <InlineSelect value={dv("hsGradStatus") || "해당 없음"} options={HS_GRAD_OPTS} onChange={(v) => setDv("hsGradStatus", v)} />
              </FieldRow>
            </EditGrid>
          </EditSection>

          {/* 공인외국어시험 — 다중 입력 */}
          <EditSection title="공인외국어시험">
            <div className="space-y-3">
              {draftLangExams.map((exam, idx) => (
                <div key={exam.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-chip text-muted-foreground">시험 {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeLangExam(idx)}
                      className="p-0.5 rounded text-muted-foreground hover:text-destructive"
                      aria-label="삭제"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <EditGrid>
                    <FieldRow label="언어">
                      <Input value={exam.lang} onChange={(e) => updateLangExam(idx, "lang", e.target.value)} className="h-8 text-xs" placeholder="영어, 일본어..." />
                    </FieldRow>
                    <FieldRow label="시험명">
                      <Input value={exam.examName} onChange={(e) => updateLangExam(idx, "examName", e.target.value)} className="h-8 text-xs" placeholder="TOEIC, JLPT N1..." />
                    </FieldRow>
                    <FieldRow label="점수 / 등급">
                      <Input value={exam.score} onChange={(e) => updateLangExam(idx, "score", e.target.value)} className="h-8 text-xs" />
                    </FieldRow>
                    <FieldRow label="응시일">
                      <Input value={exam.date} onChange={(e) => updateLangExam(idx, "date", e.target.value)} className="h-8 text-xs" placeholder="YYYY.MM" />
                    </FieldRow>
                    <FieldRow label="유효기간 (선택)">
                      <Input value={exam.expiry} onChange={(e) => updateLangExam(idx, "expiry", e.target.value)} className="h-8 text-xs" placeholder="YYYY.MM" />
                    </FieldRow>
                  </EditGrid>
                </div>
              ))}
              {draftLangExams.length === 0 && (
                <p className="text-chip text-muted-foreground/50 py-1">등록된 시험이 없어요.</p>
              )}
              <button
                type="button"
                onClick={addLangExam}
                className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              >
                <Plus className="w-3.5 h-3.5" /> 시험 추가
              </button>
            </div>
          </EditSection>

          {/* 병역 */}
          <EditSection title="병역 사항">
            <EditGrid>
              <FieldRow label="병역 상태" visible={isVis("military")} onToggle={() => toggleVis("military")}>
                <InlineSelect value={dv("military") || "해당 없음"} options={MIL_OPTS} onChange={(v) => setDv("military", v)} />
              </FieldRow>
            </EditGrid>
            {(dv("military") === "군필" || dv("military") === "복무 중") && (
              <EditGrid className="mt-4">
                {([
                  { k: "military.kind", l: "복무 구분" }, { k: "military.branch", l: "군별" },
                  { k: "military.rank", l: "계급" }, { k: "military.start", l: "복무 시작일" },
                  { k: "military.end", l: "복무 종료일" }, { k: "military.note", l: "병역 비고" },
                ]).map(({ k, l }) => (
                  <FieldRow key={k} label={l}>
                    <Input value={dv(k)} onChange={(e) => setDv(k, e.target.value)} className="h-8 text-xs" />
                  </FieldRow>
                ))}
                {dv("military") === "복무 중" && (
                  <FieldRow label="전역 예정일">
                    <Input value={dv("military.dischargeDue")} onChange={(e) => setDv("military.dischargeDue", e.target.value)} className="h-8 text-xs" />
                  </FieldRow>
                )}
              </EditGrid>
            )}
            {dv("military") === "면제" && (
              <EditGrid className="mt-4">
                <FieldRow label="면제 사유">
                  <Input value={dv("military.exemptReason")} onChange={(e) => setDv("military.exemptReason", e.target.value)} className="h-8 text-xs" />
                </FieldRow>
                <FieldRow label="병역 비고">
                  <Input value={dv("military.note")} onChange={(e) => setDv("military.note", e.target.value)} className="h-8 text-xs" />
                </FieldRow>
              </EditGrid>
            )}
          </EditSection>

          {/* 보훈 */}
          <EditSection title="보훈 사항">
            <EditGrid>
              <FieldRow label="보훈 상태" visible={isVis("veteran")} onToggle={() => toggleVis("veteran")}>
                <InlineSelect value={dv("veteran") || "해당 없음"} options={YES_NO} onChange={(v) => setDv("veteran", v)} />
              </FieldRow>
            </EditGrid>
            {dv("veteran") === "대상" && (
              <EditGrid className="mt-4">
                {([
                  { k: "veteran.kind", l: "보훈 구분" }, { k: "veteran.no", l: "보훈 번호" },
                  { k: "veteran.relation", l: "관계" }, { k: "veteran.bonus", l: "가산점 여부" },
                ]).map(({ k, l }) => (
                  <FieldRow key={k} label={l}>
                    <Input value={dv(k)} onChange={(e) => setDv(k, e.target.value)} className="h-8 text-xs" />
                  </FieldRow>
                ))}
              </EditGrid>
            )}
          </EditSection>

          {/* 장애 */}
          <EditSection title="장애 사항">
            <EditGrid>
              <FieldRow label="장애 상태" visible={isVis("disability")} onToggle={() => toggleVis("disability")}>
                <InlineSelect value={dv("disability") || "해당 없음"} options={YES_NO} onChange={(v) => setDv("disability", v)} />
              </FieldRow>
            </EditGrid>
            {dv("disability") === "대상" && (
              <EditGrid className="mt-4">
                {([
                  { k: "disability.type", l: "장애 유형" }, { k: "disability.grade", l: "장애 정도" },
                  { k: "disability.no", l: "등록번호" },
                ]).map(({ k, l }) => (
                  <FieldRow key={k} label={l}>
                    <Input value={dv(k)} onChange={(e) => setDv(k, e.target.value)} className="h-8 text-xs" />
                  </FieldRow>
                ))}
              </EditGrid>
            )}
          </EditSection>

          {/* 국가유공자 */}
          <EditSection title="국가유공자">
            <EditGrid>
              <FieldRow label="국가유공자 상태" visible={isVis("national")} onToggle={() => toggleVis("national")}>
                <InlineSelect value={dv("national") || "해당 없음"} options={YES_NO} onChange={(v) => setDv("national", v)} />
              </FieldRow>
            </EditGrid>
          </EditSection>

          {/* 운전면허 */}
          <EditSection title="운전면허">
            <EditGrid>
              <FieldRow label="면허 종류" visible={isVis("driverLicense")} onToggle={() => toggleVis("driverLicense")}>
                <InlineSelect value={dv("driverLicense") || "없음"} options={LIC_OPTS} onChange={(v) => setDv("driverLicense", v)} />
              </FieldRow>
            </EditGrid>
            {dv("driverLicense") !== "없음" && dv("driverLicense") !== "" && (
              <EditGrid className="mt-4">
                {([
                  { k: "license.no", l: "면허 번호" }, { k: "license.issued", l: "발급일" }, { k: "license.expiry", l: "만료일" },
                ]).map(({ k, l }) => (
                  <FieldRow key={k} label={l}>
                    <Input value={dv(k)} onChange={(e) => setDv(k, e.target.value)} className="h-8 text-xs" />
                  </FieldRow>
                ))}
              </EditGrid>
            )}
          </EditSection>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/60">
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={cancel}>취소</Button>
            <Button size="sm" className="h-8 text-xs" onClick={save}>저장</Button>
          </div>
        </div>
      )}
      </div>
    </TooltipProvider>
  );
}

// ── Helper components ──────────────────────────────────────────

function EditSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3.5 pb-6 border-b border-border/40 last:border-0 last:pb-0">
      <h3 className="text-chip font-medium text-muted-foreground uppercase tracking-wide">{title}</h3>
      {children}
    </section>
  );
}

function EditGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-x-8 gap-y-4", className)}>{children}</div>;
}

function FieldRow({
  label, visible, onToggle, children,
}: { label: string; visible?: boolean; onToggle?: () => void; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 mb-2">
        {onToggle !== undefined ? (
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <Checkbox
              checked={!!visible}
              onCheckedChange={() => onToggle()}
              className="h-3.5 w-3.5"
            />
            <span className={cn(
              "text-chip leading-none transition-colors",
              visible === false ? "text-muted-foreground/30" : "text-muted-foreground/70",
            )}>
              {label}
            </span>
          </label>
        ) : (
          <span className="text-chip text-muted-foreground/70 leading-none">{label}</span>
        )}
      </div>
      <div className={cn("transition-opacity", visible === false && "opacity-35")}>
        {children}
      </div>
    </div>
  );
}

function InlineSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-8 px-2.5 text-xs rounded-md border border-border bg-background text-foreground"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
