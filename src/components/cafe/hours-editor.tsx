import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { CafeProfile } from "@/lib/cafe-api";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type HourRow = {
  day_of_week: number;
  is_closed: boolean;
  open_time: string;
  close_time: string;
};

function defaultRows(): HourRow[] {
  return DAY_LABELS.map((_, i) => ({
    day_of_week: i,
    is_closed: i === 6,
    open_time: "08:00",
    close_time: "18:00",
  }));
}

function fromCafe(hours?: CafeProfile["hours"]): HourRow[] {
  if (!hours?.length) return defaultRows();
  return DAY_LABELS.map((_, i) => {
    const row = hours.find((h) => h.day_of_week === i);
    return {
      day_of_week: i,
      is_closed: row?.is_closed ?? i === 6,
      open_time: row?.open_time ?? "08:00",
      close_time: row?.close_time ?? "18:00",
    };
  });
}

type Props = {
  hours?: CafeProfile["hours"];
  onSave: (hours: HourRow[]) => Promise<void>;
  saving?: boolean;
};

export function HoursEditor({ hours, onSave, saving }: Props) {
  const [rows, setRows] = useState<HourRow[]>(() => fromCafe(hours));

  useEffect(() => {
    setRows(fromCafe(hours));
  }, [hours]);

  return (
    <div className="space-y-4">
      {rows.map((row, index) => (
        <div
          key={row.day_of_week}
          className="grid grid-cols-1 sm:grid-cols-[140px_1fr_1fr_1fr] gap-3 items-center py-2 border-b border-border last:border-0"
        >
          <div className="font-medium text-sm">{DAY_LABELS[index]}</div>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={row.is_closed}
              onCheckedChange={(checked) => {
                setRows((prev) =>
                  prev.map((r, i) => (i === index ? { ...r, is_closed: checked } : r)),
                );
              }}
            />
            Closed
          </label>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Open</Label>
            <Input
              type="time"
              value={row.open_time}
              disabled={row.is_closed}
              onChange={(e) => {
                const v = e.target.value;
                setRows((prev) =>
                  prev.map((r, i) => (i === index ? { ...r, open_time: v } : r)),
                );
              }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Close</Label>
            <Input
              type="time"
              value={row.close_time}
              disabled={row.is_closed}
              onChange={(e) => {
                const v = e.target.value;
                setRows((prev) =>
                  prev.map((r, i) => (i === index ? { ...r, close_time: v } : r)),
                );
              }}
            />
          </div>
        </div>
      ))}
      <Button onClick={() => onSave(rows)} disabled={saving}>
        {saving ? "Saving…" : "Save hours"}
      </Button>
    </div>
  );
}
