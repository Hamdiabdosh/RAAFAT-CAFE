import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  to?: "/" | "/admin";
};

export function Logo({ className, size = "md", to = "/" }: LogoProps) {
  const sizeCls = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-lg";
  return (
    <Link
      to={to}
      className={cn("font-display font-bold tracking-wider select-none", sizeCls, className)}
      aria-label="RAAFAT-Cafe home"
    >
      <span className="text-gold">RAAFAT</span>
      <span className="text-muted-foreground mx-0.5">-</span>
      <span className="text-gold">Cafe</span>
    </Link>
  );
}