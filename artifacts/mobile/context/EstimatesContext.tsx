import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface MaterialItem {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  storeName: string;
  notes: string | null;
}

export interface Estimate {
  id: string;
  jobDescription: string;
  jobSummary: string;
  materials: MaterialItem[];
  grandTotal: number;
  disclaimer: string;
  createdAt: string;
}

interface EstimatesContextValue {
  estimates: Estimate[];
  addEstimate: (estimate: Estimate) => Promise<void>;
  removeEstimate: (id: string) => Promise<void>;
  removeMaterialFromEstimate: (
    estimateId: string,
    materialId: string
  ) => Promise<void>;
  getEstimate: (id: string) => Estimate | undefined;
}

const EstimatesContext = createContext<EstimatesContextValue | null>(null);

const STORAGE_KEY = "material_estimates_v1";

export function EstimatesProvider({ children }: { children: React.ReactNode }) {
  const [estimates, setEstimates] = useState<Estimate[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setEstimates(JSON.parse(raw) as Estimate[]);
        } catch {
          // ignore corrupt data
        }
      }
    });
  }, []);

  const persist = useCallback(async (updated: Estimate[]) => {
    setEstimates(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const addEstimate = useCallback(
    async (estimate: Estimate) => {
      const updated = [estimate, ...estimates];
      await persist(updated);
    },
    [estimates, persist]
  );

  const removeEstimate = useCallback(
    async (id: string) => {
      await persist(estimates.filter((e) => e.id !== id));
    },
    [estimates, persist]
  );

  const removeMaterialFromEstimate = useCallback(
    async (estimateId: string, materialId: string) => {
      const updated = estimates.map((e) => {
        if (e.id !== estimateId) return e;
        const materials = e.materials.filter((m) => m.id !== materialId);
        const grandTotal = Math.round(
          materials.reduce((sum, m) => sum + m.totalPrice, 0) * 100
        ) / 100;
        return { ...e, materials, grandTotal };
      });
      await persist(updated);
    },
    [estimates, persist]
  );

  const getEstimate = useCallback(
    (id: string) => estimates.find((e) => e.id === id),
    [estimates]
  );

  return (
    <EstimatesContext.Provider
      value={{
        estimates,
        addEstimate,
        removeEstimate,
        removeMaterialFromEstimate,
        getEstimate,
      }}
    >
      {children}
    </EstimatesContext.Provider>
  );
}

export function useEstimates() {
  const ctx = useContext(EstimatesContext);
  if (!ctx) throw new Error("useEstimates must be used inside EstimatesProvider");
  return ctx;
}
