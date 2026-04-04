"use client"

import { useTransition } from "react"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { updateTaskStatus } from "@/lib/actions/tasks"

type Task = {
  id: string
  title: string
  due_date: string | null
  event: { id: string; title: string } | null
  assigned_member: { name: string; color: string } | null
}

export function OpenTasks({ tasks }: { tasks: Task[] }) {
  const [pending, startTransition] = useTransition()

  function handleComplete(taskId: string, eventId?: string) {
    startTransition(async () => {
      await updateTaskStatus(taskId, "done", eventId)
    })
  }

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
        Keine offenen Aufgaben.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${pending ? "opacity-60 pointer-events-none" : ""}`}
        >
          <Checkbox
            className="shrink-0"
            onCheckedChange={() => handleComplete(task.id, task.event?.id)}
          />
          <Link
            href={task.event ? `/kalender/${task.event.id}` : "#"}
            className="flex-1 min-w-0"
          >
            <p className="text-sm font-medium truncate">{task.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {task.event && (
                <span className="text-xs text-[#C5A572] truncate">
                  {task.event.title}
                </span>
              )}
              {task.due_date && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Fällig: {new Date(task.due_date).toLocaleDateString("de-CH")}
                </span>
              )}
            </div>
          </Link>
          {task.assigned_member && (
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: task.assigned_member.color }}
              title={task.assigned_member.name}
            >
              {task.assigned_member.name[0]}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
