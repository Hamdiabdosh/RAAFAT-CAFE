import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  ClipboardList,
  MonitorSmartphone,
  QrCode,
  SlidersHorizontal,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CaféOS — Your café, fully digital" },
      {
        name: "description",
        content:
          "Give your customers a QR menu. Manage orders live. Understand your sales. Built for Ethiopian cafés.",
      },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: UtensilsCrossed,
    title: "Digital menu",
    desc: "Always up to date, no printing costs",
  },
  {
    icon: QrCode,
    title: "QR ordering",
    desc: "Customers order from their phone, no app needed",
  },
  {
    icon: ClipboardList,
    title: "Live order queue",
    desc: "Real-time updates the moment a customer places an order",
  },
  {
    icon: SlidersHorizontal,
    title: "Menu customisation",
    desc: "Categories, modifiers, photos, allergen tags",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "See your best sellers and peak hours",
  },
  {
    icon: MonitorSmartphone,
    title: "Works on any device",
    desc: "Phone, tablet, or computer",
  },
];

const steps = [
  {
    title: "Sign up & build your menu",
    desc: "Add your categories, items, and prices in minutes",
  },
  {
    title: "Print your QR code",
    desc: "Customers scan it from any phone to browse and order",
  },
  {
    title: "Manage orders live",
    desc: "Watch orders come in and mark them ready from any device",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="font-semibold text-lg tracking-tight">
            CaféOS
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-muted-foreground">CaféOS</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            Your café, fully digital — in minutes
          </h1>
          <p className="mt-6 text-base text-muted-foreground sm:text-lg">
            Give your customers a QR menu. Manage orders live. Understand your sales. No technical
            knowledge needed.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/register">Get started free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-t border-border bg-muted/30 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">How it works</h2>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="text-center md:text-left">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Features</h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border border-border bg-card p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted">
                  <f.icon className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-border bg-muted/30 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Pricing</h2>
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-lg border border-border bg-card p-8">
              <h3 className="text-xl font-bold">Basic</h3>
              <p className="mt-1 text-sm font-medium text-muted-foreground">Display only</p>
              <p className="mt-4 text-sm text-muted-foreground">
                Menu + QR code, no ordering
              </p>
              <p className="mt-6 text-2xl font-bold">Contact us</p>
              <Button asChild className="mt-8 w-full">
                <Link to="/register">Get started</Link>
              </Button>
            </div>
            <div className="flex flex-col rounded-lg border border-border bg-card p-8">
              <h3 className="text-xl font-bold">Pro</h3>
              <p className="mt-1 text-sm font-medium text-muted-foreground">Full ordering</p>
              <p className="mt-4 text-sm text-muted-foreground">
                Menu + QR + live orders + analytics
              </p>
              <p className="mt-6 text-2xl font-bold">Contact us</p>
              <Button asChild className="mt-8 w-full">
                <Link to="/register">Get started</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-sm text-muted-foreground">
            CaféOS — Built for Ethiopian cafés
          </p>
          <nav className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link to="/login" className="text-foreground hover:underline">
              Login
            </Link>
            <Link to="/register" className="text-foreground hover:underline">
              Register
            </Link>
            <a href="mailto:raafatdigital@gmail.com" className="text-foreground hover:underline">
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
