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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
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
