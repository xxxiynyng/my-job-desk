import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Pencil, Check, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types & constants ──────────────────────────────────────────

type InfoKey =
  | "name" | "hanjaName" | "engName" | "birth"
  | "email" | "phone" | "address"
  | "school" | "major" | "grade"
  | "military" | "veteran" | "disability" | "national" | "driverLicense"
  | "portfolioUrl" | "github" | "linkedin" | "blog"
  | "enrollYear" | "gradYear" | "gpa" | "minor" | "transfer"
  | "gender" | "nationality"
  | "hsSchool" | "hsLocation" | "hsEnroll" | "hsGrad" | "hsGradStatus"
  | "langExam1Name" | "langExam1Score" | "langExam1Date"
  | "langConversation" | "langWriting" | "langReading"
  | "itProgram" | "itLevel" | "itDuration";

const INFO_FIELDS: { key: InfoKey; label: string }[] = [
  { key: "name",             label: "이름"                },
  { key: "hanjaName",        label: "한자 이름"            },
  { key: "engName",          label: "영문 이름"            },
  { key: "birth",            label: "생년월일"             },
  { key: "email",            label: "이메일"               },
  { key: "phone",            label: "전화번호"             },
  { key: "address",          label: "주소"                 },
  { key: "school",           label: "학교"                 },
  { key: "major",            label: "전공"                 },
  { key: "grade",            label: "학년 / 졸업 여부"      },
  { key: "military",         label: "병역 사항"            },
  { key: "veteran",          label: "보훈 사항"            },
  { key: "disability",       label: "장애 사항"            },
  { key: "national",         label: "국가유공자 관련"       },
  { key: "driverLicense",    label: "운전면허"             },
  { key: "portfolioUrl",     label: "포트폴리오 URL"       },
  { key: "github",           label: "GitHub"               },
  { key: "linkedin",         label: "LinkedIn"             },
  { key: "blog",             label: "블로그/노션"           },
  { key: "enrollYear",       label: "입학 연도"            },
  { key: "gradYear",         label: "졸업(예정) 연도"      },
  { key: "gpa",              label: "학점 (GPA)"           },
  { key: "minor",            label: "부전공"               },
  { key: "transfer",         label: "편입 여부"            },
  { key: "gender",           label: "성별"                 },
  { key: "nationality",      label: "국적"                 },
  { key: "hsSchool",         label: "고등학교"             },
  { key: "hsLocation",       label: "고등학교 소재지"       },
  { key: "hsEnroll",         label: "고등학교 입학년월"     },
  { key: "hsGrad",           label: "고등학교 졸업년월"     },
  { key: "hsGradStatus",     label: "고등학교 졸업여부"     },
  { key: "langExam1Name",    label: "공인외국어시험명"      },
  { key: "langExam1Score",   label: "점수 / 등급"          },
  { key: "langExam1Date",    label: "응시일"               },
  { key: "langConversation", label: "회화 수준"            },
  { key: "langWriting",      label: "작문 수준"            },
  { key: "langReading",      label: "독해 수준"            },
  { key: "itProgram",        label: "IT 프로그램명"        },
  { key: "itLevel",          label: "활용 수준"            },
  { key: "itDuration",       label: "사용 기간"            },
];

// 뷰 모드 정보구조: 인적사항 / 연락처 / 학력 / 고등학교 / 온라인 프로필 / 어학 / IT활용능력 / 병역·면허
const FIELD_GROUPS: { title: string; keys: InfoKey[] }[] = [
  { title: "인적사항",      keys: ["name", "hanjaName", "engName", "birth", "gender", "nationality"] },
  { title: "연락처",        keys: ["email", "phone", "address"] },
  { title: "학력",          keys: ["school", "major", "grade", "enrollYear", "gradYear", "gpa", "minor", "transfer"] },
  { title: "고등학교",      keys: ["hsSchool", "hsLocation", "hsEnroll", "hsGrad", "hsGradStatus"] },
  { title: "온라인 프로필", keys: ["portfolioUrl", "github", "linkedin", "blog"] },
  { title: "공인외국어시험", keys: ["langExam1Name", "langExam1Score", "langExam1Date"] },
  { title: "외국어활용능력", keys: ["langConversation", "langWriting", "langReading"] },
  { title: "IT활용능력",    keys: ["itProgram", "itLevel", "itDuration"] },
  { title: "병역·면허",     keys: ["military", "veteran", "disability", "national", "driverLicense"] },
];

