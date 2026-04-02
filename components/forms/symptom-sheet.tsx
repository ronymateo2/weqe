"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/status-banner";
import { SYMPTOM_OPTIONS } from "@/lib/constants";
import { saveSymptomAction } from "@/lib/actions/symptoms";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/types/domain";

type SymptomSheetProps = {
  onSaved: () => void;
};

function SymptomChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        "min-h-12 rounded-[999px] border px-4 py-2 text-[13px] font-medium transition-colors",
        selected
          ? "border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]"
          : "border-[var(--border)] bg-transparent text-[var(--text-muted)]"
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function SymptomSheet({ onSaved }: SymptomSheetProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customSymptom, setCustomSymptom] = useState("");
  const [state, setState] = useState<ActionState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  const hasSelection = useMemo(
    () => selected.size > 0 || customSymptom.trim().length > 0,
    [selected, customSymptom]
  );

  const toggleSelection = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const saveSelection = () => {
    const loggedAt = new Date().toISOString();
    const toSave: { type: string }[] = [
      ...Array.from(selected).map((id) => {
        const option = SYMPTOM_OPTIONS.find((o) => o.id === id);
        return { type: option?.value ?? id };
      }),
    ];

    if (customSymptom.trim()) {
      toSave.push({ type: customSymptom.trim().toLowerCase().replace(/\s+/g, "_") });
    }

    startTransition(async () => {
      for (const { type } of toSave) {
        const result = await saveSymptomAction({
          id: crypto.randomUUID(),
          loggedAt,
          symptomType: type
        });

        if (!result.ok) {
          setState({ status: "error", message: result.message });
          return;
        }
      }

      setState({ status: "success", message: "Sintomas guardados." });
      onSaved();
    });
  };

  return (
    <div className="space-y-5">
      {state.status !== "idle" && state.message ? (
        <StatusBanner message={state.message} tone={state.status === "success" ? "success" : "error"} />
      ) : null}

      <div className="space-y-3">
        <p className="section-label">Sintomas</p>
        <div className="flex flex-wrap gap-2">
          {SYMPTOM_OPTIONS.map((option) => (
            <SymptomChip
              key={option.id}
              label={option.label}
              selected={selected.has(option.id)}
              onClick={() => toggleSelection(option.id)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="section-label">Otro</p>
        <input
          className="w-full rounded-[12px] border border-[var(--border)] bg-transparent px-4 py-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          placeholder="Describe el sintoma..."
          type="text"
          value={customSymptom}
          onChange={(e) => setCustomSymptom(e.target.value)}
        />
      </div>

      <Button className="w-full" disabled={!hasSelection || isPending} type="button" onClick={saveSelection}>
        {isPending ? "Guardando..." : "Guardar sintomas"}
      </Button>
    </div>
  );
}
