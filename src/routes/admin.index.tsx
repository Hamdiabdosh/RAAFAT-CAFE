import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Coffee,
  CreditCard,
  ShoppingBag,
  Store,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdminAuth } from "@/lib/route-guards";
import { fetchAdminStats } from "@/lib/admin-api";
import { formatMoney } from "@/lib/public-api";
import { useIsClient } from "@/hooks/use-is-client";

export const Route = createFileRoute("/admin/")({
  beforeLoad: () => requireAdminAuth(),
  head: () => ({ meta: [{ title: "Admin — RAAFAT-Cafe" }] }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const isClient = useIsClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchAdminStats,
    enabled: isClient,
    refetchInterval: 60_000,
  });

  const needsAttention = (data?.pending_subscriptions ?? 0) + (data?.expired_subscriptions ?? 0);

  return (
    <AdminShell activePath="/admin">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold font-medium">Super admin</p>
            <h1 className="font-display text-2xl sm:text-3xl mt-1">RAAFAT-Cafe platform</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Monitor all cafés, activate subscriptions after payment, and support owners from one
              place.
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/cafes">
              All cafés
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isError && (
          <Card className="p-4 border-destructive/40 bg-destructive/10 text-sm">
            Could not load platform stats.{" "}
            <button type="button" className="underline text-gold" onClick={() => refetch()}>
              Retry
            </button>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiStat
            icon={Store}
            label="Total cafés"
            value={data?.total_cafes}
            loading={isLoading}
          />
          <KpiStat
            icon={CreditCard}
            label="Active subscriptions"
            value={data?.active_subscriptions}
            loading={isLoading}
            highlight
          />
          <KpiStat
            icon={ShoppingBag}
            label="Orders today"
            value={data?.today_orders}
            loading={isLoading}
          />
          <KpiStat
            icon={Coffee}
            label="Revenue today"
            value={data != null ? formatMoney(data.today_revenue) : undefined}
            loading={isLoading}
            isMoney
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-5 lg:col-span-1">
            <h2 className="font-semibold text-sm">Subscription health</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <HealthRow
                label="Pending activation"
                count={data?.pending_subscriptions}
                loading={isLoading}
                variant="warning"
              />
              <HealthRow
                label="Active"
                count={data?.active_subscriptions}
                loading={isLoading}
                variant="success"
              />
              <HealthRow
                label="Expired"
                count={data?.expired_subscriptions}
                loading={isLoading}
                variant="muted"
              />
              <HealthRow
                label="Suspended owners"
                count={data?.suspended_owners}
                loading={isLoading}
                variant="danger"
              />
            </ul>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  {needsAttention > 0 && <AlertCircle className="h-4 w-4 text-gold" />}
                  Needs your attention
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Cafés with pending or expired subscriptions — activate or renew after payment.
                </p>
              </div>
              {needsAttention > 0 && (
                <Badge variant="secondary" className="shrink-0">
                  {needsAttention} total
                </Badge>
              )}
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground mt-6">Loading…</p>
            ) : (data?.attention_cafes.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground mt-6 py-8 text-center border border-dashed border-border rounded-lg">
                No pending or expired subscriptions. You&apos;re all caught up.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Café</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.attention_cafes ?? []).map((cafe) => (
                      <TableRow key={cafe.id}>
                        <TableCell className="font-medium">{cafe.name}</TableCell>
                        <TableCell className="text-muted-foreground">{cafe.owner.email}</TableCell>
                        <TableCell className="capitalize">
                          {cafe.subscription?.plan ??
                            cafe.owner.selected_plan ??
                            "—"}
                        </TableCell>
                        <TableCell>
                          <SubBadge status={cafe.subscription?.status ?? "none"} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" asChild>
                            <Link to="/admin/cafes/$id" params={{ id: cafe.id }}>
                              Manage
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickAction
            title="Manage all cafés"
            description="Search, filter, and open any café to edit subscription or suspend accounts."
            to="/admin/cafes"
            label="Open café list"
          />
          <QuickAction
            title="Activate subscription"
            description="Open a café → set plan & expiry → status Active → Save. Required after offline payment."
            to="/admin/cafes"
            label="Find a café"
          />
          <QuickAction
            title="Impersonate owner"
            description="Diagnose issues by viewing the owner dashboard with an impersonation banner."
            to="/admin/cafes"
            label="From café detail"
          />
        </div>
      </div>
    </AdminShell>
  );
}

function KpiStat({
  icon: Icon,
  label,
  value,
  loading,
  highlight,
  isMoney,
}: {
  icon: typeof Store;
  label: string;
  value?: string | number;
  loading: boolean;
  highlight?: boolean;
  isMoney?: boolean;
}) {
  return (
    <Card className="relative p-5 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-0.5 bg-gold" />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
      <p
        className={`mt-2 font-display font-bold text-gold ${isMoney ? "text-2xl" : "text-3xl"}`}
      >
        {loading ? "…" : (value ?? "—")}
      </p>
      {highlight && !loading && typeof value === "number" && value > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">Paying cafés on the platform</p>
      )}
    </Card>
  );
}

function HealthRow({
  label,
  count,
  loading,
  variant,
}: {
  label: string;
  count?: number;
  loading: boolean;
  variant: "warning" | "success" | "muted" | "danger";
}) {
  const dot =
    variant === "warning"
      ? "bg-gold"
      : variant === "success"
        ? "bg-[var(--success)]"
        : variant === "danger"
          ? "bg-destructive"
          : "bg-muted-foreground";

  return (
    <li className="flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {label}
      </span>
      <span className="font-semibold tabular-nums">{loading ? "…" : (count ?? 0)}</span>
    </li>
  );
}

function SubBadge({ status }: { status: string }) {
  const variant =
    status === "active"
      ? "default"
      : status === "pending"
        ? "secondary"
        : status === "expired"
          ? "destructive"
          : "outline";

  return <Badge variant={variant}>{status}</Badge>;
}

function QuickAction({
  title,
  description,
  to,
  label,
}: {
  title: string;
  description: string;
  to: string;
  label: string;
}) {
  return (
    <Card className="p-5 flex flex-col">
      <h3 className="font-medium text-sm">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 flex-1">{description}</p>
      <Button asChild variant="outline" size="sm" className="mt-4 w-fit">
        <Link to={to}>{label}</Link>
      </Button>
    </Card>
  );
}
