import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  type AdminPlan,
  createAdminPlan,
  updateAdminPlan,
} from "@/lib/admin-api";
import { getApiErrorMessage } from "@/lib/api";
import {
  ENTITLEMENTS,
  ENTITLEMENT_KEYS,
  type EntitlementKey,
  type EntitlementsMap,
} from "@/lib/entitlements";
import { formatMoney } from "@/lib/public-api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: AdminPlan | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-\s]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 20);
}

function emptyEntitlements(): EntitlementsMap {
  return Object.fromEntries(ENTITLEMENT_KEYS.map((k) => [k, false])) as EntitlementsMap;
}

export function PlanFormDialog({ open, onOpenChange, plan }: Props) {
  const isEdit = Boolean(plan);
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [priceMonthly, setPriceMonthly] = useState("");
  const [priceYearly, setPriceYearly] = useState("");
  const [entitlements, setEntitlements] = useState<EntitlementsMap>(emptyEntitlements);
  const [features, setFeatures] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(plan?.name ?? "");
    setSlug(plan?.slug ?? "");
    setSlugTouched(Boolean(plan));
    setPriceMonthly(plan ? String(plan.price_monthly) : "");
    setPriceYearly(plan?.price_yearly != null ? String(plan.price_yearly) : "");
    if (plan?.entitlements) {
      const next = emptyEntitlements();
      for (const key of ENTITLEMENT_KEYS) {
        next[key] = Boolean(plan.entitlements[key]);
      }
      setEntitlements(next);
    } else {
      setEntitlements(emptyEntitlements());
    }
    setFeatures(plan ? plan.features.join("\n") : "");
    setIsActive(plan?.is_active ?? true);
  }, [open, plan]);

  const coreKeys = useMemo(
    () => ENTITLEMENT_KEYS.filter((k) => ENTITLEMENTS[k].group === "core"),
    [],
  );
  const proKeys = useMemo(
    () => ENTITLEMENT_KEYS.filter((k) => ENTITLEMENTS[k].group === "pro"),
    [],
  );

  const savingsPct = useMemo(() => {
    const m = parseFloat(priceMonthly);
    const y = parseFloat(priceYearly);
    if (Number.isNaN(m) || Number.isNaN(y) || m <= 0 || y <= 0) return null;
    const annualMonthly = m * 12;
    return Math.round((1 - y / annualMonthly) * 100);
  }, [priceMonthly, priceYearly]);

  const toggleEntitlement = (key: EntitlementKey, checked: boolean) => {
    setEntitlements((prev) => ({ ...prev, [key]: checked }));
  };

  const save = useMutation({
    mutationFn: () => {
      const parsedMonthly = parseFloat(priceMonthly);
      if (Number.isNaN(parsedMonthly) || parsedMonthly < 0) {
        throw new Error("Enter a valid monthly price (0 or more)");
      }
      const yearlyTrim = priceYearly.trim();
      let parsedYearly: number | null = null;
      if (yearlyTrim) {
        parsedYearly = parseFloat(yearlyTrim);
        if (Number.isNaN(parsedYearly) || parsedYearly < 0) {
          throw new Error("Enter a valid yearly price (0 or more)");
        }
      }
      const cleanSlug = slug.trim();
      if (cleanSlug.length < 2) {
        throw new Error("Slug must be at least 2 characters");
      }
      const featureList = features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);

      const body = {
        name: name.trim(),
        slug: cleanSlug,
        price: parsedMonthly,
        price_yearly: parsedYearly,
        entitlements,
        features: featureList,
        is_active: isActive,
      };

      return isEdit ? updateAdminPlan(plan!.id, body) : createAdminPlan(body);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Plan updated" : "Plan created");
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit plan" : "New plan"}</DialogTitle>
          <DialogDescription>
            Set pricing and which product features this plan unlocks. Marketing bullets are shown on
            signup only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="plan-name">Name</Label>
              <Input
                id="plan-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched && !isEdit) setSlug(slugify(e.target.value));
                }}
                placeholder="Pro"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-slug">Slug</Label>
              <Input
                id="plan-slug"
                value={slug}
                onChange={(e) => {
                  setSlug(slugify(e.target.value));
                  setSlugTouched(true);
                }}
                placeholder="pro"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="plan-price-monthly">Monthly price</Label>
              <Input
                id="plan-price-monthly"
                type="number"
                step="0.01"
                min="0"
                value={priceMonthly}
                onChange={(e) => setPriceMonthly(e.target.value)}
                placeholder="49.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-price-yearly">Yearly price (optional)</Label>
              <Input
                id="plan-price-yearly"
                type="number"
                step="0.01"
                min="0"
                value={priceYearly}
                onChange={(e) => setPriceYearly(e.target.value)}
                placeholder="490.00"
              />
              {savingsPct != null && savingsPct > 0 && (
                <p className="text-xs text-gold">Save {savingsPct}% vs paying monthly</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Entitlements</Label>
            <div className="rounded-lg border border-border p-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Core</p>
              {coreKeys.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={entitlements[key]}
                    onCheckedChange={(c) => toggleEntitlement(key, c === true)}
                  />
                  {ENTITLEMENTS[key].label}
                </label>
              ))}
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">
                Pro
              </p>
              {proKeys.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={entitlements[key]}
                    onCheckedChange={(c) => toggleEntitlement(key, c === true)}
                  />
                  {ENTITLEMENTS[key].label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plan-features">Marketing bullets (one per line)</Label>
            <Textarea
              id="plan-features"
              rows={4}
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder={"Customer ordering\nLive order queue"}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="plan-active">Active</Label>
              <p className="text-xs text-muted-foreground">
                Inactive plans are hidden from signup.
              </p>
            </div>
            <Switch id="plan-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {priceMonthly && !Number.isNaN(parseFloat(priceMonthly)) && (
            <p className="text-xs text-muted-foreground">
              Preview: {formatMoney(parseFloat(priceMonthly))}/mo
              {priceYearly.trim() && !Number.isNaN(parseFloat(priceYearly))
                ? ` · ${formatMoney(parseFloat(priceYearly))}/yr`
                : ""}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? "Saving…" : isEdit ? "Save changes" : "Create plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
