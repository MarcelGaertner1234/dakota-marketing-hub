"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Plus, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createTask, updateTaskStatus } from "@/lib/actions/tasks"
import { TASK_PRIORITY_LABELS } from "@/lib/constants"

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-300" },
  medium: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300" },
  high: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-300" },
  urgent: { bg: "bg-red-50", text: "text-red-700", border: "border-red-300" },
}

interface TeamMemberOption {
  id: string
  name: string
  color: string
}

interface TaskItem {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
  assigned_to: string | null
  assigned_member?: { id?: string; name: string; color: string } | null
}

export function TaskList({
  eventId,
  tasks,
  teamMembers = [],
}: {
  eventId: string
  tasks: TaskItem[]
  teamMembers?: TeamMemberOption[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [showExtras, setShowExtras] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleToggle(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === "done" ? "todo" : "done"
    startTransition(async () => {
      await updateTaskStatus(taskId, newStatus, eventId)
      router.refresh()
    })
  }

  async function handleAdd(formData: FormData) {
    formData.set("event_id", eventId)
    startTransition(async () => {
      await createTask(formData)
      setShowForm(false)
      setShowExtras(false)
      router.refresh()
    })
  }

  const openTasks = tasks.filter((t) => t.status !== "done")
  const doneTasks = tasks.filter((t) => t.status === "done")

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          Aufgaben ({openTasks.length} offen)
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Aufgabe
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add form */}
        {showForm && (
          <form action={handleAdd} className="space-y-2 rounded-lg border bg-gray-50 p-3">
            {/* Row 1: Title + Due Date + Add Button */}
            <div className="flex gap-2">
              <Input name="title" placeholder="Neue Aufgabe..." required className="flex-1" />
              <Input name="due_date" type="date" className="w-40" />
              <Button type="submit" size="sm" className="bg-[#C5A572] hover:bg-[#A08050]" disabled={isPending}>
                Hinzufügen
              </Button>
            </div>

            {/* Toggle for extra fields */}
            <button
              type="button"
              onClick={() => setShowExtras(!showExtras)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showExtras ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showExtras ? "Weniger Optionen" : "Mehr Optionen"}
            </button>

            {/* Row 2: Priority + Assigned To (expandable) */}
            {showExtras && (
              <div className="flex gap-2">
                <select
                  name="priority"
                  className="flex h-9 rounded-md border border-input bg-white px-3 py-1 text-sm w-36"
                  defaultValue="medium"
                >
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                  <option value="urgent">Dringend</option>
                </select>

                <select
                  name="assigned_to"
                  className="flex h-9 flex-1 rounded-md border border-input bg-white px-3 py-1 text-sm"
                  defaultValue=""
                >
                  <option value="">Nicht zugewiesen</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>

                <Input
                  name="description"
                  placeholder="Beschreibung (optional)"
                  className="flex-1"
                />
              </div>
            )}
          </form>
        )}

        {/* Open tasks */}
        {openTasks.map((task) => {
          const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium
          return (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50"
            >
              <Checkbox
                checked={false}
                onCheckedChange={() => handleToggle(task.id, task.status)}
                disabled={isPending}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{task.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {task.due_date && (
                    <span className="text-xs text-gray-500">
                      Fällig: {(() => { const [y,m,d] = task.due_date!.split("-").map(Number); return new Date(y, m-1, d); })().toLocaleDateString("de-CH")}
                    </span>
                  )}
                  {task.assigned_member && (
                    <Badge
                      variant="outline"
                      className="text-xs gap-1"
                      style={{ borderColor: task.assigned_member.color }}
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: task.assigned_member.color }}
                      />
                      {task.assigned_member.name}
                    </Badge>
                  )}
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}
              >
                {TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS] || task.priority}
              </Badge>
            </div>
          )
        })}

        {/* Done tasks */}
        {doneTasks.length > 0 && (
          <div className="border-t pt-3 mt-3">
            <p className="text-xs font-medium text-gray-400 mb-2">Erledigt ({doneTasks.length})</p>
            {doneTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg p-2 opacity-60"
              >
                <Checkbox
                  checked={true}
                  onCheckedChange={() => handleToggle(task.id, task.status)}
                  disabled={isPending}
                />
                <p className="text-sm line-through flex-1">{task.title}</p>
                {task.assigned_member && (
                  <span className="text-xs text-gray-400">{task.assigned_member.name}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {tasks.length === 0 && !showForm && (
          <p className="text-center text-sm text-gray-400 py-4">
            Noch keine Aufgaben. Klick auf &quot;Aufgabe&quot; um loszulegen.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
