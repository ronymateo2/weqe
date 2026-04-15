"use client";

import { useMemo } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import type { HygieneRecord } from "@/types/domain";

export function VictoriasView({
  records,
  onBack,
}: {
  records: HygieneRecord[];
  onBack: () => void;
}) {
  const today = useMemo(() => new Date(), []);
  const todayKey = today.toLocaleDateString("en-CA");

  const byDay = useMemo(() => {
    const map = new Map<string, HygieneRecord[]>();
    for (const r of records) {
      const arr = map.get(r.dayKey) ?? [];
      arr.push(r);
      map.set(r.dayKey, arr);
    }
    return map;
  }, [records]);

  const days = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - 59 + i);
        return d;
      }),
    [today],
  );

  function getDayInfo(d: Date) {
    const key = d.toLocaleDateString("en-CA");
    const recs = byDay.get(key) ?? [];
    const completedRecs = recs.filter((r) => r.status === "completed");
    const completed = completedRecs.length > 0;
    const isToday = key === todayKey;
    const sessionCount = completedRecs.length;
    if (!completed)
      return {
        completed: false,
        dot: null as null | "low" | "high" | "gray",
        isToday,
        sessionCount: 0,
      };
    const calibrated = completedRecs.filter((r) => r.deviationValue > 0);
    if (calibrated.length === 0)
      return { completed, dot: "gray" as const, isToday, sessionCount };
    const avg =
      calibrated.reduce((a, b) => a + b.deviationValue, 0) / calibrated.length;
    return {
      completed,
      dot: avg <= 2 ? ("low" as const) : ("high" as const),
      isToday,
      sessionCount,
    };
  }

  return (
    <div className="flex flex-col gap-4 px-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-2 rounded-full px-4 text-[13px] font-medium transition-opacity active:opacity-70"
          style={{
            minHeight: 48,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
          type="button"
          onClick={onBack}
        >
          <ArrowLeftIcon size={13} />
          volver
        </button>
        <span
          className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
          style={{
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
        >
          Banco de Victorias
        </span>
      </div>

      <p
        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "var(--text-faint)" }}
      >
        Últimos 60 días — Solo victorias visibles
      </p>

      {/* 6 × 10 calendar grid */}
      <div className="flex flex-col gap-[10px]">
        {Array.from({ length: 6 }, (_, row) => (
          <div key={row} className="grid grid-cols-10 gap-[6px]">
            {Array.from({ length: 10 }, (_, col) => {
              const d = days[row * 10 + col];
              if (!d) return <div key={col} />;
              const { completed, dot, isToday, sessionCount } = getDayInfo(d);
              const dayNum = d.getDate();
              const dotColor =
                dot === "low"
                  ? "var(--accent)"
                  : dot === "high"
                    ? "#cc3f30"
                    : "var(--border)";

              return (
                <div
                  key={col}
                  className="relative flex flex-col items-center pb-[8px]"
                >
                  <div
                    className="flex h-[30px] w-[30px] items-center justify-center rounded-full"
                    style={{
                      background: completed
                        ? isToday
                          ? "var(--accent)"
                          : "var(--accent-dim)"
                        : "transparent",
                      border: `1px solid ${completed ? "rgba(212,162,76,0.55)" : "var(--border)"}`,
                      outline: isToday ? "2px solid var(--accent)" : "none",
                      outlineOffset: 1,
                    }}
                  >
                    <span
                      className="font-mono text-[10px] font-medium"
                      style={{
                        color: completed
                          ? isToday
                            ? "#121008"
                            : "var(--accent)"
                          : "var(--text-faint)",
                      }}
                    >
                      {dayNum}
                    </span>
                  </div>
                  {/* Friction dot */}
                  {dot && (
                    <div
                      className="absolute bottom-[2px] right-0 h-[5px] w-[5px] rounded-full"
                      style={{ background: dotColor }}
                    />
                  )}
                  {/* Extra-session badge */}
                  {sessionCount > 1 && (
                    <div
                      className="absolute -right-[4px] -top-[3px] flex h-[11px] min-w-[11px] items-center justify-center rounded-full px-[2px]"
                      style={{
                        background: "var(--accent)",
                        fontSize: 6,
                        fontFamily: "monospace",
                        fontWeight: 700,
                        color: "#121008",
                        lineHeight: 1,
                      }}
                    >
                      +{sessionCount - 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        {[
          { color: "var(--accent)", label: "Baja fricción" },
          { color: "#cc3f30", label: "Alta fricción" },
          { color: "var(--border)", label: "Sin calibrar" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-[5px]">
            <div
              className="h-[7px] w-[7px] rounded-full"
              style={{ background: color }}
            />
            <span
              className="text-[10px]"
              style={{ color: "var(--text-faint)" }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Quote */}
      <p
        className="text-center text-[12px] italic leading-relaxed"
        style={{ color: "var(--text-muted)" }}
      >
        "No cuentes los días sin acción. El servo no trabaja con ausencias —
        solo con señales positivas."
      </p>
    </div>
  );
}
