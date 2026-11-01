import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AmpelBadge } from "./ampel"
import { fmt, monatLabel, type MonatsCockpit } from "@/lib/cockpit/calc"
import { cn } from "@/lib/utils"

export function MonatTabelle({ m, kompakt = false }: { m: MonatsCockpit; kompakt?: boolean }) {
  const zeilen = kompakt ? m.zeilen.filter((z) => ["rest", "anl", "fr", "hp", "ges", "quote"].includes(z.key)) : m.zeilen
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#2C2C2C] hover:bg-[#2C2C2C] dark:bg-[#1E1915]">
            <TableHead className="text-white">Kennzahl</TableHead>
            {!kompakt && <TableHead className="text-white">Quelle</TableHead>}
            <TableHead className="text-right text-white">Break-even</TableHead>
            <TableHead className="text-right text-white">Profit / Loss</TableHead>
            <TableHead className="text-right text-white">Forecast</TableHead>
            <TableHead className="text-right text-white">Ist</TableHead>
            <TableHead className="text-white">Ampel</TableHead>
            {!kompakt && <TableHead className="text-white">Regel</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {zeilen.map((z) => {
            const bold = z.key === "ges" || z.key === "quote"
            return (
              <TableRow key={z.key} className={cn(bold && "bg-[#F8F6F3] dark:bg-[#1E1915]")}>
                <TableCell className={cn("whitespace-nowrap", bold && "font-semibold")}>{z.label}</TableCell>
                {!kompakt && <TableCell className="text-xs text-gray-500">{z.quelle}</TableCell>}
                <TableCell className="text-right tabular-nums">{fmt(z.breakEven, z.einheit)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(z.basis, z.einheit)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(z.forecast, z.einheit)}</TableCell>
                <TableCell className={cn("text-right tabular-nums", bold && "font-semibold")}>{fmt(z.ist, z.einheit)}</TableCell>
                <TableCell><AmpelBadge ampel={z.ampel} /></TableCell>
                {!kompakt && <TableCell className="text-xs text-gray-500">{z.regel}</TableCell>}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {monatLabel(m.monat)} · {m.betriebstage} Betriebstage · {m.wochen.length} Wochen erfasst · {m.anlaesseFix.length} Anlässe fix{m.anlaesseOption.length ? `, ${m.anlaesseOption.length} Option` : ""} · Ampel vergleicht Ist, solange der Monat läuft den Forecast
      </p>
    </div>
  )
}
