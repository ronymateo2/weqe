function SliderSkeleton({ labelWidth }: { labelWidth: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="skeleton h-4 w-4" style={{ borderRadius: "var(--radius-full)" }} />
          <div className="skeleton h-3" style={{ width: `${labelWidth}px` }} />
        </div>
        <div className="skeleton h-5 w-6" />
      </div>
      <div className="skeleton h-11 w-full" style={{ borderRadius: "var(--radius-full)" }} />
    </div>
  );
}

export default function RegisterLoading() {
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
        <div className="skeleton mb-2 h-6 w-36" />
        <div className="skeleton mt-2 h-3 w-full" />
        <div className="skeleton mt-2 h-3 w-3/4" />
      </header>

      {/* Segmented control (Mañana / Tarde / Trigger) */}
      <div
        className="skeleton mb-6 h-11 w-full"
        style={{ borderRadius: "var(--radius-md)" }}
      />

      <div className="space-y-4">
        {/* Card: Mapa de dolor — 5 sliders */}
        <div className="rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.7)] p-4">
          <div className="skeleton mb-4 h-3 w-24" />
          <div className="space-y-5">
            <SliderSkeleton labelWidth={56} />
            <SliderSkeleton labelWidth={44} />
            <SliderSkeleton labelWidth={72} />
            <SliderSkeleton labelWidth={60} />
            <SliderSkeleton labelWidth={88} />
          </div>
        </div>

        {/* Card: Estrés — 1 slider */}
        <div className="rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.7)] p-4">
          <div className="skeleton mb-4 h-3 w-16" />
          <SliderSkeleton labelWidth={80} />
        </div>

        {/* Card: Sueño */}
        <div className="rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.7)] p-4">
          <div className="skeleton mb-4 h-3 w-16" />
          <div className="skeleton h-11 w-full" style={{ borderRadius: "var(--radius-md)" }} />
          <div className="mt-3 flex gap-2">
            {[52, 60, 48].map((w, i) => (
              <div
                key={i}
                className="skeleton h-9"
                style={{ width: `${w}px`, borderRadius: "var(--radius-full)" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Submit button */}
      <div
        className="skeleton mt-8 h-12 w-full"
        style={{ borderRadius: "var(--radius-full)" }}
      />
    </section>
  );
}
