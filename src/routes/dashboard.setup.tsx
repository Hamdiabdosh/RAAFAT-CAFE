import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchCafeProfile } from "@/lib/cafe-api";
import { fetchMenu } from "@/lib/menu-api";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/dashboard/setup")({
  head: () => ({ meta: [{ title: "Setup — CaféOS" }] }),
  component: SetupPage,
});

function SetupPage() {
  const subscription = useAuthStore((s) => s.subscription);
  const { data: cafe } = useQuery({
    queryKey: ["cafe", "profile"],
    queryFn: fetchCafeProfile,
  });
  const { data: menuData } = useQuery({
    queryKey: ["menu"],
    queryFn: fetchMenu,
  });

  const subActive = subscription?.status === "active";
  const profileDone = cafe?.profile_complete ?? false;
  const hasTheme =
    cafe?.primary_color !== "#000000" || cafe?.bg_color !== "#ffffff";
  const hasHours = cafe?.hours?.some((h) => !h.is_closed) ?? false;

  const steps = [
    {
      title: "Subscription activated",
      done: subActive,
      href: "/dashboard/billing",
      cta: "View subscription",
    },
    {
      title: "Café profile (name + address)",
      done: profileDone,
      href: "/dashboard/settings",
      cta: "Edit profile",
    },
    {
      title: "Operating hours",
      done: hasHours,
      href: "/dashboard/settings",
      cta: "Set hours",
    },
    {
      title: "Menu theme colors",
      done: hasTheme,
      href: "/dashboard/settings",
      cta: "Pick colors",
    },
    {
      title: "Build menu (1+ item)",
      done: (menuData?.menu.item_count ?? 0) >= 1,
      href: "/dashboard/menu",
      cta: "Menu builder",
    },
    {
      title: "Publish menu",
      done: menuData?.menu.status === "published",
      href: "/dashboard/menu",
      cta: "Publish",
    },
    {
      title: "Download QR code",
      done: false,
      href: "/dashboard/qr",
      cta: "Get QR",
    },
  ];

  const completed = steps.filter((s) => s.done).length;

  return (
    <>
      <PageHeader
        title="Setup checklist"
        subtitle={`${completed} of ${steps.length} steps complete`}
      />

      <Card className="p-6 bg-card max-w-xl space-y-4">
        {steps.map((step) => (
          <div key={step.title} className="flex items-start gap-3">
            {step.done ? (
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{step.title}</p>
              {!step.done && (
                <Button asChild variant="link" className="h-auto p-0 text-gold">
                  <Link to={step.href}>{step.cta}</Link>
                </Button>
              )}
            </div>
          </div>
        ))}

        {completed >= 3 && (
          <Button asChild className="w-full mt-4">
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
        )}
      </Card>
    </>
  );
}
