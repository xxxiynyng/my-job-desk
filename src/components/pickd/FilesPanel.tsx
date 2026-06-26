import { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Folder,
  FileText,
  Image as ImageIcon,
  MoreHorizontal,
  Check,
  Star,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types & constants ──────────────────────────────────────────

type FileKind =
  | "증명사진"
  | "성적증명서"
  | "졸업증명서"
  | "재학증명서"
  | "어학 성적표"
  | "자격증 사본"
  | "수상 증빙"
  | "교육 수료증"
  | "기타 제출서류";

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

const SAMPLE_PHOTO_A = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=240&h=320&fit=crop";
const SAMPLE_PHOTO_B = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=240&h=320&fit=crop";

const INITIAL_FILES: FileItem[] = [
  { id: "f0", kind: "증명사진", name: "profile_photo.jpg", fileKind: "image", url: SAMPLE_PHOTO_A },
  { id: "f0b", kind: "증명사진", name: "profile_photo_2.jpg", fileKind: "image", url: SAMPLE_PHOTO_B },
  { id: "f1", kind: "성적증명서", name: "성적증명서_2025.pdf", fileKind: "pdf" },
  { id: "f4", kind: "어학 성적표", name: "toeic_945.png", fileKind: "image" },
];

const LS_FILES = "specs.files.v1";
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
    setFiles((p) => p.filter((f) => f.id !== id));
    setPreview(null);
    toast("삭제했어요", { duration: 1200 });
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
      />

      <PreviewModal
        preview={preview}
        onClose={() => setPreview(null)}
        isBasicPhoto={(id) => id === basicPhotoId}
        onSetBasicPhoto={(id) => {
          setBasicPhotoId(id);
          lsSet(LS_PHOTO_SHOWN, true);
          toast("대표 사진으로 설정했어요", { duration: 1200 });
        }}
        onCopy={copy}
        onRename={renameFile}
        onDelete={deleteFile}
      />
    </TooltipProvider>
  );
}

// ── FileGrid ──────────────────────────────────────────────────

function FileGrid({
  files,
  onUpload,
  onPreview,
}: {
  files: FileItem[];
  onUpload: (kind: FileKind, name: string, fileKind: "pdf" | "image", url?: string) => void;
  onPreview: (f: FileItem) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<{ name: string; fileKind: "pdf" | "image"; url?: string } | null>(
    null,
  );
  const [dragOver, setDragOver] = useState(false);

  const byKind = useMemo(() => {
    const map: Record<string, FileItem[]> = {};
    for (const f of files) (map[f.kind] ||= []).push(f);
    return map;
  }, [files]);

  const activeKinds = FILE_KINDS.filter((k) => (byKind[k]?.length ?? 0) > 0);

  const handleFiles = (fl: FileList | null) => {
    if (!fl || fl.length === 0) return;
    const f = fl[0];
    const isImg = f.type.startsWith("image") || /\.(png|jpe?g|gif|webp)$/i.test(f.name);
    setPendingFile({ name: f.name, fileKind: isImg ? "image" : "pdf", url: isImg ? URL.createObjectURL(f) : undefined });
  };

  return (
    <div className="relative">
      <input ref={inputRef} type="file" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <div className="absolute top-0 right-0">
        <button
          onClick={() => inputRef.current?.click()}
          className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors shrink-0"
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
            <div className="py-16 text-center text-muted-foreground rounded-lg border border-dashed border-border">
              <Folder className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm">저장된 파일이 없어요.</p>
              <p className="text-[11px] mt-1 opacity-60">
                파일을 끌어다 놓거나 "파일 업로드"를 눌러 추가하세요.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {activeKinds.map((kind) => {
                const kindItems = byKind[kind] || [];
                const isPhotoKind = kind === "증명사진";
                const previewItems = kindItems.slice(0, isPhotoKind ? 6 : 8);
                const remaining = kindItems.length - previewItems.length;
                return (
                  <div key={kind}>
                    {/* 섹션 헤더 */}
                    <div className="flex items-center gap-2 mb-3">
                      <Folder className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">{kind}</span>
                      <span className="text-[11px] text-muted-foreground/60 ml-0.5">{kindItems.length}</span>
                      <div className="flex-1 h-px bg-border ml-1" />
                    </div>
                    {isPhotoKind ? (
                      <div className="flex flex-wrap gap-3 pl-1">
                        {previewItems.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => onPreview(f)}
                            className="group relative w-[90px] h-[120px] rounded-lg overflow-hidden bg-muted hover:shadow-md transition-all"
                            title={f.name}
                          >
                            {f.url ? (
                              <img src={f.url} alt={f.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground">
                                <ImageIcon className="w-6 h-6" />
                                <span className="text-[10px]">사진</span>
                              </div>
                            )}
                            <div className="absolute inset-0 ring-2 ring-transparent group-hover:ring-primary/40 rounded-lg transition-all" />
                          </button>
                        ))}
                        {remaining > 0 && (
                          <div className="w-[90px] h-[120px] rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground">
                            <span className="text-sm font-semibold">+{remaining}</span>
                            <span className="text-[10px]">더보기</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <ul className="pl-1">
                        {previewItems.map((f, idx) => (
                          <li key={f.id} className={cn(idx < previewItems.length - 1 && "border-b border-border/50")}>
                            <button
                              onClick={() => onPreview(f)}
                              className="w-full flex items-center gap-3 py-3 px-2 hover:bg-muted/50 rounded-md text-left transition-colors group"
                            >
                              {f.fileKind === "image" ? (
                                <ImageIcon className="w-5 h-5 text-blue-500 shrink-0" />
                              ) : (
                                <FileText className="w-5 h-5 text-red-500 shrink-0" />
                              )}
                              <span className="text-[14px] font-medium text-foreground truncate flex-1">{f.name}</span>
                              <span className="text-[11px] text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                {f.fileKind === "image" ? "이미지" : "PDF"}
                              </span>
                            </button>
                          </li>
                        ))}
                        {remaining > 0 && (
                          <li className="py-2 px-2 text-[12px] text-muted-foreground">+{remaining}개 더보기</li>
                        )}
                      </ul>
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
        onConfirm={(kind) => {
          if (!pendingFile) return;
          onUpload(kind, pendingFile.name, pendingFile.fileKind, pendingFile.url);
          setPendingFile(null);
        }}
      />
    </div>
  );
}

// ── UploadKindModal ────────────────────────────────────────────

function UploadKindModal({
  pending,
  onCancel,
  onConfirm,
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
          <DialogDescription className="text-xs">파일 종류와 이름을 확인해주세요.</DialogDescription>
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
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-8 text-xs" />
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
                    <DropdownMenuItem className="text-xs" disabled={isBasic} onSelect={() => onSetBasicPhoto(f.id)}>
                      <Star className="w-3 h-3" /> 대표 지정
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem className="text-xs" onSelect={() => onCopy(f.name)}>파일명 복사</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onSelect={() => toast("다운로드 시작", { duration: 1200 })}>다운로드</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onSelect={() => setRenaming(true)}>이름 변경</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-destructive" onSelect={() => onDelete(f.id)}>삭제</DropdownMenuItem>
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
