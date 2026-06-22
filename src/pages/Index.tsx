import { useState } from "react";
import { PickdSidebar } from "@/components/pickd/PickdSidebar";
import { DashboardHeader } from "@/components/pickd/DashboardHeader";
import { QuickJobRegistration } from "@/components/pickd/QuickJobRegistration";
import { JobPostingTable } from "@/components/pickd/JobPostingTable";
import { TodayPanel } from "@/components/pickd/TodayPanel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const Index = () => {
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <PickdSidebar />

      <div className="flex-1 flex overflow-hidden">
        {/* Main workspace — flex-1 so it smoothly reflows as panel slides */}
        <div className="flex-1 overflow-y-auto px-10 py-8 min-w-0 transition-all duration-300 ease-in-out">
          <div className="max-w-[1320px] w-full flex flex-col gap-7">
            <DashboardHeader />
            <QuickJobRegistration />
            <JobPostingTable />
          </div>
        </div>

        {/* Right panel wrapper — toggle button hangs off the left edge */}
        <div className="relative shrink-0 flex">
          {/* Toggle tab — always on left edge of wrapper, slides with it */}
          <button
            onClick={() => setPanelOpen((p) => !p)}
            aria-label={panelOpen ? "패널 닫기" : "패널 열기"}
            className={cn(
              "absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 z-10",
              "w-5 h-14 flex items-center justify-center",
              "bg-card border border-border rounded-l-lg",
              "text-muted-foreground hover:text-foreground hover:bg-muted",
              "transition-colors shadow-sm",
            )}
          >
            {panelOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>

          {/* Sliding panel — width animates between 0 and 288px */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              panelOpen ? "w-72" : "w-0",
            )}
          >
            <div className="w-72 h-full overflow-y-auto border-l border-border bg-muted/20">
              <TodayPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
