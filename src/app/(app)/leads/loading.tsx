export default function LeadsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="mt-2 h-4 w-64 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </div>
        <div className="h-10 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, j) => (
                <div key={j} className="h-20 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
