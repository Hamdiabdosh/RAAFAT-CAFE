import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronDown,
  Smartphone,
  Moon,
  Palette,
  BarChart3,
  Lock,
  Settings,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: Index,
});

const features = [
  { icon: Smartphone, title: "Fully Responsive", desc: "Pixel-perfect across phones, tablets, laptops, desktops, and 4K displays." },
  { icon: Moon, title: "Dark / Light Mode", desc: "System-aware theme with a one-click toggle that remembers your preference." },
  { icon: Palette, title: "Brand System", desc: "Gold-on-black design tokens, Cinzel display, DM Sans body — calibrated." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "KPI cards, charts, sortable tables, and an activity feed ready to wire." },
  { icon: Lock, title: "Auth Pages", desc: "Login, register, and password reset flows with social provider stubs." },
  { icon: Settings, title: "Settings System", desc: "Profile, notifications, security, billing, and a danger zone tab." },
];

const stats = [
  { value: "14+", label: "Pages" },
  { value: "100%", label: "Responsive" },
  { value: "Dark+Light", label: "Themes" },
  { value: "1", label: "Strong Brand" },
];

const testimonials = [
  { initials: "AM", name: "Ada Morrison", role: "Design Lead, Northwind", quote: "Felt like our brand from the first commit. The gold + black system is restrained and confident." },
  { initials: "JK", name: "Jonas Kessler", role: "CTO, Pylon", quote: "We replaced three internal libraries with this template. Saved us a full sprint of plumbing." },
  { initials: "SR", name: "Saira Rahman", role: "Founder, Caelum", quote: "It just feels premium. Light mode is as polished as the dark one, which is rare." },
];

function Index() {
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
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" />
            Now Available — v2.0
          </span>

          <h1
            className="mt-6 font-display font-bold leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(32px, 6vw, 72px)" }}
          >
            Build <span className="text-gold">Digital</span> Experiences<br className="hidden sm:block" /> That Matter
          </h1>

          <p className="mt-6 text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            A premium React template for portfolios, SaaS, and dashboards — branded gold and black, dark and light, ready to ship.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="font-medium">
              <Link to="/register">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/dashboard">View Dashboard</Link>
            </Button>
          </div>
        </div>

        <a href="#features" className="absolute bottom-8 inset-x-0 flex justify-center text-muted-foreground" aria-label="Scroll to features">
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </a>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">What's Included</p>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold">Everything you need</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            A complete starting point — every screen, every state, every breakpoint.
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

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display font-bold text-gold text-3xl sm:text-4xl">{s.value}</p>
                <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="about" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">Testimonials</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold">Trusted by builders</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <Card key={t.name} className="p-6 bg-card">
              <p className="text-sm text-foreground/90 leading-relaxed">"{t.quote}"</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gold-dim border border-gold-soft flex items-center justify-center text-gold font-display text-sm">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-24">
        <div className="rounded-2xl border border-gold-soft bg-gold-dim p-10 sm:p-14 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">Ship your next idea today</h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Skip the plumbing. Start with a brand system, every layout, and every flow already in place.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/register">
              Create your account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
