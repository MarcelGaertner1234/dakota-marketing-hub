/** Heutiges Datum (YYYY-MM-DD) in Europe/Zurich, unabhängig von der Server-Zeitzone (Vercel = UTC). */
export function todayZurich(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
}

/** Datum (YYYY-MM-DD) plus n Tage, kalendarisch. */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}
