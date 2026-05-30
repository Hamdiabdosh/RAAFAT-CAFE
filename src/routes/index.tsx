import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  ClipboardList,
  QrCode,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  fetchPublicPlans,
  formatMoneyPerMonth,
  formatMoneyPerYear,
} from "@/lib/public-api";
import { useIsClient } from "@/hooks/use-is-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CaféOS — Digital menus & QR ordering for cafés" },
      {
        name: "description",
        content:
          "Subscription SaaS for independent cafés. Build your menu, share a QR code, and manage live orders from any device.",
      },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: UtensilsCrossed,
    title: "Visual menu builder",
    desc: "Categories, photos, modifiers, and dietary tags — publish when you're ready, no developer needed.",
  },
  {
    icon: QrCode,
    title: "QR code in minutes",
    desc: "Every café gets a unique link and downloadable QR. Customers scan and browse on their phone.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first ordering",
    desc: "Guests build a cart, pick dine-in or takeaway, and track order status live from the same page.",
  },
  {
    icon: ClipboardList,
    title: "Live order queue",
    desc: "Staff see new orders instantly, move them through preparing → ready → served, with sound alerts.",
  },
  {
    icon: BarChart3,
    title: "Sales analytics",
    desc: "Revenue, best sellers, peak hours, and category breakdown — export reports when you need them.",
  },
  {
    icon: Zap,
    title: "Built for small cafés",
    desc: "Self-serve onboarding, simple plans, and an admin team that activates you after payment — no enterprise bloat.",
  },
];

const steps = [
  {
    step: "01",
    title: "Create your café",
    desc: "Register, verify your email, and choose Basic or Pro. We'll activate your subscription after payment.",
  },
  {
    step: "02",
    title: "Build & publish your menu",
    desc: "Add categories and items, set hours, customize your brand colors, then publish with one click.",
  },
  {
    step: "03",
    title: "Share your QR code",
    desc: "Print the QR at tables or the counter. Orders flow straight into your dashboard in real time.",
  },
];

function Index() {
  const isClient = useIsClient();
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ["public", "plans", "landing"],
    queryFn: fetchPublicPlans,
    enabled: isClient,
  });
  const plans = plansData?.plans ?? [];

  return (
    <PublicLayout>
      {/* HERO */}
      <section className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-50" aria-hidden />
        <div className="absolute inset-0 -z-0 flex items-center justify-center" aria-hidden>
          <div className="h-[600px] w-[600px] gold-glow rounded-full" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-soft bg-gold-dim text-gold text-xs font-medium tracking-wide">
            <Sparkles className="h-3.5 w-3.5" />
            CaféOS — for independent cafés
          </span>

          <h1
            className="mt-6 font-display font-bold leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(32px, 6vw, 72px)" }}
          >
            Your menu. Your QR.{" "}
            <span className="text-gold">Live orders.</span>
          </h1>

          <p className="mt-6 text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Replace printed menus and shouted orders with a subscription platform built for small
            café operators — digital menus, QR ordering, and a real-time kitchen queue.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="font-medium">
              <Link to="/register">
                Start free signup
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">Owner sign in</Link>
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Already running a café on CaféOS?{" "}
            <Link to="/login" className="text-gold hover:underline">
              Sign in to your dashboard
            </Link>
          </p>
        </div>

        <a
          href="#features"
          className="absolute bottom-8 inset-x-0 flex justify-center text-muted-foreground"
          aria-label="Scroll to features"
        >
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </a>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">Features</p>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold">
            Everything a modern café needs
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            From menu display on Basic to full ordering and analytics on Pro — one platform, no
            custom code.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <Card
              key={f.title}
              className="relative p-6 bg-card border-border hover:-translate-y-0.5 hover:border-gold-soft transition-all duration-200 group"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gold opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="h-10 w-10 rounded-lg bg-gold-dim border border-gold-soft flex items-center justify-center text-gold">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 border-t border-border">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">How it works</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold">Up and running in three steps</h2>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.step} className="relative text-center md:text-left">
              <span className="font-display text-5xl font-bold text-gold/25">{s.step}</span>
              <h3 className="mt-2 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">Pricing</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold">Simple plans for every café</h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Choose monthly or yearly billing at signup. Your plan is activated by our team after
            payment — no surprise charges.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plansLoading && isClient ? (
            <>
              <Card className="p-8 h-64 animate-pulse bg-muted/30" />
              <Card className="p-8 h-64 animate-pulse bg-muted/30" />
            </>
          ) : plans.length > 0 ? (
            plans.map((plan) => (
              <Card
                key={plan.id}
                className={cn(
                  "p-8 flex flex-col",
                  plan.slug === "pro" && "border-gold-soft bg-gold-dim/30",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
                  {plan.slug === "pro" && (
                    <Badge variant="outline" className="border-gold text-gold">
                      Popular
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-3xl font-display font-bold text-gold">
                  {formatMoneyPerMonth(plan.price_monthly)}
                </p>
                {plan.price_yearly != null && (
                  <p className="text-sm text-muted-foreground">
                    or {formatMoneyPerYear(plan.price_yearly)} billed yearly
                  </p>
                )}
                <ul className="mt-6 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-8 w-full">
                  <Link to="/register">Get started with {plan.name}</Link>
                </Button>
              </Card>
            ))
          ) : (
            <Card className="p-8 md:col-span-2 text-center text-muted-foreground">
              <p>Plans load when the API is running. Start signup to see options in your dashboard.</p>
              <Button asChild className="mt-4">
                <Link to="/register">Create account</Link>
              </Button>
            </Card>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-24">
        <div className="rounded-2xl border border-gold-soft bg-gold-dim p-10 sm:p-14 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">
            Ready to digitize your café?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Join independent owners who use CaféOS for menus, QR ordering, and live order management
            — without hiring a developer.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/register">
                Create your café account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/admin/login">Platform admin</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
