import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiErrorMessage } from "@/lib/api";
import {
  downloadAnalyticsExport,
  fetchAnalyticsSummary,
  fetchCategoryAnalytics,
  fetchDailyAnalytics,
  fetchOrderTypeSplit,
  fetchPeakHours,
  fetchTopItems,
  type AnalyticsRange,
  type RangeParams,
} from "@/lib/analytics-api";
import { fetchLiveOrders } from "@/lib/orders-api";
import { formatMoney } from "@/lib/public-api";
import { useEntitlement } from "@/hooks/use-entitlement";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Overview — CaféOS" }] }),
  component: OverviewPage,
});

const RANGES: { id: AnalyticsRange; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7days", label: "7 days" },
  { id: "30days", label: "30 days" },
  { id: "this_month", label: "This month" },
  { id: "custom", label: "Custom" },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const COLORS = ["var(--gold)", "var(--info)", "var(--success)", "var(--warning)"];

function OverviewPage() {
  const hasAnalytics = useEntitlement("analytics");
  const hasOrders = useEntitlement("order_management");
  const [range, setRange] = useState<AnalyticsRange>("7days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const params: RangeParams = useMemo(() => {
    if (range === "custom" && customStart && customEnd) {
      return { range, start: customStart, end: customEnd };
    }
    return { range: range === "custom" ? "7days" : range };
  }, [range, customStart, customEnd]);

  const { data: summary } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: fetchAnalyticsSummary,
    enabled: hasAnalytics,
    refetchInterval: 5 * 60_000,
  });

  const { data: daily, isLoading: dailyLoading } = useQuery({
    queryKey: ["analytics-daily", params],
    queryFn: () => fetchDailyAnalytics(params),
    enabled: hasAnalytics,
  });

  const { data: peak } = useQuery({
    queryKey: ["analytics-peak", params],
    queryFn: () => fetchPeakHours(params),
    enabled: hasAnalytics,
  });

  const { data: topItems } = useQuery({
    queryKey: ["analytics-top", params],
    queryFn: () => fetchTopItems(params),
    enabled: hasAnalytics,
  });

  const { data: categories } = useQuery({
    queryKey: ["analytics-categories", params],
    queryFn: () => fetchCategoryAnalytics(params),
    enabled: hasAnalytics,
  });

  const { data: orderTypes } = useQuery({
    queryKey: ["analytics-order-types", params],
    queryFn: () => fetchOrderTypeSplit(params),
    enabled: hasAnalytics,
  });

  const { data: live } = useQuery({
    queryKey: ["orders-live"],
    queryFn: fetchLiveOrders,
    enabled: hasOrders,
    refetchInterval: 30_000,
  });

  const chartDays = daily?.days ?? [];
  const hasData = chartDays.some((d) => d.orders > 0);
  const activeCount = live?.orders.length ?? 0;

  const peakMatrix = useMemo(() => {
    const max = Math.max(1, ...(peak?.grid.map((c) => c.count) ?? [1]));
    return peak?.grid.map((c) => ({ ...c, intensity: c.count / max })) ?? [];
  }, [peak]);

  const typeChart = orderTypes
    ? [
        { name: "Dine in", value: orderTypes.dine_in.count },
        { name: "Takeaway", value: orderTypes.takeaway.count },
      ]
    : [];

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={new Date().toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
        actions={
          <>
            {hasAnalytics &&
              RANGES.map((r) => (
                <Button
                  key={r.id}
                  variant={range === r.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRange(r.id)}
                >
                  {r.label}
                </Button>
              ))}
            {hasOrders && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/orders">Live queue</Link>
              </Button>
            )}
            {hasAnalytics && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await downloadAnalyticsExport(params);
                  } catch (e) {
                    toast.error(getApiErrorMessage(e));
                  }
                }}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}
          </>
        }
      />

      {!hasAnalytics && (
        <Card className="p-6 mb-6 border-dashed">
          <p className="text-sm text-muted-foreground">
            Analytics and revenue insights are available on plans that include the analytics
            feature. Contact your platform admin to upgrade.
          </p>
        </Card>
      )}

      {hasAnalytics && range === "custom" && (
        <div className="mb-6 flex flex-wrap gap-3">
          <Input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="w-40"
          />
          <Input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="w-40"
          />
        </div>
      )}

      {hasAnalytics && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Today's revenue"
          value={summary ? formatMoney(summary.today_revenue) : "—"}
          delta="Served orders"
        />
        <KpiCard label="Today's orders" value={summary ? String(summary.today_orders) : "—"} />
        <KpiCard
          label="Active in queue"
          value={String(activeCount)}
          delta={activeCount > 0 ? "Needs attention" : "All clear"}
        />
        <KpiCard
          label="This month"
          value={summary ? formatMoney(summary.month_revenue) : "—"}
          delta={summary ? `${summary.month_orders} orders` : undefined}
        />
      </div>
      )}

      {hasOrders && live && live.orders.length > 0 && (
        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">Active orders</h3>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/orders">View all</Link>
            </Button>
          </div>
          <ul className="space-y-2">
            {live.orders.slice(0, 5).map((o) => (
              <li key={o.id} className="flex items-center justify-between text-sm">
                <span>
                  #{o.daily_number}{" "}
                  <Badge variant="outline" className="ml-1 text-[10px]">
                    {o.status}
                  </Badge>
                </span>
                <span>{formatMoney(o.total_amount)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {hasAnalytics && (
      <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <Card className="p-6 bg-card">
          <h3 className="font-display text-lg font-semibold mb-4">Revenue</h3>
          {dailyLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !hasData ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No served orders in this period — share your QR menu to get started.
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={chartDays} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => String(v).slice(5)}
                  />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(v: number) => formatMoney(v)}
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="var(--gold)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-6 bg-card">
          <h3 className="font-display text-lg font-semibold mb-4">Orders per day</h3>
          {!hasData ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No served orders in this period</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={chartDays} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => String(v).slice(5)}
                  />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="orders" radius={[4, 4, 0, 0]} fill="var(--gold)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-6 bg-card">
        <h3 className="font-display text-lg font-semibold mb-4">Peak hours</h3>
        {!peakMatrix.length || peakMatrix.every((c) => c.count === 0) ? (
          <p className="text-sm text-muted-foreground">No data for heatmap</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: "repeat(25, 1fr)" }}>
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="text-[9px] text-center text-muted-foreground">
                  {h}
                </div>
              ))}
              {DAY_LABELS.map((label, day) => [
                <div key={`l-${day}`} className="text-[10px] pr-2 text-muted-foreground">
                  {label}
                </div>,
                ...Array.from({ length: 24 }, (_, hour) => {
                  const cell = peakMatrix.find((c) => c.day === day && c.hour === hour);
                  const alpha = cell?.intensity ?? 0;
                  return (
                    <div
                      key={`${day}-${hour}`}
                      title={`${cell?.count ?? 0} orders`}
                      className="h-4 w-4 rounded-sm"
                      style={{
                        backgroundColor: `color-mix(in oklch, var(--gold) ${Math.round(alpha * 100)}%, transparent)`,
                      }}
                    />
                  );
                }),
              ])}
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <Card className="p-6 bg-card">
          <h3 className="font-display text-lg font-semibold mb-4">Dine-in vs takeaway</h3>
          {typeChart.every((t) => t.value === 0) ? (
            <p className="text-sm text-muted-foreground">No orders in period</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={typeChart} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>
                    {typeChart.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-0 overflow-hidden bg-card">
          <div className="p-6 pb-3">
            <h3 className="font-display text-lg font-semibold">Top items</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(topItems?.items.length ? topItems.items : []).map((item) => (
                <TableRow key={item.name}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right">{item.qty}</TableCell>
                  <TableCell className="text-right">{formatMoney(item.revenue)}</TableCell>
                </TableRow>
              ))}
              {!topItems?.items.length && (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    No served items yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Card className="mt-6 p-0 overflow-hidden bg-card">
        <div className="p-6 pb-3">
          <h3 className="font-display text-lg font-semibold">Category performance</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Line items</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(categories?.categories ?? []).map((c) => (
              <TableRow key={c.category_id}>
                <TableCell>{c.name}</TableCell>
                <TableCell className="text-right">{c.orders}</TableCell>
                <TableCell className="text-right">{formatMoney(c.revenue)}</TableCell>
              </TableRow>
            ))}
            {!categories?.categories.length && (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  No category data in this period
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      </>
      )}
    </>
  );
}
