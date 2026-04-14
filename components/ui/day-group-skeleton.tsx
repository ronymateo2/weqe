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
        <div className="skeleton h-3 w-16" />
      </div>
      <div className="mt-4">
        <div
          className="skeleton h-5 w-full"
          style={{ borderRadius: "var(--radius-sm)" }}
        />
      </div>
    </div>
  );
}

export function DayGroupSkeleton({
  entries,
}: {
  entries: Array<"checkin" | "slim">;
}) {
  return (
    <div>
      <div className="skeleton mb-3 h-3 w-16" />
      <div className="space-y-3">
        {entries.map((type, i) =>
          type === "checkin" ? (
            <CheckInCardSkeleton key={i} />
          ) : (
            <SlimCardSkeleton key={i} width={100 + i * 20} />
          ),
        )}
      </div>
    </div>
  );
}
