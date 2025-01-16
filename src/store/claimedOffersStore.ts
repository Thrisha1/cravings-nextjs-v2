// claimedOffersStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Offer } from "./offerStore";
import { db } from "../lib/firebase";
import {
  arrayUnion,
  doc,
  getDoc,
  increment,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";

interface ClaimedOffer {
  offerId: string;
  token: string;
  claimedAt: string;
  offerDetails: {
    dishName: string;
    hotelName: string;
    originalPrice: number;
    newPrice: number;
    hotelLocation: string;
  };
}

interface ClaimedOffersState {
  claimedOffers: ClaimedOffer[];
  isLoading: boolean;
  lastSynced: string | null; // Track the last sync timestamp
  addClaimedOffer: (offer: Offer, userId: string) => Promise<string>;
  isOfferClaimed: (offerId: string) => boolean;
  getClaimedOffer: (offerId: string) => ClaimedOffer | undefined;
  syncClaimedOffersWithFirestore: (userId: string) => () => void; // Returns unsubscribe function
  offersClaimable: number;
  updateUserOffersClaimable: (
    userId: string,
    isIncrement: boolean
  ) => Promise<void>;
  syncUserOffersClaimable: (userId: string) => Promise<void>;
}

export const useClaimedOffersStore = create<ClaimedOffersState>()(
  persist(
    (set, get) => ({
      claimedOffers: [],
      isLoading: false,
      lastSynced: null,
      offersClaimable: 0,

      // Add a claimed offer
      addClaimedOffer: async (offer: Offer, userId: string) => {
        const token = Math.random().toString(36).substring(2, 10).toUpperCase();

        const newClaim: ClaimedOffer = {
          offerId: offer.id,
          token,
          claimedAt: new Date().toISOString(),
          offerDetails: {
            dishName: offer.dishName,
            hotelName: offer.hotelName,
            originalPrice: offer.originalPrice,
            newPrice: offer.newPrice,
            hotelLocation: offer.hotelLocation,
          },
        };

        // Update Firestore
        const userDocRef = doc(db, "claimed_offers", userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          await updateDoc(userDocRef, {
            offers: arrayUnion(newClaim),
          });
        } else {
          await setDoc(userDocRef, {
            userId,
            offers: [newClaim],
          });
        }

        // Update local state
        set((state) => {
          const isAlreadyClaimed = state.claimedOffers.some(
            (claim) => claim.offerId === offer.id
          );

          if (!isAlreadyClaimed) {
            return { claimedOffers: [...state.claimedOffers, newClaim] };
          }

          return state;
        });

        return token;
      },

      // Check if an offer is already claimed
      isOfferClaimed: (offerId: string) => {
        return get().claimedOffers.some((claim) => claim.offerId === offerId);
      },

      // Get a claimed offer by ID
      getClaimedOffer: (offerId: string) => {
        return get().claimedOffers.find((claim) => claim.offerId === offerId);
      },

      // Sync claimed offers with Firestore (real-time updates)
      syncClaimedOffersWithFirestore: (userId: string) => {
        const now = new Date().toISOString();
        const lastSynced = get().lastSynced;

        // Only sync if data is stale (e.g., older than 5 minutes)
        if (
          !lastSynced ||
          new Date(now).getTime() - new Date(lastSynced).getTime() >
            5 * 60 * 1000 // 5 minutes
        ) {
          const userDocRef = doc(db, "claimed_offers", userId);

          // Set up a real-time listener
          const unsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              const firestoreOffers = doc.data().offers;
              set({ claimedOffers: firestoreOffers, lastSynced: now });
            }
          });

          // Return the unsubscribe function to clean up the listener
          return unsubscribe;
        }

        // If data is not stale, return a no-op function
        return () => {};
      },

      syncUserOffersClaimable: async (userId: string) => {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        const offersCalimableLessThan2 = get().offersClaimable < 2;
        console.log("offersCalimableLessThan2", offersCalimableLessThan2);

        if (userDoc.exists()) {
          const { offersClaimable } = userDoc.data();
          const localStoreTime = localStorage.getItem(
            "offersClaimableUpdatedAt"
          );
          const lastOfferClaimedAt = new Date(localStoreTime || 0);
          const minituesPassed =
            (new Date().getTime() - lastOfferClaimedAt.getTime()) / 1000 / 60;

          // if (!localStoreTime && (new Date(userDoc.data().createdAt).getTime() <= new Date().getTime() - 60000)) {
          //   minituesPassed = 9999;
          // }

          // console.log(
          //   "how many minits have passed after latofferclaimedat",
          //   localStoreTime,
          //   lastOfferClaimedAt,
          //   minituesPassed,
          //   offersCalimableLessThan2,
          //   minituesPassed >= 1440
          // );

          if (offersCalimableLessThan2 && minituesPassed >= 1440) {
            //24HRS
            set({ offersClaimable: 2 });
            const updateDocRef = doc(db, "users", userId);
            updateDoc(updateDocRef, {
              offersClaimable: 2,
            });
            set({ offersClaimable: 2 });
          }
          set({ offersClaimable });
        }
      },

      updateUserOffersClaimable: async (
        userId: string,
        isIncrement: boolean
      ) => {
        const userDocRef = doc(db, "users", userId);
        try {
          if (isIncrement) {
            await updateDoc(userDocRef, {
              offersClaimable: increment(1),
            });
            set({ offersClaimable: get().offersClaimable + 1 });
            console.log("User's claimable offers incremented");
          } else {
            localStorage.setItem(
              "offersClaimableUpdatedAt",
              new Date().toISOString()
            );
            await updateDoc(userDocRef, {
              offersClaimable: increment(-1),
            });
            set({ offersClaimable: get().offersClaimable - 1 });
            console.log("User's claimable offers decremented");
          }
          console.log("User's claimable offers updated successfully");
        } catch (error) {
          console.error("Error updating user's claimable offers: ", error);
        }
      },
    }),
    {
      name: "claimed-offers-storage", // Local storage key
    }
  )
);
