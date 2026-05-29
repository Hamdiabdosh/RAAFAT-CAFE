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

export const BASIC_ENTITLEMENTS: EntitlementsMap = {
  menu_display: true,
  qr_code: true,
  cafe_profile: true,
  customer_ordering: false,
  order_management: false,
  analytics: false,
  staff_accounts: false,
};

export const PRO_ENTITLEMENTS: EntitlementsMap = {
  menu_display: true,
  qr_code: true,
  cafe_profile: true,
  customer_ordering: true,
  order_management: true,
  analytics: true,
  staff_accounts: true,
};

export const BASIC_MARKETING_FEATURES = [
  "Public menu page",
  "QR code",
  "Café profile & hours",
];

export const PRO_MARKETING_FEATURES = [
  "Everything in Basic",
  "Customer ordering",
  "Live order queue",
  "Analytics dashboard",
];

export function defaultEntitlementsForSlug(slug: string): EntitlementsMap {
  if (slug === "pro") return { ...PRO_ENTITLEMENTS };
  return { ...BASIC_ENTITLEMENTS };
}

export function parseEntitlements(json: unknown): EntitlementsMap {
  const base: EntitlementsMap = { ...BASIC_ENTITLEMENTS };
  for (const key of ENTITLEMENT_KEYS) {
    base[key] = false;
  }

  if (json && typeof json === "object" && !Array.isArray(json)) {
    for (const key of ENTITLEMENT_KEYS) {
      const value = (json as Record<string, unknown>)[key];
      if (typeof value === "boolean") {
        base[key] = value;
      }
    }
    return base;
  }

  // Legacy: features array stored entitlement keys
  if (Array.isArray(json)) {
    for (const item of json) {
      if (typeof item === "string" && ENTITLEMENT_KEYS.includes(item as EntitlementKey)) {
        base[item as EntitlementKey] = true;
      }
    }
  }

  return base;
}

export function hasEntitlement(
  entitlements: unknown,
  key: EntitlementKey,
  legacyFeatures?: unknown,
): boolean {
  const parsed = parseEntitlements(entitlements);
  if (parsed[key]) return true;

  if (legacyFeatures) {
    const fromLegacy = parseEntitlements(legacyFeatures);
    return fromLegacy[key];
  }

  return false;
}

export function entitlementsFromPlan(plan: {
  entitlements?: unknown;
  features?: unknown;
  slug?: string;
}): EntitlementsMap {
  const parsed = parseEntitlements(plan.entitlements);
  const hasAny = ENTITLEMENT_KEYS.some((k) => parsed[k]);
  if (hasAny) return parsed;

  const fromFeatures = parseEntitlements(plan.features);
  const hasFromFeatures = ENTITLEMENT_KEYS.some((k) => fromFeatures[k]);
  if (hasFromFeatures) return fromFeatures;

  return plan.slug ? defaultEntitlementsForSlug(plan.slug) : { ...BASIC_ENTITLEMENTS };
}

export function marketingFeaturesFromEntitlements(entitlements: EntitlementsMap): string[] {
  return ENTITLEMENT_KEYS.filter((k) => entitlements[k]).map((k) => ENTITLEMENTS[k].label);
}
