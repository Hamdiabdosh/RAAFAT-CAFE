import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setAuthHeader } from "@/lib/api";

type AdminState = {
  token: string | null;
  admin: { id: string; email: string } | null;
  setSession: (token: string, admin: { id: string; email: string }) => void;
  clearSession: () => void;
};

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      setSession: (token, admin) => {
        setAuthHeader(token);
        set({ token, admin });
      },
      clearSession: () => {
        setAuthHeader(null);
        set({ token: null, admin: null });
      },
    }),
    {
      name: "cafeos-admin",
      partialize: (s) => ({ token: s.token, admin: s.admin }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setAuthHeader(state.token);
      },
    },
  ),
);
