import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "@/components/auth/password-input";
import { loginOwner } from "@/lib/auth-api";
import { getApiErrorMessage } from "@/lib/api";
import { redirectIfOwnerAuthenticated } from "@/lib/route-guards";
import { useAuthStore } from "@/stores/auth-store";

const searchSchema = z.object({
  verified: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  beforeLoad: () => redirectIfOwnerAuthenticated(),
  head: () => ({ meta: [{ title: "Sign in — CaféOS" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { verified } = useSearch({ from: "/login" });
  const setSession = useAuthStore((s) => s.setSession);
  const refreshMe = useAuthStore((s) => s.refreshMe);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (verified === "1") {
      toast.success("Email verified — sign in to continue");
    }
  }, [verified]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setLoading(true);
    try {
      const { data } = await loginOwner({ email, password });
      setSession(data.access_token, data.owner);
      await refreshMe();
      const owner = useAuthStore.getState().owner;
      if (!owner?.selected_plan) {
        navigate({ to: "/select-plan" });
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your café dashboard"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-gold hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@cafe.com" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" name="password" placeholder="••••••••" required />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox id="remember" /> Remember me
          </label>
          <Link to="/forgot-password" className="text-sm text-gold hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : (
            <>
              Sign In <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
