import { get, set } from "idb-keyval";
import type { SaveSleepInput } from "@/types/domain";

const PENDING_SLEEP_KEY = "neuroeye_pending_sleep";

export async function queueSleep(input: SaveSleepInput): Promise<void> {
  try {
    const current = (await get<SaveSleepInput[]>(PENDING_SLEEP_KEY)) ?? [];
    const next = [...current.filter((s) => s.id !== input.id), input];
    await set(PENDING_SLEEP_KEY, next);
  } catch (err) {
    console.warn("Failed to queue sleep offline", err);
  }
}

export async function getPendingSleep(): Promise<SaveSleepInput[]> {
  try {
    return (await get<SaveSleepInput[]>(PENDING_SLEEP_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function removePendingSleep(id: string): Promise<void> {
  try {
    const current = (await get<SaveSleepInput[]>(PENDING_SLEEP_KEY)) ?? [];
    await set(
      PENDING_SLEEP_KEY,
      current.filter((s) => s.id !== id),
    );
  } catch (err) {
    console.warn("Failed to remove pending sleep", err);
  }
}

export async function getPendingSleepCount(): Promise<number> {
  const pending = await getPendingSleep();
  return pending.length;
}
