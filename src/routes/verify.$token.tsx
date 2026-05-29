import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { verifyEmailToken } from "@/lib/auth-api";
import { getApiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/verify/$token")({
  head: () => ({ meta: [{ title: "Verifying email — CaféOS" }] }),
  component: VerifyTokenPage,
});

function VerifyTokenPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await verifyEmailToken(token);
        if (cancelled) return;
        setState("success");
        setMessage(data.already_verified ? "Email was already verified." : "Email verified successfully.");
        setTimeout(() => {
          navigate({ to: "/login", search: { verified: "1" } });
        }, 2000);
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setMessage(getApiErrorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  return (
    <AuthLayout title="Email verification" subtitle="">
      <div className="flex flex-col items-center text-center py-6">
        {state === "loading" && (
          <>
            <Loader2 className="h-10 w-10 text-gold animate-spin" />
            <p className="mt-4 text-sm text-muted-foreground">Verifying your email…</p>
          </>
        )}
        {state === "success" && (
          <>
            <CheckCircle2 className="h-10 w-10 text-success" />
            <p className="mt-4 text-sm text-foreground">{message}</p>
            <p className="mt-2 text-xs text-muted-foreground">Redirecting to sign in…</p>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="h-10 w-10 text-destructive" />
            <p className="mt-4 text-sm text-destructive">{message}</p>
            <Button asChild className="mt-6">
              <Link to="/verify-email">Request a new link</Link>
            </Button>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
