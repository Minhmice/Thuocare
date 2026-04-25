import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getMedications,
  getMedicationsMerged,
} from "../../features/meds/repository";
import { subscribeLocalMedications } from "./localMedsStore";
import type { Medication } from "../../types/medication";

type MedicationsContextValue = {
  items: Medication[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const MedicationsContext = createContext<MedicationsContextValue | null>(null);

export function MedicationsProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [items, setItems] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      if (!hasLoadedRef.current) setLoading(true);
      const data = await getMedications();
      hasLoadedRef.current = true;
      if (!isMountedRef.current) return;
      setItems(data ?? []);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(
        err instanceof Error ? err.message : "Failed to load medications"
      );
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Reflect localMedsStore mutations (add / edit / delete) instantly without
  // re-fetching remote — the merge is done synchronously from the cached snapshot.
  // Also clears any outstanding remote error: locally merged data is valid to show.
  useEffect(() => {
    return subscribeLocalMedications(() => {
      setItems(getMedicationsMerged());
      setError(null);
    });
  }, []);

  return (
    <MedicationsContext.Provider
      value={{ items, loading, error, refresh }}
    >
      {children}
    </MedicationsContext.Provider>
  );
}

export function useMedicationsData(): MedicationsContextValue {
  const ctx = useContext(MedicationsContext);
  if (!ctx) {
    throw new Error(
      "useMedicationsData must be used within MedicationsProvider"
    );
  }
  return ctx;
}
