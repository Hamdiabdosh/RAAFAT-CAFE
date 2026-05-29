import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { ENTITLEMENTS, ENTITLEMENT_KEYS, type EntitlementKey } from "@/lib/entitlements";
import { formatMoneyPerMonth, formatMoneyPerYear } from "@/lib/public-api";

export const Route = createFileRoute("/dashboard/billing")({
  head: () => ({ meta: [{ title: "Subscription — CaféOS" }] }),
  component: BillingPage,
});

function BillingPage() {
  const subscription = useAuthStore((s) => s.subscription);
  const owner = useAuthStore((s) => s.owner);

  const planName = subscription?.plan.name ?? owner?.selected_plan ?? "Not selected";
  const status = subscription?.status ?? owner?.subscription_status ?? "pending";
  const features = subscription?.plan.features ?? [];
  const entitlements = subscription?.plan.entitlements;
  const enabledEntitlements = entitlements
    ? ENTITLEMENT_KEYS.filter((k) => entitlements[k as EntitlementKey])
    : [];

  const billingLabel =
    owner?.selected_billing_interval === "yearly"
      ? "Yearly"
      : owner?.selected_billing_interval === "monthly"
        ? "Monthly"
        : null;

  return (
    <>
      <PageHeader
        title="Subscription"
        subtitle="View your plan status. Changes and activation are handled by the platform admin."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-3xl">
        <Card className="p-6 bg-card relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gold" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Current plan</p>
          <p className="mt-2 font-display text-2xl font-bold text-gold capitalize">{planName}</p>
          {subscription?.plan.price_monthly != null && (
            <p className="text-sm text-muted-foreground mt-1">
              {formatMoneyPerMonth(subscription.plan.price_monthly)}
              {subscription.plan.price_yearly != null &&
                ` · ${formatMoneyPerYear(subscription.plan.price_yearly)}`}
            </p>
          )}
          {billingLabel && (
            <p className="text-xs text-muted-foreground mt-1">
              Requested billing: {billingLabel}
            </p>
          )}
          <Badge className="mt-3" variant={status === "active" ? "default" : "secondary"}>
            {status}
          </Badge>
          {subscription?.starts_at && (
            <p className="mt-4 text-xs text-muted-foreground">
              Started: {new Date(subscription.starts_at).toLocaleDateString()}
            </p>
          )}
          {subscription?.expires_at && (
            <p className="mt-1 text-xs text-muted-foreground">
              Expires: {new Date(subscription.expires_at).toLocaleDateString()}
            </p>
          )}
          {status !== "active" && (
            <p className="mt-4 text-sm text-muted-foreground">
              {status === "expired"
                ? "Your subscription has expired. Contact the platform admin to renew."
                : "Your subscription is pending activation. Pay offline, then contact the platform admin to activate your account."}
            </p>
          )}
        </Card>

        <Card className="p-6 bg-card">
          <h3 className="font-display text-lg font-semibold mb-4">What&apos;s included</h3>
          {enabledEntitlements.length > 0 ? (
            <ul className="space-y-2 text-sm mb-4">
              {enabledEntitlements.map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-gold shrink-0" />
                  {ENTITLEMENTS[k].label}
                </li>
              ))}
            </ul>
          ) : features.length > 0 ? (
            <ul className="space-y-2 text-sm mb-4">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-gold shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">
              Feature list appears once your plan is assigned.
            </p>
          )}
          <p className="text-xs text-muted-foreground border-t border-border pt-4">
            To upgrade, downgrade, or renew, contact your platform administrator.
          </p>
        </Card>
      </div>
    </>
  );
}
