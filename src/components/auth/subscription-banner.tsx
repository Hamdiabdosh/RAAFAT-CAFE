import { Link } from "@tanstack/react-router";
import { AlertTriangle, Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";

export function SubscriptionBanner() {
  const subscription = useAuthStore((s) => s.subscription);
  const owner = useAuthStore((s) => s.owner);

  if (!owner) return null;

  const status = subscription?.status ?? owner.subscription_status;

  if (status === "active") return null;

  if (status === "expired") {
    return (
      <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-foreground flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          Your subscription has expired. Your menu is hidden from customers. Contact the platform
        admin to renew.
        </span>
        <Button asChild size="sm" variant="outline">
          <Link to="/dashboard/billing">View subscription</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="border-b border-gold-border bg-gold-dim px-4 py-2.5 text-sm text-foreground flex flex-wrap items-center justify-between gap-2">
      <span className="inline-flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-gold shrink-0" />
        Your account is pending activation. An administrator will activate your plan after payment.
      </span>
      <Button asChild size="sm" variant="outline" className="border-gold-border">
        <Link to="/dashboard/billing">View plan</Link>
      </Button>
    </div>
  );
}
