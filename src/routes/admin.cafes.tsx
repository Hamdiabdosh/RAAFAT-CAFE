import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminAuth } from "@/lib/route-guards";

export const Route = createFileRoute("/admin/cafes")({
  beforeLoad: () => requireAdminAuth(),
  component: AdminCafesLayout,
});

function AdminCafesLayout() {
  return (
    <AdminShell activePath="/admin/cafes">
      <Outlet />
    </AdminShell>
  );
}
