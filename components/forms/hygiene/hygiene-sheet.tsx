"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VisorIcon, TrophyIcon, WrenchIcon } from "@phosphor-icons/react";
import {
  saveLidHygieneAction,
  getLidHygieneHistoryAction,
} from "@/lib/actions/lid-hygiene";
import { queueHygiene } from "@/lib/offline/lid-hygiene-queue";
import type {
  HygieneRecord,
  SaveHygieneInput,
  ActionState,
} from "@/types/domain";
import { View, identityLabel } from "./constants";
import { CalibratingView } from "./calibrating-view";
import { VictoriasView } from "./victorias-view";
import { ServoView } from "./servo-view";

export function HygieneSheet({ onSaved }: { onSaved: () => void }) {
  const [displayedView, setDisplayedView] = useState<View>("main");
  const [transitioning, setTransitioning] = useState(false);
  const pendingTransition = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const [pendingSave, setPendingSave] = useState<{
    id: string;
    loggedAt: string;
  } | null>(null);
  const [selectedFriction, setSelectedFriction] = useState<number | null>(null);
  const [actionState, setActionState] = useState<ActionState>({
    status: "idle",
  });
  const [historyData, setHistoryData] = useState<HygieneRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const isSaving = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    getLidHygieneHistoryAction(12)
      .then(setHistoryData)
      .finally(() => setLoading(false));
    return () => {
      if (pendingTransition.current) clearTimeout(pendingTransition.current);
    };
  }, []);

  const transitionTo = useCallback((next: View) => {
    setTransitioning(true);
    pendingTransition.current = setTimeout(() => {
      setDisplayedView(next);
      setTransitioning(false);
    }, 180);
  }, []);

  const todayKey = new Date().toLocaleDateString("en-CA");

  const {
    totalCompleted,
    cycleNumber,
    sessionInCycle,
    progressPct,
    identity,
    todaySessions,
  } = useMemo(() => {
    const completed = historyData.filter((r) => r.status === "completed");
    const uniqueDays = new Set(completed.map((r) => r.dayKey));
    const total = uniqueDays.size;
    const inCycle = total % 21;
    return {
      totalCompleted: total,
      cycleNumber: Math.floor(total / 21) + 1,
      sessionInCycle: inCycle,
      progressPct: Math.round((inCycle / 21) * 100),
      identity: identityLabel(inCycle),
      todaySessions: completed.filter((r) => r.dayKey === todayKey).length,
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
      transitionTo("calibrating");
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

  // ── Animated view wrapper ──
  return (
    <div
      style={{
        opacity: transitioning ? 0 : 1,
        transform: transitioning ? "translateY(6px)" : "translateY(0)",
        transition: transitioning
          ? "opacity 180ms cubic-bezier(0.4,0,1,1), transform 180ms cubic-bezier(0.4,0,1,1)"
          : "opacity 220ms cubic-bezier(0,0,0.2,1), transform 220ms cubic-bezier(0,0,0.2,1)",
      }}
    >
      {displayedView === "calibrating" && (
        <CalibratingView
          actionState={actionState}
          selectedFriction={selectedFriction}
          onOmit={onSaved}
          onSave={handleCalibrationSave}
          onSelect={setSelectedFriction}
        />
      )}

      {displayedView === "victorias" && (
        <VictoriasView
          records={historyData}
          onBack={() => transitionTo("main")}
        />
      )}

      {displayedView === "servo" && (
        <ServoView records={historyData} onBack={() => transitionTo("main")} />
      )}

      {displayedView === "main" && (
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
              className="flex w-full flex-col items-center justify-center rounded-[var(--radius-lg)] transition-all active:opacity-75 active:scale-[0.97]"
              style={{
                minHeight: 160,
                background: "var(--surface)",
                border: `1px solid ${todaySessions > 0 ? "rgba(212,162,76,0.5)" : "var(--border)"}`,
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

            {/* Session badge — shows up to 3 icons, +N overflow after 3 */}
            {todaySessions > 0 && (
              <div
                className="absolute right-3 top-3 flex items-center gap-[3px] rounded-full px-[8px] py-[5px]"
                style={{
                  background: "var(--accent-dim)",
                  border: "1px solid rgba(212,162,76,0.3)",
                }}
              >
                {Array.from({ length: Math.min(todaySessions, 3) }, (_, i) => (
                  <VisorIcon
                    key={i}
                    size={16}
                    weight="fill"
                    style={{ color: "var(--accent)" }}
                  />
                ))}
                {todaySessions > 3 && (
                  <span
                    className="font-mono text-[8px] font-bold"
                    style={{ color: "var(--accent)" }}
                  >
                    +{todaySessions - 3}
                  </span>
                )}
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
              <p
                className="leading-none"
                style={{ color: "var(--text-primary)" }}
              >
                <span className="font-mono text-[32px] font-light">
                  {sessionInCycle}
                </span>
                <span
                  className="font-mono text-[16px] font-light"
                  style={{ color: "var(--text-muted)" }}
                >
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
              <span
                className="text-[12px] font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                Ciclo {cycleNumber} de identidad
              </span>
              <span
                className="font-mono text-[12px]"
                style={{ color: "var(--accent)" }}
              >
                {progressPct}%
              </span>
            </div>
            <div
              className="h-[6px] w-full overflow-hidden rounded-full"
              style={{ background: "var(--surface-el)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progressPct}%`,
                  background: "var(--accent)",
                  transition: mounted.current
                    ? "width 500ms cubic-bezier(0,0,0.2,1)"
                    : "none",
                }}
              />
            </div>
          </div>

          {/* Victorias / Servo */}
          <div className="flex gap-3">
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-[13px] font-semibold transition-opacity active:opacity-70"
              style={{
                minHeight: 48,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
              type="button"
              onClick={() => transitionTo("victorias")}
            >
              <TrophyIcon size={14} />
              Victorias
            </button>
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-[13px] font-semibold transition-opacity active:opacity-70"
              style={{
                minHeight: 48,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
              type="button"
              onClick={() => transitionTo("servo")}
            >
              <WrenchIcon size={14} />
              Servo
            </button>
          </div>

          {/* Error */}
          {actionState.status === "error" && (
            <p
              className="text-center text-[13px]"
              style={{ color: "var(--error)" }}
            >
              {actionState.message}
            </p>
          )}

          {/* Skip */}
          <button
            className="min-h-[48px] py-3 text-[14px] transition-opacity active:opacity-60"
            style={{ color: "var(--text-faint)" }}
            type="button"
            onClick={handleSkip}
          >
            — omitir por hoy —
          </button>
        </div>
      )}
    </div>
  );
}
