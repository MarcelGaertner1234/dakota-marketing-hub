import { Card, CardContent } from "@/components/ui/card"

export default function KonzepteLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="mt-2 h-4 w-72 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-6 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse mb-3" />
              <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-800 animate-pulse mb-2" />
              <div className="h-4 w-3/4 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
