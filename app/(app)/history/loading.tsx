import { DayGroupSkeleton } from "../../../components/ui/day-group-skeleton";

export default function HistoryLoading() {
  return (
    <section>
      {/* ScreenHeader skeleton */}
      <header className="mb-8">
        <div className="mb-3">
          <div className="skeleton h-3 w-20" />
        </div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div
            className="skeleton h-12 flex-1"
            style={{ borderRadius: "var(--radius-full)" }}
          />
          <div
            className="skeleton h-8 w-16"
            style={{ borderRadius: "var(--radius-sm)" }}
          />
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
