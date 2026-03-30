"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatusBanner } from "@/components/ui/status-banner";
import { TextInput } from "@/components/ui/text-input";
import { DROP_EYES } from "@/lib/constants";
import { saveDropAction } from "@/lib/actions/drops";
import type { ActionState, DropEye } from "@/types/domain";

type DropSheetProps = {
  onSaved: () => void;
};

export function DropSheet({ onSaved }: DropSheetProps) {
  const [dropName, setDropName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [eye, setEye] = useState<DropEye>("both");
  const [state, setState] = useState<ActionState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  const saveDrop = () => {
    startTransition(async () => {
      const result = await saveDropAction({
        id: crypto.randomUUID(),
        loggedAt: new Date().toISOString(),
        name: dropName,
        quantity: Number(quantity),
        eye
      });

      setState({
        status: result.ok ? "success" : "error",
        message: result.message
      });

      if (result.ok) {
        onSaved();
      }
    });
  };

  return (
    <div className="space-y-5">
      {state.status !== "idle" && state.message ? (
        <StatusBanner message={state.message} tone={state.status === "success" ? "success" : "error"} />
      ) : null}

      <div className="space-y-2">
        <p className="section-label">Tipo de gota</p>
        <TextInput
          placeholder="Nombre de la gota (ej. systane ultra)"
          value={dropName}
          onChange={(event) => setDropName(event.target.value)}
        />
      </div>

      <div className="grid grid-cols-[1fr_120px] gap-3">
        <SegmentedControl
          label="Ojo"
          options={DROP_EYES.map((item) => ({
            label: item === "left" ? "Izq" : item === "right" ? "Der" : "Ambos",
            value: item
          }))}
          value={eye}
          onChange={setEye}
        />
        <div className="space-y-2">
          <p className="section-label">Cantidad</p>
          <TextInput
            inputMode="numeric"
            min={1}
            type="number"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </div>
      </div>

      <Button className="w-full" disabled={isPending || !dropName.trim()} type="button" onClick={saveDrop}>
        {isPending ? "Guardando..." : "Guardar gota"}
      </Button>
    </div>
  );
}
