import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  delta,
  positive = true,
}: {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
}) {
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className="relative p-5 bg-card border-border overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-0.5 bg-gold" />
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-gold">{value}</p>
      {delta && (
        <p
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-xs",
            positive ? "text-success" : "text-danger",
          )}
        >
          <Icon className="h-3 w-3" /> {delta}
        </p>
      )}
    </Card>
  );
}