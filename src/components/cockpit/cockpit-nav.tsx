"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/cockpit", label: "Übersicht" },
  { href: "/cockpit/wochen", label: "Wochen (Ist)" },
  { href: "/cockpit/forecast", label: "Forecast" },
  { href: "/cockpit/ziel", label: "Ziel 2027" },
]

export function CockpitNav() {
  const pathname = usePathname()
  return (
    <nav className="flex flex-wrap gap-1 rounded-lg border border-[#E7DED1] bg-white/70 p-1 dark:border-[#3A332B] dark:bg-[#1E1915]">
      {TABS.map((t) => {
        const active = t.href === "/cockpit" ? pathname === "/cockpit" : pathname.startsWith(t.href)
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-[#2C2C2C] text-white dark:bg-[#C5A572] dark:text-[#15120F]" : "text-gray-600 hover:bg-[#F3EEE6] dark:text-gray-300 dark:hover:bg-[#2A241E]",
            )}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
