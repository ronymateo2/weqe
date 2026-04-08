"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { PainSlider } from "@/components/ui/pain-slider";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SleepHoursInput } from "@/components/ui/sleep-hours-input";
import { SleepQualitySelector } from "@/components/ui/sleep-quality-selector";
import { TextInput } from "@/components/ui/text-input";
import { Toast } from "@/components/ui/toast";
import { TIME_OF_DAY_OPTIONS, TRIGGER_OPTIONS } from "@/lib/constants";

import { saveCheckInAction } from "@/lib/actions/check-ins";
import type { SaveCheckInInput } from "@/lib/actions/check-ins";
import { queueCheckIn } from "@/lib/offline/check-ins-queue";
import type {
  ActionState,
  TimeOfDay,
  SleepQuality,
  TriggerType,
} from "@/types/domain";
import { Bone, Brain, Crosshair, Eye, Smiley, Lightning } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const MobileSheet = dynamic(
  () => import("@/components/layout/mobile-sheet").then((m) => ({ default: m.MobileSheet })),
  { ssr: false },
);

const DateTimeWheelPicker = dynamic(
  () => import("@/components/ui/datetime-wheel-picker").then((m) => ({ default: m.DateTimeWheelPicker })),
  { ssr: false },
);

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
  const [isOnline, setIsOnline] = useState(true);
  const [zeroWarning, setZeroWarning] = useState<string | null>(null);
  const [pendingInput, setPendingInput] = useState<SaveCheckInInput | null>(
    null,
  );

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

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

  const updateEyelidPain = useCallback((v: number) => setPain((p) => ({ ...p, eyelidPain: v })), []);
  const updateTemplePain = useCallback((v: number) => setPain((p) => ({ ...p, templePain: v })), []);
  const updateOrbitalPain = useCallback((v: number) => setPain((p) => ({ ...p, orbitalPain: v })), []);
  const updateMasseterPain = useCallback((v: number) => setPain((p) => ({ ...p, masseterPain: v })), []);
  const updateCervicalPain = useCallback((v: number) => setPain((p) => ({ ...p, cervicalPain: v })), []);
  const updateStressLevel = useCallback((v: number) => setPain((p) => ({ ...p, stressLevel: v })), []);

  const resolvedTriggerType = (): TriggerType | null => {
    if (timeOfDay !== "trigger" || !selectedTrigger) return null;
    const option = TRIGGER_OPTIONS.find((o) => o.id === selectedTrigger);
    return (option?.value ?? "other") as TriggerType;
  };

  const isTriggerValid = useMemo(
    () =>
      timeOfDay !== "trigger" ||
      (selectedTrigger !== null &&
        (selectedTrigger !== "other" || customTriggerName.trim().length > 0)),
    [timeOfDay, selectedTrigger, customTriggerName],
  );

  const buildPayload = (): SaveCheckInInput => ({
    id: crypto.randomUUID(),
    loggedAt: loggedAt ?? new Date().toISOString(),
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

  const resetForm = () => {
    setPain(defaultPainState);
    setSleepHours("6");
    setSleepQuality("regular");
    setSelectedTrigger(null);
    setCustomTriggerName("");
    setLoggedAt(null);
    setShowDatePicker(false);
  };

  const submitCheckIn = (input: SaveCheckInInput) => {
    setIsPending(true);

    startTransition(async () => {
      if (!navigator.onLine) {
        await queueCheckIn(input);
        setState({
          status: "success",
          message: "Guardado sin conexión. Se sincronizará al reconectar.",
        });
        resetForm();
        setIsPending(false);
        return;
      }

      try {
        const result = await saveCheckInAction(input);

        setState({
          status: result.ok ? "success" : "error",
          message: result.message,
        });

        if (result.ok) {
          resetForm();
        }
      } catch {
        await queueCheckIn(input);
        setState({
          status: "success",
          message: "Guardado sin conexión. Se sincronizará al reconectar.",
        });
        resetForm();
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
                  setLoggedAt(new Date().toISOString());
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
                <DateTimeWheelPicker
                  max={new Date()}
                  value={loggedAt ?? new Date().toISOString()}
                  onChange={setLoggedAt}
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
              icon={<Eye size={15} />}
              label="Parpados"
              value={pain.eyelidPain}
              onChange={updateEyelidPain}
            />
            <PainSlider
              icon={<Brain size={15} />}
              label="Sienes"
              value={pain.templePain}
              onChange={updateTemplePain}
            />
            <PainSlider
              icon={<Crosshair size={15} />}
              label="Zona Orbital"
              value={pain.orbitalPain}
              onChange={updateOrbitalPain}
            />
            <PainSlider
              icon={<Smiley size={15} />}
              label="Masetero"
              value={pain.masseterPain}
              onChange={updateMasseterPain}
            />
            <PainSlider
              icon={<Bone size={15} />}
              label="Cuello / Cervical"
              value={pain.cervicalPain}
              onChange={updateCervicalPain}
            />
          </div>
        </div>

        <div className="space-y-4 rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.7)] p-4">
          <p className="section-label">Estrés</p>
          <PainSlider
            icon={<Lightning size={15} />}
            label="Nivel de estrés"
            value={pain.stressLevel}
            onChange={updateStressLevel}
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
        <div className="mx-auto w-full max-w-[480px] space-y-2">
          {!isOnline ? (
            <div className="flex items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: "var(--text-muted)" }} />
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                Sin conexión — se guardará al reconectar
              </p>
            </div>
          ) : null}
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
