"use client";

import { useCallback, useEffect, useState } from "react";
import { saveDropAction } from "@/lib/actions/drops";
import { saveCheckInAction } from "@/lib/actions/check-ins";
import {
  getPendingDrops,
  getPendingDropsCount,
  removePendingDrop,
} from "@/lib/offline/drops-queue";
import {
  getPendingCheckIns,
  getPendingCheckInsCount,
  removePendingCheckIn,
} from "@/lib/offline/check-ins-queue";

export function useOfflineSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshCount = useCallback(async () => {
    const [drops, checkIns] = await Promise.all([
      getPendingDropsCount(),
      getPendingCheckInsCount(),
    ]);
    setPendingCount(drops + checkIns);
  }, []);

  const sync = useCallback(async () => {
    const [pendingDrops, pendingCheckIns] = await Promise.all([
      getPendingDrops(),
      getPendingCheckIns(),
    ]);

    if (pendingDrops.length === 0 && pendingCheckIns.length === 0) return;

    setIsSyncing(true);

    for (const drop of pendingDrops) {
      try {
        const result = await saveDropAction(drop);
        if (result.ok) await removePendingDrop(drop.id);
      } catch {
        // Keep in queue, try again next time online
      }
    }

    for (const checkIn of pendingCheckIns) {
      try {
        const result = await saveCheckInAction(checkIn);
        if (result.ok) await removePendingCheckIn(checkIn.id);
      } catch {
        // Keep in queue, try again next time online
      }
    }

    setIsSyncing(false);
    await refreshCount();
  }, [refreshCount]);

  useEffect(() => {
    refreshCount();

    const handleOnline = () => sync();
    window.addEventListener("online", handleOnline);

    // Try to sync immediately if already online and there are pending items
    if (navigator.onLine) {
      sync();
    }

    return () => window.removeEventListener("online", handleOnline);
  }, [sync, refreshCount]);

  return { pendingCount, isSyncing, sync, refreshCount };
}
