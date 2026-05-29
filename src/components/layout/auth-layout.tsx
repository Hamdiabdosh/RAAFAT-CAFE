import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function AuthLayout({ title, subtitle, children, footer }: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden bg-background">
      <div className="absolute left-0 top-1/4 -z-0" aria-hidden>
        <div className="h-[500px] w-[500px] gold-glow rounded-full opacity-60" />
      </div>
      <div className="absolute top-4 right-4 z-10"><ThemeToggle /></div>
      <Logo size="md" className="absolute top-4 left-4 z-10" />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl font-bold">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}