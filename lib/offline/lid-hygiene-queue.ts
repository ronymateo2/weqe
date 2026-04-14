import { get, set } from "idb-keyval";
import type { SaveHygieneInput } from "@/types/domain";

const PENDING_HYGIENE_KEY = "neuroeye_pending_lid_hygiene";

export async function queueHygiene(input: SaveHygieneInput): Promise<void> {
  try {
    const current = (await get<SaveHygieneInput[]>(PENDING_HYGIENE_KEY)) ?? [];
    const next = [...current.filter((h) => h.id !== input.id), input];
    await set(PENDING_HYGIENE_KEY, next);
  } catch (err) {
    console.warn("Failed to queue hygiene offline", err);
  }
}

export async function getPendingHygiene(): Promise<SaveHygieneInput[]> {
  try {
    return (await get<SaveHygieneInput[]>(PENDING_HYGIENE_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function removePendingHygiene(id: string): Promise<void> {
  try {
    const current = (await get<SaveHygieneInput[]>(PENDING_HYGIENE_KEY)) ?? [];
    await set(
      PENDING_HYGIENE_KEY,
      current.filter((h) => h.id !== id),
    );
  } catch (err) {
    console.warn("Failed to remove pending hygiene", err);
  }
}

export async function getPendingHygieneCount(): Promise<number> {
  const pending = await getPendingHygiene();
  return pending.length;
}
