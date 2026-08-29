export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full divide-y divide-gray-200 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="py-4 px-6 flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm animate-pulse space-y-4">
      <div className="h-5 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-100 rounded w-2/3"></div>
      <div className="h-8 bg-gray-200 rounded w-full"></div>
    </div>
  );
}
