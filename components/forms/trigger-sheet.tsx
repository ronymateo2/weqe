"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/status-banner";
import { TriggerChip } from "@/components/ui/trigger-chip";
import { TRIGGER_OPTIONS } from "@/lib/constants";
import { saveTriggerAction } from "@/lib/actions/triggers";
import type { ActionState } from "@/types/domain";

type TriggerSheetProps = {
  onSaved: () => void;
};

export function TriggerSheet({ onSaved }: TriggerSheetProps) {
  const [selection, setSelection] = useState<Record<string, 0 | 1 | 2 | 3>>({});
  const [state, setState] = useState<ActionState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  const hasSelection = useMemo(
    () => Object.values(selection).some((value) => value > 0),
    [selection]
  );

  const toggleSelection = (value: string) => {
    setSelection((current) => ({
      ...current,
      [value]: (((current[value] ?? 0) + 1) % 4) as 0 | 1 | 2 | 3
    }));
  };

  const saveSelection = () => {
    const values = Object.entries(selection).filter(([, intensity]) => intensity > 0);

    startTransition(async () => {
      for (const [triggerType, intensity] of values) {
        const trigger = TRIGGER_OPTIONS.find((option) => option.id === triggerType);
        const result = await saveTriggerAction({
          id: crypto.randomUUID(),
          loggedAt: new Date().toISOString(),
          triggerType: trigger?.value ?? "other",
          intensity: intensity as 1 | 2 | 3
        });

        if (!result.ok) {
          setState({
            status: "error",
            message: result.message
          });
          return;
        }
      }

      setState({
        status: "success",
        message: "Triggers guardados."
      });
      onSaved();
    });
  };

  return (
    <div className="space-y-5">
      {state.status !== "idle" && state.message ? (
        <StatusBanner message={state.message} tone={state.status === "success" ? "success" : "error"} />
      ) : null}

      <div className="space-y-3">
        <p className="section-label">Triggers</p>
        <div className="flex flex-wrap gap-2">
          {TRIGGER_OPTIONS.map((option) => (
            <TriggerChip
              key={option.id}
              intensity={selection[option.id] ?? 0}
              label={option.label}
              onClick={() => toggleSelection(option.id)}
            />
          ))}
        </div>
      </div>

      <Button className="w-full" disabled={!hasSelection || isPending} type="button" onClick={saveSelection}>
        {isPending ? "Guardando..." : "Guardar triggers"}
      </Button>
    </div>
  );
}
