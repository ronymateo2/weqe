function SliderSkeleton({ labelWidth }: { labelWidth: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="skeleton h-3" style={{ width: `${labelWidth}px` }} />
        <div className="skeleton h-3 w-4" />
      </div>
      <div className="skeleton h-3 w-full" style={{ borderRadius: "var(--radius-full)" }} />
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

      {/* Segmented control (morning / afternoon / night) */}
      <div
        className="skeleton mb-6 h-11 w-full"
        style={{ borderRadius: "var(--radius-md)" }}
      />

      {/* Pain sliders */}
      <div className="space-y-8">
        <SliderSkeleton labelWidth={68} />
        <SliderSkeleton labelWidth={52} />
        <SliderSkeleton labelWidth={80} />
        <SliderSkeleton labelWidth={60} />

        {/* Sleep hours input */}
        <div className="space-y-3">
          <div className="skeleton h-3 w-28" />
          <div className="skeleton h-11 w-full" style={{ borderRadius: "var(--radius-md)" }} />
        </div>
      </div>

      {/* Submit button */}
      <div
        className="skeleton mt-8 h-12 w-full"
        style={{ borderRadius: "var(--radius-md)" }}
      />
    </section>
  );
}
