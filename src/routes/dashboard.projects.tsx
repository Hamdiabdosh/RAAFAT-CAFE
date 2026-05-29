import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, MoreVertical } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/public-api";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/projects")({
  head: () => ({ meta: [{ title: "Projects — RAAFAT-Cafe" }] }),
  component: ProjectsPage,
});

type Status = "active" | "pending" | "paused" | "error";
const all: { name: string; client: string; status: Status; revenue: number; progress: number; updated: string }[] = [
  { name: "Aurora", client: "Northwind", status: "active", revenue: 24800, progress: 68, updated: "2h ago" },
  { name: "Helios CMS", client: "Pylon", status: "pending", revenue: 12400, progress: 24, updated: "1d ago" },
  { name: "Caelum Studio", client: "Caelum", status: "active", revenue: 38200, progress: 91, updated: "3d ago" },
  { name: "Vega Mobile", client: "Vega Labs", status: "paused", revenue: 6000, progress: 42, updated: "1w ago" },
  { name: "Orion Internal", client: "—", status: "error", revenue: 0, progress: 8, updated: "1w ago" },
  { name: "Lyra API", client: "Lyra Inc.", status: "active", revenue: 18200, progress: 55, updated: "5h ago" },
];

function ProjectsPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const filtered = all.filter((p) =>
    (filter === "all" || p.status === filter) &&
    (p.name.toLowerCase().includes(q.toLowerCase()) || p.client.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle={`${filtered.length} project${filtered.length === 1 ? "" : "s"}`}
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4" /> New Project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create project</DialogTitle>
                <DialogDescription>Set up a new project workspace.</DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Project created"); }}>
                <div className="space-y-1.5">
                  <Label htmlFor="pn">Project name</Label>
                  <Input id="pn" placeholder="Aurora" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pc">Client</Label>
                  <Input id="pc" placeholder="Northwind" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pd">Description</Label>
                  <Textarea id="pd" rows={3} placeholder="Brief..." />
                </div>
                <DialogFooter>
                  <Button type="submit">Create</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects..." className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <Card key={p.name} className="p-5 bg-card hover:border-gold-soft hover:-translate-y-0.5 transition-all">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="font-display text-lg font-semibold truncate">{p.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{p.client}</p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Actions"><MoreVertical className="h-4 w-4" /></Button>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <StatusPill status={p.status} />
              <span className="text-sm font-medium text-gold">{formatMoney(p.revenue)}</span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Progress</span><span>{p.progress}%</span>
              </div>
              <Progress value={p.progress} className="h-1.5" />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Updated {p.updated}</p>
          </Card>
        ))}
      </div>
    </>
  );
}