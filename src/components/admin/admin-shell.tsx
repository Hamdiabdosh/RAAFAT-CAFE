import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { useAdminStore } from "@/stores/admin-store";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/cafes", label: "Cafés", exact: false },
  { to: "/admin/plans", label: "Plans", exact: false },
] as const;

export function AdminShell({
  children,
  activePath,
}: {
  children: ReactNode;
  activePath: string;
}) {
  const navigate = useNavigate();
  const clearSession = useAdminStore((s) => s.clearSession);
  const admin = useAdminStore((s) => s.admin);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo size="sm" to="/admin" />
          <nav className="flex gap-1">
            {nav.map((item) => {
              const active = item.exact
                ? activePath === item.to
                : activePath.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md transition-colors",
                    active
                      ? "bg-gold-dim text-gold font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {admin?.email && (
            <span className="text-muted-foreground hidden sm:inline">{admin.email}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearSession();
              navigate({ to: "/admin/login" });
            }}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}
