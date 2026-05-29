import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchAdminCafes } from "@/lib/admin-api";
import { useIsClient } from "@/hooks/use-is-client";

export const Route = createFileRoute("/admin/cafes/")({
  head: () => ({ meta: [{ title: "Cafés — Admin — CaféOS" }] }),
  component: AdminCafesListPage,
});

function AdminCafesListPage() {
  const isClient = useIsClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "cafes", search],
    queryFn: () => fetchAdminCafes({ search: search.length >= 2 ? search : undefined }),
    enabled: isClient,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Cafés</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Open a café to activate or change its subscription, suspend accounts, or impersonate owners.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, slug, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="space-y-3">
        {data?.cafes.map((cafe) => (
          <Card key={cafe.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <h2 className="font-medium">{cafe.name}</h2>
              <p className="text-sm text-muted-foreground">
                /menu/{cafe.slug} · {cafe.owner.email}
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="secondary">{cafe.owner.status}</Badge>
                <Badge variant="outline">
                  {cafe.subscription?.plan ?? "—"} · {cafe.subscription?.status ?? "none"}
                </Badge>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link to="/admin/cafes/$id" params={{ id: cafe.id }}>
                Manage
              </Link>
            </Button>
          </Card>
        ))}
      </div>

      {!isLoading && data?.cafes.length === 0 && (
        <p className="text-sm text-muted-foreground">No cafés found.</p>
      )}
    </div>
  );
}
