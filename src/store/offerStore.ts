import { create } from 'zustand';
import { ref, push, remove, onValue, off, runTransaction } from 'firebase/database';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { rtdb, db } from '@/lib/firebase';
import { useAuthStore } from './authStore';

export interface Offer {
  id: string;
  menuItemId: string;
  dishName: string;
  dishImage: string;
  originalPrice: number;
  newPrice: number;
  fromTime: Date;
  toTime: Date;
  createdAt: Date;
  hotelId: string;
  hotelName: string;
  area: string;
  hotelLocation: string;
  itemsAvailable: number;
  enquiries: number;
  category: string;
  description?: string;
}

interface OfferState {
  offers: Offer[];
  loading: boolean;
  error: string | null;
  subscribeToOffers: () => void;
  unsubscribeFromOffers: () => void;
  addOffer: (offer: Omit<Offer, 'id' | 'hotelId' | 'hotelName' | 'area' | 'hotelLocation' | 'dishName' | 'dishImage' | 'originalPrice' | 'enquiries' | 'description' | 'createdAt'>) => Promise<void>;
  deleteOffer: (id: string) => Promise<void>;
  incrementEnquiry: (offerId: string, hotelId: string) => Promise<void>;
}

export const useOfferStore = create<OfferState>((set) => {
  let offersRef: ReturnType<typeof ref> | null = null;

  return {
    offers: [],
    loading: false,
    error: null,

    subscribeToOffers: () => {
      set({ loading: true, error: null });
      offersRef = ref(rtdb, 'offers');

      onValue(
        offersRef,
        (snapshot) => {
          try {
            const data = snapshot.val();
            const offers: Offer[] = [];

            if (data) {
              Object.keys(data).forEach((key) => {
                offers.push({
                  id: key,
                  ...data[key],
                  fromTime: new Date(data[key].fromTime),
                  toTime: new Date(data[key].toTime),
                  createdAt: new Date(data[key].createdAt),
                  enquiries: data[key].enquiries || 0,
                  description: data[key].description || '',
                });
              });
            }

            set({ offers, loading: false, error: null });
          } catch (error) {
            set({ error: (error as Error).message, loading: false });
          }
        },
        (error) => {
          set({ error: error.message, loading: false });
        }
      );
    },

    unsubscribeFromOffers: () => {
      if (offersRef) {
        off(offersRef);
        set({ loading: false, error: null });
      }
    },

    addOffer: async (offer) => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      try {
        set({ error: null });
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          throw new Error('User data not found');
        }

        const userData = userDocSnap.data();
        const menuItems = userData.menu || [];
        const menuItem = menuItems.find((item: any) => item.id === offer.menuItemId);

        if (!menuItem) {
          throw new Error('Menu item not found');
        }

        const offersRef = ref(rtdb, 'offers');
        await push(offersRef, {
          ...offer,
          hotelId: user.uid,
          hotelName: userData.hotelName,
          area: userData.area,
          hotelLocation: userData.location,
          dishName: menuItem.name,
          dishImage: menuItem.image,
          originalPrice: menuItem.price,
          description: menuItem.description || '',
          enquiries: 0,
          category: userData.category || 'hotel',
          fromTime: offer.fromTime.toISOString(),
          toTime: offer.toTime.toISOString(),
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        set({ error: (error as Error).message });
        throw error;
      }
    },

    deleteOffer: async (id) => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      try {
        set({ error: null });
        const offerRef = ref(rtdb, `offers/${id}`);
        await remove(offerRef);
      } catch (error) {
        set({ error: (error as Error).message });
        throw error;
      }
    },

    incrementEnquiry: async (offerId: string, hotelId: string) => {
      try {
        set({ error: null });
        const hotelRef = doc(db, 'users', hotelId);
        await updateDoc(hotelRef, {
          enquiry: increment(1),
        });

        const offerRef = ref(rtdb, `offers/${offerId}`);
        await runTransaction(offerRef, (currentData) => {
          if (currentData === null) {
            return { enquiries: 1 };
          }
          return {
            ...currentData,
            enquiries: (currentData.enquiries || 0) + 1,
          };
        });
      } catch (error) {
        set({ error: (error as Error).message });
        throw error;
      }
    },
  };
});
