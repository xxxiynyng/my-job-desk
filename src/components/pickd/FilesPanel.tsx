import { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Folder,
  FileText,
  Image as ImageIcon,
  Check,
  Star,
  Pencil,
  Download,
  Trash2,
  Copy,
  ChevronDown,
  Search,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { pushTrash, removeTrash } from "@/lib/trash";

// ── Types & constants ──────────────────────────────────────────

// 프리셋 9종 + 사용자 지정 종류(직접 입력) 허용 → 안 맞는 '다른 파일'도 제자리 폴더를 갖는다.
type FileKind = string;

const FILE_KINDS: FileKind[] = [
  "증명사진",
  "성적증명서",
  "졸업증명서",
  "재학증명서",
  "어학 성적표",
  "자격증 사본",
  "수상 증빙",
  "교육 수료증",
  "기타 제출서류",
];

type FileItem = {
  id: string;
  kind: FileKind;
  name: string;
  fileKind: "pdf" | "image";
  url?: string;
};

type Preview = { kind: "image" | "pdf"; file: FileItem } | null;

// 서비스 이용 대상(한국 취준생)에 맞춘 증명사진 스타일 헤드샷 (Unsplash, 무료·상업이용 가능)
const SAMPLE_PHOTO_A = "https://images.unsplash.com/photo-1543132220-4bf3de6e10ae?w=240&h=320&fit=crop&crop=faces";
const SAMPLE_PHOTO_B = "https://images.unsplash.com/photo-1771591742030-e22976e38aea?w=240&h=320&fit=crop&crop=faces";

const INITIAL_FILES: FileItem[] = [
  { id: "f0", kind: "증명사진", name: "profile_photo.jpg", fileKind: "image", url: SAMPLE_PHOTO_A },
  { id: "f0b", kind: "증명사진", name: "profile_photo_2.jpg", fileKind: "image", url: SAMPLE_PHOTO_B },
  { id: "f1", kind: "성적증명서", name: "성적증명서_2025.pdf", fileKind: "pdf" },
  { id: "f4", kind: "어학 성적표", name: "toeic_945.png", fileKind: "image" },
];

const LS_FILES = "specs.files.v2";
const LS_PHOTO_ID = "specs.basicPhoto.id";
const LS_PHOTO_SHOWN = "specs.basicPhoto.shown";

function lsGet<T>(k: string, fallback: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function lsSet(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

// ── Panel ─────────────────────────────────────────────────────
// 파일함 탭 콘텐츠. 사이드바/페이지 셸은 호출하는 쪽(통합 허브)에서 처리합니다.

export function FilesPanel() {
  const [files, setFiles] = useState<FileItem[]>(() => lsGet<FileItem[]>(LS_FILES, INITIAL_FILES));
  useEffect(() => lsSet(LS_FILES, files), [files]);

  const [preview, setPreview] = useState<Preview>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [basicPhotoId, setBasicPhotoId] = useState<string>(() => lsGet<string>(LS_PHOTO_ID, "f0"));
  useEffect(() => lsSet(LS_PHOTO_ID, basicPhotoId), [basicPhotoId]);

  const addFile = (kind: FileKind, name: string, fileKind: "pdf" | "image", url?: string) => {
    setFiles((p) => [
      ...p,
      { id: `f${Date.now()}`, kind, name, fileKind, url: url ?? (fileKind === "image" ? SAMPLE_PHOTO_B : undefined) },
    ]);
    toast("파일이 추가됐어요", { duration: 1200 });
  };

  const renameFile = (id: string, name: string) => {
    setFiles((p) => p.map((f) => (f.id === id ? { ...f, name } : f)));
    toast("저장됐어요", { duration: 1200 });
  };

  const deleteFile = (id: string) => {
    const removed = files.find((f) => f.id === id);
    setFiles((p) => p.filter((f) => f.id !== id));
    setPreview(null);
    if (!removed) return;
    // 소프트 삭제 — 통합 휴지통으로 이동 + 즉시 실행취소
    const [entry] = pushTrash([{ kind: "file", name: removed.name, sub: removed.kind, payload: removed }]);
    toast("휴지통으로 옮겼어요", {
      duration: 7000,
      action: {
        label: "실행취소",
        onClick: () => {
          removeTrash([entry.trashId]);
          setFiles((p) => [removed, ...p]);
        },
      },
    });
  };

  const copy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast("복사했어요", { duration: 1200 });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <FileGrid
        files={files}
        onUpload={addFile}
        onPreview={(f) => setPreview({ kind: f.fileKind, file: f })}
        isBasicPhoto={(id) => id === basicPhotoId}
      />

      <PreviewModal
        preview={preview}
        onClose={() => setPreview(null)}
        isBasicPhoto={(id) => id === basicPhotoId}
        onSetBasicPhoto={(id) => {
          setBasicPhotoId(id);
          lsSet(LS_PHOTO_SHOWN, true);
          // 기본정보 탭(BasicInfoPanel)에 즉시 반영 — 같은 문서라 storage 이벤트가 안 뜨므로 커스텀 이벤트
          window.dispatchEvent(new CustomEvent("pickd:basicPhoto"));
          toast("대표 사진으로 설정했어요", { duration: 1200 });
        }}
        onCopy={copy}
        onRename={renameFile}
        onDelete={(id) => setDeleteConfirmId(id)}
      />

      {/* ── 파일 삭제 확인 다이얼로그 (탭2 경험 삭제와 동일 패턴) ──── */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-base">휴지통으로 옮길까요?</DialogTitle>
            <DialogDescription className="text-sm">
              {files.find((f) => f.id === deleteConfirmId)?.name
                ? `'${files.find((f) => f.id === deleteConfirmId)?.name}' 파일을 휴지통으로 옮겨요. 14일 안에 복원할 수 있어요.`
                : "이 파일을 휴지통으로 옮겨요. 14일 안에 복원할 수 있어요."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setDeleteConfirmId(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                if (deleteConfirmId) deleteFile(deleteConfirmId);
                setDeleteConfirmId(null);
              }}
            >
              삭제
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

// ── FileGrid ──────────────────────────────────────────────────

function FileGrid({
  files,
  onUpload,
  onPreview,
  isBasicPhoto,
}: {
  files: FileItem[];
  onUpload: (kind: FileKind, name: string, fileKind: "pdf" | "image", url?: string) => void;
  onPreview: (f: FileItem) => void;
  isBasicPhoto?: (id: string) => boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<{ name: string; fileKind: "pdf" | "image"; url?: string } | null>(
    null,
  );
  const [dragOver, setDragOver] = useState(false);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleCollapse = (k: string) =>
    setCollapsed((prev) => {
      const n = new Set(prev);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  const q = query.trim().toLowerCase();
  const byKind = useMemo(() => {
    const map: Record<string, FileItem[]> = {};
    for (const f of files) {
      if (q && !f.name.toLowerCase().includes(q) && !f.kind.toLowerCase().includes(q)) continue;
      (map[f.kind] ||= []).push(f);
    }
    return map;
  }, [files, q]);

  // 프리셋 순서 우선 + 목록 밖 사용자 지정 종류는 뒤에 가나다순(탭2 유형 탭과 같은 원칙)
  const activeKinds = [
    ...FILE_KINDS.filter((k) => (byKind[k]?.length ?? 0) > 0),
    ...Object.keys(byKind).filter((k) => !FILE_KINDS.includes(k)).sort((a, b) => a.localeCompare(b, "ko")),
  ];

  const handleFiles = (fl: FileList | null) => {
    if (!fl || fl.length === 0) return;
    const f = fl[0];
    const isImg = f.type.startsWith("image") || /\.(png|jpe?g|gif|webp)$/i.test(f.name);
    setPendingFile({ name: f.name, fileKind: isImg ? "image" : "pdf", url: isImg ? URL.createObjectURL(f) : undefined });
  };

  return (
    <div className="relative">
      <input ref={inputRef} type="file" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <div className="absolute top-0 right-0 flex items-center gap-2">
        {files.length > 0 && (
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="파일 이름·종류 검색"
              className="w-full h-8 pl-8 pr-2.5 text-xs rounded-md border border-border bg-background outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        )}
        <button
          onClick={() => inputRef.current?.click()}
          className="text-xs text-foreground inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors shrink-0"
        >
          <Upload className="w-3 h-3" /> 파일 업로드
        </button>
      </div>

      {/* ── 콘텐츠 ───────────────────────────────── */}
      <div className="pt-6">
        {/* 드래그 존 */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          className={cn("rounded-xl transition-colors", dragOver && "ring-2 ring-primary/40 bg-primary/5 p-2")}
        >
          {activeKinds.length === 0 ? (
            q ? (
              <div className="py-16 text-center text-muted-foreground">
                <p className="text-sm">‘{query}’ 검색 결과가 없어요.</p>
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground rounded-xl border border-dashed border-border">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Folder className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm">저장된 파일이 없어요.</p>
                <p className="text-chip mt-1 opacity-60">
                  파일을 끌어다 놓거나 "파일 업로드"를 눌러 추가하세요.
                </p>
              </div>
            )
          ) : (
            <div className="space-y-6">
              {activeKinds.map((kind) => {
                const kindItems = byKind[kind] || [];
                const isCollapsed = !q && collapsed.has(kind);
                return (
                  <div key={kind}>
                    {/* 폴더 헤더 — 클릭하면 접기/펼치기 (파일 많을 때 정리) */}
                    <button
                      type="button"
                      onClick={() => toggleCollapse(kind)}
                      className="w-full flex items-center gap-2 mb-3"
                    >
                      <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform", isCollapsed && "-rotate-90")} />
                      <span className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Folder className="w-3.5 h-3.5 text-muted-foreground" />
                      </span>
                      <span className="text-body font-medium text-foreground">{kind}</span>
                      <span className="text-chip text-muted-foreground tabular-nums">{kindItems.length}</span>
                    </button>
                    {/* 카드 그리드 */}
                    {!isCollapsed && (
                      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
                        {kindItems.map((f) => {
                          const rep = isBasicPhoto?.(f.id) && f.kind === "증명사진";
                          return (
                            <button
                              key={f.id}
                              onClick={() => onPreview(f)}
                              title={f.name}
                              className="group text-left bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all"
                            >
                              <div className="h-[104px] bg-muted/30 flex items-center justify-center overflow-hidden">
                                {f.fileKind === "image" && f.url ? (
                                  <img src={f.url} alt={f.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                ) : (
                                  <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center">
                                    {f.fileKind === "image"
                                      ? <ImageIcon className="w-5 h-5 text-muted-foreground/60" />
                                      : <FileText className="w-5 h-5 text-muted-foreground/60" />}
                                  </div>
                                )}
                              </div>
                              <div className="px-2.5 py-2 min-w-0 border-t border-border/60">
                                <p className="text-xs font-medium text-foreground truncate">{f.name}</p>
                                {rep ? (
                                  <p className="text-chip text-primary inline-flex items-center gap-0.5 mt-0.5"><Check className="w-3 h-3" /> 대표 사진</p>
                                ) : (
                                  <p className="text-chip text-muted-foreground truncate mt-0.5">{f.kind}</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <UploadKindModal
        pending={pendingFile}
        onCancel={() => setPendingFile(null)}
        onConfirm={(kind, name) => {
          if (!pendingFile) return;
          onUpload(kind, name, pendingFile.fileKind, pendingFile.url);
          setPendingFile(null);
        }}
      />
    </div>
  );
}

// ── UploadKindModal ────────────────────────────────────────────

const CUSTOM_KIND = "__custom__";

function UploadKindModal({
  pending,
  onCancel,
  onConfirm,
}: {
  pending: { name: string; fileKind: "pdf" | "image"; url?: string } | null;
  onCancel: () => void;
  onConfirm: (kind: FileKind, name: string) => void;
}) {
  const [kind, setKind] = useState<string>("기타 제출서류");
  const [customKind, setCustomKind] = useState("");
  const [name, setName] = useState(pending?.name ?? "");

  useEffect(() => {
    if (pending) {
      setName(pending.name);
      setCustomKind("");
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

  const effectiveKind = kind === CUSTOM_KIND ? customKind.trim() : kind;
  const canSubmit = !!effectiveKind && !!name.trim();

  return (
    <Dialog open={!!pending} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">파일 등록</DialogTitle>
          <DialogDescription className="text-xs">종류를 고르거나 직접 입력해 보관할 위치를 정하세요.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {/* 미리보기 타일 + 이름 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              {pending?.fileKind === "image"
                ? <ImageIcon className="w-5 h-5 text-muted-foreground/60" />
                : <FileText className="w-5 h-5 text-muted-foreground/60" />}
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-chip text-muted-foreground">파일 이름</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-8 text-xs" />
            </div>
          </div>
          <div>
            <label className="text-chip text-muted-foreground">파일 종류</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="mt-1 w-full h-8 px-2 text-xs rounded-md border border-border bg-background"
            >
              {FILE_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              <option value={CUSTOM_KIND}>+ 직접 입력…</option>
            </select>
            {kind === CUSTOM_KIND && (
              <Input
                autoFocus
                value={customKind}
                onChange={(e) => setCustomKind(e.target.value)}
                placeholder="예: 포트폴리오, 경력기술서, 활동 증빙"
                className="mt-2 h-8 text-xs"
              />
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onCancel}>취소</Button>
          <Button size="sm" className="h-8 text-xs" disabled={!canSubmit} onClick={() => onConfirm(effectiveKind, name.trim())}>
            <Check className="w-3.5 h-3.5" /> 등록
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── PreviewModal ───────────────────────────────────────────────

function PreviewModal({
  preview,
  onClose,
  isBasicPhoto,
  onSetBasicPhoto,
  onCopy,
  onRename,
  onDelete,
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
    if (preview) {
      setRenaming(false);
      setDraftName(preview.file.name);
    }
  }, [preview]);

  if (!preview)
    return (
      <Dialog open={false} onOpenChange={(o) => !o && onClose()}>
        <DialogContent />
      </Dialog>
    );

  const f = preview.file;
  const isPhoto = f.kind === "증명사진";
  const isBasic = isBasicPhoto(f.id);

  return (
    <Dialog open={!!preview} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="pr-6">
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
                className="text-sm bg-transparent border-b border-primary/60 outline-none py-0.5 w-full min-w-0"
              />
            ) : (
              <DialogTitle className="text-sm truncate flex items-center gap-2">
                <span className="truncate">{f.name}</span>
                {isPhoto && isBasic && (
                  <span className="inline-flex items-center gap-0.5 text-mini text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                    <Star className="w-2.5 h-2.5" /> 기본정보 대표
                  </span>
                )}
              </DialogTitle>
            )}
          </div>
        </DialogHeader>

        {/* 미리보기 */}
        <div className="bg-muted/30 border border-border rounded-lg overflow-hidden flex items-center justify-center min-h-[420px]">
          {f.fileKind === "image" ? (
            f.url ? (
              <img src={f.url} alt={f.name} className="max-h-[60vh] object-contain" />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground py-12">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <ImageIcon className="w-7 h-7 text-muted-foreground/60" />
                </div>
                <p className="text-xs">이미지 미리보기</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center text-muted-foreground py-12">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <FileText className="w-7 h-7 text-muted-foreground/60" />
              </div>
              <p className="text-xs">PDF 미리보기</p>
            </div>
          )}
        </div>

        {/* 액션 바 — 숨은 ⋯ 메뉴 대신 보이는 버튼으로 */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-chip text-muted-foreground">
            <span className="px-2 py-0.5 rounded-md bg-muted">{f.kind}</span>
            <span className="uppercase tracking-wide">{f.fileKind === "image" ? "이미지" : "PDF"}</span>
          </span>
          <div className="flex items-center gap-1.5">
            {isPhoto && (
              <Button
                variant={isBasic ? "outline" : "default"}
                size="sm"
                className="h-8 text-xs"
                disabled={isBasic}
                onClick={() => onSetBasicPhoto(f.id)}
              >
                <Star className="w-3.5 h-3.5" /> {isBasic ? "대표 사진" : "대표 지정"}
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onCopy(f.name)} title="파일명 복사" aria-label="파일명 복사">
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setRenaming(true)}>
              <Pencil className="w-3.5 h-3.5" /> 이름 변경
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => toast("다운로드를 시작했어요", { duration: 1200 })}>
              <Download className="w-3.5 h-3.5" /> 다운로드
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive" onClick={() => onDelete(f.id)}>
              <Trash2 className="w-3.5 h-3.5" /> 삭제
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
