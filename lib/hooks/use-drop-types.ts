import { useEffect, useRef, useState } from "react";
import { get, set } from "idb-keyval";
import type { DropTypeRecord } from "@/types/domain";

export const DROP_TYPES_CACHE_KEY = "neuroeye_drop_types";

export function useDropTypes() {
  const [dropTypes, setDropTypes] = useState<DropTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Ref to avoid stale closure when checking if cache was loaded
  const hasCachedData = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      // 1. Try Cache
      try {
        const cached = await get<DropTypeRecord[]>(DROP_TYPES_CACHE_KEY);
        if (cached && isMounted) {
          hasCachedData.current = true;
          setDropTypes(cached);
          setLoading(false);
        }
      } catch (err) {
        console.warn("Failed to retrieve drop types from IndexedDB", err);
      }

      // 2. Fetch API
      try {
        const response = await fetch("/api/drop-types", { cache: "no-store" });
        const result = (await response.json()) as {
          ok: boolean;
          message: string;
          dropTypes: DropTypeRecord[];
        };

        if (isMounted) {
          if (result.ok) {
            setDropTypes(result.dropTypes);
            setLoading(false);
            setError(null);
            await set(DROP_TYPES_CACHE_KEY, result.dropTypes);
          } else {
            if (!hasCachedData.current) {
              setError(result.message);
              setLoading(false);
            }
          }
        }
      } catch {
        if (isMounted && !hasCachedData.current) {
          setError("No se pudieron cargar tus tipos de gota.");
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { dropTypes, setDropTypes, loading, error };
}
