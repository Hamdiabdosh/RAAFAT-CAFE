import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { fetchOrderHistory } from "@/lib/orders-api";
import { formatMoney } from "@/lib/public-api";

export const Route = createFileRoute("/dashboard/orders/history")({
  head: () => ({ meta: [{ title: "Order history — CaféOS" }] }),
  component: OrderHistoryPage,
});

function OrderHistoryPage() {
  const [page, setPage] = useState(1);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["orders-history", page, start, end, orderNumber],
    queryFn: () =>
      fetchOrderHistory({
        page,
        limit: 20,
        ...(start ? { start } : {}),
        ...(end ? { end } : {}),
        ...(orderNumber ? { order_number: Number(orderNumber) } : {}),
      }),
  });

  return (
    <div>
      <PageHeader
        title="Order history"
        subtitle="Served and cancelled orders"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard/orders">Live queue</Link>
          </Button>
        }
      />

      <Card className="mb-6 p-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <Label htmlFor="start">From</Label>
            <Input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="end">To</Label>
            <Input id="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="num">Order # (today)</Label>
            <Input
              id="num"
              type="number"
              min={1}
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setStart("");
                setEnd("");
                setOrderNumber("");
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          </div>
        </div>
      </Card>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      <div className="space-y-3">
        {data?.orders.map((order) => (
          <Card key={order.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold">#{order.daily_number}</span>
                <Badge className="ml-2" variant={order.status === "cancelled" ? "destructive" : "secondary"}>
                  {order.status}
                </Badge>
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleString()} ·{" "}
                  {order.type === "dine_in" ? `Table ${order.table_number}` : "Takeaway"}
                </p>
              </div>
              <span className="font-semibold">{formatMoney(order.total_amount)}</span>
            </div>
            <ul className="mt-2 text-sm text-muted-foreground">
              {order.items.map((i) => (
                <li key={i.id}>
                  {i.quantity}× {i.item_name}
                </li>
              ))}
            </ul>
          </Card>
        ))}
        {!isLoading && data?.orders.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">No orders match your filters</Card>
        )}
      </div>

      {data && data.pages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">
            Page {data.page} of {data.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
