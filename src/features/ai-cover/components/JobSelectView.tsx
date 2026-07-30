/* 자소서 메인 화면 — "쓰던 글을 이어 쓰는 작업대"
   자소서 작성자의 실제 여정: ⑴ 쓰다 만 글에 복귀(가장 잦음) ⑵ 새 공고 시작.
   그래서 공고 카탈로그가 아니라 '내 글' 중심 — JobDetail 자소서 섹션과 같은 언어
   (상태 dot·내가 쓴 문장 미리보기·'이어서 작성하기'/'작성하기' CTA 위계). 마감 임박 순 정렬.
   AICoverPage.tsx에서 그대로 분리(2026-07-29). */
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PickdSidebar } from "@/components/layout/PickdSidebar";
import { PageTitle } from "@/components/ds/PageTitle";
import { ddayLabel, ddayCls } from "@/lib/dday";
import { JOBS, type Job } from "../model/aiCoverMock";
import { getProgress, type JobProgress } from "../model/essayCache";

// 대시보드 카드형(DocumentStatusList 카드)과 동일 해부도 — 탭1 계열과 한 언어.
// D-day는 대시보드 카드와 같은 글자색 규칙(§5-4-1 예외 계열), 진행은 바 없이 N/M 텍스트만(§0-10).

// 마감일 목데이터 — dday와 항상 일치하도록 오늘 기준 파생 (탭1 대시보드 mockDeadline 방식)
function deadlineOf(dday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dday);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function JobCard({ job, p, onSelect }: { job: Job; p: JobProgress; onSelect: () => void }) {
  const writing = p.written > 0 || p.finished;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${job.org} 자소서 작성`}
      className="bg-card border border-border rounded-lg px-5 py-4 hover:bg-muted/20 hover:border-primary/40 transition-colors flex flex-col text-left"
    >
      {/* 제목 행 */}
      <p className="text-sm font-semibold text-foreground leading-snug">
        {job.org} <span className="font-normal text-muted-foreground">{job.role}</span>
      </p>

      {/* 서브라인: 자소서 · D-day (대시보드 카드의 '지원서 · D-N' 문법) */}
      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground">자소서</span>
        <span className="text-muted-foreground/40 text-xs">·</span>
        <span className={cn("text-xs tabular-nums", ddayCls(job.dday))}>{ddayLabel(job.dday)}</span>
      </div>

      {/* 문항 수 — 선 없이 크고 직관적으로 (2026-07-27: 가로선·작은 글자 피드백) */}
      <p className="mt-3 text-title font-semibold text-foreground tabular-nums">
        문항 {p.total}개
        {writing && <span className="text-muted-foreground font-normal"> · {p.written}개 작성</span>}
      </p>

      {/* 마감일 · CTA */}
      <div className="mt-3 flex items-center justify-between gap-2 text-xs tabular-nums w-full">
        <span className="text-muted-foreground">마감 {deadlineOf(job.dday)}</span>
        <span className={cn("font-medium", writing && !p.finished ? "text-primary" : "text-muted-foreground")}>
          {p.finished ? "수정" : writing ? "이어서 작성하기" : "작성하기"}
        </span>
      </div>
    </button>
  );
}

export function JobSelect({ onSelect }: { onSelect: (id: string, qIdx?: number) => void }) {
  // 공고 기준 카드 그리드 — 마감 임박 순, 전폭 사용(탭1과 동일한 컨테이너 감각, 좌우 빈공간 최소화)
  const rows = JOBS.map((job) => ({ job, p: getProgress(job) })).sort((a, b) => a.job.dday - b.job.dday);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <PickdSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[82.5rem] mx-auto px-8 py-7">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <div>
              <PageTitle>AI 자소서</PageTitle>
              <p className="text-sm text-muted-foreground mt-1.5">공고나 문항을 누르면 바로 작성으로 들어가요.</p>
            </div>
            <p className="text-xs text-muted-foreground">
              새 공고는{" "}
              <Link to="/" className="text-primary hover:underline">지원 대시보드</Link>
              에서 등록해요.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 xl:grid-cols-3 gap-3.5">
            {rows.map(({ job, p }) => (
              <JobCard key={job.id} job={job} p={p} onSelect={() => onSelect(job.id)} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
