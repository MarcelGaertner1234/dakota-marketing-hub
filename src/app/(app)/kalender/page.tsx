import { YearCalendar } from "@/components/kalender/year-calendar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { getEvents, getHolidays } from "@/lib/actions/events"

export default async function KalenderPage() {
  const currentYear = new Date().getFullYear()
  const [events, holidays] = await Promise.all([getEvents(currentYear), getHolidays(currentYear)])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2C]">Marketing-Kalender</h1>
          <p className="text-gray-500">Alle Events, Anlässe und Feiertage auf einen Blick</p>
        </div>
        <Link href="/kalender/neu">
          <Button className="bg-[#C5A572] hover:bg-[#A08050]">
            <Plus className="mr-2 h-4 w-4" />
            Neues Event
          </Button>
        </Link>
      </div>

      <YearCalendar events={events || []} holidays={holidays || []} />
    </div>
  )
}
