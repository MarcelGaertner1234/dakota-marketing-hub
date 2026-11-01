export const dynamic = "force-dynamic"

import { AufgabenBoard, type AufgabeItem } from "@/components/aufgaben/aufgaben-board"
import { getAllTasks, getEventOptions } from "@/lib/actions/tasks"
import { getTeamMembers } from "@/lib/actions/team"
import { todayZurich } from "@/lib/utils/today"

export default async function AufgabenPage() {
  const today = todayZurich()
  const [{ open, done }, members, events] = await Promise.all([getAllTasks(), getTeamMembers(), getEventOptions(today)])
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100">Aufgaben</h1>
        <p className="text-gray-500 dark:text-gray-400">Alle offenen Aufgaben des Teams, mit oder ohne Event</p>
      </div>
      <AufgabenBoard
        open={open as unknown as AufgabeItem[]}
        done={done as unknown as AufgabeItem[]}
        members={(members ?? []).map((m) => ({ id: m.id, name: m.name, color: m.color }))}
        events={events.map((e) => ({ id: e.id, title: e.title, start_date: e.start_date }))}
        today={today}
      />
    </div>
  )
}
