import { Sidebar } from "@/components/layout/sidebar"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-[#F8F6F3] dark:bg-[#15120F]">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top,_rgba(197,165,114,0.12),_transparent_34%),linear-gradient(180deg,_#FBF8F4_0%,_#F8F6F3_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(197,165,114,0.10),_transparent_28%),linear-gradient(180deg,_#211C17_0%,_#15120F_100%)]">
        <div className="mx-auto max-w-7xl px-4 pt-14 pb-6 sm:px-6 md:pt-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
