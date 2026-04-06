"use client";

import { startTransition, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PainSlider } from "@/components/ui/pain-slider";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SleepHoursInput } from "@/components/ui/sleep-hours-input";
import { SleepQualitySelector } from "@/components/ui/sleep-quality-selector";
import { TextInput } from "@/components/ui/text-input";
import { Toast } from "@/components/ui/toast";
import { MobileSheet } from "@/components/layout/mobile-sheet";
import { TIME_OF_DAY_OPTIONS, TRIGGER_OPTIONS } from "@/lib/constants";
import { saveCheckInAction } from "@/lib/actions/check-ins";
import type { SaveCheckInInput } from "@/lib/actions/check-ins";
import type {
  ActionState,
  TimeOfDay,
  SleepQuality,
  TriggerType,
} from "@/types/domain";
import { cn } from "@/lib/utils";

const defaultPainState = {
  eyelidPain: 0,
  templePain: 0,
  masseterPain: 0,
  cervicalPain: 0,
  orbitalPain: 0,
  stressLevel: 0,
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
  return Math.round(Math.round(clamped / 0.5) * 0.5 * 10) / 10;
}

export function CheckInForm() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("morning");
  const [pain, setPain] = useState(defaultPainState);
  const [sleepHours, setSleepHours] = useState("6");
  const [sleepQuality, setSleepQuality] = useState<SleepQuality>("regular");
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [customTriggerName, setCustomTriggerName] = useState("");
  const [loggedAt, setLoggedAt] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [state, setState] = useState<ActionState>({ status: "idle" });
  const [isPending, setIsPending] = useState(false);
  const [zeroWarning, setZeroWarning] = useState<string | null>(null);
  const [pendingInput, setPendingInput] = useState<SaveCheckInInput | null>(
    null,
  );

  useEffect(() => {
    if (!zeroWarning) return;
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([35, 40, 55]);
    }
  }, [zeroWarning]);

  const updatePain = (key: keyof typeof pain, value: number) => {
    setPain((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const toDatetimeLocal = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  const resolvedTriggerType = (): TriggerType | null => {
    if (timeOfDay !== "trigger" || !selectedTrigger) return null;
    const option = TRIGGER_OPTIONS.find((o) => o.id === selectedTrigger);
    return (option?.value ?? "other") as TriggerType;
  };

  const isTriggerValid =
    timeOfDay !== "trigger" ||
    (selectedTrigger !== null &&
      (selectedTrigger !== "other" || customTriggerName.trim().length > 0));

  const buildPayload = (): SaveCheckInInput => ({
    id: crypto.randomUUID(),
    loggedAt: loggedAt
      ? new Date(loggedAt).toISOString()
      : new Date().toISOString(),
    timeOfDay,
    eyelidPain: pain.eyelidPain,
    templePain: pain.templePain,
    masseterPain: pain.masseterPain,
    cervicalPain: pain.cervicalPain,
    orbitalPain: pain.orbitalPain,
    stressLevel: pain.stressLevel,
    sleepHours: timeOfDay === "morning" ? parseSleepHours(sleepHours) : null,
    sleepQuality: timeOfDay === "morning" ? sleepQuality : null,
    triggerType: resolvedTriggerType(),
    notes:
      timeOfDay === "trigger" &&
      selectedTrigger === "other" &&
      customTriggerName.trim()
        ? customTriggerName.trim()
        : undefined,
  });

  const getZeroValueWarning = (input: SaveCheckInInput): string | null => {
    const trackedValues: Array<{ label: string; value: number }> = [
      { label: "parpados", value: input.eyelidPain },
      { label: "sienes", value: input.templePain },
      { label: "masetero", value: input.masseterPain },
      { label: "cuello / cervical", value: input.cervicalPain },
      { label: "zona orbital", value: input.orbitalPain },
      { label: "nivel de estrés", value: input.stressLevel },
    ];

    if (input.sleepHours !== null && input.sleepHours !== undefined) {
      trackedValues.push({ label: "horas de sueno", value: input.sleepHours });
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
        message: result.message,
      });

      if (result.ok) {
        setPain(defaultPainState);
        setSleepHours("6");
        setSleepQuality("regular");
        setSelectedTrigger(null);
        setCustomTriggerName("");
        setLoggedAt(null);
        setShowDatePicker(false);
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
          <Toast
            message={state.message}
            tone={state.status === "success" ? "success" : "error"}
            onDismiss={() => setState({ status: "idle" })}
          />
        ) : null}

        <SegmentedControl
          label="Momento del dia"
          options={TIME_OF_DAY_OPTIONS}
          value={timeOfDay}
          onChange={setTimeOfDay}
        />
        {timeOfDay === "trigger" ? (
          <div>
            {!showDatePicker ? (
              <button
                type="button"
                className="text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--accent)]"
                onClick={() => {
                  setShowDatePicker(true);
                  setLoggedAt(toDatetimeLocal(new Date()));
                }}
              >
                ¿Olvidaste registrarlo? Cambiar fecha
              </button>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="section-label mb-0">Fecha y hora</p>
                  <button
                    type="button"
                    className="text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--accent)]"
                    onClick={() => {
                      setShowDatePicker(false);
                      setLoggedAt(null);
                    }}
                  >
                    Usar hora actual
                  </button>
                </div>
                <input
                  type="datetime-local"
                  className="h-12 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 font-mono text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] [color-scheme:dark]"
                  max={toDatetimeLocal(new Date())}
                  value={loggedAt ?? ""}
                  onChange={(e) => setLoggedAt(e.target.value)}
                />
              </div>
            )}
          </div>
        ) : null}

        {timeOfDay === "trigger" ? (
          <div className="space-y-4 rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.7)] p-4">
            <p className="section-label">Trigger</p>
            <div className="flex flex-wrap gap-2">
              {TRIGGER_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={cn(
                    "min-h-12 rounded-[999px] border px-4 py-2 text-[13px] font-medium transition-colors",
                    selectedTrigger === option.id
                      ? "border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]"
                      : "border-[var(--border)] bg-transparent text-[var(--text-muted)]",
                  )}
                  onClick={() => {
                    setSelectedTrigger(
                      selectedTrigger === option.id ? null : option.id,
                    );
                    if (option.id !== "other") setCustomTriggerName("");
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {selectedTrigger === "other" ? (
              <TextInput
                placeholder="Nombre del trigger (ej. polvo, humo)"
                value={customTriggerName}
                onChange={(e) => setCustomTriggerName(e.target.value)}
              />
            ) : null}
          </div>
        ) : null}

        <div className="space-y-4 rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.7)] p-4">
          <p className="section-label">Mapa de dolor</p>
          <div className="space-y-5">
            <PainSlider
              label="👁️ Parpados"
              value={pain.eyelidPain}
              onChange={(value) => updatePain("eyelidPain", value)}
            />
            <PainSlider
              label="🧠 Sienes"
              value={pain.templePain}
              onChange={(value) => updatePain("templePain", value)}
            />
            <PainSlider
              label="🎯 Zona Orbital"
              value={pain.orbitalPain}
              onChange={(value) => updatePain("orbitalPain", value)}
            />
            <PainSlider
              label="🦷 Masetero"
              value={pain.masseterPain}
              onChange={(value) => updatePain("masseterPain", value)}
            />
            <PainSlider
              label="🦴 Cuello / Cervical"
              value={pain.cervicalPain}
              onChange={(value) => updatePain("cervicalPain", value)}
            />
          </div>
        </div>

        <div className="space-y-4 rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.7)] p-4">
          <p className="section-label">Estrés</p>
          <PainSlider
            label="🧠 Nivel de estrés"
            value={pain.stressLevel}
            onChange={(value) => updatePain("stressLevel", value)}
          />
        </div>

        {timeOfDay === "morning" ? (
          <div className="space-y-4 rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.7)] p-4">
            <p className="section-label">Sueño</p>
            <SleepHoursInput value={sleepHours} onChange={setSleepHours} />
            <SleepQualitySelector
              value={sleepQuality}
              onChange={setSleepQuality}
            />
          </div>
        ) : null}
      </div>

      <div className="fixed bottom-[calc(var(--tabbar-height)+env(safe-area-inset-bottom))] left-0 right-0 z-20 border-t border-[var(--border)] bg-[rgba(18,16,8,0.94)] px-5 py-4 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[480px]">
          <Button
            className="w-full"
            disabled={isPending || !isTriggerValid}
            type="button"
            onClick={handleSave}
          >
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
          <p className="m-0 text-[15px] leading-6 text-[var(--text-primary)]">
            {zeroWarning}
          </p>
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
