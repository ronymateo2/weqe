"use client";

import { startTransition, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SleepHoursInput } from "@/components/ui/sleep-hours-input";
import { SleepQualitySelector } from "@/components/ui/sleep-quality-selector";
import { StatusBanner } from "@/components/ui/status-banner";
import { saveSleepAction, getTodaySleep } from "@/lib/actions/sleep";
import { queueSleep } from "@/lib/offline/sleep-queue";
import type { ActionState, SleepQuality } from "@/types/domain";

function parseSleepHours(value: string): number | null {
  if (!value.trim()) return null;
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  const clamped = Math.min(12, Math.max(0, parsed));
  return Math.round(Math.round(clamped / 0.5) * 0.5 * 10) / 10;
}

type SleepSheetProps = {
  onSaved: () => void;
};

export function SleepSheet({ onSaved }: SleepSheetProps) {
  const [sleepHours, setSleepHours] = useState("7");
  const [sleepQuality, setSleepQuality] = useState<SleepQuality>("regular");
  const [isUpdating, setIsUpdating] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [state, setState] = useState<ActionState>({ status: "idle" });
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    getTodaySleep().then((record) => {
      if (!record) return;
      setExistingId(record.id);
      setIsUpdating(true);
      setSleepHours(String(record.sleepHours));
      setSleepQuality(record.sleepQuality);
    });
  }, []);

  const handleSave = () => {
    const hours = parseSleepHours(sleepHours);
    if (hours === null) return;

    const input = {
      id: existingId ?? crypto.randomUUID(),
      loggedAt: new Date().toISOString(),
      sleepHours: hours,
      sleepQuality,
    };

    setIsPending(true);

    startTransition(async () => {
      if (!navigator.onLine) {
        await queueSleep(input);
        setState({
          status: "success",
          message: "Guardado sin conexion. Se sincronizara al reconectar.",
        });
        setTimeout(onSaved, 800);
        setIsPending(false);
        return;
      }

      try {
        const result = await saveSleepAction(input);
        if (result.ok) {
          onSaved();
        } else {
          setState({ status: "error", message: result.message });
        }
      } catch {
        await queueSleep(input);
        setState({
          status: "success",
          message: "Guardado sin conexion. Se sincronizara al reconectar.",
        });
        setTimeout(onSaved, 800);
      }

      setIsPending(false);
    });
  };

  return (
    <>
      <div className="space-y-5 pb-4">
        {state.status !== "idle" && state.message ? (
          <StatusBanner
            message={state.message}
            tone={state.status === "success" ? "success" : "error"}
          />
        ) : null}

        <SleepHoursInput value={sleepHours} onChange={setSleepHours} />
        <SleepQualitySelector value={sleepQuality} onChange={setSleepQuality} />
      </div>

      <div
        className="sticky bottom-0 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3"
        style={{
          background:
            "linear-gradient(to top, rgba(18,16,8,1) 60%, rgba(18,16,8,0))",
        }}
      >
        <Button
          className="w-full"
          disabled={isPending}
          type="button"
          onClick={handleSave}
        >
          {isPending
            ? "Guardando..."
            : isUpdating
              ? "Actualizar sueno"
              : "Guardar sueno"}
        </Button>
      </div>
    </>
  );
}
