import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill } from "@/components/dashboard/status-pill";

export const Route = createFileRoute("/dashboard/users")({
  head: () => ({ meta: [{ title: "Users — RAAFAT-Cafe" }] }),
  component: UsersPage,
});

const users = [
  { initials: "AM", name: "Ada Morrison", email: "ada@northwind.co", role: "Owner", status: "active" as const, last: "online" },
  { initials: "JK", name: "Jonas Kessler", email: "jonas@pylon.dev", role: "Admin", status: "active" as const, last: "2h ago" },
  { initials: "SR", name: "Saira Rahman", email: "saira@caelum.io", role: "Member", status: "pending" as const, last: "yesterday" },
  { initials: "MV", name: "Marcus Vale", email: "mv@vega.com", role: "Member", status: "paused" as const, last: "1w ago" },
  { initials: "EL", name: "Elena Liu", email: "elena@lyra.app", role: "Member", status: "active" as const, last: "5m ago" },
];

function UsersPage() {
  return (
    <>
      <PageHeader
        title="Users"
        subtitle={`${users.length} team members`}
        actions={<Button size="sm"><Plus className="h-4 w-4" /> Invite</Button>}
      />
      <Card className="p-0 overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Role</TableHead>
                <TableHead>Status</TableHead><TableHead>Last active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.email}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gold-dim border border-gold-soft flex items-center justify-center text-gold font-display text-xs">{u.initials}</div>
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell><StatusPill status={u.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{u.last}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}