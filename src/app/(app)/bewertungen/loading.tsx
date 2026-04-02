import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function BewertungenLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="mt-2 h-4 w-64 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </div>
        <div className="h-10 w-44 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
