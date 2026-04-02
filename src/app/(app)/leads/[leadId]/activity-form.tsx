"use client"

import { useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { addLeadActivity } from "@/lib/actions/leads"

export function ActivityForm({ leadId }: { leadId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  function handleSubmit(formData: FormData) {
    setFeedback(null)
    startTransition(async () => {
      try {
        await addLeadActivity(formData)
        formRef.current?.reset()
        setFeedback({ type: "success", message: "Aktivität gespeichert." })
        setTimeout(() => setFeedback(null), 3000)
      } catch {
        setFeedback({ type: "error", message: "Fehler beim Speichern. Bitte erneut versuchen." })
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <input type="hidden" name="lead_id" value={leadId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="activity_type">Typ</Label>
          <select
            id="activity_type"
            name="activity_type"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            defaultValue="anruf"
          >
            <option value="anruf">Anruf</option>
            <option value="email">E-Mail</option>
            <option value="treffen">Treffen</option>
            <option value="nachricht">Nachricht</option>
            <option value="notiz">Notiz</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung *</Label>
        <Textarea
          id="description"
          name="description"
          required
          rows={3}
          placeholder="Was wurde besprochen?"
        />
      </div>
      {feedback && (
        <p className={`text-sm ${feedback.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {feedback.message}
        </p>
      )}
      <div className="flex justify-end">
        <Button
          type="submit"
          className="bg-[#C5A572] hover:bg-[#A08050]"
          disabled={isPending}
        >
          {isPending ? "Speichern..." : "Aktivität speichern"}
        </Button>
      </div>
    </form>
  )
}
