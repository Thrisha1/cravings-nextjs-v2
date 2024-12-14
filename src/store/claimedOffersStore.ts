import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Offer } from './offerStore';

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
  addClaimedOffer: (offer: Offer) => string;
  isOfferClaimed: (offerId: string) => boolean;
  getClaimedOffer: (offerId: string) => ClaimedOffer | undefined;
}

export const useClaimedOffersStore = create<ClaimedOffersState>()(
  persist(
    (set, get) => ({
      claimedOffers: [],
      
      addClaimedOffer: (offer: Offer) => {
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
        
        set((state) => ({
          claimedOffers: [...state.claimedOffers, newClaim],
        }));

        return token;
      },

      isOfferClaimed: (offerId: string) => {
        return get().claimedOffers.some((claim) => claim.offerId === offerId);
      },

      getClaimedOffer: (offerId: string) => {
        return get().claimedOffers.find((claim) => claim.offerId === offerId);
      },
    }),
    {
      name: 'claimed-offers-storage',
    }
  )
);