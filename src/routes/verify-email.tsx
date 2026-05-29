import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resendVerification } from "@/lib/auth-api";
import { getApiErrorMessage } from "@/lib/api";
import { redirectIfOwnerAuthenticated } from "@/lib/route-guards";

const searchSchema = z.object({
  email: z.string().email().optional(),
});

export const Route = createFileRoute("/verify-email")({
  validateSearch: searchSchema,
  beforeLoad: () => redirectIfOwnerAuthenticated(),
  head: () => ({ meta: [{ title: "Verify email — CaféOS" }] }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email: initialEmail } = useSearch({ from: "/verify-email" });
  const [email, setEmail] = useState(initialEmail ?? "");
  const [loading, setLoading] = useState(false);

  const onResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resendVerification(email);
      toast.success("If an account exists, a verification email was sent.");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Check your inbox"
      subtitle="We sent a verification link to your email. Click it to continue."
      footer={
        <Link to="/login" className="text-gold hover:underline">
          Back to sign in
        </Link>
      }
    >
      <div className="flex flex-col items-center text-center py-2">
        <div className="h-14 w-14 rounded-full bg-gold-dim border border-gold-soft flex items-center justify-center text-gold">
          <Mail className="h-6 w-6" />
        </div>
        <p className="mt-5 text-sm text-muted-foreground">
          Didn&apos;t receive it? Enter your email to resend.
        </p>
      </div>
      <form className="mt-4 space-y-4" onSubmit={onResend}>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@cafe.com"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending…" : "Resend verification email"}
        </Button>
      </form>
    </AuthLayout>
  );
}
