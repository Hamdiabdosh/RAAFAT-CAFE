import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { OpenClosedToggle } from "@/components/cafe/open-closed-toggle";
import { SubscriptionBanner } from "@/components/auth/subscription-banner";
import { ImpersonationBanner } from "@/components/auth/impersonation-banner";
import { useAuthStore } from "@/stores/auth-store";

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const owner = useAuthStore((s) => s.owner);
  const clearSession = useAuthStore((s) => s.clearSession);

  const onLogout = () => {
    clearSession();
    navigate({ to: "/login" });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <ImpersonationBanner />
          <SubscriptionBanner />
          <header className="h-14 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              {owner && (
                <span className="text-sm text-muted-foreground hidden sm:inline truncate max-w-[200px]">
                  {owner.full_name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <OpenClosedToggle />
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={onLogout} aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}