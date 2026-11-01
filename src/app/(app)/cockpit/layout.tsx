import { CockpitNav } from "@/components/cockpit/cockpit-nav"

export default function CockpitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100">Monats-Cockpit</h1>
          <p className="text-gray-500 dark:text-gray-400">Air Lounge · Break-even, Profit/Loss, Forecast und Ist pro Monat · Winter 2026/27 und Ziel 2027</p>
        </div>
        <CockpitNav />
      </div>
      {children}
    </div>
  )
}
