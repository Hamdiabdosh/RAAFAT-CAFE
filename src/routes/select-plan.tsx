import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { selectPlan } from "@/lib/auth-api";
import { getApiErrorMessage } from "@/lib/api";
import {
  fetchPublicPlans,
  formatMoneyPerMonth,
  formatMoneyPerYear,
} from "@/lib/public-api";
import { ensureOwnerSession } from "@/lib/route-guards";
import { useAuthStore } from "@/stores/auth-store";
import { useIsClient } from "@/hooks/use-is-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/select-plan")({
  beforeLoad: async () => {
    await ensureOwnerSession();
    const owner = useAuthStore.getState().owner;
    if (owner?.selected_plan) {
      throw redirect({ to: "/dashboard/billing" });
    }
  },
  head: () => ({ meta: [{ title: "Choose your plan — CaféOS" }] }),
  component: SelectPlanPage,
});

function SelectPlanPage() {
  const navigate = useNavigate();
  const isClient = useIsClient();
  const refreshMe = useAuthStore((s) => s.refreshMe);
  const [loading, setLoading] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  const { data, isLoading } = useQuery({
    queryKey: ["public", "plans"],
    queryFn: fetchPublicPlans,
    enabled: isClient,
  });

  const plans = data?.plans ?? [];
  const showYearlyToggle = plans.some((p) => p.price_yearly != null);

  const displayPrice = useMemo(
    () => (plan: (typeof plans)[0]) =>
      billingInterval === "yearly" && plan.price_yearly != null
        ? formatMoneyPerYear(plan.price_yearly)
        : formatMoneyPerMonth(plan.price_monthly),
    [billingInterval],
  );

  const onSelect = async (slug: string) => {
    setLoading(slug);
    try {
      await selectPlan(slug, billingInterval);
      await refreshMe();
      toast.success("Plan selected. Awaiting admin activation.");
      navigate({ to: "/pending-payment" });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(null);
    }
  };

  return (
    <AuthLayout
      title="Choose your plan"
      subtitle="Choose the plan you want — a platform admin will activate your subscription after payment."
    >
      {showYearlyToggle && (
        <div className="flex justify-center gap-1 p-1 rounded-lg border border-border bg-muted/30 w-fit mx-auto mb-4">
          <button
            type="button"
            className={cn(
              "px-4 py-1.5 text-sm rounded-md transition-colors",
              billingInterval === "monthly"
                ? "bg-background shadow-sm font-medium"
                : "text-muted-foreground",
            )}
            onClick={() => setBillingInterval("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={cn(
              "px-4 py-1.5 text-sm rounded-md transition-colors",
              billingInterval === "yearly"
                ? "bg-background shadow-sm font-medium"
                : "text-muted-foreground",
            )}
            onClick={() => setBillingInterval("yearly")}
          >
            Yearly
          </button>
        </div>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading plans…</p>}

      {!isLoading && plans.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No plans are available right now. Please check back soon.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((plan, index) => {
          const highlighted = index === plans.length - 1 && plans.length > 1;
          const yearlyUnavailable =
            billingInterval === "yearly" && plan.price_yearly == null;
          return (
            <Card
              key={plan.id}
              className={`p-5 flex flex-col ${highlighted ? "border-gold ring-1 ring-gold-border" : ""}`}
            >
              {highlighted && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-gold mb-2">
                  <Sparkles className="h-3 w-3" /> Recommended
                </span>
              )}
              <h3 className="font-display text-lg">{plan.name}</h3>
              <p className="text-2xl font-semibold mt-1">{displayPrice(plan)}</p>
              {billingInterval === "yearly" && plan.price_yearly != null && (
                <p className="text-xs text-muted-foreground mt-1">
                  vs {formatMoneyPerMonth(plan.price_monthly)} monthly
                </p>
              )}
              <ul className="mt-4 space-y-2 text-sm flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-5 w-full"
                variant={highlighted ? "default" : "outline"}
                disabled={loading !== null || yearlyUnavailable}
                onClick={() => onSelect(plan.slug)}
              >
                {yearlyUnavailable
                  ? "Yearly not available"
                  : loading === plan.slug
                    ? "Saving…"
                    : `Choose ${plan.name}`}
              </Button>
            </Card>
          );
        })}
      </div>
    </AuthLayout>
  );
}
