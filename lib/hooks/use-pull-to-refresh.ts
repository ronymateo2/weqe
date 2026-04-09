"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const THRESHOLD = 72; // px to pull before triggering refresh
const MAX_PULL = 100; // px cap for visual indicator

export function usePullToRefresh() {
  const router = useRouter();
  // Ref tracks the live pull distance — never stale inside event handlers
  const pullDistanceRef = useRef(0);
  // State is only for triggering a re-render of the visual indicator
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (window.scrollY !== 0) return;
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = false;
    }

    function onTouchMove(e: TouchEvent) {
      if (startYRef.current === null) return;
      if (window.scrollY !== 0) {
        startYRef.current = null;
        return;
      }
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta <= 0) return;

      pullingRef.current = true;
      // Prevent native overscroll bounce while we handle the gesture
      e.preventDefault();
      const clamped = Math.min(delta, MAX_PULL);
      pullDistanceRef.current = clamped; // always up-to-date
      setPullDistance(clamped);          // schedule visual re-render
    }

    function onTouchEnd() {
      if (!pullingRef.current) return;
      // Read from ref — never stale, regardless of React render timing
      const distance = pullDistanceRef.current;
      startYRef.current = null;
      pullingRef.current = false;
      pullDistanceRef.current = 0;
      setPullDistance(0);

      if (distance >= THRESHOLD) {
        setRefreshing(true);
        router.refresh();
        setTimeout(() => setRefreshing(false), 1400);
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  // Effect runs once — all mutable values go through refs, not closure state
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { pullDistance, refreshing, threshold: THRESHOLD };
}
