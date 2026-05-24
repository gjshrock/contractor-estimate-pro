import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface ContractorProfile {
  hourlyRate: string;
  experienceYears: string;
  experienceMonths: string;
}

interface ContractorProfileContextValue {
  profile: ContractorProfile;
  setProfile: (profile: ContractorProfile) => Promise<void>;
  totalYearsExperience: number;
  isProfileSet: boolean;
}

const defaultProfile: ContractorProfile = {
  hourlyRate: "",
  experienceYears: "",
  experienceMonths: "",
};

const ContractorProfileContext = createContext<ContractorProfileContextValue | null>(null);

const STORAGE_KEY = "contractor_profile_v1";

export function ContractorProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<ContractorProfile>(defaultProfile);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setProfileState(JSON.parse(raw) as ContractorProfile);
        } catch {
          // ignore
        }
      }
    });
  }, []);

  const setProfile = useCallback(async (updated: ContractorProfile) => {
    setProfileState(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const totalYearsExperience =
    (parseFloat(profile.experienceYears) || 0) +
    (parseFloat(profile.experienceMonths) || 0) / 12;

  const isProfileSet =
    !!profile.hourlyRate && parseFloat(profile.hourlyRate) > 0;

  return (
    <ContractorProfileContext.Provider
      value={{ profile, setProfile, totalYearsExperience, isProfileSet }}
    >
      {children}
    </ContractorProfileContext.Provider>
  );
}

export function useContractorProfile() {
  const ctx = useContext(ContractorProfileContext);
  if (!ctx)
    throw new Error("useContractorProfile must be used inside ContractorProfileProvider");
  return ctx;
}
