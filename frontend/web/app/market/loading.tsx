export default function MarketLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav skeleton */}
      <div className="bg-white border-b border-gray-200 h-16" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
        {/* Hero */}
        <div className="mb-8 space-y-3">
          <div className="h-5 w-40 bg-gray-200 rounded-full" />
          <div className="h-10 w-72 bg-gray-200 rounded-xl" />
          <div className="h-5 w-96 bg-gray-200 rounded-lg" />
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 px-4 py-3 h-20" />
          ))}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between mb-5">
            <div className="space-y-2">
              <div className="h-5 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-56 bg-gray-200 rounded" />
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex gap-3 mb-4">
            <div className="h-9 w-52 bg-gray-200 rounded-lg" />
            <div className="h-9 w-40 bg-gray-200 rounded-lg" />
            <div className="h-9 w-32 bg-gray-200 rounded-lg" />
          </div>

          {/* Table rows */}
          <div className="space-y-2">
            <div className="h-10 bg-gray-100 rounded-t-xl" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-50 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
