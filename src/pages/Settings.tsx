import { useEffect, useState } from "react";
import { Check, X, Pencil } from "lucide-react";
import { PickdSidebar } from "@/components/pickd/PickdSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const LS_JOB_PREFS = "specs.settings.jobPrefs.v1";

type JobPrefs = {
  availableDate: string;
  desiredSalary: string;
  desiredLocation: string;
  desiredRole: string;
};

const PREFS_DEFAULTS: JobPrefs = {
  availableDate: "",
  desiredSalary: "",
  desiredLocation: "",
  desiredRole: "",
};

const PREFS_FIELDS: { key: keyof JobPrefs; label: string; placeholder: string }[] = [
  { key: "availableDate",   label: "입사 가능일",  placeholder: "예: 즉시 / 2025.09.01" },
  { key: "desiredSalary",   label: "희망 연봉",    placeholder: "예: 3,500만 원 / 협의" },
  { key: "desiredLocation", label: "희망 근무지",  placeholder: "예: 서울 / 재택 선호" },
  { key: "desiredRole",     label: "희망 직무",    placeholder: "예: 마케터, PM" },
];

function lsGet<T>(k: string, fallback: T): T {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback; }
  catch { return fallback; }
}
function lsSet(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

export default function Settings() {
  const [prefs, setPrefs]     = useState<JobPrefs>(() => ({ ...PREFS_DEFAULTS, ...lsGet<Partial<JobPrefs>>(LS_JOB_PREFS, {}) }));
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft]     = useState<JobPrefs>(prefs);

  useEffect(() => lsSet(LS_JOB_PREFS, prefs), [prefs]);

  const enterEdit = () => { setDraft({ ...prefs }); setEditMode(true); };
  const save      = () => { setPrefs(draft); setEditMode(false); toast("저장되었습니다", { duration: 1500 }); };
  const cancel    = () => setEditMode(false);

  const anyFilled = Object.values(prefs).some(Boolean);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen bg-background overflow-hidden">
        <PickdSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="px-10 py-8 max-w-[720px] mx-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-7">
              <h1 className="text-[26px] font-bold text-foreground tracking-[-0.04em] leading-tight">설정</h1>
              {editMode ? (
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={cancel}>
                    <X className="w-3 h-3 mr-1" />취소
                  </Button>
                  <Button size="sm" className="h-7 text-xs px-3" onClick={save}>
                    <Check className="w-3 h-3 mr-1" />저장
                  </Button>
                </div>
              ) : (
                <button
                  onClick={enterEdit}
                  className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors"
                >
                  <Pencil className="w-3 h-3" /> 편집
                </button>
              )}
            </div>

            {/* 취업 희망 정보 */}
            <section className="space-y-3">
              <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">취업 희망 정보</h3>
              <p className="text-[11px] text-muted-foreground/70">공고 추천 알고리즘 및 지원서 자동 완성에 활용됩니다.</p>

              {editMode ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-3">
                  {PREFS_FIELDS.map(({ key, label, placeholder }) => (
                    <div key={key} className="min-w-0">
                      <span className="text-[11px] text-muted-foreground block mb-1">{label}</span>
                      <Input
                        value={draft[key]}
                        onChange={(e) => setDraft((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                  <div className="col-span-2 flex justify-end gap-2 pt-2 border-t border-border">
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={cancel}>취소</Button>
                    <Button size="sm" className="h-8 text-xs" onClick={save}>저장</Button>
                  </div>
                </div>
              ) : anyFilled ? (
                <div className="grid grid-cols-2 gap-x-10 gap-y-0.5 mt-3">
                  {PREFS_FIELDS.filter(({ key }) => prefs[key]).map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3 py-1.5 border-b border-border/30">
                      <span className="text-[11px] text-muted-foreground w-[96px] shrink-0">{label}</span>
                      <span className="text-[12.5px] text-foreground truncate">{prefs[key]}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 py-10 text-center text-muted-foreground rounded-lg border border-dashed border-border">
                  <p className="text-sm">취업 희망 정보를 입력하세요.</p>
                  <p className="text-[11px] mt-1">편집을 눌러 시작할 수 있어요.</p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
