import { Button } from "@/components/ui/button"
import { getConcepts } from "@/lib/actions/concepts"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { EventCreateForm } from "@/components/kalender/event-create-form"

export default async function NeuesEventPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date: prefillDate } = await searchParams
  const concepts = await getConcepts()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/kalender">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100">Neues Event</h1>
          <p className="text-gray-500 dark:text-gray-400">Event zum Marketing-Kalender hinzufuegen</p>
        </div>
      </div>

      <EventCreateForm
        concepts={(concepts || []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))}
        prefillDate={prefillDate}
      />
    </div>
  )
}
