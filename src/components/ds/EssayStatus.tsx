import { cn } from "@/lib/utils";

// ---------- Essay state palette (JobDetail 색 가이드) ----------
// 단일 accent = primary 블루(진행/CTA). 상태는 dot+라벨(SSOT 상태 처리 패턴).
// blue=작성중(진행) · amber=초안 · green=완료 · gray=미작성. 오프브랜드 indigo 폐기.
export const ESSAY_STATE: Record<string, { chip: string; dot: string }> = {
  완료: { chip: "bg-pickd-green-light text-pickd-green", dot: "bg-pickd-green" },
  작성중: { chip: "bg-blue-50 text-blue-700", dot: "bg-primary" },
  초안: { chip: "bg-pickd-orange-light text-pickd-orange", dot: "bg-pickd-orange" },
  미작성: { chip: "text-muted-foreground", dot: "bg-muted-foreground/40" },
};

// ---------- Essay status chip (dot + 라벨) ----------
export function EssayStatus({ status }: { status: string }) {
  const s = ESSAY_STATE[status] ?? ESSAY_STATE["미작성"];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-mini font-semibold px-2 py-0.5 rounded-full whitespace-nowrap", s.chip)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />
      {status}
    </span>
  );
}
