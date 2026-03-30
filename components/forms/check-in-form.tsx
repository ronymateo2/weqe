"use client";

import { startTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { PainSlider } from "@/components/ui/pain-slider";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatusBanner } from "@/components/ui/status-banner";
import { TextInput } from "@/components/ui/text-input";
import { TIME_OF_DAY_OPTIONS } from "@/lib/constants";
import { saveCheckInAction } from "@/lib/actions/check-ins";
import type { ActionState, TimeOfDay } from "@/types/domain";

const defaultPainState = {
  eyelidPain: 0,
  templePain: 0,
  masseterPain: 0,
  overallPain: 0
};

export function CheckInForm() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("morning");
  const [pain, setPain] = useState(defaultPainState);
  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState(5);
  const [state, setState] = useState<ActionState>({ status: "idle" });
  const [isPending, setIsPending] = useState(false);

  const updatePain = (key: keyof typeof pain, value: number) => {
    setPain((current) => ({
      ...current,
      [key]: value
    }));
  };

  const handleSave = () => {
    setIsPending(true);

    startTransition(async () => {
      const result = await saveCheckInAction({
        id: crypto.randomUUID(),
        loggedAt: new Date().toISOString(),
        timeOfDay,
        eyelidPain: pain.eyelidPain,
        templePain: pain.templePain,
        masseterPain: pain.masseterPain,
        overallPain: pain.overallPain,
        sleepHours: timeOfDay === "morning" && sleepHours ? Number(sleepHours) : null,
        sleepQuality: timeOfDay === "morning" ? sleepQuality : null
      });

      setState({
        status: result.ok ? "success" : "error",
        message: result.message
      });

      if (result.ok) {
        setPain(defaultPainState);
      }

      setIsPending(false);
    });
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
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[var(--text-primary)]" htmlFor="sleep-hours">
                Horas de sueno
              </label>
              <TextInput
                id="sleep-hours"
                inputMode="decimal"
                placeholder="6.5"
                value={sleepHours}
                onChange={(event) => setSleepHours(event.target.value)}
              />
            </div>
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
    </div>
  );
}
