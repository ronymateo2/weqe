import { get, set } from "idb-keyval";
import type { SaveDropInput } from "@/lib/actions/drops";

const PENDING_DROPS_KEY = "neuroeye_pending_drops";

export async function queueDrop(input: SaveDropInput): Promise<void> {
  try {
    const current = (await get<SaveDropInput[]>(PENDING_DROPS_KEY)) ?? [];
    // Deduplicate by id (upsert semantics)
    const next = [...current.filter((d) => d.id !== input.id), input];
    await set(PENDING_DROPS_KEY, next);
  } catch (err) {
    console.warn("Failed to queue drop offline", err);
  }
}

export async function getPendingDrops(): Promise<SaveDropInput[]> {
  try {
    return (await get<SaveDropInput[]>(PENDING_DROPS_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function removePendingDrop(id: string): Promise<void> {
  try {
    const current = (await get<SaveDropInput[]>(PENDING_DROPS_KEY)) ?? [];
    await set(
      PENDING_DROPS_KEY,
      current.filter((d) => d.id !== id),
    );
  } catch (err) {
    console.warn("Failed to remove pending drop", err);
  }
}

export async function getPendingDropsCount(): Promise<number> {
  const pending = await getPendingDrops();
  return pending.length;
}
