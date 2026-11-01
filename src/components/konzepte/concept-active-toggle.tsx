"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { setConceptActive } from "@/lib/actions/concepts"

export function ConceptActiveToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => startTransition(async () => { const r = await setConceptActive(id, !active); if (!r.success) alert(r.error); router.refresh() })}
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : active ? "Deaktivieren" : "Aktivieren"}
    </Button>
  )
}
