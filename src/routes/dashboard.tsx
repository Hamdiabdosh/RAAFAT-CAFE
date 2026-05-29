import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { ensureOwnerSession } from "@/lib/route-guards";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ location }) => {
    await ensureOwnerSession();
    const owner = useAuthStore.getState().owner;
    if (!owner?.selected_plan && location.pathname !== "/select-plan") {
      throw redirect({ to: "/select-plan" });
    }
  },
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});
