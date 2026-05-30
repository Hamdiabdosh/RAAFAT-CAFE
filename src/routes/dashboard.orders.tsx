import { createFileRoute, Link } from "@tanstack/react-router";
import { requireEntitlement } from "@/lib/route-guards";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api";
import {
  cancelOrder,
  fetchLiveOrders,
  fetchTodaySummary,
  updateOrderStatus,
  type LiveOrder,
} from "@/lib/orders-api";
import { fetchCafeProfile } from "@/lib/cafe-api";
import { formatMoney } from "@/lib/public-api";
import { getSocket, joinCafeRoom, leaveCafeRoom } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth-store";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/dashboard/orders")({
  beforeLoad: () => requireEntitlement("order_management"),
  head: () => ({ meta: [{ title: "Live orders — CaféOS" }] }),
  component: LiveOrdersPage,
});

const NEXT_STATUS: Record<string, "preparing" | "ready" | "served" | null> = {
  new: "preparing",
  preparing: "ready",
  ready: "served",
};

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
};

const STATUS_BADGE: Record<string, string> = {
  new: "border-red-500 text-red-400 bg-red-500/10",
  preparing: "border-amber-500 text-amber-400 bg-amber-500/10",
  ready: "border-green-500 text-green-400 bg-green-500/10",
};

const STATUS_CARD: Record<string, string> = {
  new: "border-l-4 border-l-red-500 bg-red-500/5",
  preparing: "border-l-4 border-l-amber-500 bg-amber-500/5",
  ready: "border-l-4 border-l-green-500 bg-green-500/5",
};

function useElapsed(createdAt: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const mins = Math.floor((now - new Date(createdAt).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  return `${mins} min ago`;
}

function ElapsedBadge({ createdAt }: { createdAt: string }) {
  const elapsed = useElapsed(createdAt);
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000);
  const color =
    mins >= 25 ? "text-red-400" :
    mins >= 15 ? "text-amber-400" :
    "text-muted-foreground";
  return <span className={`text-sm ${color}`}>{elapsed}</span>;
}

function LiveOrdersPage() {
  const queryClient = useQueryClient();
  const cafeId = useAuthStore((s) => s.owner?.cafe_id);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "preparing" | "ready">("all");
  const playedRef = useRef<Set<string>>(new Set());

  const { data: cafe } = useQuery({
    queryKey: ["cafe-profile"],
    queryFn: fetchCafeProfile,
  });

  const { data: summary } = useQuery({
    queryKey: ["orders-summary"],
    queryFn: fetchTodaySummary,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["orders-live"],
    queryFn: fetchLiveOrders,
    refetchInterval: 15_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["orders-live"] });
    queryClient.invalidateQueries({ queryKey: ["orders-summary"] });
  };

  useEffect(() => {
    const id = cafe?.id ?? cafeId;
    if (!id) return;
    joinCafeRoom(id);
    const socket = getSocket();
    const onNew = (order: LiveOrder) => {
      if (!playedRef.current.has(order.id)) {
        playedRef.current.add(order.id);
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } catch {
          /* audio optional */
        }
        toast.info(`New order #${order.daily_number}`);
      }
      invalidate();
    };
    const onUpdated = () => invalidate();
    socket.on("order:new", onNew);
    socket.on("order:updated", onUpdated);
    return () => {
      socket.off("order:new", onNew);
      socket.off("order:updated", onUpdated);
      leaveCafeRoom(id);
    };
  }, [cafe?.id, cafeId]);

  const advance = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "preparing" | "ready" | "served" }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      invalidate();
      toast.success("Order updated");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const cancel = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelOrder(id, reason),
    onSuccess: () => {
      setCancelId(null);
      setCancelReason("");
      invalidate();
      toast.success("Order cancelled");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const orders = useMemo(() => {
    const list = data?.orders ?? [];
    if (statusFilter === "all") return list;
    return list.filter((o) => o.status === statusFilter);
  }, [data?.orders, statusFilter]);

  const filters: Array<{ id: typeof statusFilter; label: string }> = [
    { id: "all", label: "All" },
    { id: "new", label: "New" },
    { id: "preparing", label: "Preparing" },
    { id: "ready", label: "Ready" },
  ];

  return (
    <div>
      <PageHeader
        title="Live orders"
        subtitle="Newest first — updates in real time"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard/orders/history">History</Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={statusFilter === f.id ? "default" : "outline"}
            onClick={() => setStatusFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {summary && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Today&apos;s orders</p>
            <p className="text-2xl font-bold">{summary.total_orders}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Revenue (served)</p>
            <p className="text-2xl font-bold">{formatMoney(summary.total_revenue)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">In queue</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </Card>
        </div>
      )}

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {!isLoading && orders.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          No active orders — new orders will appear here instantly.
        </Card>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const next = NEXT_STATUS[order.status];
          const cardClass = `p-4 relative ${STATUS_CARD[order.status] ?? ""}`;
          const cardContent = (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="text-lg font-bold">#{order.daily_number}</span>
                  <Badge
                    className={`ml-2 ${STATUS_BADGE[order.status] ?? ""}`}
                    variant="outline"
                  >
                    {STATUS_LABEL[order.status] ?? order.status}
                  </Badge>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.type === "dine_in"
                      ? `Dine in · Table ${order.table_number}`
                      : "Takeaway"}
                    {" · "}
                    <ElapsedBadge createdAt={order.created_at} />
                  </p>
                </div>
                <span className="font-semibold">{formatMoney(order.total_amount)}</span>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity}× {item.item_name}
                    {item.modifiers.length > 0 && (
                      <span className="text-muted-foreground">
                        {" "}
                        ({item.modifiers.map((m) => m.option_name).join(", ")})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {order.note && (
                <p className="mt-2 text-sm italic text-muted-foreground">Note: {order.note}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {next && (
                  <Button
                    size="sm"
                    onClick={() => advance.mutate({ id: order.id, status: next })}
                    disabled={advance.isPending}
                  >
                    Mark {STATUS_LABEL[next] ?? next}
                  </Button>
                )}
                <AlertDialog
                  open={cancelId === order.id}
                  onOpenChange={(o) => {
                    if (!o) setCancelId(null);
                  }}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCancelId(order.id)}
                    >
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel order #{order.daily_number}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This cannot be undone. Provide a reason for your records.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div>
                      <Label htmlFor="reason">Reason</Label>
                      <Input
                        id="reason"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep order</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={cancelReason.trim().length < 3 || cancel.isPending}
                        onClick={() =>
                          cancel.mutate({ id: order.id, reason: cancelReason.trim() })
                        }
                      >
                        Cancel order
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          );
          if (order.status === "new") {
            return (
              <div key={order.id} className="relative">
                <div className="absolute -inset-0.5 rounded-xl bg-red-500/20 animate-pulse" />
                <Card className={cardClass}>{cardContent}</Card>
              </div>
            );
          }
          return (
            <Card key={order.id} className={cardClass}>
              {cardContent}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
