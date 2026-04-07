"use client"

import Image from "next/image"
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
  BookOpen,
  Utensils,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useTheme } from "next-themes"
import { BRAND_ASSETS } from "@/lib/brand"

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/kalender", label: "Kalender", icon: Calendar },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/konzepte", label: "Konzepte", icon: Lightbulb },
  { href: "/stories", label: "Stories", icon: BookOpen },
  { href: "/tischkarten", label: "Tischkarten", icon: Utensils },
  { href: "/social", label: "Social Media", icon: Share2 },
  { href: "/bewertungen", label: "Bewertungen", icon: Star },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  function cycleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  const themeLabel =
    resolvedTheme === "dark" ? "Dunkel" : "Hell"

  const ThemeIcon =
    resolvedTheme === "dark" ? Moon : Sun

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
          <div className="w-full max-w-[184px] rounded-2xl bg-white px-3 py-3 text-[#2C2C2C] shadow-sm ring-1 ring-white/10">
            <div className="flex items-center gap-3">
              <div className="overflow-hidden rounded-full border border-[#E7DED1] bg-white p-1">
                <Image
                  src={BRAND_ASSETS.hotelLogo}
                  alt="Dakota Hotel Logo"
                  width={54}
                  height={54}
                  className="h-[54px] w-[54px] object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <Image
                  src={BRAND_ASSETS.airLoungeLogo}
                  alt="Air Lounge Logo"
                  width={170}
                  height={88}
                  className="h-auto w-full object-contain"
                />
                <p className="mt-2 text-[10px] font-medium tracking-[0.32em] text-[#C5A572] uppercase">
                  Marketing Hub
                </p>
              </div>
            </div>
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
            title={`Theme: ${themeLabel}`}
          >
            <ThemeIcon className="h-5 w-5 shrink-0" />
            {resolvedTheme === "dark" ? "Zu Light wechseln" : "Zu Dark wechseln"}
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
