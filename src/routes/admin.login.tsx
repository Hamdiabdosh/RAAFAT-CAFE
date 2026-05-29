import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/password-input";
import { adminLogin } from "@/lib/auth-api";
import { getApiErrorMessage } from "@/lib/api";
import { redirectIfAdminAuthenticated } from "@/lib/route-guards";
import { useAdminStore } from "@/stores/admin-store";

export const Route = createFileRoute("/admin/login")({
  beforeLoad: () => redirectIfAdminAuthenticated(),
  head: () => ({ meta: [{ title: "Admin sign in — RAAFAT-Cafe" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const setSession = useAdminStore((s) => s.setSession);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setLoading(true);
    try {
      const { data } = await adminLogin({ email, password });
      setSession(data.access_token, data.admin);
      toast.success("Welcome, admin");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Admin portal"
      subtitle="Platform administration"
      footer={
        <Link to="/" className="text-gold hover:underline">
          Back to site
        </Link>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue="admin@cafeos.local" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" name="password" required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : (
            <>
              Sign in <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
