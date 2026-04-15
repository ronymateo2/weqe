"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ArrowLeftIcon, TrophyIcon, WrenchIcon } from "@phosphor-icons/react";
import { saveLidHygieneAction, getLidHygieneHistoryAction } from "@/lib/actions/lid-hygiene";
import { queueHygiene } from "@/lib/offline/lid-hygiene-queue";
import type { HygieneRecord, SaveHygieneInput, ActionState } from "@/types/domain";

// ─── Types ────────────────────────────────────────────────────────────────────

type View = "main" | "calibrating" | "victorias" | "servo";

// ─── Constants ────────────────────────────────────────────────────────────────

const FRICTION_LEVELS = [
  { val: 0, label: "FLUJO\nTOTAL",  desc: "Hábito automático, sin resistencia." },
  { val: 1, label: "MUY\nPOCA",     desc: "Mínima fricción. El servo apenas trabajó." },
  { val: 2, label: "MODERADA",      desc: "Fricción moderada. El servo trabaja con normalidad." },
  { val: 3, label: "NOTABLE",       desc: "Resistencia notable. Señal de corrección significativa." },
  { val: 4, label: "ALTA",          desc: "Alta resistencia. Señal valiosa para el sistema." },
  { val: 5, label: "MÁXIMA",        desc: "Máxima corrección. El servo tiene material de trabajo." },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function identityLabel(n: number): string {
  if (n === 0)   return "Despertando";
  if (n <= 4)    return "Activando";
  if (n <= 9)    return "Constante";
  if (n <= 14)   return "Disciplinado";
  if (n <= 19)   return "Consolidado";
  return "Automatizado";
}

// ─── Calibrating View ─────────────────────────────────────────────────────────

function CalibratingView({
  selectedFriction,
  onSelect,
  onSave,
  onOmit,
  actionState,
}: {
  selectedFriction: number | null;
  onSelect: (v: number) => void;
  onSave: () => void;
  onOmit: () => void;
  actionState: ActionState;
}) {
  const level =
    selectedFriction !== null ? FRICTION_LEVELS[selectedFriction] : null;

  return (
    <div className="flex flex-col items-center gap-5 px-5 pb-8">
      {/* Chip */}
      <div className="w-full">
        <span
          className="rounded-full px-3 py-[5px] text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          Calibrador de Fricción
        </span>
      </div>

      {/* Check circle */}
      <div
        className="flex h-[80px] w-[80px] items-center justify-center rounded-full"
        style={{ border: "2px solid var(--accent)" }}
      >
        <span className="text-[34px] leading-none" style={{ color: "var(--accent)" }}>
          ✓
        </span>
      </div>

      {/* Confirmation */}
      <div className="text-center">
        <p
          className="text-[26px] font-semibold leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Acción registrada
        </p>
        <p className="mt-1 text-[13px]" style={{ color: "var(--text-muted)" }}>
          Tu identidad se actualiza con cada acción.
        </p>
      </div>

      {/* Friction card */}
      <div
        className="w-full rounded-[var(--radius-lg)] p-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <p
          className="mb-[3px] text-[11px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: "var(--text-muted)" }}
        >
          Calibrador de Fricción{" "}
          <span
            className="font-normal lowercase tracking-normal"
            style={{ color: "var(--text-faint)" }}
          >
            (Opcional)
          </span>
        </p>
        <p className="mb-4 text-[12px] italic leading-snug" style={{ color: "var(--text-muted)" }}>
          ¿Cuánta resistencia tuvo que superar el servo hoy? No es un fallo — es la señal de
          corrección que usa para alinearse.
        </p>

        {/* 0–5 buttons */}
        <div className="grid grid-cols-6 gap-[5px]">
          {FRICTION_LEVELS.map(({ val, label }) => {
            const isSelected = selectedFriction === val;
            return (
              <button
                key={val}
                className="flex flex-col items-center justify-center rounded-[var(--radius-md)] py-3 transition-all active:scale-95"
                style={{
                  minHeight: 64,
                  background: isSelected ? "var(--accent-dim)" : "var(--surface-el)",
                  border: `1px solid ${isSelected ? "rgba(212,162,76,0.5)" : "var(--border)"}`,
                }}
                type="button"
                onClick={() => onSelect(val)}
              >
                <span
                  className="font-mono text-[22px] font-semibold leading-none"
                  style={{ color: isSelected ? "var(--accent)" : "var(--text-primary)" }}
                >
                  {val}
                </span>
                <span
                  className="mt-[3px] whitespace-pre-line text-center text-[7px] uppercase leading-tight"
                  style={{
                    color: isSelected ? "var(--accent)" : "var(--text-faint)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected description + save */}
        {level && (
          <>
            <p className="mt-3 text-[12px] italic" style={{ color: "var(--text-muted)" }}>
              {level.desc}
            </p>
            <button
              className="mt-3 flex w-full items-center justify-center rounded-full py-[10px] text-[14px] font-medium transition-opacity active:opacity-70"
              style={{
                background: "var(--surface-el)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              type="button"
              onClick={onSave}
            >
              Guardar señal →
            </button>
          </>
        )}
      </div>

      {/* Error */}
      {actionState.status === "error" && (
        <p className="text-center text-[13px]" style={{ color: "var(--error)" }}>
          {actionState.message}
        </p>
      )}

      {/* Omit */}
      <button
        className="w-full rounded-[var(--radius-lg)] py-3 text-[14px] transition-opacity active:opacity-60"
        style={{ border: "1px solid var(--border)", color: "var(--text-faint)" }}
        type="button"
        onClick={onOmit}
      >
        omitir calibración
      </button>
    </div>
  );
}

// ─── Victorias View ───────────────────────────────────────────────────────────

function VictoriasView({
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
    const completed = recs.some((r) => r.status === "completed");
    const isToday = key === todayKey;
    if (!completed) return { completed: false, dot: null as null | "low" | "high" | "gray", isToday };
    const calibrated = recs.filter((r) => r.status === "completed" && r.deviationValue > 0);
    if (calibrated.length === 0) return { completed, dot: "gray" as const, isToday };
    const avg = calibrated.reduce((a, b) => a + b.deviationValue, 0) / calibrated.length;
    return { completed, dot: avg <= 2 ? ("low" as const) : ("high" as const), isToday };
  }

  return (
    <div className="flex flex-col gap-4 px-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-2 rounded-full px-3 py-2 text-[13px] font-medium transition-opacity active:opacity-70"
          style={{
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
          style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
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
              const { completed, dot, isToday } = getDayInfo(d);
              const dayNum = d.getDate();
              const dotColor =
                dot === "low" ? "var(--accent)" : dot === "high" ? "#cc3f30" : "var(--border)";

              return (
                <div key={col} className="relative flex flex-col items-center">
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
                  {dot && (
                    <div
                      className="absolute bottom-[-2px] right-0 h-[6px] w-[6px] rounded-full"
                      style={{ background: dotColor }}
                    />
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
            <div className="h-[7px] w-[7px] rounded-full" style={{ background: color }} />
            <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
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
        "No cuentes los días sin acción. El servo no trabaja con ausencias — solo con señales
        positivas."
      </p>
    </div>
  );
}

// ─── Servo View ───────────────────────────────────────────────────────────────

function ServoView({
  records,
  onBack,
}: {
  records: HygieneRecord[];
  onBack: () => void;
}) {
  const { trajectoryData, distributionData, insight } = useMemo(() => {
    const completed = records
      .filter((r) => r.status === "completed")
      .slice()
      .reverse(); // chronological

    // Trajectory: all completed sessions (dev=0 = flow, dev>0 = friction)
    const ys = completed.map((r) => r.deviationValue);
    const { slope, intercept } = (() => {
      const n = ys.length;
      if (n < 2) return { slope: 0, intercept: 0 };
      const sumX = (n * (n - 1)) / 2;
      const sumY = ys.reduce((a, b) => a + b, 0);
      const sumXY = ys.reduce((s, y, i) => s + i * y, 0);
      const sumX2 = ys.reduce((s, _, i) => s + i * i, 0);
      const denom = n * sumX2 - sumX * sumX;
      if (denom === 0) return { slope: 0, intercept: sumY / n };
      return {
        slope: (n * sumXY - sumX * sumY) / denom,
        intercept: (sumY - ((n * sumXY - sumX * sumY) / denom) * sumX) / n,
      };
    })();

    const trajectoryData = completed.map((r, i) => ({
      label: r.dayKey.slice(5).replace("-", "/"),
      friction: r.deviationValue,
      trend: Math.max(0, Math.min(5, Math.round((slope * i + intercept) * 10) / 10)),
    }));

    // Distribution: count per level 0–5
    const counts = [0, 0, 0, 0, 0, 0];
    for (const r of completed) {
      if (r.deviationValue >= 0 && r.deviationValue <= 5) counts[r.deviationValue]++;
    }
    const distributionData = counts.map((count, val) => ({ val: String(val), count }));

    // Insight: compare first vs second half of calibrated sessions
    const calibrated = completed.filter((r) => r.deviationValue > 0);
    let insight: string | null = null;
    if (calibrated.length >= 4) {
      const half = Math.floor(calibrated.length / 2);
      const firstAvg = calibrated.slice(0, half).reduce((a, b) => a + b.deviationValue, 0) / half;
      const secondAvg =
        calibrated.slice(half).reduce((a, b) => a + b.deviationValue, 0) /
        (calibrated.length - half);
      if (secondAvg < firstAvg - 0.5)
        insight = "El servo está instalando la identidad. Menos corrección necesaria cada vez.";
      else if (secondAvg > firstAvg + 0.5)
        insight = "El servo está trabajando más. La corrección activa indica que el sistema opera.";
      else insight = "El servo mantiene equilibrio. Trayectoria estable — identidad consolidándose.";
    }

    return { trajectoryData, distributionData, insight };
  }, [records]);

  const completedCount = records.filter((r) => r.status === "completed").length;
  const calibratedCount = records.filter(
    (r) => r.status === "completed" && r.deviationValue > 0,
  ).length;

  const tooltipStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 11,
    color: "var(--text-primary)",
  };

  return (
    <div className="flex flex-col gap-4 px-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-2 rounded-full px-3 py-2 text-[13px] font-medium transition-opacity active:opacity-70"
          style={{
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
          style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          Trayectoria del Servo
        </span>
      </div>

      {/* Trajectory chart */}
      <div
        className="rounded-[var(--radius-lg)] p-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <p
          className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: "var(--text-muted)" }}
        >
          Fricción en el Tiempo — Corrección del Servo
        </p>

        {completedCount < 2 ? (
          <div className="flex h-[100px] items-center justify-center">
            <p className="text-center text-[13px]" style={{ color: "var(--text-faint)" }}>
              Registra al menos 2 victorias calibradas para ver la trayectoria.
            </p>
          </div>
        ) : (
          <div className="h-[120px]">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={trajectoryData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--text-faint)", fontSize: 8 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 5]}
                  ticks={[0, 2, 4]}
                  tick={{ fill: "var(--text-faint)", fontSize: 8 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: number) => [val, "Fricción"]}
                />
                <Line
                  connectNulls={false}
                  dataKey="friction"
                  dot={{ fill: "var(--accent)", r: 3, strokeWidth: 0 }}
                  stroke="var(--accent)"
                  strokeWidth={1.5}
                  type="monotone"
                />
                {calibratedCount >= 3 && (
                  <Line
                    connectNulls
                    dataKey="trend"
                    dot={false}
                    stroke="var(--accent)"
                    strokeWidth={1}
                    strokeDasharray="3 2"
                    strokeOpacity={0.45}
                    type="monotone"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        <div className="mt-2 flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="h-[6px] w-[6px] rounded-full" style={{ background: "var(--accent)" }} />
            <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
              Fricción diaria
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="h-[2px] w-[14px]"
              style={{ background: "var(--accent)", opacity: 0.45 }}
            />
            <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
              Tendencia
            </span>
          </div>
        </div>
        {calibratedCount < 3 && completedCount >= 2 && (
          <p className="mt-1 text-[11px] italic" style={{ color: "var(--text-faint)" }}>
            Registra al menos 3 victorias con calibración para ver la tendencia.
          </p>
        )}
      </div>

      {/* Distribution chart */}
      <div
        className="rounded-[var(--radius-lg)] p-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <p
          className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: "var(--text-muted)" }}
        >
          Distribución de Señales de Corrección
        </p>
        <div className="h-[100px]">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={distributionData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
              <XAxis
                dataKey="val"
                tick={{ fill: "var(--text-faint)", fontSize: 9 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-faint)", fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: number) => [val, "Señales"]}
              />
              <Bar dataKey="count" fill="var(--accent)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insight */}
      {insight && (
        <p
          className="text-center text-[12px] italic leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          "{insight}"
        </p>
      )}

      {/* Quote */}
      <p
        className="text-center text-[12px] italic leading-relaxed"
        style={{ color: "var(--text-faint)" }}
      >
        "Fricción alta no es fallo. Es el servo trabajando. La trayectoria descendente es la
        identidad instalándose."
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function HygieneSheet({ onSaved }: { onSaved: () => void }) {
  const [view, setView] = useState<View>("main");
  const [pendingSave, setPendingSave] = useState<{ id: string; loggedAt: string } | null>(null);
  const [selectedFriction, setSelectedFriction] = useState<number | null>(null);
  const [actionState, setActionState] = useState<ActionState>({ status: "idle" });
  const [historyData, setHistoryData] = useState<HygieneRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const isSaving = useRef(false);

  useEffect(() => {
    getLidHygieneHistoryAction(12)
      .then(setHistoryData)
      .finally(() => setLoading(false));
  }, []);

  const todayKey = new Date().toLocaleDateString("en-CA");

  const { totalCompleted, cycleNumber, sessionInCycle, progressPct, identity, doneToday } =
    useMemo(() => {
      const completed = historyData.filter((r) => r.status === "completed");
      const total = completed.length;
      const inCycle = total % 21;
      return {
        totalCompleted: total,
        cycleNumber: Math.floor(total / 21) + 1,
        sessionInCycle: inCycle,
        progressPct: Math.round((inCycle / 21) * 100),
        identity: identityLabel(inCycle),
        doneToday: completed.some((r) => r.dayKey === todayKey),
      };
    }, [historyData, todayKey]);

  async function saveHygiene(input: SaveHygieneInput): Promise<boolean> {
    if (!navigator.onLine) {
      await queueHygiene(input);
      return true;
    }
    try {
      const result = await saveLidHygieneAction(input);
      if (!result.ok) {
        setActionState({ status: "error", message: result.message });
        return false;
      }
      return true;
    } catch {
      await queueHygiene(input);
      return true;
    }
  }

  async function handleLoHice() {
    if (isSaving.current) return;
    isSaving.current = true;
    setActionState({ status: "idle" });

    const id = crypto.randomUUID();
    const loggedAt = new Date().toISOString();

    const ok = await saveHygiene({
      id,
      loggedAt,
      status: "completed",
      deviationValue: 0,
      frictionType: "none",
    });

    isSaving.current = false;
    if (ok) {
      setPendingSave({ id, loggedAt });
      setSelectedFriction(null);
      setView("calibrating");
    }
  }

  async function handleCalibrationSave() {
    if (!pendingSave || selectedFriction === null || isSaving.current) return;
    isSaving.current = true;
    setActionState({ status: "idle" });

    const ok = await saveHygiene({
      id: pendingSave.id,
      loggedAt: pendingSave.loggedAt,
      status: "completed",
      deviationValue: selectedFriction,
      frictionType: "none",
    });

    isSaving.current = false;
    if (ok) onSaved();
  }

  async function handleSkip() {
    if (isSaving.current) return;
    isSaving.current = true;

    await saveHygiene({
      id: crypto.randomUUID(),
      loggedAt: new Date().toISOString(),
      status: "skipped",
      deviationValue: 0,
      frictionType: "none",
    });

    isSaving.current = false;
    onSaved();
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="flex flex-col gap-4 px-5 pb-8">
        {[100, 160, 80].map((h, i) => (
          <div
            key={i}
            className="animate-pulse rounded-[var(--radius-lg)]"
            style={{ height: h, background: "var(--surface-el)" }}
          />
        ))}
      </div>
    );
  }

  // ── Calibrating ──
  if (view === "calibrating") {
    return (
      <CalibratingView
        actionState={actionState}
        selectedFriction={selectedFriction}
        onOmit={onSaved}
        onSave={handleCalibrationSave}
        onSelect={setSelectedFriction}
      />
    );
  }

  // ── Victorias ──
  if (view === "victorias") {
    return <VictoriasView records={historyData} onBack={() => setView("main")} />;
  }

  // ── Servo ──
  if (view === "servo") {
    return <ServoView records={historyData} onBack={() => setView("main")} />;
  }

  // ── Main ──
  return (
    <div className="flex flex-col gap-5 px-5 pb-8">
      {/* Identity header */}
      <div className="pt-1 text-center">
        <p
          className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--text-muted)" }}
        >
          TU IDENTIDAD ACTUAL
        </p>
        <p
          className="text-[28px] font-semibold leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {identity}
        </p>
      </div>

      {/* LO HICE card */}
      <div className="relative">
        <button
          className="flex w-full flex-col items-center justify-center rounded-[var(--radius-lg)] transition-opacity active:opacity-75"
          style={{
            minHeight: 160,
            background: "var(--surface)",
            border: `1px solid ${doneToday ? "rgba(212,162,76,0.5)" : "var(--border)"}`,
          }}
          type="button"
          onClick={handleLoHice}
        >
          <p
            className="text-[42px] font-semibold leading-none tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            LO
            <br />
            HICE
          </p>
          <p
            className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--text-faint)" }}
          >
            REGISTRAR ACCIÓN
          </p>
        </button>
        {doneToday && (
          <div
            className="absolute right-3 top-3 rounded-full px-2 py-[3px] text-[9px] font-semibold"
            style={{
              background: "var(--accent-dim)",
              border: "1px solid rgba(212,162,76,0.3)",
              color: "var(--accent)",
              letterSpacing: "0.06em",
            }}
          >
            HOY ✓
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-[var(--radius-lg)] px-4 py-3"
          style={{ background: "var(--surface)" }}
        >
          <p
            className="font-mono text-[32px] font-light leading-none"
            style={{ color: "var(--text-primary)" }}
          >
            {totalCompleted}
          </p>
          <p
            className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--text-muted)" }}
          >
            Señales de Identidad
          </p>
        </div>
        <div
          className="rounded-[var(--radius-lg)] px-4 py-3"
          style={{ background: "var(--surface)" }}
        >
          <p className="leading-none" style={{ color: "var(--text-primary)" }}>
            <span className="font-mono text-[32px] font-light">{sessionInCycle}</span>
            <span className="font-mono text-[16px] font-light" style={{ color: "var(--text-muted)" }}>
              /21
            </span>
          </p>
          <p
            className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--text-muted)" }}
          >
            Este Ciclo
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="rounded-[var(--radius-lg)] px-4 py-3"
        style={{ background: "var(--surface)" }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] font-semibold" style={{ color: "var(--text-muted)" }}>
            Ciclo {cycleNumber} de identidad
          </span>
          <span className="font-mono text-[12px]" style={{ color: "var(--accent)" }}>
            {progressPct}%
          </span>
        </div>
        <div
          className="h-[6px] w-full overflow-hidden rounded-full"
          style={{ background: "var(--surface-el)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, background: "var(--accent)" }}
          />
        </div>
      </div>

      {/* Victorias / Servo */}
      <div className="flex gap-3">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-[13px] font-semibold transition-opacity active:opacity-70"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
          type="button"
          onClick={() => setView("victorias")}
        >
          <TrophyIcon size={14} />
          Victorias
        </button>
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-[13px] font-semibold transition-opacity active:opacity-70"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
          type="button"
          onClick={() => setView("servo")}
        >
          <WrenchIcon size={14} />
          Servo
        </button>
      </div>

      {/* Error */}
      {actionState.status === "error" && (
        <p className="text-center text-[13px]" style={{ color: "var(--error)" }}>
          {actionState.message}
        </p>
      )}

      {/* Skip */}
      <button
        className="py-3 text-[14px] transition-opacity active:opacity-60"
        style={{ color: "var(--text-faint)" }}
        type="button"
        onClick={handleSkip}
      >
        — omitir por hoy —
      </button>
    </div>
  );
}
