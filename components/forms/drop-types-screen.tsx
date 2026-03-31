"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/status-banner";
import { TextInput } from "@/components/ui/text-input";
import { saveDropTypeAction } from "@/lib/actions/drops";
import type { ActionState, DropTypeRecord } from "@/types/domain";

type DropTypesScreenProps = {
  initialDropTypes: DropTypeRecord[];
  initialErrorMessage?: string;
};

export function DropTypesScreen({ initialDropTypes, initialErrorMessage }: DropTypesScreenProps) {
  const [dropTypes, setDropTypes] = useState(initialDropTypes);
  const [dropName, setDropName] = useState("");
  const [state, setState] = useState<ActionState>(
    initialErrorMessage
      ? {
          status: "error",
          message: initialErrorMessage
        }
      : { status: "idle" }
  );
  const [isPending, startTransition] = useTransition();

  const saveDropType = () => {
    startTransition(async () => {
      const result = await saveDropTypeAction({ name: dropName });

      setState({
        status: result.ok ? "success" : "error",
        message: result.message
      });

      if (!result.ok || !result.dropType) {
        return;
      }

      const savedDropType = result.dropType;

      setDropTypes((current) => {
        const withoutCurrent = current.filter((item) => item.id !== savedDropType.id);
        const next = [...withoutCurrent, savedDropType];
        return next.sort((a, b) => a.name.localeCompare(b.name, "es-CO"));
      });
      setDropName("");
    });
  };

  return (
    <div className="space-y-6">
      {state.status !== "idle" && state.message ? (
        <StatusBanner message={state.message} tone={state.status === "success" ? "success" : "error"} />
      ) : null}

      <section className="space-y-3">
        <p className="section-label">Nueva gota</p>
        <TextInput
          placeholder="Nombre de la gota (ej. systane ultra)"
          value={dropName}
          onChange={(event) => setDropName(event.target.value)}
        />
        <Button className="w-full" disabled={isPending || !dropName.trim()} type="button" onClick={saveDropType}>
          {isPending ? "Guardando..." : "Guardar tipo de gota"}
        </Button>
      </section>

      <section className="space-y-3">
        <p className="section-label">Gotas guardadas</p>
        {dropTypes.length === 0 ? (
          <StatusBanner message="Todavia no registras gotas frecuentes." tone="info" />
        ) : (
          <ul className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[rgba(28,24,16,0.56)]">
            {dropTypes.map((dropType) => (
              <li
                key={dropType.id}
                className="min-h-12 border-b border-[var(--border)] px-4 py-3 text-[15px] text-[var(--text-primary)] last:border-b-0"
              >
                {dropType.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        className="inline-flex min-h-12 w-full items-center justify-center rounded-[999px] border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-[15px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-el)]"
        href="/register"
      >
        Volver a Registrar
      </Link>
    </div>
  );
}
