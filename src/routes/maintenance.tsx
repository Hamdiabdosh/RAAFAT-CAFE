import { createFileRoute, Link } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance — RAAFAT-Cafe" }] }),
  component: () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <Logo size="lg" />
      <Wrench className="h-12 w-12 text-gold mt-10 animate-spin" style={{ animationDuration: "4s" }} />
      <h1 className="mt-6 font-display text-3xl sm:text-4xl font-bold">We'll be right back</h1>
      <p className="mt-3 text-muted-foreground max-w-md">We're performing some maintenance. Check back in a few minutes.</p>
      <Button asChild className="mt-8" variant="outline"><Link to="/">Refresh</Link></Button>
    </div>
  ),
});