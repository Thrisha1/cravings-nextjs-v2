import { create } from "zustand";
import { useAuthStore } from "./authStore";
import { unstable_cache } from "next/cache";
import { fetchFromHasura } from "@/lib/hasuraClient";
import getTimestampWithTimezone from "@/lib/getTimeStampWithTimezon";
import {
  addOffer,
  deleteOffer,
  getOffers,
  getPartnerOffers,
  incrementOfferEnquiry,
} from "@/api/offers";
import { revalidateTag } from "@/app/actions/revalidate";

interface Category {
  name: string;
}

interface Partner {
  district: string;
  location: string;
  id: string;
  store_name: string;
}

interface MenuItem {
  category: Category;
  description: string;
  image_url: string;
  id: string;
  name: string;
  price: number;
}

export interface Offer {
  created_at: string;
  end_time: string;
  enquiries: number;
  id: string;
  items_available: number;
  offer_price: number;
  start_time: string;
  menu: MenuItem;
  partner?: Partner;
}

interface OfferState {
  offers: Offer[];
  fetchPartnerOffers: (partnerId?: string) => Promise<void>;
  addOffer: (offer: {
    menu_id: string;
    offer_price: number;
    items_available: number;
    start_time: string;
    end_time: string;
  }) => Promise<void>;
  fetchOffer: () => Promise<Offer[]>;
  deleteOffer: (id: string) => Promise<void>;
  incrementOfferEnquiry: (offerId: string) => Promise<void>;
}

export const useOfferStore = create<OfferState>((set, get) => {
  return {
    offers: [],

    fetchOffer: async () => {
      if (get().offers.length > 0) {
        return get().offers;
      }

      try {
        const offers = await fetchFromHasura(getOffers);
        set({ offers: offers.offers });
        return offers.offers;
      } catch (error) {
        console.log(error);
        return get().offers;
      }
    },

    fetchPartnerOffers: async (partnerId?: string) => {
      if (get().offers.length > 0) {
        return;
      }

      try {
        const time = getTimestampWithTimezone(new Date());
        const userData = useAuthStore.getState().userData;
        const targetId = partnerId ? partnerId : userData?.id;

        if (!targetId) {
          throw "No partner ID provided";
        }

        const offers = await fetchFromHasura(getPartnerOffers, {
          partner_id: targetId,
          end_time: time,
        });

        set({ offers: offers.offers });
      } catch (error) {
        console.error("Error fetching offers:", error);
      }
    },

    addOffer: async (offer: {
      menu_id: string;
      offer_price: number;
      items_available: number;
      start_time: string;
      end_time: string;
    }) => {
      try {
        const user = useAuthStore.getState().userData;
        if (!user) throw "Partner not found";

        const newOffer = {
          created_at: getTimestampWithTimezone(new Date()),
          end_time: getTimestampWithTimezone(new Date(offer.end_time)),
          items_available: offer.items_available,
          menu_item_id: offer.menu_id,
          offer_price: offer.offer_price,
          partner_id: user.id,
          start_time: getTimestampWithTimezone(new Date(offer.start_time)),
        };

        console.log(newOffer);

        const addedData = await fetchFromHasura(addOffer, {
          ...newOffer,
        });

        set({
          offers: [...get().offers, addedData.insert_offers.returning[0]],
        });

        // fetch(`${process.env.NEXT_PUBLIC_WWJS_API_URL}/api/offerAlert`, {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        //   body: JSON.stringify({
        //     offer: { id: addedOffer.id, ...offerData },
        //     hotel : { id: user.uid, ...userData },
        //   }),
        // }).catch((error) => {
        //   console.error("Error sending message:", error);
        // });
      } catch (error) {
        console.error(error);
      }
    },

    deleteOffer: async (id: string) => {
      try {
        const user = useAuthStore.getState().userData;
        if (!user) throw "Partner not found";

        await fetchFromHasura(deleteOffer, {
          id: id,
        });

        set({
          offers: get().offers.filter((offer) => offer.id !== id),
        });
      } catch (error) {
        console.error(error);
      }
    },

    incrementOfferEnquiry: async (offerId: string) => {
      try {
        await fetchFromHasura(incrementOfferEnquiry, {
          id: offerId,
        });
      } catch (error) {
        console.error(error);
      }
    },
  };
});