const INFO_DEFAULTS: Record<InfoKey, string> = {
  name: "장윤영", hanjaName: "張潤瑛", engName: "Yoon Jang",
  birth: "2001.03.15", email: "yoon.jang@example.com", phone: "010-0000-0000",
  address: "부산광역시 해운대구 센텀로 17", school: "부산대학교", major: "경영학과",
  grade: "4학년 재학", military: "해당 없음", veteran: "해당 없음",
  disability: "해당 없음", national: "해당 없음", driverLicense: "2종 보통",
  portfolioUrl: "", github: "", linkedin: "", blog: "",
  enrollYear: "", gradYear: "", gpa: "", minor: "", transfer: "해당 없음",
  gender: "선택 안 함", nationality: "대한민국",
  hsSchool: "", hsLocation: "", hsEnroll: "", hsGrad: "", hsGradStatus: "해당 없음",
  langExam1Name: "", langExam1Score: "", langExam1Date: "",
  langConversation: "", langWriting: "", langReading: "",
  itProgram: "", itLevel: "", itDuration: "",
};

const DEFAULT_VISIBLE: InfoKey[] = [
  "name", "engName", "birth", "email", "phone", "address",
  "school", "major", "grade", "military", "driverLicense",
];

type FileItem = { id: string; kind: string; name: string; fileKind: "pdf" | "image"; url?: string };

const LS_INFO_VISIBLE = "specs.info.visibleKeys.v4";
const LS_INFO_VALUES  = "specs.info.values.v2";
const LS_PHOTO_SHOWN  = "specs.basicPhoto.shown";
const LS_PHOTO_ID     = "specs.basicPhoto.id";
const LS_FILES        = "specs.files.v1";

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
const LANG_LEVEL_OPTS = ["상", "중상", "중", "중하", "하"];

// ── Panel ─────────────────────────────────────────────────────
// 기본정보 탭 콘텐츠. 사이드바/페이지 셸은 호출하는 쪽(통합 허브)에서 처리합니다.

