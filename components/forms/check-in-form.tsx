"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { PainSlider } from "@/components/ui/pain-slider";
import { TextInput } from "@/components/ui/text-input";
import { Toast } from "@/components/ui/toast";
import { TRIGGER_OPTIONS } from "@/lib/constants";

import { saveCheckInAction } from "@/lib/actions/check-ins";
import type { SaveCheckInInput } from "@/lib/actions/check-ins";
import { queueCheckIn } from "@/lib/offline/check-ins-queue";
import type { ActionState, TriggerType } from "@/types/domain";
import {
  BoneIcon,
  HandEyeIcon,
  EyeIcon,
  SmileyMeltingIcon,
  LightningIcon,
  HeadCircuitIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// "now"    → no extra context, stores time_of_day = null
// "custom" → date/time picker open, stores time_of_day = null + custom loggedAt
type ContextTab = "now" | "custom";

const MobileSheet = dynamic(
  () =>
    import("@/components/layout/mobile-sheet").then((m) => ({
      default: m.MobileSheet,
    })),
  { ssr: false },
);

const DateTimeWheelPicker = dynamic(
  () =>
    import("@/components/ui/datetime-wheel-picker").then((m) => ({
      default: m.DateTimeWheelPicker,
    })),
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

function formatLoggedAt(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const time = d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return `hoy, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `ayer, ${time}`;
  return (
    d.toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" }) +
    `, ${time}`
  );
}

export function CheckInForm() {
  const [pain, setPain] = useState(defaultPainState);
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [customTriggerName, setCustomTriggerName] = useState("");
  const [contextTab, setContextTab] = useState<ContextTab>("now");
  const [loggedAt, setLoggedAt] = useState<string | null>(null);
  const [state, setState] = useState<ActionState>({ status: "idle" });
  const [isPending, setIsPending] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [zeroWarning, setZeroWarning] = useState<string | null>(null);
  const [pendingInput, setPendingInput] = useState<SaveCheckInInput | null>(null);

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

  const updateEyelidPain = useCallback(
    (v: number) => setPain((p) => ({ ...p, eyelidPain: v })),
    [],
  );
  const updateTemplePain = useCallback(
    (v: number) => setPain((p) => ({ ...p, templePain: v })),
    [],
  );
  const updateOrbitalPain = useCallback(
    (v: number) => setPain((p) => ({ ...p, orbitalPain: v })),
    [],
  );
  const updateMasseterPain = useCallback(
    (v: number) => setPain((p) => ({ ...p, masseterPain: v })),
    [],
  );
  const updateCervicalPain = useCallback(
    (v: number) => setPain((p) => ({ ...p, cervicalPain: v })),
    [],
  );
  const updateStressLevel = useCallback(
    (v: number) => setPain((p) => ({ ...p, stressLevel: v })),
    [],
  );

  const handleContextTab = (tab: ContextTab) => {
    setContextTab(tab);
    if (tab === "custom") {
      setLoggedAt((prev) => prev ?? new Date().toISOString());
    } else {
      setLoggedAt(null);
    }
  };

  const resolvedTriggerType = (): TriggerType | null => {
    if (!selectedTrigger) return null;
    const option = TRIGGER_OPTIONS.find((o) => o.id === selectedTrigger);
    return (option?.value ?? "other") as TriggerType;
  };

  const isTriggerValid = useMemo(
    () =>
      selectedTrigger === null ||
      selectedTrigger !== "other" ||
      customTriggerName.trim().length > 0,
    [selectedTrigger, customTriggerName],
  );

  const buildPayload = (): SaveCheckInInput => ({
    id: crypto.randomUUID(),
    loggedAt: loggedAt ?? new Date().toISOString(),
    timeOfDay: null,
    eyelidPain: pain.eyelidPain,
    templePain: pain.templePain,
    masseterPain: pain.masseterPain,
    cervicalPain: pain.cervicalPain,
    orbitalPain: pain.orbitalPain,
    stressLevel: pain.stressLevel,
    triggerType: resolvedTriggerType(),
    notes:
      selectedTrigger === "other" && customTriggerName.trim()
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

    const zeroValues = trackedValues.filter((field) => field.value === 0);
    if (zeroValues.length === 0) return null;

    const allValuesAreZero = trackedValues.every((field) => field.value === 0);
    if (allValuesAreZero) {
      return "Todos los valores estan en 0. Vas a guardar el registro igual. Deseas continuar?";
    }

    return `Vas a guardar valores en 0 para: ${zeroValues.map((f) => f.label).join(", ")}. Deseas continuar?`;
  };

  const resetForm = () => {
    setPain(defaultPainState);
    setSelectedTrigger(null);
    setCustomTriggerName("");
    setContextTab("now");
    setLoggedAt(null);
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
        if (result.ok) resetForm();
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
    if (!pendingInput) { closeZeroWarning(); return; }
    const input = pendingInput;
    closeZeroWarning();
    submitCheckIn(input);
  };

  const handleSave = () => {
    if (isPending || !isTriggerValid) return;
    const input = buildPayload();
    const warningMessage = getZeroValueWarning(input);
    if (!warningMessage) { submitCheckIn(input); return; }
    setPendingInput(input);
    setZeroWarning(warningMessage);
  };

  const tabClass = (active: boolean) =>
    cn(
      "min-h-[44px] rounded-[999px] border px-4 text-[13px] font-medium transition-[color,background-color,border-color,transform] duration-[160ms] ease-out active:scale-[0.97]",
      active
        ? "border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]"
        : "border-[var(--border)] bg-transparent text-[var(--text-muted)]",
    );

  return (
    <div className="relative pb-[calc(var(--sticky-cta-height)+44px)]">
      <div className="space-y-6">
        {state.status !== "idle" && state.message ? (
          <Toast
            message={state.message}
            tone={state.status === "success" ? "success" : "error"}
            onDismiss={() => setState({ status: "idle" })}
          />
        ) : null}

        {/* Pain map — always shown */}
        <div className="space-y-4 rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.7)] p-4">
          <p className="section-label">Mapa de dolor</p>
          <div className="space-y-5">
            <PainSlider
              icon={<EyeIcon size={15} />}
              label="Ojo/Parpados"
              value={pain.eyelidPain}
              onChange={updateEyelidPain}
            />
            <PainSlider
              icon={<HeadCircuitIcon size={15} />}
              label="Sienes"
              value={pain.templePain}
              onChange={updateTemplePain}
            />
            <PainSlider
              icon={<HandEyeIcon size={15} />}
              label="Zona Orbital"
              value={pain.orbitalPain}
              onChange={updateOrbitalPain}
            />
            <PainSlider
              icon={<SmileyMeltingIcon size={15} />}
              label="Masetero"
              value={pain.masseterPain}
              onChange={updateMasseterPain}
            />
            <PainSlider
              icon={<BoneIcon size={15} />}
              label="Cuello / Cervical"
              value={pain.cervicalPain}
              onChange={updateCervicalPain}
            />
          </div>
        </div>

        {/* Stress — always shown */}
        <div className="space-y-4 rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.7)] p-4">
          <p className="section-label">Estrés</p>
          <PainSlider
            icon={<LightningIcon size={15} />}
            label="Nivel de estrés"
            value={pain.stressLevel}
            onChange={updateStressLevel}
          />
        </div>

        {/* Context — all optional */}
        <div className="rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.7)]">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <p className="section-label mb-0">Contexto</p>
            <span
              className="text-[10px] font-medium tracking-[0.08em] uppercase"
              style={{ color: "var(--text-faint)" }}
            >
              opcional
            </span>
          </div>

          <div className="px-4 pb-4 space-y-5">
            {/* 2-tab control: Ahora / Cambiar hora */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  className={tabClass(contextTab === "now")}
                  onClick={() => handleContextTab("now")}
                >
                  Ahora
                </button>
                <button
                  type="button"
                  className={cn(tabClass(contextTab === "custom"))}
                  onClick={() => handleContextTab("custom")}
                >
                  {contextTab === "custom" && loggedAt
                    ? formatLoggedAt(loggedAt)
                    : "Cambiar hora"}
                </button>
              </div>

              {/* Wheel picker — inline below tabs, only when custom */}
              {contextTab === "custom" ? (
                <DateTimeWheelPicker
                  max={new Date()}
                  value={loggedAt ?? new Date().toISOString()}
                  onChange={setLoggedAt}
                />
              ) : null}
            </div>

            {/* Trigger — always optional */}
            <div className="space-y-2.5">
              <p
                className="text-[11px] font-medium tracking-[0.08em] uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                ¿Hubo un trigger?
              </p>
              <div className="flex flex-wrap gap-2">
                {TRIGGER_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={cn(
                      "min-h-[44px] rounded-[999px] border px-4 py-2 text-[13px] font-medium transition-[color,background-color,border-color,transform] duration-[160ms] ease-out active:scale-[0.97]",
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
          </div>
        </div>
      </div>

      <div className="fixed bottom-[calc(82px+env(safe-area-inset-bottom))] left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--bg)] px-1 py-1 shadow-[0_-14px_28px_rgba(18,16,8,0.95)]">
        <div className="mx-auto w-full max-w-[480px] space-y-2">
          {!isOnline ? (
            <div className="flex items-center justify-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                style={{ background: "var(--text-muted)" }}
              />
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
