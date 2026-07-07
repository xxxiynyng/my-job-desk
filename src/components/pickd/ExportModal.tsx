import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, FileText, Printer, Check } from "lucide-react";
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

const FORMAT_CARDS: { key: ExportFormat; label: string; icon: typeof FileSpreadsheet }[] = [
  { key: "excel", label: "Excel", icon: FileSpreadsheet },
  { key: "word", label: "Word", icon: FileText },
  { key: "pdf", label: "PDF", icon: Printer },
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
  // 순서: ① 값(필드) 선택 → ② 형식 선택·내보내기
  const [step, setStep] = useState<1 | 2>(1);
  const [format, setFormat] = useState<ExportFormat>("excel");
  const [fields, setFields] = useState<Set<ExportFieldKey>>(new Set(["type", "name", "org", "period", "keywords"]));
  const [filename, setFilename] = useState(todayName());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setBusy(false);
    setFilename(todayName());
    setFormat(lsGet<ExportFormat>(LS_FORMAT, "excel"));
    // 필드 기본값: 지난 선택 → 없으면 표시 중인 컬럼
    const saved = lsGet<ExportFieldKey[]>(LS_FIELDS, []);
    const base = saved.length ? saved : visibleKeys.filter((k) => CATALOG_KEYS.includes(k));
    const next = new Set<ExportFieldKey>(base.length ? base : ["type", "name", "org", "period", "keywords"]);
    next.add("name"); // 항목명 항상 포함
    setFields(next);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // 대상은 진입점에서 결정됨(선택 항목 or 전체) — 모달에서 토글하지 않음
  const scopeItems = defaultScope === "selected" && selectedItems.length > 0 ? selectedItems : allItems;
  const orderedKeys = CATALOG_KEYS.filter((k) => fields.has(k));
  const hasFields = orderedKeys.length > 0;
  const canExport = scopeItems.length > 0 && hasFields;

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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-base">내보내기</DialogTitle>
          <DialogDescription className="text-chip">
            {step === 1 ? "포함할 값을 선택하세요." : "형식을 선택하세요."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <>
            {/* ① 필드 선택 */}
            <div className="grid grid-cols-3 gap-y-1.5 gap-x-2 mt-1">
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
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <span className="text-chip text-muted-foreground">{scopeItems.length}개 항목</span>
              <Button size="sm" className="h-8 text-xs px-4" disabled={!hasFields} onClick={() => setStep(2)}>
                다음
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* ② 형식 선택 (컴팩트) */}
            <div className="grid grid-cols-3 gap-2.5 mt-1">
              {FORMAT_CARDS.map((f) => {
                const Icon = f.icon;
                const on = format === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFormat(f.key)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 rounded-lg border transition-colors",
                      on ? "border-primary/50 bg-primary/5" : "border-border hover:bg-muted/40",
                    )}
                  >
                    <Icon className={cn("w-5 h-5", on ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-xs text-foreground">{f.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
              <span className="text-chip text-muted-foreground shrink-0">파일명</span>
              <Input value={filename} onChange={(e) => setFilename(e.target.value)} className="h-8 text-xs flex-1" />
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setStep(1)}>
                이전
              </Button>
              <Button size="sm" className="h-8 text-xs px-4" disabled={!canExport || busy} onClick={doExport}>
                내보내기
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
