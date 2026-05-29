import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, UserCog } from "lucide-react";
import { toast } from "sonner";
import { SubscriptionEditor } from "@/components/admin/subscription-editor";
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
import { requireAdminAuth } from "@/lib/route-guards";
import {
  fetchAdminCafeDetail,
  startImpersonation,
  updateCafeAccountStatus,
} from "@/lib/admin-api";
import { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useIsClient } from "@/hooks/use-is-client";

export const Route = createFileRoute("/admin/cafes/$id")({
  beforeLoad: () => requireAdminAuth(),
  head: () => ({ meta: [{ title: "Café detail — Admin" }] }),
  component: AdminCafeDetailPage,
});

function AdminCafeDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isClient = useIsClient();
  const setImpersonation = useAuthStore((s) => s.setImpersonation);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "cafe", id],
    queryFn: () => fetchAdminCafeDetail(id),
    enabled: isClient,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "cafe", id] });
    queryClient.invalidateQueries({ queryKey: ["admin", "cafes"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
  };

  const toggleAccount = useMutation({
    mutationFn: (status: "active" | "suspended") => updateCafeAccountStatus(id, status),
    onSuccess: (_, status) => {
      toast.success(status === "suspended" ? "Account suspended" : "Account reactivated");
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const impersonate = useMutation({
    mutationFn: () => startImpersonation(id),
    onSuccess: (result) => {
      setImpersonation(result.impersonation_token, result.owner, result.cafe_name);
      toast.success(`Viewing as ${result.cafe_name}`);
      navigate({ to: "/dashboard" });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  if (isLoading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Link to="/admin/cafes" className="text-sm text-muted-foreground hover:text-gold">
          ← All cafés
        </Link>
        <p className="text-sm text-destructive">
          {isError ? getApiErrorMessage(error) : "Café not found"}
        </p>
      </div>
    );
  }

  const { cafe, owner, subscription, menu } = data;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/cafes" className="text-sm text-muted-foreground hover:text-gold">
          ← All cafés
        </Link>
        <h1 className="font-display text-2xl mt-2">{cafe.name}</h1>
        <p className="text-sm text-muted-foreground">/menu/{cafe.slug}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="secondary">{owner.status}</Badge>
          <Badge variant="outline">{cafe.status}</Badge>
          {menu && <Badge variant="outline">Menu: {menu.status}</Badge>}
          {subscription && (
            <Badge variant="outline">
              {subscription.plan.name} · {subscription.status}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total orders</p>
          <p className="text-2xl font-bold">{data.order_count}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Served orders</p>
          <p className="text-2xl font-bold">{data.served_order_count}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Staff accounts</p>
          <p className="text-2xl font-bold">{data.staff_count}</p>
        </Card>
      </div>

      <SubscriptionEditor
        cafeId={id}
        ownerSuspended={owner.status === "suspended"}
        subscription={subscription}
        onUpdated={invalidate}
      />

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Owner</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Name</dt>
            <dd>{owner.full_name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{owner.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Verified</dt>
            <dd>{owner.email_verified ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Requested plan</dt>
            <dd className="capitalize">{owner.selected_plan ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Billing interval</dt>
            <dd className="capitalize">{owner.selected_billing_interval ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Address</dt>
            <dd>{cafe.address ?? "—"}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" size="sm" asChild>
            <a href={cafe.menu_url} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              Public menu
            </a>
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={impersonate.isPending || owner.status === "suspended"}
            onClick={() => impersonate.mutate()}
          >
            <UserCog className="h-4 w-4" />
            Impersonate owner
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-2">Account actions</h2>
        {owner.status === "suspended" ? (
          <Button
            variant="outline"
            disabled={toggleAccount.isPending}
            onClick={() => toggleAccount.mutate("active")}
          >
            Reactivate account
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Suspend account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Suspend {cafe.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  The owner cannot log in and the menu will be unpublished. Active orders may still
                  complete.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => toggleAccount.mutate("suspended")}>
                  Suspend
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </Card>
    </div>
  );
}
