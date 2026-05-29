import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { PlanFormDialog } from "@/components/admin/plan-form-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { requireAdminAuth } from "@/lib/route-guards";
import {
  type AdminPlan,
  deleteAdminPlan,
  fetchAdminPlans,
  updateAdminPlan,
} from "@/lib/admin-api";
import { getApiErrorMessage } from "@/lib/api";
import { ENTITLEMENTS, ENTITLEMENT_KEYS, type EntitlementKey } from "@/lib/entitlements";
import { formatMoneyPerMonth, formatMoneyPerYear } from "@/lib/public-api";
import { useIsClient } from "@/hooks/use-is-client";

export const Route = createFileRoute("/admin/plans")({
  beforeLoad: () => requireAdminAuth(),
  head: () => ({ meta: [{ title: "Plans — Admin — RAAFAT-Cafe" }] }),
  component: AdminPlansPage,
});

function AdminPlansPage() {
  const isClient = useIsClient();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPlan | null>(null);
  const [toDelete, setToDelete] = useState<AdminPlan | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () => fetchAdminPlans(),
    enabled: isClient,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });

  const toggleActive = useMutation({
    mutationFn: (plan: AdminPlan) =>
      updateAdminPlan(plan.id, { is_active: !plan.is_active }),
    onSuccess: (_, plan) => {
      toast.success(plan.is_active ? "Plan deactivated" : "Plan activated");
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (plan: AdminPlan) => deleteAdminPlan(plan.id),
    onSuccess: () => {
      toast.success("Plan deleted");
      setToDelete(null);
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (plan: AdminPlan) => {
    setEditing(plan);
    setDialogOpen(true);
  };

  return (
    <AdminShell activePath="/admin/plans">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold font-medium">Pricing</p>
            <h1 className="font-display text-2xl sm:text-3xl mt-1">Subscription plans</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Create and price the plans cafés subscribe to. Prices here drive signup, billing, and
              the subscription editor.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New plan
          </Button>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {!isLoading && (data?.plans.length ?? 0) === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground border-dashed">
            No plans yet. Create your first plan to get started.
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.plans.map((plan) => (
            <Card
              key={plan.id}
              className={`p-5 flex flex-col ${plan.is_active ? "" : "opacity-60"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg">{plan.name}</h2>
                  <p className="text-xs text-muted-foreground">/{plan.slug}</p>
                </div>
                <Badge variant={plan.is_active ? "default" : "outline"}>
                  {plan.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="mt-3">
                <p className="text-2xl font-semibold">{formatMoneyPerMonth(plan.price_monthly)}</p>
                {plan.price_yearly != null && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {formatMoneyPerYear(plan.price_yearly)}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-1 mt-3">
                {ENTITLEMENT_KEYS.filter((k) => plan.entitlements[k]).map((k) => (
                  <Badge key={k} variant="secondary" className="text-[10px]">
                    {ENTITLEMENTS[k as EntitlementKey].label}
                  </Badge>
                ))}
              </div>

              <ul className="mt-3 space-y-1 text-sm text-muted-foreground flex-1">
                {plan.features.length === 0 ? (
                  <li className="italic">No features listed</li>
                ) : (
                  plan.features.map((f) => <li key={f}>• {f}</li>)
                )}
              </ul>

              <p className="text-xs text-muted-foreground mt-4">
                {plan.subscriber_count} café{plan.subscriber_count === 1 ? "" : "s"} on this plan
              </p>

              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                <Button size="sm" variant="outline" onClick={() => openEdit(plan)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={toggleActive.isPending}
                  onClick={() => toggleActive.mutate(plan)}
                >
                  {plan.is_active ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={plan.subscriber_count > 0}
                  title={
                    plan.subscriber_count > 0
                      ? "Cafés are subscribed to this plan — deactivate instead"
                      : "Delete plan"
                  }
                  onClick={() => setToDelete(plan)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <PlanFormDialog open={dialogOpen} onOpenChange={setDialogOpen} plan={editing} />

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the plan. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (toDelete) remove.mutate(toDelete);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
