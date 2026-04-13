"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function KalenderError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle className="h-12 w-12 text-[#C5A572]" />
      <div>
        <h2 className="text-xl font-semibold text-[#2C2C2C] dark:text-gray-100">
          Etwas ist schiefgelaufen
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
        </p>
      </div>
      <Button
        onClick={reset}
        className="bg-[#C5A572] hover:bg-[#A08050]"
      >
        Erneut versuchen
      </Button>
    </div>
  )
}
