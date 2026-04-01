export default function ReportLoading() {
  return (
    <section>
      {/* ScreenHeader skeleton */}
      <header className="mb-8">
        <div className="mb-3">
          <div className="skeleton h-3 w-20" />
        </div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="skeleton h-12 flex-1" style={{ borderRadius: "var(--radius-full)" }} />
          <div className="skeleton h-8 w-16" style={{ borderRadius: "var(--radius-sm)" }} />
        </div>
        <div className="skeleton mb-2 h-6 w-24" />
        <div className="skeleton mt-2 h-3 w-full" />
        <div className="skeleton mt-2 h-3 w-3/5" />
      </header>

      <section className="space-y-8 px-5 pt-4 pb-8">
        {/* Summary card */}
        <div>
          <div className="skeleton mb-3 h-3 w-36" />
          <div
            className="space-y-6 border border-[var(--border)] p-5"
            style={{
              borderRadius: "var(--radius-lg)",
              background: "rgba(28,24,16,0.72)"
            }}
          >
            {/* checkInsCount + dateRange */}
            <div>
              <div className="skeleton mb-2 h-5 w-32" />
              <div className="skeleton h-3 w-40" />
            </div>

            {/* Dolor promedio */}
            <div>
              <div className="skeleton mb-2 h-3 w-28" />
              <div className="skeleton h-9 w-24" />
            </div>

            {/* Sueño promedio */}
            <div>
              <div className="skeleton mb-2 h-3 w-28" />
              <div className="skeleton h-4 w-36" />
            </div>

            {/* Correlacion */}
            <div>
              <div className="skeleton mb-2 h-3 w-40" />
              <div className="skeleton mb-2 h-6 w-20" />
              <div className="skeleton h-3 w-full" />
            </div>
          </div>
        </div>

        {/* PDF button */}
        <div className="skeleton h-12 w-full" style={{ borderRadius: "var(--radius-md)" }} />

        {/* Trend chart */}
        <div>
          <div className="skeleton mb-3 h-3 w-28" />
          <div
            className="border border-[var(--border)] p-5"
            style={{
              borderRadius: "var(--radius-lg)",
              background: "rgba(28,24,16,0.72)"
            }}
          >
            <div className="skeleton h-[200px]" style={{ borderRadius: "var(--radius-md)" }} />
          </div>
        </div>

        {/* Scatter chart */}
        <div>
          <div className="skeleton mb-3 h-3 w-44" />
          <div
            className="border border-[var(--border)] p-5"
            style={{
              borderRadius: "var(--radius-lg)",
              background: "rgba(28,24,16,0.72)"
            }}
          >
            <div className="skeleton h-[180px]" style={{ borderRadius: "var(--radius-md)" }} />
          </div>
        </div>
      </section>
    </section>
  );
}
