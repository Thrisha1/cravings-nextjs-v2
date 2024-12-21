import { create } from "zustand";

interface LocationState {
  locations: string[];
}

export const useLocationStore = create<LocationState>((set) => ({
  locations: ["kakkanad", "kalamassery", "edapally"],
}));
