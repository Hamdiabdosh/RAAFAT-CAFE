import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Settings,
  ListChecks,
  QrCode,
  LogOut,
  CreditCard,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/brand/logo";
import { useAuthStore } from "@/stores/auth-store";
import { type EntitlementKey, hasEntitlementKey } from "@/lib/entitlements";

const groups = [
  {
    label: "Main",
    items: [
      { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
      { title: "Menu", url: "/dashboard/menu", icon: UtensilsCrossed },
      {
        title: "Orders",
        url: "/dashboard/orders",
        icon: ClipboardList,
        entitlement: "order_management" as EntitlementKey,
      },
    ],
  },
  {
    label: "Setup",
    items: [
      { title: "Setup", url: "/dashboard/setup", icon: ListChecks },
      { title: "QR Code", url: "/dashboard/qr", icon: QrCode },
      { title: "Subscription", url: "/dashboard/billing", icon: CreditCard },
      { title: "Café settings", url: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const owner = useAuthStore((s) => s.owner);
  const entitlements = useAuthStore((s) => s.subscription?.plan.entitlements);
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();
  const isActive = (p: string) => currentPath === p || currentPath.startsWith(`${p}/`);

  const initials = owner?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-14 px-4 flex items-center justify-start border-b border-sidebar-border">
        {!collapsed ? <Logo size="md" /> : <span className="font-display text-gold text-lg">C</span>}
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  if (
                    "entitlement" in item &&
                    item.entitlement &&
                    !hasEntitlementKey(entitlements, item.entitlement)
                  ) {
                    return null;
                  }
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className={
                          active ? "bg-gold-dim text-gold border-l-2 border-gold rounded-l-none" : ""
                        }
                      >
                        <Link to={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          {!collapsed && (
                            <span className="flex-1">
                              {item.title}
                              {"soon" in item && item.soon && (
                                <span className="ml-1 text-[10px] text-muted-foreground">(soon)</span>
                              )}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gold-dim border border-gold-border flex items-center justify-center text-gold font-display text-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{owner?.full_name ?? "Owner"}</p>
              <p className="text-xs text-muted-foreground truncate">{owner?.email}</p>
            </div>
            <button
              type="button"
              aria-label="Log out"
              className="text-muted-foreground hover:text-gold"
              onClick={() => {
                clearSession();
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label="Log out"
            className="flex justify-center w-full text-muted-foreground hover:text-gold"
            onClick={() => {
              clearSession();
              navigate({ to: "/login" });
            }}
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
