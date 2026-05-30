import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ensureOwnerSession } from "@/lib/route-guards";
import { useAuthStore } from "@/stores/auth-store";

/** Placeholder payment details — update before going live. */
const PAYMENT = {
  TELEBIRR_NUMBER: "+251/0 931947040",
  CBE_ACCOUNT: "1000344200193",
  BUSINESS_NAME: "Abdulhamid Teweleda",
  CONTACT_EMAIL: "raafatdigital@gmail.com",
} as const;

export const Route = createFileRoute("/pending-payment")({
  beforeLoad: async () => {
    await ensureOwnerSession();
    const { owner, subscription } = useAuthStore.getState();
    if (subscription?.status === "active") {
      throw redirect({ to: "/dashboard" });
    }
    if (!owner?.selected_plan) {
      throw redirect({ to: "/select-plan" });
    }
  },
  head: () => ({ meta: [{ title: "Complete payment — CaféOS" }] }),
  component: PendingPaymentPage,
});

function PaymentInstructionsCard() {
  return (
    <Card className="p-5 text-sm space-y-4">
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
      <p className="text-muted-foreground border-t border-border pt-4">
        After sending payment, email us at{" "}
        <a href={`mailto:${PAYMENT.CONTACT_EMAIL}`} className="text-gold hover:underline">
          {PAYMENT.CONTACT_EMAIL}
        </a>{" "}
        with your registered email and payment screenshot.
      </p>
    </Card>
  );
}

function PendingPaymentPage() {
  const navigate = useNavigate();
  const refreshMe = useAuthStore((s) => s.refreshMe);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshMe();
      window.location.reload();
    } finally {
      setRefreshing(false);
    }
  };

  const onSignOut = () => {
    clearSession();
    navigate({ to: "/login" });
  };

  return (
    <AuthLayout
      title="Complete your payment"
      subtitle="Your plan is reserved. Send your payment and we'll activate your account within a few hours."
    >
      <div className="space-y-4">
        <PaymentInstructionsCard />
        <Button className="w-full" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Checking…" : "Refresh status"}
        </Button>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <button type="button" onClick={onSignOut} className="text-gold hover:underline">
          Sign out
        </button>
      </p>
    </AuthLayout>
  );
}
