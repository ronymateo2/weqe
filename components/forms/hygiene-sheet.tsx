"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { WrenchIcon, CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import { saveLidHygieneAction } from "@/lib/actions/lid-hygiene";
import { getLidHygieneHistoryAction } from "@/lib/actions/lid-hygiene";
import { queueHygiene } from "@/lib/offline/lid-hygiene-queue";
import type { HygieneRecord, SaveHygieneInput, ActionState } from "@/types/domain";

// ─── Data ────────────────────────────────────────────────────────────────────

const DEVIATION_DATA: Record<
  string,
  { label: string; shortLabel: string; desc: string; tip: string }
> = {
  "+3": {
    label: "Error Crítico (Pereza)",
    shortLabel: "PEREZA DOMINANTE",
    desc: "Resistencia mental total. Sabía que debía hacerlo y elegí no hacerlo.",
    tip: "Reducir fricción: Pon el kit sobre el teclado antes de terminar de trabajar.",
  },
  "+2": {
    label: "Fallo Leve (Resistencia)",
    shortLabel: "RESISTENCIA",
    desc: "Empecé pero paré antes de tiempo o lo hice con mucha pesadez.",
    tip: "Ajuste de identidad: Repite: 'Soy un profesional que cuida su herramienta visual'.",
  },
  "+1": {
    label: "Ajuste Menor (Inercia)",
    shortLabel: "INERCIA",
    desc: "Casi no lo hago por flojera, pero logré forzar el inicio.",
    tip: "Refuerzo: Mañana intenta hacerlo 1 minuto antes.",
  },
  "0": {
    label: "Zona de Éxito (Flow)",
    shortLabel: "ÉXITO",
    desc: "Hábito automático. Sin esfuerzo, parte de mi identidad.",
    tip: "Mantén la trayectoria actual. Sin cambios necesarios.",
  },
  "-1": {
    label: "Ajuste Menor (Preparación)",
    shortLabel: "PREPARACIÓN",
    desc: "Fricción operativa: El kit estaba lejos o el agua no estaba lista.",
    tip: "Ajuste logístico: Prepara el material 10 minutos antes.",
  },
  "-2": {
    label: "Fallo Leve (Logística)",
    shortLabel: "LOGÍSTICA",
    desc: "No pude hacerlo bien porque me faltó un insumo (gasas, gel, etc).",
    tip: "Gestión de stock: Revisa tus suministros de higiene hoy.",
  },
  "-3": {
    label: "Error Crítico (Entorno)",
    shortLabel: "FRICCIÓN LOGÍSTICA",
    desc: "Imposible por causas externas (viaje, olvidé el kit, emergencia).",
    tip: "Plan de contingencia: Ten un kit de emergencia en tu mochila/auto.",
  },
};

const TABLE_ROWS = [
  { val: "+3", color: "#e05c00" },
  { val: "+2", color: "#b35000" },
  { val: "+1", color: "#7a3a00" },
  { val: "0", color: "#5cb85a" },
  { val: "-1", color: "#2a4a5a" },
  { val: "-2", color: "#1e3d54" },
  { val: "-3", color: "#153048" },
];

function deviationKey(v: number): string {
  return v > 0 ? `+${v}` : String(v);
}

