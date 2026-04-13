import { Card, CardContent } from "@/components/ui/card"

export default function TischkartenLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="mt-2 h-4 w-96 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </div>
        <div className="h-10 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <CardContent className="space-y-3 p-4">
              <div className="flex justify-between">
                <div className="h-5 w-28 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <div className="h-5 w-20 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              </div>
              <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="flex gap-3">
                <div className="h-4 w-20 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
                <div className="h-4 w-12 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
              </div>
              <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
