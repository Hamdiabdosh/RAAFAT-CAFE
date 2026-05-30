import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const cols = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Owner sign in", to: "/login" as const },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Create account", to: "/register" as const },
      { label: "Choose a plan", to: "/select-plan" as const },
      { label: "Admin portal", to: "/admin/login" as const },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo size="lg" />
          <p className="text-sm text-muted-foreground max-w-md">
            CaféOS — subscription SaaS for independent cafés. Digital menus, QR ordering, and live
            order management.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 mt-12 max-w-lg mx-auto">
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-sans font-semibold">
                {c.title}
              </h4>
              <ul className="mt-4 space-y-2">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {"to" in l ? (
                      <Link
                        to={l.to}
                        className="text-sm text-foreground/80 hover:text-gold transition-colors"
                      >
                        {l.label}
                      </Link>
                    ) : (
                      <a
                        href={l.href}
                        className="text-sm text-foreground/80 hover:text-gold transition-colors"
                      >
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CaféOS. All rights reserved.
          </p>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
