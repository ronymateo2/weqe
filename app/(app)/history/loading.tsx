function CheckInCardSkeleton() {
  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.72)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-3 w-10" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-3 w-18" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="skeleton h-3 w-20" />
      </div>
    </div>
  );
}

function SlimCardSkeleton({ width }: { width: number }) {
  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.56)] p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="skeleton h-3" style={{ width: `${width}px` }} />
        <div className="skeleton h-3 w-8" />
      </div>
    </div>
  );
}

function DayGroupSkeleton({ entries }: { entries: Array<"checkin" | "slim"> }) {
  return (
    <div>
      <div className="skeleton mb-3 h-3 w-16" />
      <div className="space-y-3">
        {entries.map((type, i) =>
          type === "checkin" ? (
            <CheckInCardSkeleton key={i} />
          ) : (
            <SlimCardSkeleton key={i} width={100 + i * 20} />
          )
        )}
      </div>
    </div>
  );
}

export default function HistoryLoading() {
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
        <div className="skeleton mt-2 h-3 w-3/4" />
      </header>

      <section className="space-y-8">
        <DayGroupSkeleton entries={["checkin", "slim", "slim"]} />
        <DayGroupSkeleton entries={["checkin", "slim"]} />
        <DayGroupSkeleton entries={["slim", "checkin"]} />
      </section>
    </section>
  );
}
