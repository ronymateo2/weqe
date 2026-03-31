"use client";

import { startTransition, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PainSlider } from "@/components/ui/pain-slider";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SleepHoursInput } from "@/components/ui/sleep-hours-input";
import { StatusBanner } from "@/components/ui/status-banner";
import { MobileSheet } from "@/components/layout/mobile-sheet";
import { TIME_OF_DAY_OPTIONS } from "@/lib/constants";
import { saveCheckInAction } from "@/lib/actions/check-ins";
import type { SaveCheckInInput } from "@/lib/actions/check-ins";
import type { ActionState, TimeOfDay } from "@/types/domain";

const defaultPainState = {
  eyelidPain: 0,
  templePain: 0,
  masseterPain: 0,
  overallPain: 0
};

function parseSleepHours(value: string) {
  if (!value.trim()) {
    return null;
  }

  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  const clamped = Math.min(12, Math.max(0, parsed));
  return Math.round((Math.round(clamped / 0.5) * 0.5) * 10) / 10;
}

export function CheckInForm() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("morning");
  const [pain, setPain] = useState(defaultPainState);
  const [sleepHours, setSleepHours] = useState("6");
  const [sleepQuality, setSleepQuality] = useState(5);
  const [state, setState] = useState<ActionState>({ status: "idle" });
  const [isPending, setIsPending] = useState(false);
  const [zeroWarning, setZeroWarning] = useState<string | null>(null);
  const [pendingInput, setPendingInput] = useState<SaveCheckInInput | null>(null);

  useEffect(() => {
    if (!zeroWarning) return;
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([35, 40, 55]);
    }
  }, [zeroWarning]);

  const updatePain = (key: keyof typeof pain, value: number) => {
    setPain((current) => ({
      ...current,
      [key]: value
    }));
  };

  const buildPayload = (): SaveCheckInInput => ({
    id: crypto.randomUUID(),
    loggedAt: new Date().toISOString(),
    timeOfDay,
    eyelidPain: pain.eyelidPain,
    templePain: pain.templePain,
    masseterPain: pain.masseterPain,
    overallPain: pain.overallPain,
    sleepHours: timeOfDay === "morning" ? parseSleepHours(sleepHours) : null,
    sleepQuality: timeOfDay === "morning" ? sleepQuality : null
  });

  const getZeroValueWarning = (input: SaveCheckInInput): string | null => {
    const trackedValues: Array<{ label: string; value: number }> = [
      { label: "parpados", value: input.eyelidPain },
      { label: "sienes", value: input.templePain },
      { label: "masetero", value: input.masseterPain },
      { label: "dolor general", value: input.overallPain }
    ];

    if (input.sleepHours !== null && input.sleepHours !== undefined) {
      trackedValues.push({ label: "horas de sueno", value: input.sleepHours });
    }

    if (input.sleepQuality !== null && input.sleepQuality !== undefined) {
      trackedValues.push({ label: "calidad del sueno", value: input.sleepQuality });
    }

    const zeroValues = trackedValues.filter((field) => field.value === 0);

    if (zeroValues.length === 0) {
      return null;
    }

    const allValuesAreZero = trackedValues.every((field) => field.value === 0);

    if (allValuesAreZero) {
      return "Todos los valores estan en 0. Vas a guardar el registro igual. Deseas continuar?";
    }

    return `Vas a guardar valores en 0 para: ${zeroValues.map((field) => field.label).join(", ")}. Deseas continuar?`;
  };

  const submitCheckIn = (input: SaveCheckInInput) => {
    setIsPending(true);

    startTransition(async () => {
      const result = await saveCheckInAction(input);

      setState({
        status: result.ok ? "success" : "error",
        message: result.message
      });

      if (result.ok) {
        setPain(defaultPainState);
        setSleepHours("6");
      }

      setIsPending(false);
    });
  };

  const closeZeroWarning = () => {
    setZeroWarning(null);
    setPendingInput(null);
  };

  const confirmSaveWithZeros = () => {
    if (!pendingInput) {
      closeZeroWarning();
      return;
    }

    const input = pendingInput;
    closeZeroWarning();
    submitCheckIn(input);
  };

  const handleSave = () => {
    const input = buildPayload();
    const warningMessage = getZeroValueWarning(input);

    if (!warningMessage) {
      submitCheckIn(input);
      return;
    }

    setPendingInput(input);
    setZeroWarning(warningMessage);
  };

  return (
    <div className="relative pb-[calc(var(--sticky-cta-height)+32px)]">
      <div className="space-y-6">
        {state.status !== "idle" && state.message ? (
          <StatusBanner message={state.message} tone={state.status === "success" ? "success" : "error"} />
        ) : null}

        <SegmentedControl
          label="Momento del dia"
          options={TIME_OF_DAY_OPTIONS}
          value={timeOfDay}
          onChange={setTimeOfDay}
        />

        <div className="space-y-5">
          <PainSlider label="Parpados" value={pain.eyelidPain} onChange={(value) => updatePain("eyelidPain", value)} />
          <PainSlider label="Sienes" value={pain.templePain} onChange={(value) => updatePain("templePain", value)} />
          <PainSlider
            label="Masetero"
            value={pain.masseterPain}
            onChange={(value) => updatePain("masseterPain", value)}
          />
          <PainSlider label="Dolor general" value={pain.overallPain} onChange={(value) => updatePain("overallPain", value)} />
        </div>

        {timeOfDay === "morning" ? (
          <div className="space-y-4 rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.7)] p-4">
            <p className="section-label">Sueno</p>
            <SleepHoursInput value={sleepHours} onChange={setSleepHours} />
            <PainSlider label="Calidad del sueno" value={sleepQuality} onChange={setSleepQuality} />
          </div>
        ) : null}
      </div>

      <div className="fixed bottom-[calc(var(--tabbar-height)+env(safe-area-inset-bottom))] left-0 right-0 z-20 border-t border-[var(--border)] bg-[rgba(18,16,8,0.94)] px-5 py-4 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[480px]">
          <Button className="w-full" disabled={isPending} type="button" onClick={handleSave}>
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      <MobileSheet
        description="Revisa antes de confirmar."
        open={Boolean(zeroWarning)}
        panelClassName="warning-sheet-attention"
        title="Confirmar valores en cero"
        onClose={closeZeroWarning}
      >
        <div className="space-y-5">
          <p className="m-0 text-[15px] leading-6 text-[var(--text-primary)]">{zeroWarning}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button variant="subtle" onClick={closeZeroWarning}>
              Revisar registro
            </Button>
            <Button onClick={confirmSaveWithZeros}>Guardar igual</Button>
          </div>
        </div>
      </MobileSheet>
    </div>
  );
}
