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
import { queueDrop } from "@/lib/offline/drops-queue";
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
  const [loggedAt, setLoggedAt] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [state, setState] = useState<ActionState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();
  const [isOnline, setIsOnline] = useState(true);

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

  const toDatetimeLocal = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

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
      const input = {
        id: crypto.randomUUID(),
        loggedAt: loggedAt ? new Date(loggedAt).toISOString() : new Date().toISOString(),
        name: selectedDropName,
        quantity: Number(quantity),
        eye,
      };

      // Offline: queue directly without attempting the server action
      if (!navigator.onLine) {
        await queueDrop(input);
        setState({
          status: "success",
          message: "Guardada sin conexión. Se sincronizará al reconectar.",
        });
        // Don't close the sheet — let the user read the confirmation
        return;
      }

      try {
        const result = await saveDropAction(input);

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
      } catch {
        // Network failure while nominally online — queue for later
        await queueDrop(input);
        setState({
          status: "success",
          message: "Guardada sin conexión. Se sincronizará al reconectar.",
        });
        // Don't close the sheet — let the user read the confirmation
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

      <div>
        {!showDatePicker ? (
          <button
            type="button"
            className="text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--accent)]"
            onClick={() => {
              setShowDatePicker(true);
              setLoggedAt(toDatetimeLocal(new Date()));
            }}
          >
            ¿Olvidaste registrarla? Cambiar fecha
          </button>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="section-label mb-0">Fecha y hora</p>
              <button
                type="button"
                className="text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--accent)]"
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
              className="min-h-12 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 font-mono text-[15px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] [color-scheme:dark]"
              max={toDatetimeLocal(new Date())}
              value={loggedAt ?? ""}
              onChange={(e) => setLoggedAt(e.target.value)}
            />
          </div>
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

      {!isOnline ? (
        <div className="flex items-center gap-2 rounded-[10px] px-3 py-2" style={{ background: "var(--surface-el)" }}>
          <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: "var(--text-muted)" }} />
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            Sin conexión — se guardará y sincronizará al reconectar
          </p>
        </div>
      ) : null}

      <Button
        className="w-full"
        disabled={
          isPending ||
          (loading && dropTypes.length === 0) ||
          !selectedDropName.trim() ||
          state.status === "success"
        }
        type="button"
        onClick={saveDrop}
      >
        {isPending ? "Guardando..." : state.status === "success" ? "Guardada" : "Guardar gota"}
      </Button>
    </div>
  );
}
