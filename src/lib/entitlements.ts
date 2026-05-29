export const ENTITLEMENTS = {
  menu_display: { label: "Public menu page", group: "core" as const },
  qr_code: { label: "QR code", group: "core" as const },
  cafe_profile: { label: "Café profile & hours", group: "core" as const },
  customer_ordering: { label: "Customer ordering", group: "pro" as const },
  order_management: { label: "Live order queue", group: "pro" as const },
  analytics: { label: "Analytics dashboard", group: "pro" as const },
  staff_accounts: { label: "Staff accounts", group: "pro" as const },
} as const;

export type EntitlementKey = keyof typeof ENTITLEMENTS;

export const ENTITLEMENT_KEYS = Object.keys(ENTITLEMENTS) as EntitlementKey[];

export type EntitlementsMap = Record<EntitlementKey, boolean>;

export function hasEntitlementKey(
  entitlements: Partial<EntitlementsMap> | undefined,
  key: EntitlementKey,
): boolean {
  return Boolean(entitlements?.[key]);
}
