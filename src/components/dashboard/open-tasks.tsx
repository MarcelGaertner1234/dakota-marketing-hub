"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { updateTaskStatus, updateTaskAssignment } from "@/lib/actions/tasks"

type TeamMember = {
  id: string
  name: string
  color: string
}

type Task = {
  id: string
  title: string
  due_date: string | null
  assigned_to: string | null
  event: { id: string; title: string } | null
  assigned_member: { name: string; color: string } | null
}

const COLLAPSED_COUNT = 5

export function OpenTasks({
  tasks,
  teamMembers = [],
}: {
  tasks: Task[]
  teamMembers?: TeamMember[]
}) {
  const [, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null)

  function handleComplete(taskId: string, eventId?: string) {
    setPendingId(taskId)
    startTransition(async () => {
      await updateTaskStatus(taskId, "done", eventId)
      setPendingId(null)
    })
  }

  function handleReassign(taskId: string, memberId: string | null) {
    setAssigningTaskId(null)
    startTransition(async () => {
      await updateTaskAssignment(taskId, memberId)
    })
  }

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
        Keine offenen Aufgaben.
      </p>
    )
  }

  const visible = expanded ? tasks : tasks.slice(0, COLLAPSED_COUNT)
  const hasMore = tasks.length > COLLAPSED_COUNT

  return (
    <div className="space-y-2">
      {visible.map((task) => (
        <div
          key={task.id}
          className={`flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${pendingId === task.id ? "opacity-60 pointer-events-none" : ""}`}
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

          {/* Avatar / Reassign */}
          <div className="relative shrink-0">
            <button
              onClick={() => setAssigningTaskId(assigningTaskId === task.id ? null : task.id)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white transition-transform hover:scale-110"
              style={{ backgroundColor: task.assigned_member?.color || "#D1D5DB" }}
              title={task.assigned_member ? `${task.assigned_member.name} — klicken zum Ändern` : "Nicht zugewiesen — klicken zum Zuweisen"}
            >
              {task.assigned_member ? task.assigned_member.name[0] : "?"}
            </button>

            {assigningTaskId === task.id && teamMembers.length > 0 && (
              <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border bg-white dark:bg-gray-800 shadow-lg dark:border-gray-700 p-1">
                {teamMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleReassign(task.id, member.id)}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${task.assigned_to === member.id ? "bg-gray-50 dark:bg-gray-700" : ""}`}
                  >
                    <div
                      className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.name[0]}
                    </div>
                    <span className="truncate">{member.name}</span>
                    {task.assigned_to === member.id && (
                      <span className="ml-auto text-[10px] text-[#C5A572]">aktuell</span>
                    )}
                  </button>
                ))}
                <button
                  onClick={() => handleReassign(task.id, null)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[9px]">?</div>
                  Niemand
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-gray-400 hover:text-gray-600"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="mr-1 h-3 w-3" />
              Weniger anzeigen
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 h-3 w-3" />
              Alle {tasks.length} Aufgaben anzeigen
            </>
          )}
        </Button>
      )}
    </div>
  )
}
