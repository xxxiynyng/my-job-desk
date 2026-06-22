import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, Sparkles, Settings, HelpCircle, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { to: "/",           label: "지원 대시보드", icon: LayoutDashboard },
  { to: "/experiences", label: "경험정리",      icon: BookOpen },
  { to: "/ai-cover",   label: "AI 자소서",     icon: Sparkles },
];

const bottomItems = [
  { icon: HelpCircle, label: "도움말" },
];

export function PickdSidebar() {
  const { pathname } = useLocation();
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <aside className="flex flex-col w-[60px] border-r border-border bg-card py-4 items-center shrink-0">
      <img src="/logo-mark.svg" alt="Pickd" className="w-7 h-7 mb-6" />

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <Tooltip key={item.to}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.to}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}

        {/* 캘린더 — 보조 기능, 구분선 위 하단 */}
        <div className="mt-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/calendar"
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
                  isActive("/calendar")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <CalendarDays className="w-[18px] h-[18px] shrink-0" />
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">캘린더</TooltipContent>
          </Tooltip>
        </div>
      </nav>

      <div className="flex flex-col gap-1 pt-2 border-t border-border">
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink
              to="/settings"
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
                isActive("/settings")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Settings className="w-[18px] h-[18px] shrink-0" />
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">설정</TooltipContent>
        </Tooltip>

        {bottomItems.map((item) => (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <button
                className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </aside>
  );
}
