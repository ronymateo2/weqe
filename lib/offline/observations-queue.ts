import { get, set } from "idb-keyval";
import type { SaveObservationInput } from "@/lib/actions/observations";

const PENDING_OBSERVATIONS_KEY = "neuroeye_pending_observations";

export async function queueObservation(input: SaveObservationInput): Promise<void> {
  try {
    const current = (await get<SaveObservationInput[]>(PENDING_OBSERVATIONS_KEY)) ?? [];
    const next = [...current.filter((o) => o.id !== input.id), input];
    await set(PENDING_OBSERVATIONS_KEY, next);
  } catch (err) {
    console.warn("Failed to queue observation offline", err);
  }
}

export async function getPendingObservations(): Promise<SaveObservationInput[]> {
  try {
    return (await get<SaveObservationInput[]>(PENDING_OBSERVATIONS_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function removePendingObservation(id: string): Promise<void> {
  try {
    const current = (await get<SaveObservationInput[]>(PENDING_OBSERVATIONS_KEY)) ?? [];
    await set(
      PENDING_OBSERVATIONS_KEY,
      current.filter((o) => o.id !== id),
    );
  } catch (err) {
    console.warn("Failed to remove pending observation", err);
  }
}

export async function getPendingObservationsCount(): Promise<number> {
  const pending = await getPendingObservations();
  return pending.length;
}
