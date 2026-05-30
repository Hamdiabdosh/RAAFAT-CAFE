import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/#features", label: "Features" },
  { to: "/#how-it-works", label: "How it works" },
  { to: "/#pricing", label: "Pricing" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-[100] h-14 border-b transition-colors duration-200",
        scrolled
          ? "bg-background/85 backdrop-blur-xl border-border"
          : "bg-background/40 backdrop-blur-md border-transparent",
      )}
    >
      <div className="mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Logo />

        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.to}
              href={l.to}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild variant="default" size="sm" className="hidden sm:inline-flex">
            <Link to="/register">Start free</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="px-4 py-4 flex flex-col gap-3">
            {links.map((l) => (
              <a
                key={l.to}
                href={l.to}
                onClick={() => setOpen(false)}
                className="text-sm text-foreground py-1"
              >
                {l.label}
              </a>
            ))}
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link to="/login" onClick={() => setOpen(false)}>
                Sign in
              </Link>
            </Button>
            <Button asChild variant="default" size="sm">
              <Link to="/register" onClick={() => setOpen(false)}>
                Start free
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
