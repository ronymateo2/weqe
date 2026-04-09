"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const THRESHOLD = 72; // px to pull before triggering refresh
const MAX_PULL = 100; // px cap for visual indicator

export function usePullToRefresh() {
  const router = useRouter();
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
      setPullDistance(Math.min(delta, MAX_PULL));
    }

    function onTouchEnd() {
      if (!pullingRef.current) return;
      const distance = pullDistance;
      startYRef.current = null;
      pullingRef.current = false;
      setPullDistance(0);

      if (distance >= THRESHOLD) {
        setRefreshing(true);
        router.refresh();
        // Give Next.js a moment to re-fetch, then hide spinner
        setTimeout(() => setRefreshing(false), 1200);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pullDistance]);

  return { pullDistance, refreshing, threshold: THRESHOLD };
}
