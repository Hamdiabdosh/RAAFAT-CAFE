import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { fetchOrderStatus, formatMoney } from "@/lib/public-api";
import { joinOrderRoom, leaveOrderRoom, getSocket } from "@/lib/socket";

export const Route = createFileRoute("/menu/$slug/order/$token")({
  head: () => ({ meta: [{ title: "Order status — CaféOS" }] }),
  component: OrderStatusPage,
});

const STATUS_LABELS: Record<string, string> = {
  new: "Received",
  preparing: "Preparing",
  ready: "Ready for pickup",
  served: "Served",
  cancelled: "Cancelled",
};

const STATUS_STEPS = ["new", "preparing", "ready", "served"] as const;

function OrderStatusPage() {
  const { slug, token } = Route.useParams();

  const { data: order, refetch } = useQuery({
    queryKey: ["order-status", token],
    queryFn: () => fetchOrderStatus(token),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    joinOrderRoom(token);
    const socket = getSocket();
    const onUpdate = () => refetch();
    socket.on("order:updated", onUpdate);
    socket.on("order:new", onUpdate);
    return () => {
      socket.off("order:updated", onUpdate);
      socket.off("order:new", onUpdate);
      leaveOrderRoom(token);
    };
  }, [token, refetch]);

  if (!order) {
    return (
      <CustomerLayout>
        <div className="flex min-h-svh items-center justify-center text-muted-foreground">
          Loading order…
        </div>
      </CustomerLayout>
    );
  }

  const stepIndex = STATUS_STEPS.indexOf(order.status as (typeof STATUS_STEPS)[number]);

  return (
    <CustomerLayout>
      <div className="mx-auto max-w-lg px-4 py-8">
        <Link to="/menu/$slug" params={{ slug }} className="text-sm text-muted-foreground hover:underline">
          ← Back to menu
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Order #{order.daily_number}</h1>
        <Badge className="mt-2" variant={order.status === "cancelled" ? "destructive" : "default"}>
          {STATUS_LABELS[order.status] ?? order.status}
        </Badge>

        {order.status !== "cancelled" && (
          <div className="mt-8 flex justify-between gap-2">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    stepIndex >= i ? "bg-primary" : "bg-muted"
                  }`}
                />
                <span className="text-center text-[10px] text-muted-foreground">
                  {STATUS_LABELS[step]}
                </span>
              </div>
            ))}
          </div>
        )}

        <Card className="mt-8 p-4">
          <p className="text-sm text-muted-foreground">
            {order.type === "dine_in" ? `Table ${order.table_number}` : "Takeaway"}
          </p>
          {order.note && <p className="mt-1 text-sm italic">&ldquo;{order.note}&rdquo;</p>}
          <ul className="mt-4 space-y-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity}× {item.item_name}
                  {item.modifiers.length > 0 && (
                    <span className="block text-xs text-muted-foreground">
                      {item.modifiers.map((m) => m.option_name).join(", ")}
                    </span>
                  )}
                </span>
                <span>{formatMoney(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t pt-3 font-semibold">
            <span>Total</span>
            <span>{formatMoney(order.total_amount)}</span>
          </div>
        </Card>
      </div>
    </CustomerLayout>
  );
}
