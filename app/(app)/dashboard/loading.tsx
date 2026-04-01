function SkeletonHeader() {
  return (
    <header className="mb-8">
      <div className="mb-3">
        <div className="skeleton h-3 w-20" />
      </div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="skeleton h-12 flex-1" style={{ borderRadius: "var(--radius-full)" }} />
        <div className="skeleton h-8 w-16" style={{ borderRadius: "var(--radius-sm)" }} />
      </div>
      <div className="skeleton mb-2 h-6 w-32" />
      <div className="skeleton mt-2 h-3 w-full" />
      <div className="skeleton mt-2 h-3 w-4/5" />
    </header>
  );
}

export default function DashboardLoading() {
  return (
    <section className="space-y-10">
      <SkeletonHeader />

      {/* Tendencia */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="skeleton h-3 w-16" />
          <div className="skeleton h-7 w-28" style={{ borderRadius: "var(--radius-full)" }} />
        </div>
        <div className="rounded-[16px] bg-[rgba(28,24,16,0.72)] p-5">
          <div className="skeleton mb-4 h-[220px]" style={{ borderRadius: "var(--radius-md)" }} />
          <div className="skeleton h-3 w-3/4" />
        </div>
      </section>

      {/* Correlacion */}
      <section>
        <div className="skeleton mb-3 h-3 w-40" />
        <div className="skeleton mb-3 h-4 w-full" />
        <div className="rounded-[16px] bg-[rgba(28,24,16,0.72)] p-5">
          <div className="skeleton mb-4 h-[200px]" style={{ borderRadius: "var(--radius-md)" }} />
          <div className="skeleton h-3 w-48" />
        </div>
      </section>

      {/* Triggers */}
      <section>
        <div className="skeleton mb-3 h-3 w-36" />
        <div className="space-y-3">
          {[72, 60, 52, 44].map((w, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-[var(--border)] pb-3"
            >
              <div className="skeleton h-3" style={{ width: `${w}px` }} />
              <div className="skeleton h-3 w-12" />
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
