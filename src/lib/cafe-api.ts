import { api, apiGet, apiPatch, apiPost } from "@/lib/api";

export type CafeProfile = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  primary_color: string;
  bg_color: string;
  status: "open" | "closed";
  profile_complete: boolean;
  timezone: string;
  menu_url: string;
  hours?: Array<{
    day_of_week: number;
    is_closed: boolean;
    open_time: string | null;
    close_time: string | null;
  }>;
};

export async function fetchCafeProfile() {
  return apiGet<CafeProfile>("/api/cafe/profile");
}

export async function updateCafeProfile(body: {
  name?: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  timezone?: string;
}) {
  return apiPatch<CafeProfile>("/api/cafe/profile", body);
}

export async function uploadCafeLogo(file: File) {
  const form = new FormData();
  form.append("logo", file);
  const { data } = await api.post<{ success: true; data: CafeProfile }>(
    "/api/cafe/profile/logo",
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data.data;
}

export async function updateCafeHours(
  hours: Array<{
    day_of_week: number;
    is_closed: boolean;
    open_time?: string | null;
    close_time?: string | null;
  }>,
) {
  return apiPatch<{ hours: CafeProfile["hours"] }>("/api/cafe/hours", { hours });
}

export async function updateCafeStatus(status: "open" | "closed") {
  return apiPatch<{ status: "open" | "closed" }>("/api/cafe/status", { status });
}

export async function updateCafeTheme(primary_color: string, bg_color: string) {
  return apiPatch<{ primary_color: string; bg_color: string }>("/api/cafe/theme", {
    primary_color,
    bg_color,
  });
}

export async function fetchQrInfo() {
  return apiGet<{ slug: string; menu_url: string; qr_url: string }>("/api/cafe/qr");
}

export async function downloadQr(format: "png" | "pdf", filename: string) {
  const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
  const token = localStorage.getItem("cafeos-auth");
  let authToken: string | null = null;
  if (token) {
    try {
      const parsed = JSON.parse(token) as { state?: { token?: string } };
      authToken = parsed.state?.token ?? null;
    } catch {
      /* ignore */
    }
  }

  const res = await fetch(`${baseURL}/api/cafe/qr/download?format=${format}`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
