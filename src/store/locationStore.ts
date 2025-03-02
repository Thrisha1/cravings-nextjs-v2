import { create } from "zustand";

interface LocationState {
  locations: string[];
}

export const useLocationStore = create<LocationState>(() => ({
  locations:[
    "Kasaragod",
    "Kannur",
    "Kozhikode",
    "Malappuram",
    "Palakkad",
    "Thrissur",
    "Ernakulam",
    "Idukki",
    "Wayanad",
    "Kottayam",
    "Pathanamthitta",
    "Alappuzha",
    "Kollam",
    "Trivandrum",
  ],
}));
