import { create } from "zustand";

interface LocationState {
  locations: string[];
}

export const useLocationStore = create<LocationState>(() => ({
  locations: ["kakkanad", "kalamassery", "edapally"],
}));
