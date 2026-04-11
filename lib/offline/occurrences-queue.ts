import { get, set } from "idb-keyval";
import type { SaveOccurrenceInput } from "@/types/domain";

const PENDING_OCCURRENCES_KEY = "neuroeye_pending_occurrences";

export async function queueOccurrence(input: SaveOccurrenceInput): Promise<void> {
  try {
    const current = (await get<SaveOccurrenceInput[]>(PENDING_OCCURRENCES_KEY)) ?? [];
    const next = [...current.filter((o) => o.id !== input.id), input];
    await set(PENDING_OCCURRENCES_KEY, next);
  } catch (err) {
    console.warn("Failed to queue occurrence offline", err);
  }
}

export async function getPendingOccurrences(): Promise<SaveOccurrenceInput[]> {
  try {
    return (await get<SaveOccurrenceInput[]>(PENDING_OCCURRENCES_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function removePendingOccurrence(id: string): Promise<void> {
  try {
    const current = (await get<SaveOccurrenceInput[]>(PENDING_OCCURRENCES_KEY)) ?? [];
    await set(
      PENDING_OCCURRENCES_KEY,
      current.filter((o) => o.id !== id),
    );
  } catch (err) {
    console.warn("Failed to remove pending occurrence", err);
  }
}

export async function getPendingOccurrencesCount(): Promise<number> {
  const pending = await getPendingOccurrences();
  return pending.length;
}
