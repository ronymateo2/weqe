"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type TrendPoint = {
  dayKey: string;
  label: string;
  eyelidPain: number | null;
  templePain: number | null;
  masseterPain: number | null;
  cervicalPain: number | null;
  orbitalPain: number | null;
  overallPain: number | null;
};

type CorrelationPoint = {
  sleepHours: number;
  masseterPain: number;
};

type DashboardChartsProps = {
  trendPoints: TrendPoint[];
  correlationPoints: CorrelationPoint[];
};

const tooltipStyle = {
  background: "rgba(18,16,8,0.96)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  color: "var(--text-primary)",
  fontSize: "12px"
} as const;

export function DashboardTrendChart({ trendPoints }: Pick<DashboardChartsProps, "trendPoints">) {
  return (
    <div className="h-[220px] rounded-[12px] bg-[linear-gradient(180deg,rgba(37,32,20,0.9),rgba(28,24,16,0.55))] p-2">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={trendPoints} margin={{ top: 12, right: 12, left: -14, bottom: 0 }}>
          <CartesianGrid stroke="rgba(46,39,24,0.8)" strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke="var(--text-faint)" tick={{ fill: "var(--text-faint)", fontSize: 11 }} />
          <YAxis
            domain={[0, 10]}
            stroke="var(--text-faint)"
            tick={{ fill: "var(--text-faint)", fontSize: 11 }}
            tickCount={6}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => value.toFixed(1)} labelStyle={{ color: "var(--text-muted)" }} />
          <Line connectNulls dataKey="overallPain" dot={false} name="General" stroke="var(--accent)" strokeWidth={2.3} />
          <Line connectNulls dataKey="eyelidPain" dot={false} name="Parpados" stroke="var(--pain-low)" strokeWidth={1.5} />
          <Line connectNulls dataKey="templePain" dot={false} name="Sienes" stroke="var(--pain-mid)" strokeWidth={1.5} />
          <Line connectNulls dataKey="masseterPain" dot={false} name="Masetero" stroke="var(--pain-high)" strokeWidth={1.5} />
          <Line connectNulls dataKey="cervicalPain" dot={false} name="Cervical" stroke="#8b6fbf" strokeWidth={1.5} />
          <Line connectNulls dataKey="orbitalPain" dot={false} name="Orbital" stroke="#4f9ecf" strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardCorrelationChart({ correlationPoints }: Pick<DashboardChartsProps, "correlationPoints">) {
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
            formatter={(value: number, name: string) => (name === "Sueno" ? `${value.toFixed(1)}h` : value.toFixed(1))}
            labelFormatter={() => ""}
          />
          <ReferenceLine stroke="rgba(212,162,76,0.5)" x={6} />
          <Scatter data={correlationPoints} fill="var(--accent)" name="Sueno" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
