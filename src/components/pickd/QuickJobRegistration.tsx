import { useMemo, useRef, useState } from "react";
import { Building2, FileText, Search, Upload, Briefcase, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { JobRegistrationModal } from "./JobRegistrationModal";
import { FallbackUploadModal } from "./FallbackUploadModal";
import {
  POSTINGS,
  searchPostings,
  calcPostingDday,
  type Posting,
} from "@/data/postings.seed";
import { formatApplyEnd, isRegistered } from "@/data/jobStore";

/**
 * 탭1 진입점 — 공고 검색(자동완성) → 직무 선택 → 담기.
 * 드롭다운 섹션: 기관 / 공고 / 직무. 검색 결과 없음 → PDF 직접 등록(폴백).
 */
export function QuickJobRegistration() {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [modalPosting, setModalPosting] = useState<Posting | null>(null);
  const [modalPositionId, setModalPositionId] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const blurTimer = useRef<number | null>(null);

  const results = useMemo(() => searchPostings(q), [q]);
  const hasQuery = q.trim().length > 0;
  const empty =
    hasQuery &&
    results.orgs.length === 0 &&
    results.postings.length === 0 &&
    results.positions.length === 0;

  const openPosting = (posting: Posting, positionId?: string) => {
    setModalPosting(posting);
    setModalPositionId(positionId);
    setModalOpen(true);
    setFocused(false);
    setQ("");
  };

  // 기관 클릭 → 해당 기관의 진행중 공고(현재는 1기관 1공고 규모라 첫 공고로)
  const openOrg = (orgName: string) => {
    const posting = POSTINGS.find((p) => p.orgName === orgName);
    if (posting) openPosting(posting);
  };

  const handleBlur = () => {
    blurTimer.current = window.setTimeout(() => setFocused(false), 150);
  };
  const handleFocus = () => {
    if (blurTimer.current) window.clearTimeout(blurTimer.current);
    setFocused(true);
  };

  const dropdownOpen = focused && hasQuery;

  return (
    <>
      <div className="relative">
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-2 pickd-shadow">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="기관명, 직무, 공고명을 검색해 보세요"
            className="border-0 shadow-none bg-transparent h-7 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 px-0"
          />
          <button
            onClick={() => setFallbackOpen(true)}
            className="text-chip text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0 transition-colors"
          >
            <Upload className="w-3 h-3" />
            직접 등록
          </button>
        </div>

        {dropdownOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-card border border-border rounded-xl pickd-shadow overflow-hidden">
            {empty ? (
              <div className="px-4 py-5 text-center">
                <p className="text-sm text-muted-foreground">검색 결과가 없어요</p>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setFallbackOpen(true);
                    setFocused(false);
                  }}
                  className="mt-2 text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  찾는 공고가 없나요? PDF로 직접 등록하기
                </button>
              </div>
            ) : (
              <div className="max-h-[50vh] overflow-y-auto py-1">
                {results.orgs.length > 0 && (
                  <Section label="기관">
                    {results.orgs.map((org) => {
                      const count = POSTINGS.filter(
                        (p) => p.orgName === org && calcPostingDday(p.applyEnd) >= 0,
                      ).length;
                      return (
                        <ResultRow
                          key={org}
                          icon={<Building2 className="w-3.5 h-3.5" />}
                          onPick={() => openOrg(org)}
                          title={org}
                          meta={count > 0 ? `진행중 공고 ${count}건` : "진행중 공고 없음"}
                        />
                      );
                    })}
                  </Section>
                )}
                {results.postings.length > 0 && (
                  <Section label="공고">
                    {results.postings.map((p) => (
                      <ResultRow
                        key={p.id}
                        icon={<FileText className="w-3.5 h-3.5" />}
                        onPick={() => openPosting(p)}
                        title={p.title}
                        sub={p.orgName}
                        meta={ddayMeta(p)}
                        registered={isRegistered(p.id)}
                      />
                    ))}
                  </Section>
                )}
                {results.positions.length > 0 && (
                  <Section label="직무">
                    {results.positions.map(({ posting, position }) => (
                      <ResultRow
                        key={position.id}
                        icon={<Briefcase className="w-3.5 h-3.5" />}
                        onPick={() => openPosting(posting, position.id)}
                        title={position.jobTitle}
                        sub={`${posting.orgName} · ${position.employmentType}`}
                        meta={ddayMeta(posting)}
                        registered={isRegistered(posting.id)}
                      />
                    ))}
                  </Section>
                )}
                <div className="border-t border-border px-4 py-2">
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setFallbackOpen(true);
                      setFocused(false);
                    }}
                    className="text-chip text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    찾는 공고가 없나요? PDF로 직접 등록하기
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <JobRegistrationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        posting={modalPosting}
        initialPositionId={modalPositionId}
      />
      <FallbackUploadModal open={fallbackOpen} onOpenChange={setFallbackOpen} />
    </>
  );
}

function ddayMeta(p: Posting): string {
  const d = calcPostingDday(p.applyEnd);
  return d >= 0 ? `D-${d} · ${formatApplyEnd(p)} 마감` : "마감";
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <p className="px-4 py-1 text-chip font-medium text-muted-foreground/70 uppercase tracking-wide">
        {label}
      </p>
      {children}
    </div>
  );
}

function ResultRow({
  icon,
  title,
  sub,
  meta,
  registered,
  onPick,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  meta?: string;
  registered?: boolean;
  onPick: () => void;
}) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-muted/50",
      )}
    >
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-foreground truncate">{title}</span>
        {sub && <span className="block text-chip text-muted-foreground truncate">{sub}</span>}
      </span>
      {registered && (
        <span className="inline-flex items-center gap-1 text-chip text-pickd-green shrink-0">
          <Check className="w-3 h-3" />
          담음
        </span>
      )}
      {meta && <span className="text-chip tabular-nums text-muted-foreground shrink-0">{meta}</span>}
    </button>
  );
}
