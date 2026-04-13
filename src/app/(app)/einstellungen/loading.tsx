import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function EinstellungenLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="mt-2 h-4 w-72 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
      <Card>
        <CardHeader>
          <div className="h-6 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <div className="h-3 w-48 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-4 w-64 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </CardContent>
      </Card>
    </div>
  )
}
