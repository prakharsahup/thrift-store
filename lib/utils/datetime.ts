// The store runs on India time. <input type="datetime-local"> has no time zone, so admin forms
// read and write it as IST.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** ISO timestamp → "2026-10-03T20:00" in IST, for a datetime-local input's value. */
export function toIstInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + IST_OFFSET_MS).toISOString().slice(0, 16);
}

/** "2026-10-03T20:00" (IST, from a datetime-local input) → ISO timestamp, or null if invalid. */
export function fromIstInputValue(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+05:30`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

const istDateTime = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

/** "3 Oct 2026, 8:00 pm" in IST. */
export function formatIstDateTime(iso: string): string {
  return istDateTime.format(new Date(iso));
}

/** ISO timestamp for `days` days before now. */
export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}
