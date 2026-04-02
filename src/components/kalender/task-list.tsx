"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Plus, CheckCircle2 } from "lucide-react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createTask, updateTaskStatus } from "@/lib/actions/tasks"
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/constants"

interface TaskItem {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
  assigned_member?: { name: string; color: string } | null
}

export function TaskList({
  eventId,
  tasks,
}: {
  eventId: string
  tasks: TaskItem[]
}) {
  const [showForm, setShowForm] = useState(false)
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
          <form action={handleAdd} className="flex gap-2 rounded-lg border bg-gray-50 p-3">
            <Input name="title" placeholder="Neue Aufgabe..." required className="flex-1" />
            <Input name="due_date" type="date" className="w-40" />
            <Button type="submit" size="sm" className="bg-[#C5A572] hover:bg-[#A08050]" disabled={isPending}>
              Hinzufügen
            </Button>
          </form>
        )}

        {/* Open tasks */}
        {openTasks.map((task) => (
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
              <div className="flex items-center gap-2 mt-0.5">
                {task.due_date && (
                  <span className="text-xs text-gray-500">
                    Fällig: {(() => { const [y,m,d] = task.due_date!.split("-").map(Number); return new Date(y, m-1, d); })().toLocaleDateString("de-CH")}
                  </span>
                )}
                {task.assigned_member && (
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{ borderColor: task.assigned_member.color }}
                  >
                    {task.assigned_member.name}
                  </Badge>
                )}
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS] || task.priority}
            </Badge>
          </div>
        ))}

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
                <p className="text-sm line-through">{task.title}</p>
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
