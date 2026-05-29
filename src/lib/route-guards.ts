import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { useAdminStore } from "@/stores/admin-store";
import { type EntitlementKey, hasEntitlementKey } from "@/lib/entitlements";

/** Wait for zustand persist (localStorage) before reading auth on the client. */
async function waitForStoreHydration(hasHydrated: () => boolean, onFinish: (cb: () => void) => () => void) {
  if (hasHydrated()) return;
  await new Promise<void>((resolve) => {
    const unsub = onFinish(() => {
      unsub();
      resolve();
    });
  });
}

export async function requireOwnerAuth() {
  if (typeof window === "undefined") return;

  await waitForStoreHydration(
    () => useAuthStore.persist.hasHydrated(),
    (cb) => useAuthStore.persist.onFinishHydration(cb),
  );

  const { token, owner } = useAuthStore.getState();
  if (!token || !owner) {
    throw redirect({ to: "/login" });
  }
}

export async function ensureOwnerSession() {
  await requireOwnerAuth();
  await useAuthStore.getState().refreshMe();
}

export async function requireEntitlement(key: EntitlementKey) {
  await ensureOwnerSession();
  const entitlements = useAuthStore.getState().subscription?.plan.entitlements;
  if (!hasEntitlementKey(entitlements, key)) {
    throw redirect({ to: "/dashboard/billing" });
  }
}

export async function requireAdminAuth() {
  if (typeof window === "undefined") return;

  await waitForStoreHydration(
    () => useAdminStore.persist.hasHydrated(),
    (cb) => useAdminStore.persist.onFinishHydration(cb),
  );

  const { token } = useAdminStore.getState();
  if (!token) {
    throw redirect({ to: "/admin/login" });
  }
}

export async function redirectIfOwnerAuthenticated() {
  if (typeof window === "undefined") return;

  await waitForStoreHydration(
    () => useAuthStore.persist.hasHydrated(),
    (cb) => useAuthStore.persist.onFinishHydration(cb),
  );

  const { token, owner } = useAuthStore.getState();
  if (token && owner) {
    throw redirect({ to: "/dashboard" });
  }
}

export async function redirectIfAdminAuthenticated() {
  if (typeof window === "undefined") return;

  await waitForStoreHydration(
    () => useAdminStore.persist.hasHydrated(),
    (cb) => useAdminStore.persist.onFinishHydration(cb),
  );

  const { token } = useAdminStore.getState();
  if (token) {
    throw redirect({ to: "/admin" });
  }
}
