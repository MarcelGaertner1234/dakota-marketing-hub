import { Sidebar } from "@/components/layout/sidebar"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-4 pt-14 pb-6 sm:px-6 md:pt-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
