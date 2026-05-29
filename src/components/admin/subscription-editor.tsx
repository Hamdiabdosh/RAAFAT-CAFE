import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAdminPlans, updateCafeSubscription, type AdminCafeDetail } from "@/lib/admin-api";
import { getApiErrorMessage } from "@/lib/api";
import { formatMoneyPerMonth } from "@/lib/public-api";
import { useIsClient } from "@/hooks/use-is-client";

type Props = {
  cafeId: string;
  ownerSuspended: boolean;
  subscription: AdminCafeDetail["subscription"];
  onUpdated: () => void;
};

export function SubscriptionEditor({ cafeId, ownerSuspended, subscription, onUpdated }: Props) {
  const isClient = useIsClient();
  const [planId, setPlanId] = useState("");
  const [subStatus, setSubStatus] = useState("pending");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");

  const { data: plansData } = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () => fetchAdminPlans(),
    enabled: isClient,
  });

  // Show active plans, plus the currently assigned plan even if it's inactive.
  const planOptions = useMemo(() => {
    const all = plansData?.plans ?? [];
    return all.filter((p) => p.is_active || p.id === subscription?.plan.id);
  }, [plansData, subscription?.plan.id]);

  useEffect(() => {
    if (!subscription) return;
    setPlanId(subscription.plan.id);
    setSubStatus(subscription.status);
    setStartsAt(
      subscription.starts_at
        ? new Date(subscription.starts_at).toISOString().slice(0, 10)
        : "",
    );
    setExpiresAt(
      subscription.expires_at
        ? new Date(subscription.expires_at).toISOString().slice(0, 10)
        : "",
    );
    setNotes(subscription.notes ?? "");
  }, [subscription]);

  const save = useMutation({
    mutationFn: () =>
      updateCafeSubscription(cafeId, {
        status: subStatus,
        plan_id: planId || undefined,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        notes: notes.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Subscription updated");
      onUpdated();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const quickActivate = useMutation({
    mutationFn: () => {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      return updateCafeSubscription(cafeId, {
        status: "active",
        plan_id: planId || undefined,
        starts_at: new Date().toISOString(),
        expires_at: expiry.toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("Activated for 30 days");
      onUpdated();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const onSave = () => {
    if (subStatus === "active" && !expiresAt) {
      toast.error("Set an expiry date before activating");
      return;
    }
    if (ownerSuspended && subStatus === "active") {
      toast.error("Reactivate the owner account before activating subscription");
      return;
    }
    save.mutate();
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="font-semibold">Subscription (admin)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Only platform admins can change plan, status, and dates. Owners choose a plan once at
            signup; you activate after payment.
          </p>
        </div>
        {subscription?.status !== "active" && (
          <Button
            size="sm"
            disabled={quickActivate.isPending || ownerSuspended || !planId}
            onClick={() => quickActivate.mutate()}
          >
            Quick activate (30d)
          </Button>
        )}
      </div>

      {subscription && (
        <p className="text-sm text-muted-foreground">
          Current: {subscription.plan.name} (
          {formatMoneyPerMonth(subscription.plan.price_monthly)}) ·{" "}
          {subscription.status}
          {subscription.expires_at &&
            ` · expires ${new Date(subscription.expires_at).toLocaleDateString()}`}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Plan</Label>
          <Select value={planId} onValueChange={setPlanId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select a plan" />
            </SelectTrigger>
            <SelectContent>
              {planOptions.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} — {formatMoneyPerMonth(p.price_monthly)}
                  {p.is_active ? "" : " (inactive)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={subStatus} onValueChange={setSubStatus}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Starts</Label>
          <Input
            type="date"
            className="mt-1"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div>
          <Label>Expires {subStatus === "active" && <span className="text-destructive">*</span>}</Label>
          <Input
            type="date"
            className="mt-1"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
          />
        </div>
      </div>

      <div>
        <Label>Internal notes</Label>
        <Textarea
          className="mt-1"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Payment reference, agreement details…"
        />
      </div>

      <Button disabled={save.isPending} onClick={onSave}>
        Save subscription
      </Button>
    </Card>
  );
}