function cellColor(deviation: number): string {
  switch (deviation) {
    case 3:  return "#e05c00";
    case 2:  return "#b35000";
    case 1:  return "#7a3a00";
    case 0:  return "#3a6622";
    case -1: return "#2a4a5a";
    case -2: return "#1e3d54";
    case -3: return "#153048";
    default: return "#1c1810";
  }
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────

function HygieneHeatmap({
  records,
}: {
  records: HygieneRecord[];
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Group records by day_key
  const byDay = useMemo(() => {
    const map = new Map<string, HygieneRecord[]>();
    for (const r of records) {
      const arr = map.get(r.dayKey) ?? [];
      arr.push(r);
      map.set(r.dayKey, arr);
    }
    return map;
  }, [records]);

  // Build 7-row × 12-col calendar grid (Mon=row0 … Sun=row6)
  const grid = useMemo(() => {
    const today = new Date();
    const todayKey = today.toLocaleDateString("en-CA");
    // Monday of current week
    const todayDow = (today.getDay() + 6) % 7; // Mon=0
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - todayDow);
    // Start Monday 11 weeks before current week's Monday
    const startMonday = new Date(currentMonday);
    startMonday.setDate(currentMonday.getDate() - 11 * 7);

    // grid[row=dow][col=week]
    const g: Array<Array<{ dayKey: string; isFuture: boolean } | null>> =
      Array.from({ length: 7 }, () => Array(12).fill(null));

    for (let week = 0; week < 12; week++) {
      for (let dow = 0; dow < 7; dow++) {
        const d = new Date(startMonday);
        d.setDate(startMonday.getDate() + week * 7 + dow);
        const dayKey = d.toLocaleDateString("en-CA");
        g[dow][week] = { dayKey, isFuture: dayKey > todayKey };
      }
    }
    return g;
  }, []);

  const selectedRecord = selectedDay ? byDay.get(selectedDay) : null;
  const selectedLabel = selectedRecord
    ? (() => {
        const deviations = selectedRecord
          .filter((r) => r.status !== "skipped")
          .map((r) => r.deviationValue);
        if (deviations.length === 0) return "Omitido";
        const avg = Math.round(deviations.reduce((a, b) => a + b, 0) / deviations.length);
        const key = deviationKey(avg);
        return `${key} — ${DEVIATION_DATA[key]?.label ?? ""}`;
      })()
    : null;

  const DOW_LABELS = ["LUN", "", "MI", "", "VI", "", "DOM"];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          MAPA DE IDENTIDAD
        </span>
        <span className="text-[11px] text-[var(--text-muted)]">Últimas 12 semanas</span>
      </div>

      <div className="flex gap-1">
        {/* Row labels */}
        <div className="flex flex-col gap-[3px] pt-[2px]">
          {DOW_LABELS.map((label, i) => (
            <div
              key={i}
              className="flex h-[10px] items-center"
              style={{ fontSize: "9px", color: "var(--text-faint)", lineHeight: 1 }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex flex-1 gap-[3px]">
          {Array.from({ length: 12 }, (_, col) => (
            <div key={col} className="flex flex-1 flex-col gap-[3px]">
              {grid.map((row, dow) => {
                const cell = row[col];
                if (!cell) return <div key={dow} className="h-[10px] rounded-[2px]" />;

                const recs = byDay.get(cell.dayKey);
                let bg = "#1c1810"; // no record

                if (!cell.isFuture && recs) {
                  const completed = recs.filter((r) => r.status !== "skipped");
                  if (completed.length === 0) {
                    bg = "#252014"; // all skipped
                  } else {
                    const avg = Math.round(
                      completed.reduce((a, b) => a + b.deviationValue, 0) / completed.length,
                    );
                    bg = cellColor(avg);
                  }
                }

                const isSelected = selectedDay === cell.dayKey;

                return (
                  <button
                    key={dow}
                    aria-label={cell.dayKey}
                    className="h-[10px] rounded-[2px] transition-opacity"
                    style={{
                      backgroundColor: bg,
                      opacity: cell.isFuture ? 0.2 : 1,
                      outline: isSelected ? "1px solid var(--accent)" : "none",
                    }}
                    type="button"
                    onClick={() =>
                      setSelectedDay(selectedDay === cell.dayKey ? null : cell.dayKey)
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-[2px]" style={{ background: "#e05c00" }} />
          <span className="text-[10px] text-[var(--text-faint)]">Fricción</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-[2px]" style={{ background: "#3a6622" }} />
          <span className="text-[10px] text-[var(--text-faint)]">Éxito</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-[2px]" style={{ background: "#153048" }} />
          <span className="text-[10px] text-[var(--text-faint)]">Resistencia</span>
        </div>
      </div>

      {/* Selected day info */}
      {selectedDay && (
        <div className="mt-2 rounded-[var(--radius-md)] bg-[var(--surface-el)] px-3 py-2">
          <span className="text-[12px] font-mono text-[var(--text-muted)]">
            {selectedDay}
          </span>
          {selectedLabel && (
            <span className="ml-2 text-[12px] text-[var(--text-primary)]">
              {selectedLabel}
            </span>
          )}
          {!byDay.get(selectedDay) && (
            <span className="text-[12px] text-[var(--text-faint)]">Sin registro</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Trajectory Chart ─────────────────────────────────────────────────────────

function TrajectoryChart({
  records,
  previewDeviation,
}: {
  records: HygieneRecord[];
  previewDeviation: number;
}) {
  const PREVIEW_LABEL = "▸";

  const { chartData, weekAvg, todayLabel } = useMemo(() => {
    // Plot every individual session — no grouping, no averaging
    const historical = records
      .filter((r) => r.status !== "skipped")
      .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
      .slice(-11) // leave room for preview point
      .map((r) => ({
        label: r.dayKey.slice(5).replace("-", "/"),
        value: r.deviationValue,
      }));

    // Rolling avg over last 7 sessions
    const last7 = historical.slice(-7).map((p) => p.value);
    const avg =
      last7.length > 0
        ? Math.round((last7.reduce((a, b) => a + b, 0) / last7.length) * 10) / 10
        : null;

    const data = [
      ...historical,
      { label: PREVIEW_LABEL, value: null as unknown as number },
    ];

    return { chartData: data, weekAvg: avg, todayLabel: PREVIEW_LABEL };
  }, [records]);

  const avgDisplay =
    weekAvg !== null
      ? `${weekAvg > 0 ? "+" : ""}${weekAvg} Avg`
      : null;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            TRAYECTORIA SEMANAL
          </p>
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">
            Balance de fricción
          </p>
        </div>
        {avgDisplay && (
          <span
            className="rounded-full px-2 py-1 text-[11px] font-mono font-semibold"
            style={{
              background: "var(--accent-dim)",
              color: "var(--accent)",
              border: "1px solid rgba(212,162,76,0.3)",
            }}
          >
            {avgDisplay}
          </span>
        )}
      </div>

      <div className="h-[120px]">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -28 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--text-faint)", fontSize: 9 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[-3, 3]}
              ticks={[-3, 0, 3]}
              tick={{ fill: "var(--text-faint)", fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v > 0 ? `+${v}` : String(v))}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 11,
                color: "var(--text-primary)",
              }}
              formatter={(val: number) => [
                `${val > 0 ? "+" : ""}${val}`,
                "Desviación",
              ]}
            />
            <ReferenceLine
              y={0}
              stroke="#5cb85a"
              strokeDasharray="4 2"
              strokeOpacity={0.45}
              label={{
                value: "ÉXITO",
                position: "right",
                fill: "#5cb85a",
                fontSize: 8,
                opacity: 0.6,
              }}
            />
            <Line
              connectNulls={false}
              dataKey="value"
              dot={{ fill: "var(--accent)", r: 3, strokeWidth: 0 }}
              stroke="var(--accent)"
              strokeWidth={2}
              type="monotone"
            />
            {/* Live preview dot for today */}
            <ReferenceDot
              fill="var(--accent-bright)"
              r={5}
              stroke="var(--bg)"
              strokeWidth={2}
              x={todayLabel}
              y={previewDeviation}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function HygieneSheet({ onSaved }: { onSaved: () => void }) {
  const [deviation, setDeviation] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [note, setNote] = useState("");
  const [actionState, setActionState] = useState<ActionState>({ status: "idle" });
  const [historyData, setHistoryData] = useState<HygieneRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const isSaving = useRef(false);

  useEffect(() => {
    getLidHygieneHistoryAction(12)
      .then(setHistoryData)
      .finally(() => setLoading(false));
  }, []);

  const devKey = deviationKey(deviation);
  const devData = DEVIATION_DATA[devKey];

  async function handleConfirm() {
    if (isSaving.current) return;
    isSaving.current = true;
    setActionState({ status: "idle" });

    const id = crypto.randomUUID();
    const loggedAt = new Date().toISOString();
    const frictionType =
      deviation > 0 ? "mental" : deviation < 0 ? "logistics" : "none";
    const input: SaveHygieneInput = {
      id,
      loggedAt,
      status: "completed",
      deviationValue: deviation,
      frictionType,
      userNote: note.trim() || undefined,
    };

    if (!navigator.onLine) {
      await queueHygiene(input);
      isSaving.current = false;
      onSaved();
      return;
    }

    try {
      const result = await saveLidHygieneAction(input);
      if (result.ok) {
        onSaved();
      } else {
        setActionState({ status: "error", message: result.message });
        isSaving.current = false;
      }
    } catch {
      await queueHygiene(input);
      isSaving.current = false;
      onSaved();
    }
  }

  async function handleSkip() {
    if (isSaving.current) return;
    isSaving.current = true;

    const id = crypto.randomUUID();
    const loggedAt = new Date().toISOString();
    const input: SaveHygieneInput = {
      id,
      loggedAt,
      status: "skipped",
      deviationValue: 0,
      frictionType: "none",
    };

    if (!navigator.onLine) {
      await queueHygiene(input);
      isSaving.current = false;
      onSaved();
      return;
    }

    try {
      await saveLidHygieneAction(input);
    } catch {
      await queueHygiene(input);
    }
    isSaving.current = false;
    onSaved();
  }

  return (
    <div className="flex flex-col gap-6 px-5 pb-8">
      {/* Trajectory Chart */}
      <div
        className="rounded-[var(--radius-lg)] p-4"
        style={{ background: "var(--surface)" }}
      >
        {loading ? (
          <div
            className="h-[160px] animate-pulse rounded-[var(--radius-md)]"
            style={{ background: "var(--surface-el)" }}
          />
        ) : (
          <>
            <TrajectoryChart
              previewDeviation={deviation}
              records={historyData}
            />
            {historyData.length > 0 && (
              <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                <HygieneHeatmap records={historyData} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Calibration Slider */}
      <div>
        <p className="mb-1 text-center text-[17px] font-semibold text-[var(--text-primary)]">
          Calibrador de Fricción
        </p>
        <p className="mb-5 text-center text-[13px] text-[var(--text-muted)]">
          Define el origen del sesgo de hoy
        </p>

        {/* Tick labels */}
        <div className="mb-1 flex justify-between px-1">
          {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
            <div key={v} className="flex flex-col items-center" style={{ width: "14%" }}>
              <span
                className="font-mono text-[13px] font-semibold"
                style={{
                  color:
                    v === deviation
                      ? v === 0
                        ? "#5cb85a"
                        : v > 0
                          ? "#e05c00"
                          : "#4a8aaa"
                      : "var(--text-faint)",
                }}
              >
                {v > 0 ? `+${v}` : v}
              </span>
            </div>
          ))}
        </div>

        {/* Slider track */}
        <div className="relative mb-2">
          <input
            aria-label="Calibrador de fricción"
            className="w-full"
            max={3}
            min={-3}
            step={1}
            style={{
              WebkitAppearance: "none",
              appearance: "none",
              height: "6px",
              borderRadius: "9999px",
              background:
                "linear-gradient(to right, #cc3f30 0%, #5cb85a 50%, #e0932a 100%)",
              outline: "none",
              cursor: "pointer",
            }}
            type="range"
            value={deviation}
            onChange={(e) => setDeviation(Number(e.target.value))}
          />
        </div>

        {/* Tick short labels */}
        <div className="flex justify-between px-1">
          {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
            <div key={v} className="flex flex-col items-center" style={{ width: "14%" }}>
              <span
                className="text-center text-[7px] uppercase leading-tight"
                style={{ color: "var(--text-faint)", letterSpacing: "0.05em" }}
              >
                {DEVIATION_DATA[deviationKey(v)]?.shortLabel ?? ""}
              </span>
            </div>
          ))}
        </div>

        {/* Dynamic description */}
        <div
          className="mt-4 rounded-[var(--radius-md)] px-4 py-3"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <p
            className="mb-1 text-[13px] font-semibold"
            style={{
              color:
                deviation === 0
                  ? "#5cb85a"
                  : deviation > 0
                    ? "#e05c00"
                    : "#4a8aaa",
            }}
          >
            {devData?.label}
          </p>
          <p className="text-[13px] text-[var(--text-muted)]">{devData?.desc}</p>
        </div>
      </div>

      {/* "Más información" collapsible */}
      <div>
        <button
          className="flex w-full items-center justify-between py-2"
          style={{ color: "var(--text-muted)" }}
          type="button"
          onClick={() => setInfoOpen((o) => !o)}
        >
          <span className="flex items-center gap-2 text-[13px]">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background:
                  deviation === 0
                    ? "#5cb85a"
                    : deviation > 0
                      ? "#e05c00"
                      : "#4a8aaa",
              }}
            />
            Más información
          </span>
          {infoOpen ? <CaretUpIcon size={14} /> : <CaretDownIcon size={14} />}
        </button>

        {infoOpen && (
          <div
            className="overflow-x-auto rounded-[var(--radius-md)]"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <table className="w-full min-w-[480px] border-collapse text-[11px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Val", "Label", "Descripción", "Sugerencia"].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left font-semibold uppercase tracking-[0.08em]"
                      style={{ color: "var(--text-faint)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map(({ val, color }) => {
                  const d = DEVIATION_DATA[val];
                  const isActive = deviationKey(deviation) === val;
                  return (
                    <tr
                      key={val}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: isActive ? "var(--surface-el)" : "transparent",
                        borderLeft: isActive ? `3px solid ${color}` : "3px solid transparent",
                      }}
                    >
                      <td
                        className="px-3 py-2 font-mono font-semibold"
                        style={{ color }}
                      >
                        {val}
                      </td>
                      <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>
                        {d.label}
                      </td>
                      <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>
                        {d.desc}
                      </td>
                      <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>
                        {d.tip}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sugerencia de Servomecanismo */}
      <div
        className="flex gap-3 rounded-[var(--radius-lg)] p-4"
        style={{
          background: "var(--info-bg)",
          border: "1px solid var(--info-border)",
        }}
      >
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--surface-el)" }}
        >
          <WrenchIcon size={18} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <p
            className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--accent)" }}
          >
            SUGERENCIA DE SERVOMECANISMO
          </p>
          <p className="text-[13px]" style={{ color: "var(--text-primary)" }}>
            {devData?.tip}
          </p>
        </div>
      </div>

      {/* Optional note */}
      <div>
        <textarea
          className="w-full resize-none rounded-[var(--radius-md)] px-4 py-3 text-[14px] outline-none"
          maxLength={300}
          placeholder="Nota adicional (opcional)…"
          rows={2}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* Error message */}
      {actionState.status === "error" && (
        <p className="text-center text-[13px]" style={{ color: "var(--error)" }}>
          {actionState.message}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <button
          className="min-h-[48px] w-full rounded-full text-[15px] font-medium transition-opacity active:opacity-80"
          style={{
            background: "var(--accent)",
            color: "#121008",
          }}
          type="button"
          onClick={handleConfirm}
        >
          Confirmar Calibración
        </button>
        <button
          className="min-h-[48px] w-full text-[15px] transition-opacity active:opacity-80"
          style={{ color: "var(--text-muted)" }}
          type="button"
          onClick={handleSkip}
        >
          Omitir por hoy
        </button>
      </div>
    </div>
  );
}
