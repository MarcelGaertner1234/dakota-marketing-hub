"use client"

import { useTransition } from "react"
import { updatePostStatus } from "@/lib/actions/social"
import { useRouter } from "next/navigation"

const STATUS_OPTIONS = [
  { value: "draft", label: "Entwurf" },
  { value: "planned", label: "Geplant" },
  { value: "ready", label: "Bereit" },
  { value: "published", label: "Veröffentlicht" },
]

export function PostStatusSelect({
  postId,
  currentStatus,
}: {
  postId: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value
    startTransition(async () => {
      await updatePostStatus(postId, newStatus)
      router.refresh()
    })
  }

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      disabled={isPending}
      className="mt-1 w-full rounded-md border border-gray-200 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium focus:border-[#C5A572] focus:outline-none focus:ring-1 focus:ring-[#C5A572]"
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
