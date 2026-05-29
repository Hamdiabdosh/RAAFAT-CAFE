import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiGet, setAuthHeader } from "@/lib/api";
import type { EntitlementsMap } from "@/lib/entitlements";

export type OwnerSession = {
  id: string;
  email: string;
  full_name: string;
  email_verified: boolean;
  status: string;
  cafe_id: string | null;
  selected_plan: string | null;
  selected_billing_interval: string | null;
  subscription_status: string;
};

export type SubscriptionInfo = {
  id: string;
  status: string;
  plan: {
    id: string;
    name: string;
    slug: string;
    price_monthly: number;
    price_yearly: number | null;
    entitlements: EntitlementsMap;
    features: string[];
  };
  starts_at: string | null;
  expires_at: string | null;
} | null;

type AuthState = {
  token: string | null;
  owner: OwnerSession | null;
  subscription: SubscriptionInfo;
  impersonating: boolean;
  impersonationCafeName: string | null;
  setSession: (token: string, owner: OwnerSession) => void;
  setImpersonation: (token: string, owner: OwnerSession, cafeName: string) => void;
  clearSession: () => void;
  refreshMe: () => Promise<void>;
  isAuthenticated: () => boolean;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      owner: null,
      subscription: null,
      impersonating: false,
      impersonationCafeName: null,

      setSession: (token, owner) => {
        setAuthHeader(token);
        set({ token, owner, impersonating: false, impersonationCafeName: null });
      },

      setImpersonation: (token, owner, cafeName) => {
        setAuthHeader(token);
        set({ token, owner, impersonating: true, impersonationCafeName: cafeName });
      },

      clearSession: () => {
        setAuthHeader(null);
        set({
          token: null,
          owner: null,
          subscription: null,
          impersonating: false,
          impersonationCafeName: null,
        });
      },

      refreshMe: async () => {
        const token = get().token;
        if (!token) return;
        setAuthHeader(token);
        const me = await apiGet<{
          owner: OwnerSession;
          subscription: SubscriptionInfo;
        }>("/api/auth/me");
        set({ owner: me.owner, subscription: me.subscription });
      },

      isAuthenticated: () => Boolean(get().token && get().owner),
    }),
    {
      name: "cafeos-auth",
      partialize: (s) => ({
        token: s.token,
        owner: s.owner,
        subscription: s.subscription,
        impersonating: s.impersonating,
        impersonationCafeName: s.impersonationCafeName,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setAuthHeader(state.token);
      },
    },
  ),
);