export function BasicInfoPanel() {
  const [infoVisible, setInfoVisible] = useState<InfoKey[]>(() => lsGet<InfoKey[]>(LS_INFO_VISIBLE, DEFAULT_VISIBLE));
  const [infoValues,  setInfoValues]  = useState<Record<string, string>>(() => ({ ...INFO_DEFAULTS, ...lsGet<Record<string, string>>(LS_INFO_VALUES, {}) }));
  const [photoShown,  setPhotoShown]  = useState<boolean>(() => lsGet<boolean>(LS_PHOTO_SHOWN, true));
  const [basicPhotoId]                = useState<string>(() => lsGet<string>(LS_PHOTO_ID, "f0"));
  const [files]                       = useState<FileItem[]>(() => lsGet<FileItem[]>(LS_FILES, []));

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

  useEffect(() => { if (inlineKey) inlineRef.current?.select(); }, [inlineKey]);

  const startInline = (k: InfoKey) => {
    setInlineKey(k);
    setInlineDraft(infoValues[k] ?? "");
  };
  const commitInline = () => {
    if (inlineKey) {
      setInfoValues((p) => ({ ...p, [inlineKey]: inlineDraft }));
      toast("저장되었습니다", { duration: 900 });
    }
    setInlineKey(null);
  };
  const cancelInline = () => setInlineKey(null);

  useEffect(() => lsSet(LS_INFO_VISIBLE, infoVisible), [infoVisible]);
  useEffect(() => lsSet(LS_INFO_VALUES,  infoValues),  [infoValues]);
  useEffect(() => lsSet(LS_PHOTO_SHOWN,  photoShown),  [photoShown]);

  const copy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast("복사되었습니다", { duration: 1200 });
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
    setEditMode(true);
  };

  const save = () => {
    setInfoValues(draft);
    setInfoVisible(draftVisible);
    setPhotoShown(draftPhotoShown);
    setEditMode(false);
    toast("저장되었습니다", { duration: 1500 });
  };

  const cancel = () => setEditMode(false);

  const dv       = (k: string) => draft[k] ?? "";
  const setDv    = (k: string, v: string) => setDraft((p) => ({ ...p, [k]: v }));
  const isVis    = (k: InfoKey) => draftVisible.includes(k);
  const toggleVis = (k: InfoKey) =>
    setDraftVisible((p) => p.includes(k) ? p.filter((x) => x !== k) : [...p, k]);

  const basicPhoto = useMemo(
    () => files.find((f) => f.kind === "증명사진" && f.id === basicPhotoId) ?? files.find((f) => f.kind === "증명사진"),
    [files, basicPhotoId],
  );

  const filledCount = INFO_FIELDS.filter((f) => (infoValues[f.key] || "").trim()).length;
  const totalCount  = INFO_FIELDS.length;
  const pct         = Math.round((filledCount / totalCount) * 100);

  const visibleGroups = FIELD_GROUPS.map((g) => ({
    title: g.title,
    fields: INFO_FIELDS.filter((f) => g.keys.includes(f.key) && infoVisible.includes(f.key) && infoValues[f.key]),
  })).filter((g) => g.fields.length > 0);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative">
        {/* ── 뷰 모드 ──────────────────────────────── */}
        {!editMode && (
          <div className="pt-6 flex gap-10 items-start">

            {/* 상단 우측: 완성도 + 편집 버튼 */}
            <div className="absolute top-0 right-0 flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-default select-none">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-emerald-500" : "bg-primary/70")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums">{filledCount}/{totalCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[11px]">
                  {pct === 100 ? "모든 항목이 입력되었어요" : `${totalCount - filledCount}개 항목이 비어 있어요`}
                </TooltipContent>
              </Tooltip>
              <button
                onClick={enterEdit}
                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors shrink-0"
              >
                <Pencil className="w-3 h-3" /> 전체 편집
              </button>
            </div>

            {/* 증명사진 */}
            {photoShown && basicPhoto?.url && (
              <div className="shrink-0">
                <div className="w-[96px] h-[128px] rounded-xl border border-border overflow-hidden bg-muted/30 shadow-sm">
                  <img src={basicPhoto.url} alt="증명사진" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* 그룹별 필드 */}
            <div className="flex-1 min-w-0 space-y-6">
              {visibleGroups.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <p className="text-sm">표시할 정보가 없어요.</p>
                  <p className="text-[11px] mt-1 opacity-60">편집을 눌러 정보를 입력하거나 항목을 표시하세요.</p>
                </div>
              ) : (
                visibleGroups.map((group) => (
                  <div key={group.title}>
                    {/* 섹션 헤더 — 배경 + 좌측 강조 선 */}
                    <div className="flex items-center gap-2.5 mb-3 px-2 py-1 bg-muted/40 rounded-md border-l-[3px] border-primary/60">
                      <h3 className="text-[11px] font-semibold text-foreground/75 tracking-wide leading-none">
                        {group.title}
                      </h3>
                      <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                        {group.fields.length}개
                      </span>
                    </div>

                    {/* 반응형 그리드: 필드 수에 관계없이 190px 단위로 자동 배치 */}
                    <div
                      className="grid gap-x-8"
                      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}
                    >
                      {group.fields.map((f) => {
                        const isMasked  = masked.has(f.key);
                        const isEditing = inlineKey === f.key;
                        const val       = infoValues[f.key] ?? "";

                        return (
                          <div key={f.key} className="group/row flex items-center gap-2 py-2.5 border-b border-border/40 last:border-0 min-w-0">
                            {/* 레이블 */}
                            <span className="text-[11px] text-muted-foreground w-[88px] shrink-0 leading-none truncate" title={f.label}>
                              {f.label}
                            </span>

                            {/* 값 영역 */}
                            <div className="flex-1 min-w-0 flex items-center gap-1">
                              {isEditing ? (
                                /* 인라인 편집 입력 */
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
                                    className="flex-1 min-w-0 text-sm text-foreground bg-transparent border-b border-primary/60 outline-none py-0.5"
                                  />
                                  <button onClick={commitInline} className="shrink-0 p-0.5 rounded text-emerald-500 hover:bg-emerald-50">
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button onClick={cancelInline} className="shrink-0 p-0.5 rounded text-muted-foreground hover:bg-muted">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : isMasked ? (
                                <span className="text-sm text-muted-foreground/30 tracking-widest select-none">••••••</span>
                              ) : (
                                /* 복사 버튼 + full-value 툴팁 */
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => copy(val)}
                                      className="inline-flex items-center gap-1 text-[13px] text-foreground hover:text-primary transition-colors min-w-0 max-w-full text-left font-medium"
                                    >
                                      <span className="truncate">{val}</span>
                                      <Copy className="w-3 h-3 opacity-0 group-hover/row:opacity-35 shrink-0 transition-opacity" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs max-w-72">
                                    <p className="break-all">{val}</p>
                                    <p className="text-muted-foreground/60 mt-0.5 text-[10px]">클릭하여 복사</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}

                              {/* hover 시 노출: 인라인 편집 연필 */}
                              {!isEditing && !isMasked && (
                                <button
                                  onClick={() => startInline(f.key)}
                                  title="편집"
                                  className="shrink-0 p-0.5 rounded text-muted-foreground/50 hover:text-foreground hover:bg-muted opacity-0 group-hover/row:opacity-100 transition-opacity"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* 눈 감기/뜨기 */}
                            {!isEditing && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => toggleMask(f.key)}
                                    className={cn(
                                      "w-5 h-5 flex items-center justify-center shrink-0 transition-all",
                                      isMasked
                                        ? "text-muted-foreground/50 opacity-100"
                                        : "text-muted-foreground/30 opacity-0 group-hover/row:opacity-100 hover:text-muted-foreground",
                                    )}
                                    aria-label={isMasked ? "값 보기" : "값 숨기기"}
                                  >
                                    {isMasked ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">
                                  {isMasked ? "값 보기" : "값 숨기기"}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
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
                  : <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 text-[10px]">사진 없음</div>
                }
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[12px] text-foreground/80 cursor-pointer">
                  <Checkbox checked={draftPhotoShown} onCheckedChange={(c) => setDraftPhotoShown(!!c)} className="h-3.5 w-3.5" />
                  기본정보에 증명사진 표시
                </label>
                <p className="text-[11px] text-muted-foreground/50">사진 업로드 및 교체는 파일함에서 관리하세요.</p>
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
                    : <Input value={dv(k)} onChange={(e) => setDv(k, e.target.value)} className="h-8 text-[12px]" />
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
                  <Input value={dv(k)} onChange={(e) => setDv(k, e.target.value)} className="h-8 text-[12px]" placeholder="https://" />
                </FieldRow>
              ))}
            </EditGrid>
          </EditSection>

          {/* 학력 상세 */}
          <EditSection title="학력 상세">
            <EditGrid>
              {(["enrollYear","gradYear","gpa","minor"] as InfoKey[]).map((k) => (
                <FieldRow key={k} label={INFO_FIELDS.find((x) => x.key === k)!.label} visible={isVis(k)} onToggle={() => toggleVis(k)}>
                  <Input value={dv(k)} onChange={(e) => setDv(k, e.target.value)} className="h-8 text-[12px]" />
                </FieldRow>
              ))}
              <FieldRow label="편입 여부" visible={isVis("transfer")} onToggle={() => toggleVis("transfer")}>
                <InlineSelect value={dv("transfer") || "해당 없음"} options={TRANS_OPTS} onChange={(v) => setDv("transfer", v)} />
              </FieldRow>
            </EditGrid>
          </EditSection>

          {/* 고등학교 */}
          <EditSection title="고등학교">
            <EditGrid>
              <FieldRow label="학교명" visible={isVis("hsSchool")} onToggle={() => toggleVis("hsSchool")}>
                <Input value={dv("hsSchool")} onChange={(e) => setDv("hsSchool", e.target.value)} className="h-8 text-[12px]" />
              </FieldRow>
              <FieldRow label="소재지" visible={isVis("hsLocation")} onToggle={() => toggleVis("hsLocation")}>
                <Input value={dv("hsLocation")} onChange={(e) => setDv("hsLocation", e.target.value)} className="h-8 text-[12px]" />
              </FieldRow>
              <FieldRow label="입학년월" visible={isVis("hsEnroll")} onToggle={() => toggleVis("hsEnroll")}>
                <Input value={dv("hsEnroll")} onChange={(e) => setDv("hsEnroll", e.target.value)} className="h-8 text-[12px]" placeholder="YYYY.MM" />
              </FieldRow>
              <FieldRow label="졸업년월" visible={isVis("hsGrad")} onToggle={() => toggleVis("hsGrad")}>
                <Input value={dv("hsGrad")} onChange={(e) => setDv("hsGrad", e.target.value)} className="h-8 text-[12px]" placeholder="YYYY.MM" />
              </FieldRow>
              <FieldRow label="졸업여부" visible={isVis("hsGradStatus")} onToggle={() => toggleVis("hsGradStatus")}>
                <InlineSelect value={dv("hsGradStatus") || "해당 없음"} options={HS_GRAD_OPTS} onChange={(v) => setDv("hsGradStatus", v)} />
              </FieldRow>
            </EditGrid>
          </EditSection>

          {/* 어학 — 공인외국어시험 */}
          <EditSection title="공인외국어시험">
            <EditGrid>
              <FieldRow label="시험명" visible={isVis("langExam1Name")} onToggle={() => toggleVis("langExam1Name")}>
                <Input value={dv("langExam1Name")} onChange={(e) => setDv("langExam1Name", e.target.value)} className="h-8 text-[12px]" placeholder="TOEIC, TOEFL..." />
              </FieldRow>
              <FieldRow label="점수 / 등급" visible={isVis("langExam1Score")} onToggle={() => toggleVis("langExam1Score")}>
                <Input value={dv("langExam1Score")} onChange={(e) => setDv("langExam1Score", e.target.value)} className="h-8 text-[12px]" />
              </FieldRow>
              <FieldRow label="응시일" visible={isVis("langExam1Date")} onToggle={() => toggleVis("langExam1Date")}>
                <Input value={dv("langExam1Date")} onChange={(e) => setDv("langExam1Date", e.target.value)} className="h-8 text-[12px]" placeholder="YYYY.MM" />
              </FieldRow>
            </EditGrid>
          </EditSection>

          {/* 어학 — 외국어활용능력 */}
          <EditSection title="외국어활용능력">
            <EditGrid>
              <FieldRow label="회화" visible={isVis("langConversation")} onToggle={() => toggleVis("langConversation")}>
                <InlineSelect value={dv("langConversation") || ""} options={["", ...LANG_LEVEL_OPTS]} onChange={(v) => setDv("langConversation", v)} />
              </FieldRow>
              <FieldRow label="작문" visible={isVis("langWriting")} onToggle={() => toggleVis("langWriting")}>
                <InlineSelect value={dv("langWriting") || ""} options={["", ...LANG_LEVEL_OPTS]} onChange={(v) => setDv("langWriting", v)} />
              </FieldRow>
              <FieldRow label="독해" visible={isVis("langReading")} onToggle={() => toggleVis("langReading")}>
                <InlineSelect value={dv("langReading") || ""} options={["", ...LANG_LEVEL_OPTS]} onChange={(v) => setDv("langReading", v)} />
              </FieldRow>
            </EditGrid>
          </EditSection>

          {/* IT활용능력 */}
          <EditSection title="IT활용능력">
            <EditGrid>
              <FieldRow label="프로그램명" visible={isVis("itProgram")} onToggle={() => toggleVis("itProgram")}>
                <Input value={dv("itProgram")} onChange={(e) => setDv("itProgram", e.target.value)} className="h-8 text-[12px]" placeholder="Excel, Python..." />
              </FieldRow>
              <FieldRow label="활용 수준" visible={isVis("itLevel")} onToggle={() => toggleVis("itLevel")}>
                <InlineSelect value={dv("itLevel") || ""} options={["", ...LANG_LEVEL_OPTS]} onChange={(v) => setDv("itLevel", v)} />
              </FieldRow>
              <FieldRow label="사용 기간" visible={isVis("itDuration")} onToggle={() => toggleVis("itDuration")}>
                <Input value={dv("itDuration")} onChange={(e) => setDv("itDuration", e.target.value)} className="h-8 text-[12px]" placeholder="2년, 6개월..." />
              </FieldRow>
            </EditGrid>
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
                    <Input value={dv(k)} onChange={(e) => setDv(k, e.target.value)} className="h-8 text-[12px]" />
                  </FieldRow>
                ))}
                {dv("military") === "복무 중" && (
                  <FieldRow label="전역 예정일">
                    <Input value={dv("military.dischargeDue")} onChange={(e) => setDv("military.dischargeDue", e.target.value)} className="h-8 text-[12px]" />
                  </FieldRow>
                )}
              </EditGrid>
            )}
            {dv("military") === "면제" && (
              <EditGrid className="mt-4">
                <FieldRow label="면제 사유">
                  <Input value={dv("military.exemptReason")} onChange={(e) => setDv("military.exemptReason", e.target.value)} className="h-8 text-[12px]" />
                </FieldRow>
                <FieldRow label="병역 비고">
                  <Input value={dv("military.note")} onChange={(e) => setDv("military.note", e.target.value)} className="h-8 text-[12px]" />
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
                    <Input value={dv(k)} onChange={(e) => setDv(k, e.target.value)} className="h-8 text-[12px]" />
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
                    <Input value={dv(k)} onChange={(e) => setDv(k, e.target.value)} className="h-8 text-[12px]" />
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
                    <Input value={dv(k)} onChange={(e) => setDv(k, e.target.value)} className="h-8 text-[12px]" />
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
      <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{title}</h3>
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
              "text-[11px] leading-none transition-colors",
              visible === false ? "text-muted-foreground/30" : "text-muted-foreground/70",
            )}>
              {label}
            </span>
          </label>
        ) : (
          <span className="text-[11px] text-muted-foreground/70 leading-none">{label}</span>
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
      className="w-full h-8 px-2.5 text-[12px] rounded-md border border-border bg-background text-foreground"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
