import { get, set } from "idb-keyval";
import type { SaveCheckInInput } from "@/lib/actions/check-ins";

const PENDING_CHECK_INS_KEY = "neuroeye_pending_check_ins";

export async function queueCheckIn(input: SaveCheckInInput): Promise<void> {
  try {
    const current = (await get<SaveCheckInInput[]>(PENDING_CHECK_INS_KEY)) ?? [];
    const next = [...current.filter((c) => c.id !== input.id), input];
    await set(PENDING_CHECK_INS_KEY, next);
  } catch (err) {
    console.warn("Failed to queue check-in offline", err);
  }
}

export async function getPendingCheckIns(): Promise<SaveCheckInInput[]> {
  try {
    return (await get<SaveCheckInInput[]>(PENDING_CHECK_INS_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function removePendingCheckIn(id: string): Promise<void> {
  try {
    const current = (await get<SaveCheckInInput[]>(PENDING_CHECK_INS_KEY)) ?? [];
    await set(
      PENDING_CHECK_INS_KEY,
      current.filter((c) => c.id !== id),
    );
  } catch (err) {
    console.warn("Failed to remove pending check-in", err);
  }
}

export async function getPendingCheckInsCount(): Promise<number> {
  const pending = await getPendingCheckIns();
  return pending.length;
}
