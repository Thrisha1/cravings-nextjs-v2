import { create } from "zustand";
import { useAuthStore } from "./authStore";
// import { unstable_cache } from "next/cache";
import { fetchFromHasura } from "@/lib/hasuraClient";
// import  from "@/lib/getTimeStampWithTimezon";
import {
  addOffer,
  deleteOffer,
  getOffers,
  getPartnerOffers,
  incrementOfferEnquiry,
} from "@/api/offers";
import { revalidateTag } from "@/app/actions/revalidate";
import { toast } from "sonner";
import { sendOfferWhatsAppMsg } from "@/app/actions/sendWhatsappMsgs";
import { Notification } from "@/app/actions/notification";
import { HotelData } from "@/app/hotels/[...id]/page";

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
  deletion_status?: number;
  menu: MenuItem;
  partner?: Partner;
}

interface OfferState {
  offers: Offer[];
  fetchPartnerOffers: (partnerId?: string) => Promise<void>;
  addOffer: (
    offer: {
      menu_id: string;
      offer_price: number;
      items_available: number;
      start_time: string;
      end_time: string;
    },
    notificationMessage?: {
      title?: string;
      body?: string;
    }
  ) => Promise<void>;
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
        // const offers = await unstable_cache(
        //   async () => {
        const offers = await fetchFromHasura(getOffers);

        // return off;
        //   },
        //   ["all-offers", "offers"],
        //   {
        //     tags: ["all-offers", "offers"],
        //   }
        // )();
        set({ offers: offers.offers });
        return offers.offers;
      } catch (error) {
        console.error(error);
        return get().offers;
      }
    },

    setOffers: (offers: Offer[]) => {
      set({ offers });
    },

    fetchPartnerOffers: async (partnerId?: string) => {
      if (get().offers.length > 0) {
        return;
      }

      try {
        const userData = useAuthStore.getState().userData;
        const targetId = partnerId ? partnerId : userData?.id;

        if (!targetId) {
          throw "No partner ID provided";
        }

        // const offers = await unstable_cache(async () => {
        const offers = await fetchFromHasura(getPartnerOffers, {
          partner_id: targetId,
        });

        //   return offs;
        // }, ["partner-offers-" + targetId, "offers"], {
        //   tags: ["partner-offers-" + targetId, "offers"]
        // })();

        set({ offers: offers.offers });
      } catch (error) {
        console.error("Error fetching offers:", error);
      }
    },

    addOffer: async (
      offer: {
        menu_id: string;
        offer_price: number;
        items_available: number;
        start_time: string;
        end_time: string;
      },
      notificationMessage?: {
        title?: string;
        body?: string;
      }
    ) => {
      try {
        toast.loading("Adding offer...");
        const user = useAuthStore.getState().userData;
        if (!user) throw "Partner not found";

        const newOffer = {
          created_at: new Date().toISOString(),
          end_time: new Date(offer.end_time).toISOString(),
          items_available: offer.items_available,
          menu_item_id: offer.menu_id,
          offer_price: offer.offer_price,
          partner_id: user.id,
          start_time: new Date(offer.start_time).toISOString(),
        };

        let addedOffer = await fetchFromHasura(addOffer, {
          ...newOffer,
        });

        addedOffer = addedOffer.insert_offers.returning[0];

        revalidateTag("offers");
        revalidateTag(user.id);

        set({
          offers: [...get().offers, addedOffer],
        });
        toast.dismiss();
        toast.success("Offer added successfully");

        const { userData } = useAuthStore.getState();

        // await sendOfferWhatsAppMsg(addedOffer.id);
        await Notification.partner.sendOfferNotification(
          {
            ...addedOffer,
            partner: {
              store_name: (userData as HotelData)?.store_name,
              currency: (userData as HotelData)?.currency,
            },
          },
          {
            title: notificationMessage?.title || undefined,
            body: notificationMessage?.body || undefined,
          }
        );
      } catch (error) {
        console.error(error);
        toast.dismiss();
        toast.error("Error adding offer");
      }
    },

    deleteOffer: async (id: string) => {
      try {
        toast.loading("Deleting offer...");
        const user = useAuthStore.getState().userData;
        if (!user) throw "Partner not found";

        await fetchFromHasura(deleteOffer, {
          id: id,
        });

        set({
          offers: get().offers.filter((offer) => offer.id !== id),
        });

        revalidateTag("offers");
        revalidateTag(user.id);
        toast.dismiss();
        toast.success("Offer deleted successfully");
      } catch (error) {
        console.error(error);
        toast.dismiss();
        toast.error("Error deleting offer");
      }
    },

    incrementOfferEnquiry: async (offerId: string) => {
      try {
        await fetchFromHasura(incrementOfferEnquiry, {
          id: offerId,
        });
        revalidateTag("offers");
      } catch (error) {
        console.error(error);
      }
    },
  };
});
