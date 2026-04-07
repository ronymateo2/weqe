"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TriggerType } from "@/types/domain";

type TrendPoint = {
  dayKey: string;
  label: string;
  eyelidPain: number | null;
  templePain: number | null;
  masseterPain: number | null;
  cervicalPain: number | null;
  orbitalPain: number | null;
};

type CorrelationPoint = {
  sleepHours: number;
  masseterPain: number;
};

type TriggerZoneStat = {
  triggerType: TriggerType;
  avgEyelidPain: number;
  avgTemplePain: number;
  days: number;
};

type DashboardChartsProps = {
  trendPoints: TrendPoint[];
  correlationPoints: CorrelationPoint[];
};

const TRIGGER_LABELS: Record<TriggerType, string> = {
  climate: "Clima",
  humidifier: "Humidif.",
  stress: "Estres",
  screens: "Pantallas",
  tv: "TV",
  ergonomics: "Ergonom.",
  exercise: "Ejercicio",
  other: "Otro",
};

const tooltipStyle = {
  background: "rgba(18,16,8,0.96)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  color: "var(--text-primary)",
  fontSize: "12px",
} as const;

const WINDOW_OPTIONS = [7, 14, 30] as const;
type WindowDays = (typeof WINDOW_OPTIONS)[number];
const PAN_STEP = 7;

