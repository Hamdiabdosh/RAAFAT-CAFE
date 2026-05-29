import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { endImpersonation, setAdminAuthHeader } from "@/lib/admin-api";
import { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useAdminStore } from "@/stores/admin-store";

export function ImpersonationBanner() {
  const navigate = useNavigate();
  const impersonating = useAuthStore((s) => s.impersonating);
  const cafeName = useAuthStore((s) => s.impersonationCafeName);
  const clearSession = useAuthStore((s) => s.clearSession);
  const adminToken = useAdminStore((s) => s.token);

  if (!impersonating) return null;

  const exit = async () => {
    try {
      await endImpersonation();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
    clearSession();
    if (adminToken) setAdminAuthHeader(adminToken);
    navigate({ to: "/admin/cafes" });
    toast.success("Impersonation ended");
  };

  return (
    <div className="bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-between gap-3 text-sm">
      <span>
        Impersonating <strong>{cafeName ?? "café"}</strong> — changes apply to the owner account
      </span>
      <Button
        variant="secondary"
        size="sm"
        className="shrink-0 h-7"
        onClick={() => void exit()}
      >
        <X className="h-3 w-3 mr-1" />
        Exit
      </Button>
    </div>
  );
}
