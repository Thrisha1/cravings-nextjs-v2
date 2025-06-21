import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Partner } from "./authStore";

interface CreatedPartnerState {
  partner: Partner | null;
  setPartner: (partner: Partner) => void;
  clearPartner: () => void;
}

export const useCreatedPartnerStore = create<CreatedPartnerState>()(
  persist(
    (set) => ({
      partner: null,
      setPartner: (partner) => set({ partner }),
      clearPartner: () => set({ partner: null }),
    }),
    {
      name: "created-partner-store", // localStorage key
    }
  )
); 