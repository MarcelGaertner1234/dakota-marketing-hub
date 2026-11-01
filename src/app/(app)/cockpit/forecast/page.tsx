export const dynamic = "force-dynamic"

import { AnlaesseEingabe } from "@/components/cockpit/anlass-form"
import { MonatEingaben } from "@/components/cockpit/monat-eingaben"
import { getAnlaesse, getMonths, getSettings } from "@/lib/actions/cockpit"

export default async function ForecastPage() {
  const [settings, months, anlaesse] = await Promise.all([getSettings(), getMonths("2026-12-01", "2027-12-01"), getAnlaesse()])
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-[#2C2C2C] dark:text-gray-100">Gebuchte Anlässe</h2>
        <AnlaesseEingabe anlaesse={anlaesse} />
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-[#2C2C2C] dark:text-gray-100">Hotel und Tagesgeschäft</h2>
        <MonatEingaben months={months} settings={settings} />
      </section>
    </div>
  )
}
