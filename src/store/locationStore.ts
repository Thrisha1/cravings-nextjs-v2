import { create } from 'zustand';

interface LocationState {
  locations: string[];
  selectedLocation: string | null;
  setSelectedLocation: (location: string | null) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  locations: ['kakkanad', 'kalamassery', 'edapally'],
  selectedLocation: null,
  setSelectedLocation: (location) => set({ selectedLocation: location }),
}));