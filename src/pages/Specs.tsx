import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Eye, EyeOff, MoreHorizontal, Pencil, FileText, Image as ImageIcon,
  Search, Check, Copy, Download, GripVertical, Upload, Star, X,
  Folder, LayoutGrid, LayoutList, Trash2, ExternalLink,
} from "lucide-react";
import { PickdSidebar } from "@/components/pickd/PickdSidebar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { INITIAL_EXPERIENCES, SHARED_EXP_KEY, type Item as ExpItem } from "./Experiences";

/* ──────────────────────────────────────────────────────────
   기본정보 schema
   ────────────────────────────────────────────────────────── */

type InfoKey =
  | "name" | "hanjaName" | "engName" | "birth" | "email" | "phone"
  | "address" | "school" | "major" | "grade"
  | "military" | "veteran" | "disability" | "national" | "driverLicense";

const INFO_FIELDS: { key: InfoKey; label: string; optional: boolean }[] = [
  { key: "name",          label: "이름",            optional: false },
  { key: "hanjaName",     label: "한자 이름",        optional: true  },
  { key: "engName",       label: "영문 이름",        optional: false },
  { key: "birth",         label: "생년월일",         optional: false },
  { key: "email",         label: "이메일",          optional: false },
  { key: "phone",         label: "전화번호",         optional: false },
  { key: "address",       label: "주소",            optional: true  },
  { key: "school",        label: "학교",            optional: true  },
  { key: "major",         label: "전공",            optional: true  },
  { key: "grade",         label: "학년 / 졸업 여부", optional: true  },
  { key: "military",      label: "병역 사항",        optional: true  },
  { key: "veteran",       label: "보훈 사항",        optional: true  },
  { key: "disability",    label: "장애 사항",        optional: true  },
  { key: "national",      label: "국가유공자 관련",   optional: true  },
  { key: "driverLicense", label: "운전면허",         optional: true  },
];

const INFO_DEFAULTS: Record<InfoKey, string> = {
  name: "장윤영", hanjaName: "張潤瑛", engName: "Yoon Jang",
  birth: "2001.03.15", email: "yoon.jang@example.com", phone: "010-0000-0000",
  address: "부산광역시 해운대구 센텀로 17",
  school: "부산대학교", major: "경영학과", grade: "4학년 재학",
  military: "해당 없음", veteran: "해당 없음", disability: "해당 없음",
  national: "해당 없음", driverLicense: "2종 보통",
};

/* ──────────────────────────────────────────────────────────
   대표 스펙 — derived from Tab 2 (경험정리) shared store
   ────────────────────────────────────────────────────────── */

type SpecType = "학력/학점" | "수강과목" | "어학" | "자격증" | "수상" | "교육 이수";

type SpecItem = {
  id: string;
  type: SpecType;
  title: string;
  experienceId?: string;
  source?: string;
  fields: { key: string; label: string; value: string }[];
};

const SPEC_TYPES_ORDER: SpecType[] = [
  "학력/학점", "수강과목", "어학", "자격증", "수상", "교육 이수",
];

const SPEC_TYPE_SET = new Set<string>([
  "수강과목", "어학", "자격증", "수상", "교육 이수",
]);

const ORG_KEY_PRIORITY = [
  "school", "univ", "org", "host", "issuer", "company", "dept", "country",
];

function isGpaItem(i: ExpItem): boolean {
  if (i.type !== "수강과목") return false;
  const blob = `${i.name} ${i.values?.course ?? ""} ${i.values?.credit ?? ""} ${i.values?.grade ?? ""}`;
  return /학점|평균|GPA|전공\s*\d/i.test(blob);
}

function getSourceText(i: ExpItem): string {
  for (const k of ORG_KEY_PRIORITY) {
    const v = i.values?.[k];
    if (v && v.trim()) return v.trim();
  }
  return "";
}

function toSpecItem(i: ExpItem): SpecItem | null {
  let type: SpecType;
  if (isGpaItem(i)) type = "학력/학점";
  else if (SPEC_TYPE_SET.has(i.type)) type = i.type as SpecType;
  else return null;

  const fields = (i.fields || [])
    .filter((f) => f.key !== "keywords" && f.key !== "importance")
    .map((f) => ({
      key: f.key,
      label: f.label,
      value: (i.values?.[f.key] ?? "").toString().trim(),
    }))
    .filter((f) => f.value);

  return {
    id: i.id,
    type,
    title: i.name,
    experienceId: i.id,
    source: getSourceText(i),
    fields,
  };
}

