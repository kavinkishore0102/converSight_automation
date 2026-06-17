export default function AutomationsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero skeleton */}
      <div className="flex flex-col items-center gap-4 mb-12 animate-fade-in">
        <div className="h-6 w-40 rounded-full bg-ink-100 shimmer" />
        <div className="h-10 w-72 rounded-xl bg-ink-100 shimmer" />
        <div className="h-4 w-96 rounded-lg bg-ink-100 shimmer" />
      </div>

      {/* Search bar skeleton */}
      <div className="h-16 -mx-6 px-6 mb-8 flex items-center gap-2 border-y border-ink-100 bg-white/70">
        <div className="h-10 flex-1 rounded-lg bg-ink-100 shimmer" />
        <div className="h-10 w-24 rounded-lg bg-ink-100 shimmer" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="card p-5 space-y-3 animate-fade-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-ink-100 shimmer shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 w-3/4 rounded bg-ink-100 shimmer" />
                <div className="h-3 w-1/3 rounded bg-ink-100 shimmer" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded bg-ink-100 shimmer" />
              <div className="h-3 w-5/6 rounded bg-ink-100 shimmer" />
            </div>
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="h-3 w-16 rounded bg-ink-100 shimmer" />
              <div className="h-5 w-20 rounded-full bg-ink-100 shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
