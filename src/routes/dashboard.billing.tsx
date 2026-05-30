import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";

/** Placeholder payment details — update before going live. */
const PAYMENT = {
  TELEBIRR_NUMBER: "[TELEBIRR_NUMBER]",
  CBE_ACCOUNT: "[CBE_ACCOUNT]",
  BUSINESS_NAME: "[BUSINESS_NAME]",
  BANK_NAME: "[BANK_NAME]",
  ACCOUNT_NUMBER: "[ACCOUNT_NUMBER]",
  CONTACT_EMAIL: "[CONTACT_EMAIL]",
} as const;

export const Route = createFileRoute("/dashboard/billing")({
  head: () => ({ meta: [{ title: "Subscription — CaféOS" }] }),
  component: BillingPage,
});

function statusBadgeVariant(status: string): "default" | "secondary" | "destructive" {
  if (status === "active") return "default";
  if (status === "expired") return "destructive";
  return "secondary";
}

function PaymentInstructionsCard() {
  return (
    <Card className="p-6 bg-card">
      <h3 className="font-display text-lg font-semibold mb-4">Payment instructions</h3>
      <div className="text-sm space-y-4">
        <div>
          <p className="font-medium">Method 1: Telebirr</p>
          <p className="text-muted-foreground mt-1">
            Account: {PAYMENT.TELEBIRR_NUMBER} · Name: {PAYMENT.BUSINESS_NAME}
          </p>
        </div>
        <div>
          <p className="font-medium">Method 2: CBE</p>
          <p className="text-muted-foreground mt-1">
            Account: {PAYMENT.CBE_ACCOUNT} · Name: {PAYMENT.BUSINESS_NAME}
          </p>
        </div>
        <div>
          <p className="font-medium">Method 3: Bank transfer</p>
          <p className="text-muted-foreground mt-1">
            Bank: {PAYMENT.BANK_NAME} · Account: {PAYMENT.ACCOUNT_NUMBER}
          </p>
        </div>
        <p className="text-muted-foreground border-t border-border pt-4">
          After sending payment, email us at{" "}
          <a href={`mailto:${PAYMENT.CONTACT_EMAIL}`} className="text-gold hover:underline">
            {PAYMENT.CONTACT_EMAIL}
          </a>{" "}
          with your registered email and payment screenshot.
        </p>
      </div>
    </Card>
  );
}

function BillingPage() {
  const subscription = useAuthStore((s) => s.subscription);
  const owner = useAuthStore((s) => s.owner);

  const planName = subscription?.plan.name ?? owner?.selected_plan ?? "Not selected";
  const status = subscription?.status ?? owner?.subscription_status ?? "pending";

  return (
    <>
      <PageHeader
        title="Subscription"
        subtitle="View your plan status and payment details."
      />

      <div className="max-w-2xl space-y-4">
        <Card className="p-6 bg-card relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gold" />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Current plan</p>
              <p className="mt-2 font-display text-2xl font-bold text-gold capitalize">{planName}</p>
            </div>
            <Badge variant={statusBadgeVariant(status)} className="capitalize">
              {status}
            </Badge>
          </div>
          {subscription?.starts_at && (
            <p className="mt-4 text-sm text-muted-foreground">
              Started: {new Date(subscription.starts_at).toLocaleDateString()}
            </p>
          )}
          {subscription?.expires_at && (
            <p className="mt-1 text-sm text-muted-foreground">
              Expires: {new Date(subscription.expires_at).toLocaleDateString()}
            </p>
          )}
        </Card>

        <Card className="p-6 bg-card">
          <h3 className="font-display text-lg font-semibold mb-2">Renew / Upgrade</h3>
          <p className="text-sm text-muted-foreground">
            To renew or change your plan, contact us at{" "}
            <a href={`mailto:${PAYMENT.CONTACT_EMAIL}`} className="text-gold hover:underline">
              {PAYMENT.CONTACT_EMAIL}
            </a>{" "}
            or visit{" "}
            <Link to="/select-plan" className="text-gold hover:underline">
              /select-plan
            </Link>
            .
          </p>
        </Card>

        {status === "pending" && <PaymentInstructionsCard />}
      </div>
    </>
  );
}
