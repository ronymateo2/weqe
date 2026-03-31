import { useEffect, useState } from "react";
import { get, set } from "idb-keyval";
import type { DropTypeRecord } from "@/types/domain";

export const DROP_TYPES_CACHE_KEY = "neuroeye_drop_types";

export function useDropTypes() {
  const [dropTypes, setDropTypes] = useState<DropTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      // 1. Try Cache
      try {
        const cached = await get<DropTypeRecord[]>(DROP_TYPES_CACHE_KEY);
        if (cached && isMounted) {
          setDropTypes(cached);
          // We set loading false as soon as we have something from cache.
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
            // Save to cache for next time
            await set(DROP_TYPES_CACHE_KEY, result.dropTypes);
          } else {
            setError(result.message);
            // If we don't have anything, we're not loading anymore but we have an error
            if (dropTypes.length === 0) {
              setLoading(false);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          // If we had cache, we might not want to show a big error
          if (dropTypes.length === 0) {
            setError("No se pudieron cargar tus tipos de gota.");
            setLoading(false);
          }
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
