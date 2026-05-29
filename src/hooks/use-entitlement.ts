import { useAuthStore } from "@/stores/auth-store";
import {
  type EntitlementKey,
  type EntitlementsMap,
  hasEntitlementKey,
} from "@/lib/entitlements";

export function useEntitlements(): EntitlementsMap | undefined {
  return useAuthStore((s) => s.subscription?.plan.entitlements);
}

export function useEntitlement(key: EntitlementKey): boolean {
  const entitlements = useEntitlements();
  return hasEntitlementKey(entitlements, key);
}
