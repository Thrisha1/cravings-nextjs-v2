import { getPartnerAndOffersQuery } from "@/api/partners";
import { fetchFromHasura } from "@/lib/hasuraClient";
import HotelMenuPage from "@/screens/HotelMenuPage";
import { MenuItem } from "@/store/menuStore_hasura";
import { Offer } from "@/store/offerStore_hasura";
import { unstable_cache } from "next/cache";
import React from "react";
import { Partner } from "@/store/authStore";
// import getTimestampWithTimezone from "@/lib/getTimeStampWithTimezon";

export interface HotelDataMenus extends Omit<MenuItem, 'category'> {
  category: {
    name: string;
    id: string;
    priority: number;
  }
}

export interface HotelData extends Partner {
  offers: Offer[];
  menus: HotelDataMenus[];
}

const HotelPage = async ({
  searchParams,
  params,
  hId
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
  params: Promise<{ [key: string]: string | undefined }>;
  hId: string;
}) => {
  const { query: search, qrScan } = await searchParams;
  const { id } = await params;

  const hotelId = Array.isArray(id) ? hId : id;
  

  const getHotelData = unstable_cache(
    async (id: string) => {
      try {
        
        const partnerData = await fetchFromHasura(getPartnerAndOffersQuery, {
          id
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
    [hotelId as string , "hotel-data"],
    { tags: [hotelId as string , "hotel-data"] }
  );

  const hoteldata = hotelId ? await getHotelData(hotelId) : null;
  const offers = hoteldata?.offers;

  let filteredOffers: Offer[] = [];
  if (offers) {
    filteredOffers = search
      ? offers.filter((offer) =>
          Object.values(offer).some((value) =>
            String(value).toLowerCase().includes(search.trim().toLowerCase())
          )
        )
      : offers;
  }

  // Use the store to fetch UPI data
  const upiData = {
    userId: hoteldata?.id || "",
    upiId: hoteldata?.upi_id || "fake-dummy-not-from-db@okaxis",
  };

  return (
    <HotelMenuPage
      offers={filteredOffers}
      hoteldata={hoteldata as HotelData}
      // menu={menuItems}
      qrScan={qrScan || null}
      upiData={upiData}
    />
  );
};

export default HotelPage;
