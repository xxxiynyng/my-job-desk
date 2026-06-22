import { MoodRefresh } from "./MoodRefresh";

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          지원자님의 대시보드
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          오늘도 한 걸음 더 가까이.
        </p>
      </div>
      <MoodRefresh />
    </div>
  );
}
