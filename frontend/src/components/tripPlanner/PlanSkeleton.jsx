export default function PlanSkeleton() {
  return (
    <div className="rounded-3xl border border-white/50 bg-white/70 p-5 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-white/60 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="h-6 w-44 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded-lg bg-slate-100" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-xl bg-slate-200" />
      </div>

      <div className="mt-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="mt-1 h-3.5 w-3.5 animate-pulse rounded-full bg-indigo-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
