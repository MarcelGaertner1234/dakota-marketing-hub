"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Lightbulb,
  Share2,
  Star,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/kalender", label: "Kalender", icon: Calendar },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/konzepte", label: "Konzepte", icon: Lightbulb },
  { href: "/social", label: "Social Media", icon: Share2 },
  { href: "/bewertungen", label: "Bewertungen", icon: Star },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => { setMounted(true) }, [])

  function cycleTheme() {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-[#2C2C2C] p-2 text-white shadow-lg md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#2C2C2C] text-white transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h1 className="font-serif text-xl font-bold tracking-wide">
              DAKOTA <span className="text-[#C5A572]">HUB</span>
            </h1>
            <p className="text-xs tracking-widest text-[#C5A572]">
              MARKETING TOOL
            </p>
          </div>
          <button onClick={() => setOpen(false)} className="md:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#C5A572] text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Theme Toggle + Footer */}
        <div className="border-t border-white/10 px-6 py-4 space-y-3">
          <button
            type="button"
            onClick={cycleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            title={`Theme: ${theme === "light" ? "Hell" : theme === "dark" ? "Dunkel" : "System"}`}
          >
            {!mounted ? (
              <Monitor className="h-5 w-5 shrink-0" />
            ) : theme === "dark" ? (
              <Moon className="h-5 w-5 shrink-0" />
            ) : theme === "light" ? (
              <Sun className="h-5 w-5 shrink-0" />
            ) : (
              <Monitor className="h-5 w-5 shrink-0" />
            )}
            {!mounted ? "System" : theme === "dark" ? "Dunkel" : theme === "light" ? "Hell" : "System"}
          </button>
          <div>
            <p className="text-xs text-gray-500">Dakota Air Lounge</p>
            <p className="text-xs text-gray-500">Meiringen</p>
          </div>
        </div>
      </aside>
    </>
  )
}
