import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, FileText, Printer, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Item } from "@/pages/experiences/presets";
import {
  EXPORT_FIELDS,
  runExport,
  type ExportFormat,
  type ExportFieldKey,
} from "@/lib/exportExperiences";

const LS_FORMAT = "pickd.experiences.export.format.v1";
const LS_FIELDS = "pickd.experiences.export.fields.v1";

const FORMAT_CARDS: { key: ExportFormat; label: string; ext: string; desc: string; icon: typeof FileSpreadsheet }[] = [
  { key: "excel", label: "Excel", ext: ".xlsx", desc: "표로 정리·가공", icon: FileSpreadsheet },
  { key: "word", label: "Word", ext: ".docx", desc: "문서 초안", icon: FileText },
  { key: "pdf", label: "PDF", ext: "인쇄·공유", desc: "그대로 제출", icon: Printer },
];

type Props = {
  open: boolean;
  onClose: () => void;
  selectedItems: Item[];
  allItems: Item[];
  visibleKeys: ExportFieldKey[];
  resolveField: (item: Item, key: ExportFieldKey) => string;
  defaultScope?: "selected" | "all";
};

function todayName() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `Pickd_경험_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function lsGet<T>(k: string, fb: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fb;
  } catch {
    return fb;
  }
}

const CATALOG_KEYS = EXPORT_FIELDS.map((f) => f.key);

export function ExportModal({ open, onClose, selectedItems, allItems, visibleKeys, resolveField, defaultScope = "selected" }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [format, setFormat] = useState<ExportFormat>("excel");
  const [scope, setScope] = useState<"selected" | "all">(defaultScope);
  const [fields, setFields] = useState<Set<ExportFieldKey>>(new Set(["type", "name", "org", "period", "keywords"]));
  const [filename, setFilename] = useState(todayName());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setBusy(false);
    setScope(selectedItems.length > 0 ? defaultScope : "all");
    setFilename(todayName());
    setFormat(lsGet<ExportFormat>(LS_FORMAT, "excel"));
    // 필드 기본값: 지난 선택 → 없으면 표시 중인 컬럼
    const saved = lsGet<ExportFieldKey[]>(LS_FIELDS, []);
    const base = saved.length ? saved : visibleKeys.filter((k) => CATALOG_KEYS.includes(k));
    const next = new Set<ExportFieldKey>(base.length ? base : ["type", "name", "org", "period", "keywords"]);
    next.add("name"); // 항목명 항상 포함
    setFields(next);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const scopeItems = scope === "selected" ? selectedItems : allItems;
  const orderedKeys = CATALOG_KEYS.filter((k) => fields.has(k));
  const canExport = scopeItems.length > 0 && orderedKeys.length > 0;

  const applyPreset = (preset: "visible" | "all") => {
    const next = new Set<ExportFieldKey>(
      preset === "all" ? CATALOG_KEYS : visibleKeys.filter((k) => CATALOG_KEYS.includes(k)),
    );
    next.add("name");
    setFields(next);
  };

  const toggleField = (k: ExportFieldKey) => {
    if (k === "name") return;
    setFields((p) => {
      const n = new Set(p);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  };

  const doExport = async () => {
    if (!canExport || busy) return;
    setBusy(true);
    const headers = orderedKeys.map((k) => EXPORT_FIELDS.find((f) => f.key === k)!.label);
    const rows = scopeItems.map((it) => orderedKeys.map((k) => resolveField(it, k)));
    try {
      localStorage.setItem(LS_FORMAT, JSON.stringify(format));
      localStorage.setItem(LS_FIELDS, JSON.stringify(orderedKeys));
      await runExport(format, filename.trim() || todayName(), { headers, rows });
      toast("내보냈어요", { duration: 1600 });
      onClose();
    } catch (e) {
      if (e instanceof Error && e.message === "popup-blocked") {
        toast("팝업이 차단됐어요. 허용한 뒤 다시 시도해 주세요", { duration: 3000 });
      } else {
        toast("내보내기에 실패했어요", { duration: 2000 });
      }
    } finally {
      setBusy(false);
    }
  };

  const activeFmt = FORMAT_CARDS.find((f) => f.key === format)!;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-base">내보내기</DialogTitle>
          <DialogDescription className="text-chip">
            {step === 1 ? "형식을 골라 주세요." : "범위와 포함할 필드를 확인하세요."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <>
            <div className="grid grid-cols-3 gap-2.5 mt-1">
              {FORMAT_CARDS.map((f) => {
                const Icon = f.icon;
                const on = format === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFormat(f.key)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-4 rounded-lg border transition-colors",
                      on ? "border-primary/50 bg-primary/5" : "border-border hover:bg-muted/40",
                    )}
                  >
                    <Icon className={cn("w-6 h-6", on ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-sm text-foreground">{f.label}</span>
                    <span className="text-mini text-muted-foreground">{f.desc}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end mt-3">
              <Button size="sm" className="h-8 text-xs px-4" onClick={() => setStep(2)}>
                다음
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* 선택한 형식 요약 */}
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-chip text-muted-foreground hover:text-foreground w-fit"
            >
              <activeFmt.icon className="w-3.5 h-3.5" /> {activeFmt.label} · <span className="inline-flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> 형식 변경</span>
            </button>

            {/* 범위 */}
            <div className="mt-1">
              <p className="text-chip text-muted-foreground mb-1.5">내보낼 항목</p>
              <div className="flex gap-2">
                <ScopePill
                  active={scope === "selected"}
                  disabled={selectedItems.length === 0}
                  onClick={() => selectedItems.length && setScope("selected")}
                  label={`선택한 ${selectedItems.length}개`}
                />
                <ScopePill active={scope === "all"} onClick={() => setScope("all")} label={`전체 ${allItems.length}개`} />
              </div>
            </div>

            {/* 필드 */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-chip text-muted-foreground">포함할 필드</p>
                <div className="flex gap-1.5">
                  <button className="text-chip text-muted-foreground hover:text-foreground" onClick={() => applyPreset("visible")}>
                    표시 중인 컬럼
                  </button>
                  <span className="text-border">·</span>
                  <button className="text-chip text-muted-foreground hover:text-foreground" onClick={() => applyPreset("all")}>
                    전체 필드
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-y-1.5 gap-x-2">
                {EXPORT_FIELDS.map((f) => {
                  const on = fields.has(f.key);
                  return (
                    <button
                      key={f.key}
                      onClick={() => toggleField(f.key)}
                      disabled={f.required}
                      className={cn(
                        "flex items-center gap-1.5 text-xs py-1 rounded text-left",
                        f.required ? "cursor-default" : "hover:text-foreground",
                        on ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0",
                          on ? "bg-primary border-primary" : "border-border",
                        )}
                      >
                        {on && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                      </span>
                      {f.label}
                      {f.required && <span className="text-mini text-muted-foreground/60">(필수)</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 파일명 + 실행 */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
              <span className="text-chip text-muted-foreground shrink-0">파일명</span>
              <Input value={filename} onChange={(e) => setFilename(e.target.value)} className="h-8 text-xs flex-1" />
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClose}>
                취소
              </Button>
              <Button size="sm" className="h-8 text-xs px-4" disabled={!canExport || busy} onClick={doExport}>
                내보내기
              </Button>
            </div>
            {!canExport && (
              <p className="text-mini text-muted-foreground/70 text-right -mt-1">
                {scopeItems.length === 0 ? "내보낼 항목이 없어요." : "필드를 하나 이상 선택하세요."}
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ScopePill({ active, disabled, onClick, label }: { active: boolean; disabled?: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "text-xs px-3 py-1.5 rounded-md border transition-colors",
        disabled && "opacity-40 cursor-not-allowed",
        active ? "border-primary/50 bg-primary/5 text-primary" : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