export function DashboardTrendChart({
  trendPoints,
}: Pick<DashboardChartsProps, "trendPoints">) {
  const [windowDays, setWindowDays] = useState<WindowDays>(30);
  const [windowEnd, setWindowEnd] = useState(trendPoints.length - 1);

  const clampedEnd = Math.min(windowEnd, trendPoints.length - 1);
  const start = Math.max(0, clampedEnd - windowDays + 1);
  const visiblePoints = trendPoints.slice(start, clampedEnd + 1);

  const painKeys = [
    "eyelidPain",
    "templePain",
    "masseterPain",
    "cervicalPain",
    "orbitalPain",
  ] as const;
  const maxPain = visiblePoints.reduce((max, p) => {
    const vals = painKeys
      .map((k) => p[k])
      .filter((v): v is number => v !== null);
    return vals.length > 0 ? Math.max(max, ...vals) : max;
  }, 0);
  const yMax = Math.max(4, Math.ceil(maxPain) + 1);

  const canPanLeft = start > 0;
  const canPanRight = clampedEnd < trendPoints.length - 1;

  function handleWindowChange(days: WindowDays) {
    setWindowDays(days);
    setWindowEnd(trendPoints.length - 1);
  }

  function panLeft() {
    setWindowEnd((prev) => Math.max(windowDays - 1, prev - PAN_STEP));
  }

  function panRight() {
    setWindowEnd((prev) => Math.min(trendPoints.length - 1, prev + PAN_STEP));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {WINDOW_OPTIONS.map((d) => (
            <button
              key={d}
              className="mono flex h-[48px] min-w-[44px] items-center justify-center rounded-[var(--radius-full)] border px-3 text-[12px] transition-colors"
              style={
                windowDays === d
                  ? {
                      borderColor: "var(--accent)",
                      background: "var(--accent-dim)",
                      color: "var(--accent)",
                    }
                  : { borderColor: "var(--border)", color: "var(--text-muted)" }
              }
              onClick={() => handleWindowChange(d)}
            >
              {d}d
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1">
          <button
            className="flex h-[48px] w-[48px] items-center justify-center rounded-[var(--radius-full)] border text-[18px] transition-colors"
            disabled={!canPanLeft}
            style={
              canPanLeft
                ? { borderColor: "var(--border)", color: "var(--text-muted)" }
                : {
                    borderColor: "var(--border)",
                    color: "var(--text-faint)",
                    opacity: 0.4,
                  }
            }
            onClick={panLeft}
          >
            ←
          </button>
          <button
            className="flex h-[48px] w-[48px] items-center justify-center rounded-[var(--radius-full)] border text-[18px] transition-colors"
            disabled={!canPanRight}
            style={
              canPanRight
                ? { borderColor: "var(--border)", color: "var(--text-muted)" }
                : {
                    borderColor: "var(--border)",
                    color: "var(--text-faint)",
                    opacity: 0.4,
                  }
            }
            onClick={panRight}
          >
            →
          </button>
        </div>
      </div>
      <div className="h-[220px] rounded-[12px] bg-[linear-gradient(180deg,rgba(37,32,20,0.9),rgba(28,24,16,0.55))] p-2">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart
            data={visiblePoints}
            margin={{ top: 12, right: 12, left: -14, bottom: 0 }}
          >
            <CartesianGrid stroke="rgba(46,39,24,0.8)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              stroke="var(--text-faint)"
              tick={{ fill: "var(--text-faint)", fontSize: 11 }}
            />
            <YAxis
              domain={[0, yMax]}
              stroke="var(--text-faint)"
              tick={{ fill: "var(--text-faint)", fontSize: 11 }}
              tickCount={Math.min(6, yMax + 1)}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => value.toFixed(1)}
              labelStyle={{ color: "var(--text-muted)" }}
            />
            {/* <Line connectNulls dataKey="overallPain" dot={false} name="General" stroke="var(--accent)" strokeWidth={2.3} /> */}
            <Line
              connectNulls
              dataKey="eyelidPain"
              dot={false}
              name="Parpados"
              stroke="var(--pain-low)"
              strokeWidth={1.5}
            />
            <Line
              connectNulls
              dataKey="templePain"
              dot={false}
              name="Sienes"
              stroke="var(--pain-mid)"
              strokeWidth={1.5}
            />
            <Line
              connectNulls
              dataKey="masseterPain"
              dot={false}
              name="Masetero"
              stroke="var(--pain-high)"
              strokeWidth={1.5}
            />
            <Line
              connectNulls
              dataKey="cervicalPain"
              dot={false}
              name="Cervical"
              stroke="#8b6fbf"
              strokeWidth={1.5}
            />
            <Line
              connectNulls
              dataKey="orbitalPain"
              dot={false}
              name="Orbital"
              stroke="#4f9ecf"
              strokeWidth={1.5}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DashboardCorrelationChart({
  correlationPoints,
}: Pick<DashboardChartsProps, "correlationPoints">) {
  return (
    <div className="h-[200px] rounded-[12px] bg-[linear-gradient(180deg,rgba(37,32,20,0.9),rgba(28,24,16,0.55))] p-2">
      <ResponsiveContainer height="100%" width="100%">
        <ScatterChart margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="rgba(46,39,24,0.8)" strokeDasharray="3 3" />
          <XAxis
            dataKey="sleepHours"
            domain={[0, 12]}
            name="Sueno"
            stroke="var(--text-faint)"
            tick={{ fill: "var(--text-faint)", fontSize: 11 }}
            tickCount={7}
            unit="h"
          />
          <YAxis
            dataKey="masseterPain"
            domain={[0, 10]}
            name="Masetero"
            stroke="var(--text-faint)"
            tick={{ fill: "var(--text-faint)", fontSize: 11 }}
            tickCount={6}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ stroke: "var(--border)" }}
            formatter={(value: number, name: string) =>
              name === "Sueno" ? `${value.toFixed(1)}h` : value.toFixed(1)
            }
            labelFormatter={() => ""}
          />
          <ReferenceLine stroke="rgba(212,162,76,0.5)" x={6} />
          <Scatter data={correlationPoints} fill="var(--accent)" name="Sueno" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardTriggerPainChart({ stats }: { stats: TriggerZoneStat[] }) {
  const chartData = stats.map((item) => ({
    label: TRIGGER_LABELS[item.triggerType],
    parpados: item.avgEyelidPain,
    sienes: item.avgTemplePain,
    days: item.days,
  }));

  return (
    <div className="h-[220px] rounded-[12px] bg-[linear-gradient(180deg,rgba(37,32,20,0.9),rgba(28,24,16,0.55))] p-2">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={chartData} margin={{ top: 12, right: 12, left: -14, bottom: 0 }}>
          <CartesianGrid stroke="rgba(46,39,24,0.8)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="var(--text-faint)"
            tick={{ fill: "var(--text-faint)", fontSize: 11 }}
          />
          <YAxis
            domain={[0, 10]}
            stroke="var(--text-faint)"
            tick={{ fill: "var(--text-faint)", fontSize: 11 }}
            tickCount={6}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            formatter={(value: number) => value.toFixed(1)}
            labelStyle={{ color: "var(--text-muted)", marginBottom: 4 }}
          />
          <Bar dataKey="parpados" fill="var(--pain-low)" name="Parpados" radius={[3, 3, 0, 0]} />
          <Bar dataKey="sienes" fill="var(--pain-mid)" name="Sienes" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
