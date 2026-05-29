import { cn } from "@/lib/utils";

const map = {
  active: "bg-[color-mix(in_oklab,var(--success)_15%,transparent)] text-success",
  pending: "bg-gold-dim text-gold",
  paused: "bg-muted text-muted-foreground",
  error: "bg-[color-mix(in_oklab,var(--danger)_15%,transparent)] text-danger",
} as const;

export function StatusPill({ status }: { status: keyof typeof map }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize", map[status])}>
      {status}
    </span>
  );
}