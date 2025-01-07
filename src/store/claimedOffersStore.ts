// claimedOffersStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Offer } from './offerStore';
import { db } from '../lib/firebase';
import { arrayUnion, doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

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
}

export const useClaimedOffersStore = create<ClaimedOffersState>()(
  persist(
    (set, get) => ({
      claimedOffers: [],
      isLoading: false,
      lastSynced: null, // Initialize lastSynced as null

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
        const userDocRef = doc(db, 'claimed_offers', userId);
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
          new Date(now).getTime() - new Date(lastSynced).getTime() > 5 * 60 * 1000 // 5 minutes
        ) {
          const userDocRef = doc(db, 'claimed_offers', userId);

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
    }),
    {
      name: 'claimed-offers-storage', // Local storage key
    }
  )
);