import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiErrorMessage } from "@/lib/api";
import {
  downloadAnalyticsExport,
  fetchAnalyticsSummary,
  fetchDailyAnalytics,
  fetchOrderTypeSplit,
  fetchTopItems,
  type AnalyticsRange,
  type RangeParams,
} from "@/lib/analytics-api";
import { formatMoney } from "@/lib/public-api";
import { requireEntitlement } from "@/lib/route-guards";

export const Route = createFileRoute("/dashboard/analytics")({
  beforeLoad: () => requireEntitlement("analytics"),
  head: () => ({ meta: [{ title: "Analytics — CaféOS" }] }),
  component: AnalyticsPage,
});

const RANGES: { id: AnalyticsRange; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7days", label: "7 days" },
  { id: "30days", label: "30 days" },
  { id: "this_month", label: "This month" },
];

function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>("7days");

  const params: RangeParams = useMemo(() => ({ range }), [range]);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: fetchAnalyticsSummary,
    refetchInterval: 5 * 60_000,
  });

  const { data: daily, isLoading: dailyLoading } = useQuery({
    queryKey: ["analytics-daily", params],
    queryFn: () => fetchDailyAnalytics(params),
  });

  const { data: topItems, isLoading: topItemsLoading } = useQuery({
    queryKey: ["analytics-top", params],
    queryFn: () => fetchTopItems(params),
  });

  const { data: orderTypes, isLoading: orderTypesLoading } = useQuery({
    queryKey: ["analytics-order-types", params],
    queryFn: () => fetchOrderTypeSplit(params),
  });

  const chartDays = daily?.days ?? [];
  const hasChartData = chartDays.some((d) => d.orders > 0 || d.revenue > 0);
  const topTen = (topItems?.items ?? []).slice(0, 10);
  const isLoading = summaryLoading || dailyLoading || topItemsLoading || orderTypesLoading;

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Revenue, orders, and menu performance"
        actions={
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
            Export CSV
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <Button
            key={r.id}
            size="sm"
            variant={range === r.id ? "default" : "outline"}
            onClick={() => setRange(r.id)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-normal text-muted-foreground">
              Today&apos;s revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {summary ? formatMoney(summary.today_revenue) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-normal text-muted-foreground">
              Today&apos;s orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {summary ? summary.today_orders : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-normal text-muted-foreground">
              Month revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {summary ? formatMoney(summary.month_revenue) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-normal text-muted-foreground">
              Month orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {summary ? summary.month_orders : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {!isLoading && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-display text-lg">Revenue & orders</CardTitle>
            </CardHeader>
            <CardContent>
              {!hasChartData ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No served orders in this period — share your QR menu to get started.
                </p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartDays} margin={{ left: 0, right: 8 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="var(--muted-foreground)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => String(v).slice(5)}
                      />
                      <YAxis
                        yAxisId="left"
                        stroke="var(--gold)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => formatMoney(Number(v))}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="var(--info)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(value: number, name: string) =>
                          name === "Revenue" ? formatMoney(value) : value
                        }
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="var(--gold)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="orders"
                        name="Orders"
                        stroke="var(--info)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="font-display text-lg">Top items</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item name</TableHead>
                      <TableHead className="text-right">Qty sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topTen.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">{item.qty}</TableCell>
                        <TableCell className="text-right">
                          {formatMoney(item.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {topTen.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-muted-foreground">
                          No served items in this period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-normal text-muted-foreground">
                    Dine-in
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {orderTypes ? `${orderTypes.dine_in.pct}%` : "—"}
                  </p>
                  {orderTypes && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {orderTypes.dine_in.count} orders
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-normal text-muted-foreground">
                    Takeaway
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {orderTypes ? `${orderTypes.takeaway.pct}%` : "—"}
                  </p>
                  {orderTypes && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {orderTypes.takeaway.count} orders
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
