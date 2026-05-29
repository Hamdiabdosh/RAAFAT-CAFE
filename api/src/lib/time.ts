/** Parse "HH:mm" to a Date anchored on 1970-01-01 for Postgres TIME columns */
export function parseTimeString(value: string): Date {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    throw new Error("Invalid time format, use HH:mm");
  }
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error("Invalid time");
  }
  return new Date(`1970-01-01T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00.000Z`);
}

export function formatTimeString(value: Date | null | undefined): string | null {
  if (!value) return null;
  const h = value.getUTCHours();
  const m = value.getUTCMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Calendar date for daily order numbers in the café's timezone (stored as UTC midnight). */
export function getCafeOrderDate(timezone: string, at = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return new Date(`${y}-${m}-${d}T00:00:00.000Z`);
}
