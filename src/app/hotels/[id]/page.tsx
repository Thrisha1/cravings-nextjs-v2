
import { getPartnerAndOffersQuery, Partner } from "@/api/partners";
import { fetchFromHasura } from "@/lib/hasuraClient";
import HotelMenuPage from "@/screens/HotelMenuPage";
import { MenuItem } from "@/store/menuStore_hasura";
import { Offer } from "@/store/offerStore_hasura";
import { unstable_cache } from "next/cache";
import React from "react";

type SearchParams = Promise<{ [key: string]: string | undefined }>;
type Params = Promise<{ id: string }>;


interface UserData extends Partner {
  offers: Offer[];
  menu: MenuItem[];
}

const HotelPage = async ({
  searchParams,
  params,
}: {
  searchParams: SearchParams;
  params: Params;
}) => {
  const { query: search, qrScan } = await searchParams;
  const { id } = await params;

  const getHotelData = unstable_cache(
    async (id: string) => {
      try {
        
        const partnerData = await fetchFromHasura(getPartnerAndOffersQuery, {
          id : id
        })

        return {
          id,
          ...(partnerData.partners[0]),
        } as UserData;
      } catch (error) {
        console.error("Error fetching hotel data:", error);
        return null;
      }
    },
    [id || ""],
    { tags: [id || ""] }
  );

  const hoteldata = id ? await getHotelData(id) : null;
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
  }

  return (
    <HotelMenuPage
      offers={filteredOffers}
      hoteldata={hoteldata as UserData}
      // menu={menuItems}
      qrScan={qrScan || null}
      upiData={upiData}
    />
  );
};

export default HotelPage;
