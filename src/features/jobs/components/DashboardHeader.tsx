import { useNavigate } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { MoodRefresh } from "./MoodRefresh";
import { PageTitle } from "@/components/ds/PageTitle";

export function DashboardHeader() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between">
      <div>
        <PageTitle>
          지원자님의 대시보드
        </PageTitle>
        <p className="text-sm text-muted-foreground mt-1.5">
          오늘도 한 걸음 더 가까이.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/calendar")}
          className="w-8 h-8 rounded-full bg-accent flex items-center justify-center hover:ring-2 hover:ring-primary/20 transition-all"
          aria-label="캘린더 바로가기"
        >
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
        </button>
        <MoodRefresh />
      </div>
    </div>
  );
}
