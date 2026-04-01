"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatusBanner } from "@/components/ui/status-banner";
import { TextInput } from "@/components/ui/text-input";
import { Skeleton } from "@/components/ui/skeleton";
import { WheelPicker } from "@/components/ui/wheel-picker";
import { DROP_EYES } from "@/lib/constants";
import { saveDropAction } from "@/lib/actions/drops";
import { useDropTypes } from "@/lib/hooks/use-drop-types";
import { DROP_TYPES_CACHE_KEY } from "@/lib/hooks/use-drop-types";
import { set } from "idb-keyval";
import type { ActionState, DropEye, DropTypeRecord } from "@/types/domain";

type DropSheetProps = {
  onSaved: () => void;
};

const CUSTOM_DROP_TYPE = "__custom__";

export function DropSheet({ onSaved }: DropSheetProps) {
  const { dropTypes, loading, error } = useDropTypes();
  const [selectedDropType, setSelectedDropType] = useState(CUSTOM_DROP_TYPE);
  const [customDropName, setCustomDropName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [eye, setEye] = useState<DropEye>("left");
  const [state, setState] = useState<ActionState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  // Sync initial selection when dropTypes load
  useEffect(() => {
    if (
      dropTypes.length > 0 &&
      selectedDropType === CUSTOM_DROP_TYPE &&
      !customDropName
    ) {
      setSelectedDropType(dropTypes[0].id);
    }
  }, [dropTypes, selectedDropType, customDropName]);

  const wheelOptions = useMemo(() => {
    const opts = dropTypes.map((dt: DropTypeRecord) => ({
      value: dt.id,
      label: dt.name,
    }));
    return opts;
  }, [dropTypes]);

  const selectedDropName = useMemo(() => {
    if (selectedDropType === CUSTOM_DROP_TYPE) {
      return customDropName;
    }

    const selected = dropTypes.find(
      (item: DropTypeRecord) => item.id === selectedDropType,
    );
    return selected?.name ?? "";
  }, [customDropName, dropTypes, selectedDropType]);

  const saveDrop = () => {
    startTransition(async () => {
      const result = await saveDropAction({
        id: crypto.randomUUID(),
        loggedAt: new Date().toISOString(),
        name: selectedDropName,
        quantity: Number(quantity),
        eye,
      });

      setState({
        status: result.ok ? "success" : "error",
        message: result.message,
      });

      if (result.ok) {
        // If saveDropAction returns the created dropType, we update our local cache
        const createdDropType = (result as any).dropType as
          | DropTypeRecord
          | undefined;
        if (createdDropType) {
          const nextDropTypes = (() => {
            const exists = dropTypes.some((d) => d.id === createdDropType.id);
            if (exists) return dropTypes;
            const next = [...dropTypes, createdDropType];
            return next.sort((a, b) => a.name.localeCompare(b.name, "es-CO"));
          })();

          if (nextDropTypes !== dropTypes) {
            try {
              await set(DROP_TYPES_CACHE_KEY, nextDropTypes);
            } catch (err) {
              console.warn("Failed to update cache on quick-save", err);
            }
          }
        }
        onSaved();
      }
    });
  };

  const shouldShowCustomInput = selectedDropType === CUSTOM_DROP_TYPE;

  return (
    <div className="space-y-5">
      {state.message || error ? (
        <StatusBanner
          message={state.message || error || ""}
          tone={
            state.status === "error" || (error && state.status === "idle")
              ? "error"
              : "success"
          }
        />
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="section-label mb-0">Tipo de gota</p>
          <Link
            className="text-[12px] font-medium text-[var(--accent)] hover:text-[var(--accent-bright)]"
            href="/drop-types"
          >
            Nueva gota
          </Link>
        </div>

        {loading && dropTypes.length === 0 ? (
          <Skeleton className="h-[148px] w-full rounded-[16px]" />
        ) : (
          <>
            <WheelPicker
              label="Seleccionar tipo de gota"
              options={wheelOptions}
              value={selectedDropType}
              onChange={setSelectedDropType}
            />

            {shouldShowCustomInput ? (
              <TextInput
                placeholder="Nombre de la gota (ej. systane ultra)"
                value={customDropName}
                onChange={(event) => setCustomDropName(event.target.value)}
              />
            ) : null}
          </>
        )}
      </div>

      <div className="grid grid-cols-[1fr_120px] gap-3">
        <SegmentedControl
          label="Ojo"
          options={DROP_EYES.map((item) => ({
            label: item === "left" ? "Izq" : item === "right" ? "Der" : "Ambos",
            value: item,
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

      <Button
        className="w-full"
        disabled={
          isPending ||
          (loading && dropTypes.length === 0) ||
          !selectedDropName.trim()
        }
        type="button"
        onClick={saveDrop}
      >
        {isPending ? "Guardando..." : "Guardar gota"}
      </Button>
    </div>
  );
}
