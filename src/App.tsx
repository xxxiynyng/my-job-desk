import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import JobDetail from "./pages/JobDetail.tsx";
import Experiences from "./pages/Experiences.tsx";
import AICover from "./pages/AICover.tsx";
import Settings from "./pages/Settings.tsx";
import Calendar from "./pages/Calendar.tsx";
import NotFound from "./pages/NotFound.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import { purgeExpired } from "@/lib/trash";

// 앱 부팅 시 1회 — 휴지통 만료(14일 경과) 항목 자동 영구 삭제 스윕.
purgeExpired();

const queryClient = new QueryClient();

/** 최초 사용자는 온보딩으로 보낸다 (완료 플래그: pickd.onboarding.done.v1) */
function RequireOnboarded({ children }: { children: ReactNode }) {
  const done = localStorage.getItem("pickd.onboarding.done.v1") === "1";
  return done ? <>{children}</> : <Navigate to="/onboarding" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<RequireOnboarded><Index /></RequireOnboarded>} />
          <Route path="/jobs/:slug" element={<JobDetail />} />
          <Route path="/experiences" element={<Experiences />} />
          <Route path="/basic-info" element={<Navigate to="/experiences?tab=basic-info" replace />} />
          <Route path="/files" element={<Navigate to="/experiences?tab=files" replace />} />
          <Route path="/ai-cover" element={<AICover />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/calendar" element={<Calendar />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
