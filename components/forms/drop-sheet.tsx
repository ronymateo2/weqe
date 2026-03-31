"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
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

const CUSTOM_DROP_TYPE = "__custom__";

export function DropSheet({ onSaved }: DropSheetProps) {
  const [dropTypes, setDropTypes] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedDropType, setSelectedDropType] = useState(CUSTOM_DROP_TYPE);
  const [customDropName, setCustomDropName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [eye, setEye] = useState<DropEye>("left");
  const [isLoadingDropTypes, setIsLoadingDropTypes] = useState(true);
  const [state, setState] = useState<ActionState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    const loadDropTypes = async () => {
      setIsLoadingDropTypes(true);
      try {
        const response = await fetch("/api/drop-types", { cache: "no-store" });
        const result = (await response.json()) as {
          ok: boolean;
          message: string;
          dropTypes: Array<{ id: string; name: string }>;
        };

        if (!isMounted) return;

        if (!result.ok) {
          setState({
            status: "error",
            message: result.message,
          });
          setIsLoadingDropTypes(false);
          return;
        }

        setDropTypes(result.dropTypes);
        if (result.dropTypes.length > 0) {
          setSelectedDropType(result.dropTypes[0].id);
        }
      } catch {
        if (!isMounted) return;
        setState({
          status: "error",
          message: "No se pudieron cargar tus tipos de gota.",
        });
      }
      setIsLoadingDropTypes(false);
    };

    loadDropTypes();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedDropName = useMemo(() => {
    if (selectedDropType === CUSTOM_DROP_TYPE) {
      return customDropName;
    }

    const selected = dropTypes.find((item) => item.id === selectedDropType);
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
        onSaved();
      }
    });
  };

  const shouldShowCustomInput =
    dropTypes.length === 0 || selectedDropType === CUSTOM_DROP_TYPE;

  return (
    <div className="space-y-5">
      {state.status !== "idle" && state.message ? (
        <StatusBanner
          message={state.message}
          tone={state.status === "success" ? "success" : "error"}
        />
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="section-label mb-0">Tipo de gota</p>
          <Link
            className="text-[12px] font-medium text-[var(--accent)] hover:text-[var(--accent-bright)]"
            href="/drop-types"
          >
            Gestionar
          </Link>
        </div>

        {dropTypes.length > 0 ? (
          <select
            aria-label="Seleccionar tipo de gota"
            className="min-h-12 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[15px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            value={selectedDropType}
            onChange={(event) => setSelectedDropType(event.target.value)}
          >
            {dropTypes.map((dropType) => (
              <option key={dropType.id} value={dropType.id}>
                {dropType.name}
              </option>
            ))}
            <option value={CUSTOM_DROP_TYPE}>Nueva gota...</option>
          </select>
        ) : null}

        {shouldShowCustomInput ? (
          <TextInput
            placeholder="Nombre de la gota (ej. systane ultra)"
            value={customDropName}
            onChange={(event) => setCustomDropName(event.target.value)}
          />
        ) : null}
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
        disabled={isPending || isLoadingDropTypes || !selectedDropName.trim()}
        type="button"
        onClick={saveDrop}
      >
        {isPending ? "Guardando..." : "Guardar gota"}
      </Button>
    </div>
  );
}
