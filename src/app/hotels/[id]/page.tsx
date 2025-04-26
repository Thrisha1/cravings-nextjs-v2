import { getPartnerAndOffersQuery } from "@/api/partners";
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
// import getTimestampWithTimezone from "@/lib/getTimeStampWithTimezon";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: hotelId } = await params;

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
}

export interface HotelData extends Partner {
  offers: Offer[];
  menus: HotelDataMenus[];
}

const HotelPage = async ({
  searchParams,
  params,
  hId,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
  params: Promise<{ [key: string]: string | undefined }>;
  hId: string;
}) => {
  const { query: search, qrScan } = await searchParams;
  const { id } = await params;
  const auth = await getAuthCookie();
  const hotelId = Array.isArray(id) ? hId : id;

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

  const hoteldata = hotelId ? await getHotelData(hotelId) : null;
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

  return (
    <>
      <HotelMenuPage
        offers={filteredOffers}
        hoteldata={hoteldata as HotelData}
        auth={auth || null}
        theme={theme}
      />
    </>
  );
};

export default HotelPage;