function loadSharedExperiences(): ExpItem[] {
  if (typeof window === "undefined") return INITIAL_EXPERIENCES;
  try {
    const raw = localStorage.getItem(SHARED_EXP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ExpItem[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch { /* noop */ }
  return INITIAL_EXPERIENCES;
}

function useExperiencePool(refreshKey: unknown): SpecItem[] {
  const [exp, setExp] = useState<ExpItem[]>(() => loadSharedExperiences());
  useEffect(() => {
    setExp(loadSharedExperiences());
    const onStorage = (e: StorageEvent) => {
      if (e.key === SHARED_EXP_KEY) setExp(loadSharedExperiences());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refreshKey]);
  return useMemo(
    () => exp.map(toSpecItem).filter((s): s is SpecItem => !!s),
    [exp],
  );
}

/* ──────────────────────────────────────────────────────────
   제출파일함
   ────────────────────────────────────────────────────────── */

type FileKind =
  | "증명사진" | "성적증명서" | "졸업증명서" | "재학증명서" | "어학 성적표"
  | "자격증 사본" | "수상 증빙" | "교육 수료증" | "기타 제출서류";

const FILE_KINDS: FileKind[] = [
  "증명사진", "성적증명서", "졸업증명서", "재학증명서", "어학 성적표",
  "자격증 사본", "수상 증빙", "교육 수료증", "기타 제출서류",
];

type FileItem = {
  id: string;
  kind: FileKind;
  name: string;
  fileKind: "pdf" | "image";
  url?: string;
  linkedSpecId?: string;
};

const SAMPLE_PHOTO_A = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=240&h=320&fit=crop";
const SAMPLE_PHOTO_B = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=240&h=320&fit=crop";

const INITIAL_FILES: FileItem[] = [
  { id: "f0",  kind: "증명사진",    name: "profile_photo.jpg",     fileKind: "image", url: SAMPLE_PHOTO_A },
  { id: "f0b", kind: "증명사진",    name: "profile_photo_2.jpg",   fileKind: "image", url: SAMPLE_PHOTO_B },
  { id: "f1",  kind: "성적증명서",  name: "성적증명서_2025.pdf",     fileKind: "pdf" },
  { id: "f4",  kind: "어학 성적표", name: "toeic_945.png",         fileKind: "image", linkedSpecId: "p2" },
];

/* ──────────────────────────────────────────────────────────
   localStorage helpers
   ────────────────────────────────────────────────────────── */

const LS_VISIBLE     = "specs.info.visibleKeys.v3";
const LS_VALUES      = "specs.info.values.v2";
const LS_REP_IDS     = "specs.rep.ids";
const LS_PHOTO_SHOWN = "specs.basicPhoto.shown";
const LS_PHOTO_ID    = "specs.basicPhoto.id";
const LS_FILES       = "specs.files.v1";
const LS_CARD_FIELDS = "specs.rep.cardFields.v1";
const LS_HIDDEN_VAL  = "specs.info.hiddenValueKeys.v1";
const LS_REP_VIEW    = "specs.rep.view.v1";

function lsGet<T>(k: string, fallback: T): T {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback; }
  catch { return fallback; }
}
function lsSet(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* noop */ }
}

/* Subtle autosave toast */
let lastSaveAt = 0;
function flashSaved() {
  const now = Date.now();
  if (now - lastSaveAt < 800) return;
  lastSaveAt = now;
  toast("저장됨", { duration: 1200 });
}

/* ──────────────────────────────────────────────────────────
   Page
   ────────────────────────────────────────────────────────── */

type Preview =
  | { kind: "image" | "pdf"; file: FileItem }
  | null;

export default function Specs() {
  const navigate = useNavigate();

  // 기본정보 visibility (only optional fields are toggleable; required fields always shown)
  const defaultVisible = useMemo(
    () => INFO_FIELDS.map((f) => f.key).filter((k) => {
      // by default show common fields, hide niche ones
      return !(["hanjaName", "veteran", "disability", "national", "driverLicense"] as InfoKey[]).includes(k);
    }),
    [],
  );
  const [visibleKeys, setVisibleKeys] = useState<InfoKey[]>(
    () => lsGet<InfoKey[]>(LS_VISIBLE, defaultVisible),
  );
  useEffect(() => lsSet(LS_VISIBLE, visibleKeys), [visibleKeys]);

  // Per-field value masking (does not remove the row from layout)
  const [hiddenValueKeys, setHiddenValueKeys] = useState<string[]>(
    () => lsGet<string[]>(LS_HIDDEN_VAL, []),
  );
  useEffect(() => lsSet(LS_HIDDEN_VAL, hiddenValueKeys), [hiddenValueKeys]);
  const toggleValueHidden = (k: string) =>
    setHiddenValueKeys((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  const revealValue = (k: string) =>
    setHiddenValueKeys((p) => p.filter((x) => x !== k));

  // 기본정보 values (editable, autosaved) — also stores sub-fields like "military.branch"
  const [values, setValues] = useState<Record<string, string>>(
    () => ({ ...INFO_DEFAULTS, ...lsGet<Record<string, string>>(LS_VALUES, {}) }),
  );
  useEffect(() => lsSet(LS_VALUES, values), [values]);
  const setValue = (k: string, v: string) => {
    setValues((p) => ({ ...p, [k]: v }));
    flashSaved();
  };

  // 증명사진
  const [photoShown, setPhotoShown] = useState<boolean>(
    () => lsGet<boolean>(LS_PHOTO_SHOWN, true),
  );
  const [basicPhotoId, setBasicPhotoId] = useState<string>(
    () => lsGet<string>(LS_PHOTO_ID, "f0"),
  );
  useEffect(() => lsSet(LS_PHOTO_SHOWN, photoShown), [photoShown]);
  useEffect(() => lsSet(LS_PHOTO_ID, basicPhotoId), [basicPhotoId]);

  // 대표 스펙 — pool derived from 경험정리, only ids stored locally
  const [repIds, setRepIds] = useState<string[]>(
    () => lsGet<string[]>(LS_REP_IDS, []),
  );
  useEffect(() => lsSet(LS_REP_IDS, repIds), [repIds]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const specPool = useExperiencePool(pickerOpen);
  const [repView, setRepView] = useState<"card" | "list">(
    () => lsGet<"card" | "list">(LS_REP_VIEW, "card"),
  );
  useEffect(() => lsSet(LS_REP_VIEW, repView), [repView]);

  const reps = useMemo(
    () => repIds
      .map((id) => specPool.find((p) => p.id === id))
      .filter((s): s is SpecItem => !!s),
    [repIds, specPool],
  );

  const [editorOpen, setEditorOpen] = useState(false);

  // per-card field visibility — Record<specId, fieldKey[]>
  const [cardFields, setCardFields] = useState<Record<string, string[]>>(
    () => lsGet<Record<string, string[]>>(LS_CARD_FIELDS, {}),
  );
  useEffect(() => lsSet(LS_CARD_FIELDS, cardFields), [cardFields]);
  const setCardFieldKeys = (specId: string, keys: string[]) => {
    setCardFields((p) => ({ ...p, [specId]: keys }));
    flashSaved();
  };

  // 파일
  const [files, setFiles] = useState<FileItem[]>(
    () => lsGet<FileItem[]>(LS_FILES, INITIAL_FILES),
  );
  useEffect(() => lsSet(LS_FILES, files), [files]);

  const [preview, setPreview] = useState<Preview>(null);

  const copy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast("복사되었습니다", { duration: 1200 });
  };

  const openExperience = (experienceId?: string) =>
    navigate(experienceId ? `/experiences?open=${experienceId}` : "/experiences");

  const reorderReps = (from: number, to: number) => {
    setRepIds((p) => {
      const n = [...p]; const [m] = n.splice(from, 1); n.splice(to, 0, m); return n;
    });
  };

  const basicPhoto = useMemo(
    () => files.find((f) => f.kind === "증명사진" && f.id === basicPhotoId)
      ?? files.find((f) => f.kind === "증명사진"),
    [files, basicPhotoId],
  );

  const addFile = (kind: FileKind, name: string, fileKind: "pdf" | "image", url?: string) => {
    const newFile: FileItem = {
      id: `f${Date.now()}`, kind, name, fileKind,
      url: url ?? (fileKind === "image" ? SAMPLE_PHOTO_B : undefined),
    };
    setFiles((p) => [...p, newFile]);
    flashSaved();
  };

  const renameFile = (id: string, name: string) => {
    setFiles((p) => p.map((f) => (f.id === id ? { ...f, name } : f)));
    flashSaved();
  };
  const deleteFile = (id: string) => {
    setFiles((p) => p.filter((f) => f.id !== id));
    setPreview(null);
    toast("삭제되었습니다", { duration: 1200 });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen bg-background overflow-hidden">
        <PickdSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-6 max-w-[1180px] mx-auto space-y-6">
            {/* Page header — no top action buttons */}
            <header>
              <h1 className="text-[26px] font-bold text-foreground tracking-[-0.04em] leading-tight">기본 스펙</h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                지원서에 자주 쓰는 기본정보, 대표 스펙, 제출 파일을 한곳에서 빠르게 꺼내 쓰세요.
              </p>
            </header>

            <BasicInfoSection
              visibleKeys={visibleKeys}
              setVisibleKeys={setVisibleKeys}
              values={values}
              setValue={setValue}
              onCopy={copy}
              photoShown={photoShown}
              setPhotoShown={setPhotoShown}
              basicPhoto={basicPhoto}
              onPreviewPhoto={(f) => setPreview({ kind: "image", file: f })}
              onOpenEditor={() => setEditorOpen(true)}
              hiddenValueKeys={hiddenValueKeys}
              onToggleValueHidden={toggleValueHidden}
              onRevealValue={revealValue}
            />

            <RepSpecSection
              reps={reps}
              view={repView}
              setView={setRepView}
              onCopy={copy}
              onRemove={(id) => {
                setRepIds((p) => p.filter((x) => x !== id));
                toast("대표 스펙에서 제거했어요", { duration: 1200 });
              }}
              onOpenExperience={openExperience}
              onImport={() => setPickerOpen(true)}
              onReorder={reorderReps}
              cardFields={cardFields}
              setCardFieldKeys={setCardFieldKeys}
              files={files}
              onPreviewFile={(f) => setPreview({ kind: f.fileKind, file: f })}
            />

            <FilesSection
              files={files}
              onUpload={addFile}
              onPreview={(f) => setPreview({ kind: f.fileKind, file: f })}
            />
          </div>
        </main>

        <SpecPickerModal
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          pool={specPool}
          selected={repIds}
          onConfirm={(ids) => { setRepIds(ids); setPickerOpen(false); flashSaved(); }}
        />

        <BasicInfoEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          values={values}
          setValue={setValue}
          visibleKeys={visibleKeys}
          setVisibleKeys={setVisibleKeys}
          photoShown={photoShown}
          setPhotoShown={setPhotoShown}
          basicPhoto={basicPhoto}
        />

        <PreviewModal
          preview={preview}
          onClose={() => setPreview(null)}
          isBasicPhoto={(id) => id === basicPhotoId}
          onSetBasicPhoto={(id) => { setBasicPhotoId(id); setPhotoShown(true); flashSaved(); }}
          onCopy={copy}
          onRename={renameFile}
          onDelete={deleteFile}
        />
      </div>
    </TooltipProvider>
  );
}

/* ──────────────────────────────────────────────────────────
   1. 기본정보 — document-style block
   ────────────────────────────────────────────────────────── */

function BasicInfoSection(props: {
  visibleKeys: InfoKey[];
  setVisibleKeys: (v: InfoKey[] | ((p: InfoKey[]) => InfoKey[])) => void;
  values: Record<string, string>;
  setValue: (k: string, v: string) => void;
  onCopy: (t: string) => void;
  photoShown: boolean;
  setPhotoShown: (v: boolean) => void;
  basicPhoto: FileItem | undefined;
  onPreviewPhoto: (f: FileItem) => void;
  onOpenEditor: () => void;
  hiddenValueKeys: string[];
  onToggleValueHidden: (k: string) => void;
  onRevealValue: (k: string) => void;
}) {
  const {
    visibleKeys, setVisibleKeys, values, setValue, onCopy,
    photoShown, setPhotoShown, basicPhoto, onPreviewPhoto, onOpenEditor,
    hiddenValueKeys, onToggleValueHidden, onRevealValue,
  } = props;

  const toggleVisible = (k: InfoKey) =>
    setVisibleKeys((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const orderedKeys = INFO_FIELDS.map((f) => f.key).filter((k) => visibleKeys.includes(k));

  return (
    <section id="sec-info">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">기본정보</h2>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onOpenEditor}
                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px]">전체 편집</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl px-6 py-5">
        <div className="flex gap-6">
          {photoShown && (
            <PhotoBlock
              photo={basicPhoto}
              onPreview={() => basicPhoto && onPreviewPhoto(basicPhoto)}
            />
          )}

          <div className="flex-1 grid grid-cols-2 gap-x-10 gap-y-4 min-w-0 content-start">
            {orderedKeys.map((key) => {
              const f = INFO_FIELDS.find((x) => x.key === key)!;
              const hidden = hiddenValueKeys.includes(key);
              return (
                <InfoRow
                  key={key}
                  label={f.label}
                  value={values[key] || ""}
                  onCopy={onCopy}
                  onSave={(v) => setValue(key, v)}
                  hidden={hidden}
                  onToggleHidden={() => onToggleValueHidden(key)}
                  onReveal={() => onRevealValue(key)}
                />
              );
            })}
            {orderedKeys.length === 0 && (
              <div className="col-span-2 text-xs text-muted-foreground py-4">
                표시할 항목이 없어요. 오른쪽 위 눈 아이콘에서 항목을 선택해주세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoRow({
  label, value, onCopy, onSave, hidden, onToggleHidden, onReveal,
}: {
  label: string;
  value: string;
  onCopy: (t: string) => void;
  onSave: (v: string) => void;
  hidden?: boolean;
  onToggleHidden?: () => void;
  onReveal?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);
  useEffect(() => { if (editing) inputRef.current?.focus(); inputRef.current?.select(); }, [editing]);

  const save = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  return (
    <div className="grid grid-cols-[88px_1fr] items-center gap-3 min-w-0 group">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
          className="w-full text-sm text-foreground bg-transparent border-b border-primary/60 outline-none py-0.5"
        />
      ) : (
        <div className="flex items-center gap-1 min-w-0">
          {hidden ? (
            <button
              onClick={onReveal}
              title="클릭해서 값 보기"
              className="inline-flex items-center text-muted-foreground/60 hover:text-foreground -mx-1 px-1 py-0.5 rounded transition-colors cursor-pointer"
              aria-label="숨겨진 값 보기"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => value && onCopy(value)}
              title="클릭해서 복사"
              className="group/copy inline-flex items-center gap-1 text-sm text-foreground hover:text-primary hover:bg-primary/5 -mx-1 px-1 rounded transition-colors max-w-full cursor-pointer min-w-0"
            >
              <span className="truncate">
                {value || <span className="text-muted-foreground">—</span>}
              </span>
              {value && <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 shrink-0" />}
            </button>
          )}
          <button
            onClick={() => setEditing(true)}
            title="편집"
            className="p-0.5 rounded text-muted-foreground/70 hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pencil className="w-3 h-3" />
          </button>
          {onToggleHidden && (
            <button
              onClick={onToggleHidden}
              title={hidden ? "값 보이기" : "값 숨기기"}
              className="p-0.5 rounded text-muted-foreground/70 hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PhotoBlock({
  photo, onPreview,
}: { photo: FileItem | undefined; onPreview: () => void }) {
  return (
    <button
      onClick={onPreview}
      className="shrink-0 w-[104px] h-[140px] rounded-lg border border-border overflow-hidden bg-muted/30 hover:border-primary/40 transition-colors"
      title="미리보기"
    >
      {photo?.url ? (
        <img src={photo.url} alt="증명사진" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
          증명사진
        </div>
      )}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────
   기본정보 전체 편집 Modal
   ────────────────────────────────────────────────────────── */

function BasicInfoEditor(props: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  values: Record<string, string>;
  setValue: (k: string, v: string) => void;
  visibleKeys: InfoKey[];
  setVisibleKeys: (v: InfoKey[] | ((p: InfoKey[]) => InfoKey[])) => void;
  photoShown: boolean;
  setPhotoShown: (v: boolean) => void;
  basicPhoto: FileItem | undefined;
}) {
  const {
    open, onOpenChange, values, setValue,
    visibleKeys, setVisibleKeys, photoShown, setPhotoShown, basicPhoto,
  } = props;

  const toggleVisible = (k: InfoKey) =>
    setVisibleKeys((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const v = (k: string) => values[k] || "";

  // status options
  const MIL_OPTS = ["해당 없음", "군필", "미필", "면제", "복무 중"];
  const YES_NO  = ["해당 없음", "대상", "비대상"];
  const LIC_OPTS = ["없음", "1종 보통", "1종 대형", "2종 보통", "2종 소형", "기타"];

  const milStatus = v("military") || "해당 없음";
  const vetStatus = v("veteran") || "해당 없음";
  const disStatus = v("disability") || "해당 없음";
  const natStatus = v("national") || "해당 없음";
  const licStatus = v("driverLicense") || "없음";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">기본정보 편집</DialogTitle>
          <DialogDescription className="text-xs">
            모든 항목은 자동 저장됩니다. 필요한 항목만 입력하세요.
          </DialogDescription>
        </DialogHeader>

        {/* 증명사진 */}
        <EditorSection title="증명사진">
          <div className="flex items-center gap-4">
            <div className="w-[96px] h-[128px] rounded-lg border border-border overflow-hidden bg-muted/30">
              {basicPhoto?.url ? (
                <img src={basicPhoto.url} alt="증명사진" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[11px]">
                  사진 없음
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={photoShown}
                  onCheckedChange={(c) => setPhotoShown(!!c)}
                  className="h-3.5 w-3.5"
                />
                기본정보에 증명사진 표시
              </label>
              <p className="text-[11px] text-muted-foreground">
                사진 업로드/교체는 아래 제출파일함 → 증명사진에서 관리하세요.
              </p>
            </div>
          </div>
        </EditorSection>

        {/* 기본 인적사항 */}
        <EditorSection title="기본 인적사항">
          <FieldGrid>
            {(["name", "hanjaName", "engName", "birth", "email", "phone", "address", "school", "major", "grade"] as InfoKey[]).map((k) => {
              const f = INFO_FIELDS.find((x) => x.key === k)!;
              return (
                <EditorField key={k} label={f.label} visible={visibleKeys.includes(k)} onToggle={() => toggleVisible(k)}>
                  <Input value={v(k)} onChange={(e) => setValue(k, e.target.value)} className="h-8 text-xs" />
                </EditorField>
              );
            })}
          </FieldGrid>
        </EditorSection>

        {/* 병역 */}
        <EditorSection title="병역 사항">
          <FieldGrid>
            <EditorField label="병역 상태" visible={visibleKeys.includes("military")} onToggle={() => toggleVisible("military")}>
              <SelectInput value={milStatus} options={MIL_OPTS} onChange={(val) => setValue("military", val)} />
            </EditorField>
          </FieldGrid>
          {(milStatus === "군필" || milStatus === "복무 중") && (
            <FieldGrid>
              <EditorField label="복무 구분"><Input value={v("military.kind")} onChange={(e) => setValue("military.kind", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="군별"><Input value={v("military.branch")} onChange={(e) => setValue("military.branch", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="계급"><Input value={v("military.rank")} onChange={(e) => setValue("military.rank", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="복무 시작일"><Input value={v("military.start")} onChange={(e) => setValue("military.start", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="복무 종료일"><Input value={v("military.end")} onChange={(e) => setValue("military.end", e.target.value)} className="h-8 text-xs" /></EditorField>
              {milStatus === "복무 중" && (
                <EditorField label="전역 예정일"><Input value={v("military.dischargeDue")} onChange={(e) => setValue("military.dischargeDue", e.target.value)} className="h-8 text-xs" /></EditorField>
              )}
              <EditorField label="병역 비고"><Input value={v("military.note")} onChange={(e) => setValue("military.note", e.target.value)} className="h-8 text-xs" /></EditorField>
            </FieldGrid>
          )}
          {milStatus === "면제" && (
            <FieldGrid>
              <EditorField label="면제 사유"><Input value={v("military.exemptReason")} onChange={(e) => setValue("military.exemptReason", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="병역 비고"><Input value={v("military.note")} onChange={(e) => setValue("military.note", e.target.value)} className="h-8 text-xs" /></EditorField>
            </FieldGrid>
          )}
        </EditorSection>

        {/* 보훈 */}
        <EditorSection title="보훈 사항">
          <FieldGrid>
            <EditorField label="보훈 상태" visible={visibleKeys.includes("veteran")} onToggle={() => toggleVisible("veteran")}>
              <SelectInput value={vetStatus} options={YES_NO} onChange={(val) => setValue("veteran", val)} />
            </EditorField>
          </FieldGrid>
          {vetStatus === "대상" && (
            <FieldGrid>
              <EditorField label="보훈 구분"><Input value={v("veteran.kind")} onChange={(e) => setValue("veteran.kind", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="보훈 번호"><Input value={v("veteran.no")} onChange={(e) => setValue("veteran.no", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="발급기관"><Input value={v("veteran.org")} onChange={(e) => setValue("veteran.org", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="관계"><Input value={v("veteran.relation")} onChange={(e) => setValue("veteran.relation", e.target.value)} className="h-8 text-xs" placeholder="예: 본인, 자녀" /></EditorField>
              <EditorField label="가산점 여부"><Input value={v("veteran.bonus")} onChange={(e) => setValue("veteran.bonus", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="비고"><Input value={v("veteran.note")} onChange={(e) => setValue("veteran.note", e.target.value)} className="h-8 text-xs" /></EditorField>
            </FieldGrid>
          )}
        </EditorSection>

        {/* 장애 */}
        <EditorSection title="장애 사항">
          <FieldGrid>
            <EditorField label="장애 상태" visible={visibleKeys.includes("disability")} onToggle={() => toggleVisible("disability")}>
              <SelectInput value={disStatus} options={YES_NO} onChange={(val) => setValue("disability", val)} />
            </EditorField>
          </FieldGrid>
          {disStatus === "대상" && (
            <FieldGrid>
              <EditorField label="장애 유형"><Input value={v("disability.type")} onChange={(e) => setValue("disability.type", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="장애 정도 / 등급"><Input value={v("disability.grade")} onChange={(e) => setValue("disability.grade", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="등록번호"><Input value={v("disability.no")} onChange={(e) => setValue("disability.no", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="등록일"><Input value={v("disability.date")} onChange={(e) => setValue("disability.date", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="발급기관"><Input value={v("disability.org")} onChange={(e) => setValue("disability.org", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="비고"><Input value={v("disability.note")} onChange={(e) => setValue("disability.note", e.target.value)} className="h-8 text-xs" /></EditorField>
            </FieldGrid>
          )}
        </EditorSection>

        {/* 국가유공자 */}
        <EditorSection title="국가유공자">
          <FieldGrid>
            <EditorField label="국가유공자 상태" visible={visibleKeys.includes("national")} onToggle={() => toggleVisible("national")}>
              <SelectInput value={natStatus} options={YES_NO} onChange={(val) => setValue("national", val)} />
            </EditorField>
          </FieldGrid>
          {natStatus === "대상" && (
            <FieldGrid>
              <EditorField label="구분"><Input value={v("national.kind")} onChange={(e) => setValue("national.kind", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="국가유공자 번호"><Input value={v("national.no")} onChange={(e) => setValue("national.no", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="발급기관"><Input value={v("national.org")} onChange={(e) => setValue("national.org", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="관계"><Input value={v("national.relation")} onChange={(e) => setValue("national.relation", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="가산점 여부"><Input value={v("national.bonus")} onChange={(e) => setValue("national.bonus", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="비고"><Input value={v("national.note")} onChange={(e) => setValue("national.note", e.target.value)} className="h-8 text-xs" /></EditorField>
            </FieldGrid>
          )}
        </EditorSection>

        {/* 운전면허 */}
        <EditorSection title="운전면허">
          <FieldGrid>
            <EditorField label="면허 종류" visible={visibleKeys.includes("driverLicense")} onToggle={() => toggleVisible("driverLicense")}>
              <SelectInput value={licStatus} options={LIC_OPTS} onChange={(val) => setValue("driverLicense", val)} />
            </EditorField>
          </FieldGrid>
          {licStatus !== "없음" && (
            <FieldGrid>
              <EditorField label="면허 번호"><Input value={v("license.no")} onChange={(e) => setValue("license.no", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="발급일"><Input value={v("license.issued")} onChange={(e) => setValue("license.issued", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="갱신일"><Input value={v("license.renewed")} onChange={(e) => setValue("license.renewed", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="만료일"><Input value={v("license.expiry")} onChange={(e) => setValue("license.expiry", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="발급기관"><Input value={v("license.org")} onChange={(e) => setValue("license.org", e.target.value)} className="h-8 text-xs" /></EditorField>
              <EditorField label="운전 가능 여부"><Input value={v("license.canDrive")} onChange={(e) => setValue("license.canDrive", e.target.value)} className="h-8 text-xs" placeholder="예: 가능 / 보류" /></EditorField>
              <EditorField label="비고"><Input value={v("license.note")} onChange={(e) => setValue("license.note", e.target.value)} className="h-8 text-xs" /></EditorField>
            </FieldGrid>
          )}
        </EditorSection>

        <div className="flex items-center justify-between pt-2 border-t border-border sticky bottom-0 bg-background">
          <span className="text-[11px] text-muted-foreground">자동 저장됨</span>
          <Button size="sm" className="h-8 text-xs" onClick={() => onOpenChange(false)}>
            완료
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 pt-1">
      <h3 className="text-xs font-semibold text-foreground/80">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-5 gap-y-3">{children}</div>;
}

function EditorField({
  label, visible, onToggle, children,
}: {
  label: string;
  visible?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        {onToggle && (
          <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
            <Checkbox checked={!!visible} onCheckedChange={onToggle} className="h-3 w-3" />
            표시
          </label>
        )}
      </div>
      {children}
    </div>
  );
}

function SelectInput({
  value, options, onChange,
}: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-8 px-2 text-xs rounded-md border border-border bg-background"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

/* ──────────────────────────────────────────────────────────
   2. 대표 스펙 — import from Tab 2 only
   ────────────────────────────────────────────────────────── */

function RepSpecSection(props: {
  reps: SpecItem[];
  view: "card" | "list";
  setView: (v: "card" | "list") => void;
  onCopy: (t: string) => void;
  onRemove: (id: string) => void;
  onOpenExperience: (id?: string) => void;
  onImport: () => void;
  onReorder: (from: number, to: number) => void;
  cardFields: Record<string, string[]>;
  setCardFieldKeys: (specId: string, keys: string[]) => void;
  files: FileItem[];
  onPreviewFile: (f: FileItem) => void;
}) {
  const { reps, view, setView, onCopy, onRemove, onOpenExperience, onImport, onReorder, cardFields, setCardFieldKeys, files, onPreviewFile } = props;

  return (
    <section id="sec-rep">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">대표 스펙</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            경험정리에 저장된 스펙 중 자주 쓰는 항목을 꺼내두는 공간이에요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-md border border-border">
            <button
              onClick={() => setView("card")}
              className={cn(
                "inline-flex items-center justify-center w-6 h-6 rounded transition-colors",
                view === "card" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="카드형"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "inline-flex items-center justify-center w-6 h-6 rounded transition-colors",
                view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="리스트형"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={onImport}
            className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> 경험 추가하기
          </button>
        </div>
      </div>

      {reps.length === 0 ? (
        <button
          onClick={onImport}
          className="w-full bg-card border border-dashed border-border rounded-xl p-10 text-center hover:border-primary/40 hover:bg-primary/5 transition-colors"
        >
          <p className="text-sm text-foreground">아직 고정된 대표 스펙이 없어요.</p>
          <p className="text-xs text-muted-foreground mt-1">
            경험정리에 저장된 스펙을 불러와 자주 쓰는 항목으로 고정해보세요.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
            <Plus className="w-3.5 h-3.5" /> 경험 추가하기
          </span>
        </button>
      ) : view === "card" ? (
        <DragList
          items={reps}
          onReorder={onReorder}
          render={(s, h) => (
            <RepCard key={s.id} spec={s} dragHandlers={h}
              onCopy={onCopy} onRemove={onRemove} onOpenExperience={onOpenExperience}
              visibleFieldKeys={cardFields[s.id]}
              setVisibleFieldKeys={(keys) => setCardFieldKeys(s.id, keys)}
            />
          )}
          footer={
            <button
              onClick={onImport}
              className="min-h-[160px] rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary flex flex-col items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs">경험 추가하기</span>
            </button>
          }
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse select-text">
              <thead>
                <tr className="bg-muted/40 text-[11px] text-muted-foreground">
                  <th className="text-left font-medium px-3 py-2 w-[88px]">구분</th>
                  <th className="text-left font-medium px-3 py-2 w-[180px]">항목명</th>
                  <th className="text-left font-medium px-3 py-2 w-[140px]">기관/학교</th>
                  <th className="text-left font-medium px-3 py-2">주요 내용</th>
                  <th className="text-left font-medium px-3 py-2 w-[110px]">기간/일자</th>
                  <th className="text-left font-medium px-3 py-2 w-[64px]">파일</th>
                  <th className="text-right font-medium px-3 py-2 w-[80px]">관리</th>
                </tr>
              </thead>
              <tbody>
                {reps.map((s) => {
                  const dateField = s.fields.find((f) =>
                    /기간|일자|취득|학기|연도|날짜|^일$|date|period|year|semester/i.test(
                      `${f.key} ${f.label}`,
                    ),
                  );
                  const dateText = dateField?.value ?? "";
                  const contentFields = s.fields.filter((f) => f.key !== dateField?.key).slice(0, 4);
                  const contentText = contentFields
                    .map((f) => `${f.label} ${f.value}`)
                    .join(" · ");
                  const linkedFiles = files.filter((x) => x.linkedSpecId === s.id);
                  return (
                    <tr
                      key={s.id}
                      className="border-t border-border/60 hover:bg-muted/20 transition-colors group align-top"
                    >
                      <td className="px-3 py-2.5">
                        <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground/90 whitespace-nowrap">
                          {s.type}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-foreground truncate">{s.title}</span>
                          <button
                            onClick={() => onCopy(s.title)}
                            title="복사"
                            className="p-0.5 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground truncate">
                        {s.source || <span className="text-muted-foreground/50">—</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-start gap-1">
                          <span className="text-foreground/90 leading-relaxed">
                            {contentText || <span className="text-muted-foreground/50">—</span>}
                          </span>
                          {contentText && (
                            <button
                              onClick={() => onCopy(contentText)}
                              title="복사"
                              className="p-0.5 mt-0.5 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                        {dateText || <span className="text-muted-foreground/50">—</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        {linkedFiles.length > 0 ? (
                          <button
                            onClick={() => onPreviewFile(linkedFiles[0])}
                            title={linkedFiles[0].name}
                            className="inline-flex items-center justify-center w-7 h-7 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            {linkedFiles[0].fileKind === "image"
                              ? <ImageIcon className="w-3.5 h-3.5" />
                              : <FileText className="w-3.5 h-3.5" />}
                          </button>
                        ) : (
                          <span className="text-muted-foreground/40 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            onClick={() => onOpenExperience(s.experienceId)}
                            title="경험정리에서 보기"
                            className="w-7 h-7 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="w-7 h-7 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                aria-label="더보기"
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[160px]">
                              <DropdownMenuItem className="text-xs" onSelect={() => onOpenExperience(s.experienceId)}>
                                <ExternalLink className="w-3 h-3 mr-1.5" /> 경험정리에서 보기
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-xs text-destructive" onSelect={() => onRemove(s.id)}>
                                <Trash2 className="w-3 h-3 mr-1.5" /> 대표 스펙에서 제거
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button
            onClick={onImport}
            className="w-full px-3 py-2 text-[11px] text-muted-foreground hover:text-primary hover:bg-primary/5 border-t border-border inline-flex items-center justify-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" /> 대표 스펙 추가
          </button>
        </div>
      )}
    </section>
  );
}


function DragList({
  items, onReorder, render, footer,
}: {
  items: SpecItem[];
  onReorder: (from: number, to: number) => void;
  render: (s: SpecItem, h: DragHandlers) => React.ReactNode;
  footer?: React.ReactNode;
}) {
  const dragIndex = useRef<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const handlersFor = (i: number): DragHandlers => ({
    draggable: true,
    onDragStart: (e) => { dragIndex.current = i; e.dataTransfer.effectAllowed = "move"; },
    onDragOver: (e) => { e.preventDefault(); setOverIdx(i); },
    onDragLeave: () => setOverIdx((p) => (p === i ? null : p)),
    onDrop: (e) => {
      e.preventDefault();
      const from = dragIndex.current;
      dragIndex.current = null;
      setOverIdx(null);
      if (from === null || from === i) return;
      onReorder(from, i);
    },
    onDragEnd: () => { dragIndex.current = null; setOverIdx(null); },
    isOver: overIdx === i,
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((s, i) => render(s, handlersFor(i)))}
      {footer}
    </div>
  );
}

type DragHandlers = {
  draggable: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isOver: boolean;
};

function RepCard(props: {
  spec: SpecItem;
  dragHandlers: DragHandlers;
  onCopy: (t: string) => void;
  onRemove: (id: string) => void;
  onOpenExperience: (id?: string) => void;
  visibleFieldKeys?: string[];
  setVisibleFieldKeys: (keys: string[]) => void;
}) {
  const { spec, dragHandlers, onCopy, onRemove, onOpenExperience, visibleFieldKeys, setVisibleFieldKeys } = props;
  const { isOver, ...handlers } = dragHandlers;

  // default: first 4 fields visible
  const defaultKeys = spec.fields.slice(0, 4).map((f) => f.key);
  const activeKeys = visibleFieldKeys ?? defaultKeys;
  const shown = spec.fields.filter((f) => activeKeys.includes(f.key));

  const toggleField = (key: string) => {
    const next = activeKeys.includes(key)
      ? activeKeys.filter((k) => k !== key)
      : [...activeKeys, key];
    setVisibleFieldKeys(next);
  };

  return (
    <div
      {...handlers}
      className={cn(
        "group relative bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors",
        isOver && "border-primary/60 bg-primary/5",
      )}
    >
      <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted cursor-grab active:cursor-grabbing"
          title="드래그로 순서 변경">
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              title="표시 항목 설정"
              className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
              카드에 표시할 항목
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {spec.fields.map((f) => (
              <DropdownMenuCheckboxItem
                key={f.key}
                checked={activeKeys.includes(f.key)}
                onCheckedChange={() => toggleField(f.key)}
                onSelect={(e) => e.preventDefault()}
                className="text-xs"
              >
                {f.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem className="text-xs" onSelect={() => onOpenExperience(spec.experienceId)}>
              경험정리에서 보기
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs text-destructive" onSelect={() => onRemove(spec.id)}>
              대표 스펙에서 제거
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="pr-24">
        <span className="inline-block text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
          {spec.type}
        </span>
        <button
          onClick={() => onOpenExperience(spec.experienceId)}
          className="mt-1.5 block text-sm font-medium text-foreground text-left hover:text-primary max-w-full"
        >
          <span className="truncate block">{spec.title}</span>
        </button>
      </div>

      {shown.length > 0 ? (
        <dl className="mt-3 space-y-1">
          {shown.map((f) => (
            <div key={f.key} className="flex items-baseline text-xs gap-2">
              <dt className="text-muted-foreground shrink-0 w-[68px]">{f.label}</dt>
              <dd className="min-w-0 flex-1">
                <button
                  onClick={() => onCopy(f.value)}
                  className="group/copy inline-flex items-center gap-1 text-foreground hover:text-primary hover:bg-primary/5 -mx-1 px-1 rounded text-left max-w-full cursor-pointer"
                >
                  <span className="truncate">{f.value}</span>
                  <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 shrink-0" />
                </button>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-[11px] text-muted-foreground">
          표시할 항목이 없어요. 연필 아이콘에서 항목을 선택하세요.
        </p>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   대표 스펙 picker
   ────────────────────────────────────────────────────────── */

function SpecPickerModal(props: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pool: SpecItem[];
  selected: string[];
  onConfirm: (ids: string[]) => void;
}) {
  const { open, onOpenChange, pool, selected, onConfirm } = props;
  const [draft, setDraft] = useState<string[]>(selected);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(selected);
      setQ("");
    }
  }, [open, selected]);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return pool.filter((p) => {
      if (!query) return true;
      const target = [
        p.type,
        p.title,
        ...p.fields.map((f) => `${f.label} ${f.value}`),
      ]
        .join(" ")
        .toLowerCase();
      return target.includes(query);
    });
  }, [pool, q]);

  const toggle = (id: string) =>
    setDraft((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );

  const TABS: ("전체" | SpecType)[] = [
    "전체", "학력/학점", "수강과목", "어학", "자격증", "수상", "교육 이수",
  ];
  const [tab, setTab] = useState<(typeof TABS)[number]>("전체");
  useEffect(() => { if (open) setTab("전체"); }, [open]);

  const filtered = useMemo(() => {
    return list.filter((s) => tab === "전체" || s.type === tab);
  }, [list, tab]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[620px] max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-base">대표 스펙 추가</DialogTitle>
          <DialogDescription className="text-xs">
            경험정리에 저장된 스펙 중 자주 쓰는 항목을 골라 대표 스펙으로 꺼내두세요.
          </DialogDescription>
        </DialogHeader>

        <div className="shrink-0 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "shrink-0 h-7 px-2.5 rounded-md text-[11px] border transition-colors",
                  tab === t
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="relative shrink-0 w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="스펙 검색"
              className="h-7 pl-7 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto border border-border rounded-lg">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              조건에 맞는 스펙이 없어요.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {filtered.map((s) => {
                const checked = draft.includes(s.id);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => toggle(s.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/40 transition-colors",
                        checked && "bg-primary/5",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(s.id)}
                        className="h-3.5 w-3.5 shrink-0"
                      />
                      <span className="shrink-0 w-[68px] text-center text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground/90 truncate">
                        {s.type}
                      </span>
                      <span className="flex-1 min-w-0 text-sm text-foreground truncate">
                        {s.title}
                      </span>
                      <span className="shrink-0 max-w-[180px] text-xs text-muted-foreground truncate text-right">
                        {s.source}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="shrink-0 flex items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-muted-foreground">
            {draft.length}개 선택됨
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={() => onConfirm(draft)}
            >
              <Check className="w-3.5 h-3.5" />
              적용
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────────────────────────────────────────────
   3. 제출파일함 — file-explorer style
   ────────────────────────────────────────────────────────── */

function FilesSection(props: {
  files: FileItem[];
  onUpload: (kind: FileKind, name: string, fileKind: "pdf" | "image", url?: string) => void;
  onPreview: (f: FileItem) => void;
}) {
  const { files, onUpload, onPreview } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<{ name: string; fileKind: "pdf" | "image"; url?: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const byKind = useMemo(() => {
    const map: Record<string, FileItem[]> = {};
    for (const f of files) (map[f.kind] ||= []).push(f);
    return map;
  }, [files]);

  // show only kinds that have files, in FILE_KINDS order
  const activeKinds = FILE_KINDS.filter((k) => (byKind[k]?.length ?? 0) > 0);

  const handleFiles = (fl: FileList | null) => {
    if (!fl || fl.length === 0) return;
    const f = fl[0];
    const isImg = f.type.startsWith("image") || /\.(png|jpe?g|gif|webp)$/i.test(f.name);
    setPendingFile({
      name: f.name,
      fileKind: isImg ? "image" : "pdf",
      url: isImg ? URL.createObjectURL(f) : undefined,
    });
  };

  return (
    <section id="sec-file">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">제출파일함</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            지원서에 반복해서 첨부하는 파일을 폴더처럼 정리해두세요.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-1"
          >
            <Upload className="w-3 h-3" /> 파일 업로드
          </button>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-xl transition-colors",
          dragOver && "ring-2 ring-primary/40 bg-primary/5 p-2",
        )}
      >
        {activeKinds.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl px-5 py-10 text-center">
            <Folder className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-foreground">저장된 파일이 없어요.</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              파일을 끌어다 놓거나 위의 "파일 업로드"를 눌러 추가하세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeKinds.map((kind) => {
              const items = byKind[kind] || [];
              const isPhotoKind = kind === "증명사진";
              const previewItems = items.slice(0, isPhotoKind ? 4 : 3);
              const remaining = items.length - previewItems.length;
              return (
                <div
                  key={kind}
                  className="bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors min-h-[140px] flex flex-col"
                >
                  <div className="flex items-center gap-1.5 mb-2.5 text-xs">
                    <Folder className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-medium text-foreground/90 truncate">{kind}</span>
                    <span className="text-muted-foreground/60 text-[11px] ml-auto">{items.length}</span>
                  </div>

                  {isPhotoKind ? (
                    <div className="grid grid-cols-4 gap-1.5">
                      {previewItems.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => onPreview(f)}
                          className="relative aspect-[3/4] rounded-md border border-border overflow-hidden bg-muted/30 hover:border-primary/40"
                          title={f.name}
                        >
                          {f.url ? (
                            <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">사진</div>
                          )}
                        </button>
                      ))}
                      {remaining > 0 && (
                        <div className="aspect-[3/4] rounded-md border border-dashed border-border flex items-center justify-center text-[10px] text-muted-foreground">
                          +{remaining}
                        </div>
                      )}
                    </div>
                  ) : (
                    <ul className="space-y-0.5 flex-1">
                      {previewItems.map((f) => (
                        <li key={f.id}>
                          <button
                            onClick={() => onPreview(f)}
                            className="w-full flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-muted/60 text-left"
                          >
                            {f.fileKind === "image"
                              ? <ImageIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                              : <FileText className="w-3 h-3 text-muted-foreground shrink-0" />}
                            <span className="text-xs text-foreground truncate">{f.name}</span>
                          </button>
                        </li>
                      ))}
                      {remaining > 0 && (
                        <li className="text-[10px] text-muted-foreground px-1.5 pt-0.5">
                          +{remaining}개 더보기
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <UploadKindModal
        pending={pendingFile}
        onCancel={() => setPendingFile(null)}
        onConfirm={(kind) => {
          if (!pendingFile) return;
          onUpload(kind, pendingFile.name, pendingFile.fileKind, pendingFile.url);
          setPendingFile(null);
        }}
      />
    </section>
  );
}

function UploadKindModal({
  pending, onCancel, onConfirm,
}: {
  pending: { name: string; fileKind: "pdf" | "image"; url?: string } | null;
  onCancel: () => void;
  onConfirm: (kind: FileKind) => void;
}) {
  const [kind, setKind] = useState<FileKind>("기타 제출서류");
  const [name, setName] = useState(pending?.name ?? "");

  useEffect(() => {
    if (pending) {
      setName(pending.name);
      // simple guess
      const n = pending.name.toLowerCase();
      if (pending.fileKind === "image" && /photo|profile|증명/i.test(n)) setKind("증명사진");
      else if (/toeic|toefl|opic|어학/i.test(n)) setKind("어학 성적표");
      else if (/성적|transcript/i.test(n)) setKind("성적증명서");
      else if (/졸업|graduation/i.test(n)) setKind("졸업증명서");
      else if (/재학|enrollment/i.test(n)) setKind("재학증명서");
      else if (/자격|cert/i.test(n)) setKind("자격증 사본");
      else if (/상장|수상|award/i.test(n)) setKind("수상 증빙");
      else if (/수료|교육|edu/i.test(n)) setKind("교육 수료증");
      else setKind("기타 제출서류");
    }
  }, [pending]);

  return (
    <Dialog open={!!pending} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">파일 등록</DialogTitle>
          <DialogDescription className="text-xs">
            파일 종류와 이름을 확인해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-muted-foreground">파일 종류</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as FileKind)}
              className="mt-1 w-full h-8 px-2 text-xs rounded-md border border-border bg-background"
            >
              {FILE_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">파일 이름</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onCancel}>취소</Button>
          <Button size="sm" className="h-8 text-xs" onClick={() => onConfirm(kind)}>
            <Check className="w-3.5 h-3.5" /> 등록
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────────────────────────────────────────────
   Preview Modal — actions live in "..." menu inside preview
   ────────────────────────────────────────────────────────── */

function PreviewModal({
  preview, onClose, isBasicPhoto, onSetBasicPhoto, onCopy, onRename, onDelete,
}: {
  preview: Preview;
  onClose: () => void;
  isBasicPhoto: (id: string) => boolean;
  onSetBasicPhoto: (id: string) => void;
  onCopy: (t: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    if (preview) { setRenaming(false); setDraftName(preview.file.name); }
  }, [preview]);

  if (!preview) {
    return (
      <Dialog open={false} onOpenChange={(o) => !o && onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  const f = preview.file;
  const isPhoto = f.kind === "증명사진";
  const isBasic = isBasicPhoto(f.id);

  return (
    <Dialog open={!!preview} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-6">
            {renaming ? (
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={() => { onRename(f.id, draftName); setRenaming(false); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { onRename(f.id, draftName); setRenaming(false); }
                  if (e.key === "Escape") { setDraftName(f.name); setRenaming(false); }
                }}
                className="text-sm bg-transparent border-b border-primary/60 outline-none py-0.5 flex-1 min-w-0"
              />
            ) : (
              <DialogTitle className="text-sm truncate flex items-center gap-2">
                <span className="truncate">{f.name}</span>
                {isPhoto && isBasic && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    <Star className="w-2.5 h-2.5" /> 기본정보 대표
                  </span>
                )}
              </DialogTitle>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {isPhoto && (
                  <>
                    <DropdownMenuItem
                      className="text-xs"
                      disabled={isBasic}
                      onSelect={() => onSetBasicPhoto(f.id)}
                    >
                      <Star className="w-3 h-3" /> 대표 지정
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem className="text-xs" onSelect={() => toast("저장되었습니다", { duration: 1200 })}>
                  저장
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onSelect={() => onCopy(f.name)}>
                  파일명 복사
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onSelect={() => toast("다운로드 시작", { duration: 1200 })}>
                  다운로드
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onSelect={() => setRenaming(true)}>
                  이름 변경
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-destructive" onSelect={() => onDelete(f.id)}>
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>
        <div className="bg-muted/30 border border-border rounded-lg overflow-hidden flex items-center justify-center min-h-[420px]">
          {f.fileKind === "image" ? (
            f.url ? (
              <img src={f.url} alt={f.name} className="max-h-[60vh] object-contain" />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground py-12">
                <ImageIcon className="w-10 h-10 mb-2" />
                <p className="text-xs">이미지 미리보기</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center text-muted-foreground py-12">
              <FileText className="w-10 h-10 mb-2" />
              <p className="text-xs">PDF 미리보기</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
