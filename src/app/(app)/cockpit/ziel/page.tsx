export const dynamic = "force-dynamic"

import { ZielTabelle } from "@/components/cockpit/ziel-tabelle"
import { KennzahlenForm, ReferenzForm } from "@/components/cockpit/referenz-form"
import { getMonths, getSettingRows, getSettings } from "@/lib/actions/cockpit"

export default async function ZielPage() {
  const [settings, rows, months] = await Promise.all([getSettings(), getSettingRows(), getMonths("2026-01-01", "2027-12-01")])
  const m2026 = months.filter((m) => m.monat.startsWith("2026"))
  const m2027 = months.filter((m) => m.monat.startsWith("2027"))
  return (
    <div className="space-y-8">
      <ZielTabelle months2027={m2027} months2026={m2026} settings={settings} />
      <ReferenzForm months2026={m2026} months2027={m2027} />
      <KennzahlenForm rows={rows} />
    </div>
  )
}
