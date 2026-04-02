import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function KalenderLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-64 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="mt-2 h-4 w-96 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </div>
        <div className="h-10 w-36 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }, (_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="bg-[#2C2C2C] px-3 py-2">
              <div className="h-4 w-20 mx-auto rounded bg-gray-600 animate-pulse" />
            </CardHeader>
            <CardContent className="p-2">
              <div className="h-[180px] rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
