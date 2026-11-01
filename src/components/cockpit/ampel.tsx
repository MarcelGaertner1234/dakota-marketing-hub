import { cn } from "@/lib/utils"
import { ampelLabel, type Ampel } from "@/lib/cockpit/calc"

const STYLE: Record<Ampel, string> = {
  gruen: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800",
  gelb: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800",
  rot: "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-800",
  neutral: "bg-gray-50 text-gray-500 ring-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:ring-gray-700",
}
const DOT: Record<Ampel, string> = { gruen: "bg-emerald-500", gelb: "bg-amber-500", rot: "bg-red-500", neutral: "bg-gray-400" }

export function AmpelBadge({ ampel, className, size = "sm" }: { ampel: Ampel; className?: string; size?: "sm" | "lg" }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset", size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs", STYLE[ampel], className)}>
      <span className={cn("inline-block rounded-full", size === "lg" ? "h-2.5 w-2.5" : "h-2 w-2", DOT[ampel])} aria-hidden />
      {ampelLabel(ampel)}
    </span>
  )
}
