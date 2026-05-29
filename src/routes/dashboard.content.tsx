import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/dashboard/status-pill";
import { FileText, Plus } from "lucide-react";

export const Route = createFileRoute("/dashboard/content")({
  head: () => ({ meta: [{ title: "Content — RAAFAT-Cafe" }] }),
  component: ContentPage,
});

const items = [
  { title: "Introducing v2.0", type: "Post", status: "active" as const, author: "Ada Morrison", updated: "2h ago" },
  { title: "Design tokens guide", type: "Doc", status: "pending" as const, author: "Jonas Kessler", updated: "1d ago" },
  { title: "Q4 Release Notes", type: "Post", status: "active" as const, author: "Saira Rahman", updated: "3d ago" },
  { title: "Old migration plan", type: "Doc", status: "paused" as const, author: "Marcus Vale", updated: "2w ago" },
];

function ContentPage() {
  return (
    <>
      <PageHeader
        title="Content"
        subtitle="Manage posts, docs, and pages."
        actions={<Button size="sm"><Plus className="h-4 w-4" /> New entry</Button>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((it) => (
          <Card key={it.title} className="p-5 bg-card flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-gold-dim border border-gold-soft flex items-center justify-center text-gold">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{it.title}</p>
                <StatusPill status={it.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{it.type} · {it.author} · {it.updated}</p>
            </div>
            <Button variant="ghost" size="sm">Edit</Button>
          </Card>
        ))}
      </div>
    </>
  );
}