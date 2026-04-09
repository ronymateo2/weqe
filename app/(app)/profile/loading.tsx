export default function ProfileLoading() {
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
        <div className="skeleton mb-2 h-6 w-16" />
        <div className="skeleton mt-2 h-3 w-56" />
      </header>

      <div className="space-y-8">
        {/* Información */}
        <section className="space-y-3">
          <div className="skeleton h-3 w-20" />
          <div className="overflow-hidden rounded-[16px] border border-[var(--border)]">
            <div className="flex min-h-12 items-center gap-3 border-b border-[var(--border)] px-4">
              <div className="skeleton h-3 w-14" />
              <div className="skeleton h-3 w-32" />
            </div>
            <div className="flex min-h-12 items-center gap-3 px-4">
              <div className="skeleton h-3 w-14" />
              <div className="skeleton h-3 w-48" />
            </div>
          </div>
        </section>

        {/* Medicamentos */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-7 w-7 rounded-full" />
          </div>
          <div className="overflow-hidden rounded-[16px] border border-[var(--border)]">
            {[40, 56, 32].map((w, i) => (
              <div
                key={i}
                className="flex min-h-12 items-center gap-3 border-b border-[var(--border)] px-4 last:border-b-0"
              >
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="skeleton h-3" style={{ width: `${w * 2}px` }} />
                  <div className="skeleton h-2.5" style={{ width: `${w}px` }} />
                </div>
                <div className="skeleton h-5 w-5 rounded" />
                <div className="skeleton h-5 w-5 rounded" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
