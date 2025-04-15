import { create } from "zustand";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "./authStore";
import { unstable_cache } from "next/cache";
import { revalidateTag } from "@/app/actions/revalidate";

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
  qty?: number;
  distance?: number;
  rating?: number;
}

interface OfferState {
  offers: Offer[];
  loading: boolean;
  error: string | null;
  fetchOffers: () => Promise<void>;
  addOffer: (
    offer: Omit<
      Offer,
      | "id"
      | "hotelId"
      | "hotelName"
      | "area"
      | "hotelLocation"
      | "dishName"
      | "dishImage"
      | "originalPrice"
      | "enquiries"
      | "description"
      | "createdAt"
    >
  ) => Promise<void>;
  deleteOffer: (id: string) => Promise<void>;
  incrementEnquiry: (offerId: string, hotelId: string) => Promise<void>;
}

export const useOfferStore = create<OfferState>((set) => {
  return {
    offers: [],
    loading: false,
    error: null,

    fetchOffers: async () => {
      try {
        set({ loading: true, error: null });

        const getOffers = unstable_cache(
          async () => {
            const now = new Date().toString();
            const offersCollection = collection(db, "offers");
            const offersQuery = query(
              offersCollection,
              where("toTime", "<", now)
            );
            const querySnapshot = await getDocs(offersQuery);
            const offers: Offer[] = [];
            querySnapshot.forEach((doc) => {
              offers.push({ id: doc.id, ...doc.data() } as Offer);
            });
            return offers;
          },
          ["offers"],
          { tags: ["offers"] }
        );

        const offers = await getOffers();
        set({ offers, loading: false });
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
        throw error;
      }
    },
    
    addOffer: async (offer) => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      try {
        set({ error: null });
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          throw new Error("User data not found");
        }

        const userData = userDocSnap.data();

        // Fetch the menu item from the new menuItems collection
        const menuItemRef = doc(db, "menuItems", offer.menuItemId);
        const menuItemSnap = await getDoc(menuItemRef);

        if (!menuItemSnap.exists()) {
          throw new Error("Menu item not found");
        }

        const menuItem = menuItemSnap.data();
        
        const offerData = {
          ...offer,
          hotelId: user.uid,
          hotelName: userData.hotelName,
          area: userData.area,
          hotelLocation: userData.location,
          dishName: menuItem.name,
          dishImage: menuItem.image,
          originalPrice: menuItem.price,
          description: menuItem.description || "",
          enquiries: 0,
          category: menuItem.category || "hotel",
          fromTime: offer.fromTime.toISOString(),
          toTime: offer.toTime.toISOString(),
          createdAt: new Date().toISOString(),
          rating: 0, // You might want to handle ratings differently now
        };

        const offersRef = collection(db, "offers");
        const addedOffer = await addDoc(offersRef, offerData);

        await revalidateTag("offers");

        fetch(`${process.env.NEXT_PUBLIC_WWJS_API_URL}/api/offerAlert`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            offer: { id: addedOffer.id, ...offerData },
            hotel : { id: user.uid, ...userData },
          }),
        }).catch((error) => {
          console.error("Error sending message:", error);
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
        const offerRef = doc(db, "offers", id);
        await deleteDoc(offerRef);
        await revalidateTag("offers");
      } catch (error) {
        set({ error: (error as Error).message });
        throw error;
      }
    },

    incrementEnquiry: async (offerId: string, hotelId: string) => {
      try {
        set({ error: null });

        const hotelRef = doc(db, "users", hotelId);
        await updateDoc(hotelRef, {
          enquiry: increment(1),
        });

        const offerRef = doc(db, "offers", offerId);
        await updateDoc(offerRef, {
          enquiries: increment(1),
        });
      } catch (error) {
        set({ error: (error as Error).message });
        throw error;
      }
    },
  };
});
