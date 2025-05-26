import { getPartnerAndOffersQuery, getPartnerSubscriptionQuery } from "@/api/partners";
import { fetchFromHasura } from "@/lib/hasuraClient";
import HotelMenuPage from "@/screens/HotelMenuPage_v2";
import { MenuItem } from "@/store/menuStore_hasura";
import { Offer } from "@/store/offerStore_hasura";
import { unstable_cache } from "next/cache";
import React from "react";
import { Partner } from "@/store/authStore";
import { getAuthCookie } from "@/app/auth/actions";
import { ThemeConfig } from "@/components/hotelDetail/ThemeChangeButton";
import { Metadata } from "next";
import { getSocialLinks } from "@/lib/getSocialLinks";
import { usePartnerStore } from "@/store/usePartnerStore";
import { usePartnerStore } from "@/store/usePartnerStore";
// import getTimestampWithTimezone from "@/lib/getTimeStampWithTimezon";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string[] }>;
}): Promise<Metadata> {
  const { id: hotelIds } = await params;

  const hotelId = isUUID(hotelIds?.[0] || "") ? hotelIds?.[0] : hotelIds?.[1];
  
  

  const getHotelData = unstable_cache(
    async (id: string) => {
      try {
        const partnerData = await fetchFromHasura(getPartnerAndOffersQuery, {
          id,
        });
        
        return {
          id,
          ...partnerData.partners[0],
        } as HotelData;
      } catch (error) {
        console.error("Error fetching hotel data:", error);
        return null;
      }
    },
    [hotelId as string, "hotel-data"],
    { tags: [hotelId as string, "hotel-data"] }
  );

  const hotel = await getHotelData(hotelId);
  // console.log("partnerdata",hotel);

  if (!hotel) {
    throw new Error("Hotel not found");
  }

  return {
    title: hotel.store_name,
    icons: [hotel.store_banner || "/hotelDetailsBanner.jpeg"],
    description:
      hotel.description ||
      "Welcome to " + hotel.store_name + "! Enjoy a comfortable stay with us.",
    openGraph: {
      images: [hotel.store_banner || "/hotelDetailsBanner.jpeg"],
      title: hotel.store_name,
      description:
        hotel.description ||
        "Welcome to " +
          hotel.store_name +
          "! Enjoy a comfortable stay with us.",
    },
  };
}

export interface HotelDataMenus extends Omit<MenuItem, "category"> {
  category: {
    name: string;
    id: string;
    priority: number;
  };
  offers: {
    offer_price: number;
  }[];
}

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export interface HotelData extends Partner {
  offers: Offer[];
  menus: HotelDataMenus[];
}

export interface SocialLinks {
  instagram?: string;
  whatsapp?: string;
  googleReview?: string;
  location?: string;
}

const HotelPage = async ({
  searchParams,
  params,
}: {
  searchParams: Promise<{ query: string; qrScan: boolean }>;
  params: Promise<{ [key: string]: string | undefined }>;
}) => {
  const { query: search, qrScan } = await searchParams;
  const { id } = await params;
  const auth = await getAuthCookie();

  const hotelId = isUUID(id?.[0] || "") ? id?.[0] : id?.[1];

  const getHotelData = unstable_cache(
    async (id: string) => {
      try {
        return fetchFromHasura(getPartnerAndOffersQuery, {
          id,
        });
      } catch (error) {
        console.error("Error fetching hotel data:", error);
        return null;
      }
    },
    [hotelId as string, "hotel-data"],
    { tags: [hotelId as string, "hotel-data"] }
  );

  let hoteldata = hotelId
    ? ((await getHotelData(hotelId))?.partners[0] as HotelData)
    : null;
  const offers = hoteldata?.offers;

  let filteredOffers: Offer[] = [];
  if (offers) {
    const today = new Date().setHours(0, 0, 0, 0);
    filteredOffers = search
      ? offers
          .filter(
            (offer) => new Date(offer.end_time).setHours(0, 0, 0, 0) < today
          )
          .filter((offer) =>
            Object.values(offer).some((value) =>
              String(value).toLowerCase().includes(search.trim().toLowerCase())
            )
          )
      : offers.filter(
          (offer) => new Date(offer.end_time).setHours(0, 0, 0, 0) >= today
        );
  }

  // Use the store to fetch UPI data
  const upiData = {
    userId: hoteldata?.id || "",
    upiId: hoteldata?.upi_id || "fake-dummy-not-from-db@okaxis",
  };

  const theme = (
    typeof hoteldata?.theme === "string"
      ? JSON.parse(hoteldata?.theme)
      : hoteldata?.theme || {}
  ) as ThemeConfig;

  const socialLinks = getSocialLinks(hoteldata as HotelData);

  const menuItemWithOfferPrice = hoteldata?.menus?.map((item) => {
    return {
      ...item,
      price: item.offers?.[0]?.offer_price || item.price,
    };
  });

  const hotelDataWithOfferPrice = {
    ...hoteldata,
    menus: menuItemWithOfferPrice,
  };

  const getLastSubscription = await fetchFromHasura(getPartnerSubscriptionQuery,
    {
      partnerId: hoteldata?.id || "",
    }
  );

  const lastSubscription = getLastSubscription?.partner_subscriptions[0];


  if (hoteldata?.status === "inactive") {

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 py-8">
          <div className="text-center p-4 sm:p-8 bg-white rounded-3xl shadow-lg w-full max-w-[90%] sm:max-w-md mx-auto">
            <h1 className="text-xl sm:text-3xl font-bold mb-4 text-orange-600">{(new Date(lastSubscription?.expiry_date) < new Date()) ? "Hotel Subscription Expired" : "Hotel is Currently Inactive"}</h1>
            <p className="mb-6 text-sm sm:text-base text-gray-600">
              This hotel is temporarily unavailable. For assistance, please contact our support team.
            </p>
            <div className="text-gray-700 bg-gray-100 p-4 rounded-md">
              <p className="font-medium text-sm sm:text-base">Contact Support:</p>
              <a href="tel:+916238969297" className="text-blue-600 hover:text-blue-800 block mt-2 text-sm sm:text-base">
                +91 6238969297
              </a>
            </div>
          </div>
        </div>
      );

  
  }
 

  return (
    <>
      <HotelMenuPage
        socialLinks={socialLinks}
        offers={filteredOffers}
        hoteldata={hotelDataWithOfferPrice as HotelData}
        auth={auth || null}
        theme={theme}
        tableNumber={0}
        qrId={null}
      />
    </>
  );
};

export default HotelPage;
