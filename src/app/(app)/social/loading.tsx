export default function SocialLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="mt-2 h-4 w-64 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </div>
        <div className="h-10 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
