"use client";

import { useCallback, useEffect, useState } from "react";
import { saveDropAction } from "@/lib/actions/drops";
import { saveCheckInAction } from "@/lib/actions/check-ins";
import { saveSleepAction } from "@/lib/actions/sleep";
import { saveObservationAction, saveOccurrenceAction } from "@/lib/actions/observations";
import { saveLidHygieneAction } from "@/lib/actions/lid-hygiene";
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
import {
  getPendingSleep,
  getPendingSleepCount,
  removePendingSleep,
} from "@/lib/offline/sleep-queue";
import {
  getPendingObservations,
  getPendingObservationsCount,
  removePendingObservation,
} from "@/lib/offline/observations-queue";
import {
  getPendingOccurrences,
  getPendingOccurrencesCount,
  removePendingOccurrence,
} from "@/lib/offline/occurrences-queue";
import {
  getPendingHygiene,
  getPendingHygieneCount,
  removePendingHygiene,
} from "@/lib/offline/lid-hygiene-queue";

export function useOfflineSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshCount = useCallback(async () => {
    const [drops, checkIns, sleep, observations, occurrences, hygiene] = await Promise.all([
      getPendingDropsCount(),
      getPendingCheckInsCount(),
      getPendingSleepCount(),
      getPendingObservationsCount(),
      getPendingOccurrencesCount(),
      getPendingHygieneCount(),
    ]);
    setPendingCount(drops + checkIns + sleep + observations + occurrences + hygiene);
  }, []);

  const sync = useCallback(async () => {
    const [pendingDrops, pendingCheckIns, pendingSleeps, pendingObservations, pendingOccurrences, pendingHygiene] =
      await Promise.all([
        getPendingDrops(),
        getPendingCheckIns(),
        getPendingSleep(),
        getPendingObservations(),
        getPendingOccurrences(),
        getPendingHygiene(),
      ]);

    if (
      pendingDrops.length === 0 &&
      pendingCheckIns.length === 0 &&
      pendingSleeps.length === 0 &&
      pendingObservations.length === 0 &&
      pendingOccurrences.length === 0 &&
      pendingHygiene.length === 0
    ) {
      return;
    }

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

    for (const sleep of pendingSleeps) {
      try {
        const result = await saveSleepAction(sleep);
        if (result.ok) await removePendingSleep(sleep.id);
      } catch {
        // Keep in queue, try again next time online
      }
    }

    for (const observation of pendingObservations) {
      try {
        const result = await saveObservationAction(observation);
        if (result.ok) await removePendingObservation(observation.id);
      } catch {
        // Keep in queue, try again next time online
      }
    }

    for (const occurrence of pendingOccurrences) {
      try {
        const result = await saveOccurrenceAction(occurrence);
        if (result.ok) await removePendingOccurrence(occurrence.id);
      } catch {
        // Keep in queue, try again next time online
      }
    }

    for (const hygiene of pendingHygiene) {
      try {
        const result = await saveLidHygieneAction(hygiene);
        if (result.ok) await removePendingHygiene(hygiene.id);
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
