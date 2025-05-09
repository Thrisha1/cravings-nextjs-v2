import { getPartnerAndOffersQuery } from "@/api/partners";
import { GET_QR_TABLE } from "@/api/qrcodes";
import { getAuthCookie } from "@/app/auth/actions";
import { HotelData } from "@/app/hotels/[id]/page";
import { ThemeConfig } from "@/components/hotelDetail/ThemeChangeButton";
import { getSocialLinks } from "@/lib/getSocialLinks";
import { fetchFromHasura } from "@/lib/hasuraClient";
import HotelMenuPage from "@/screens/HotelMenuPage_v2";
import QrPayment from "@/screens/QrPayment";
import { Offer } from "@/store/offerStore_hasura";
import { unstable_cache } from "next/cache";
import React from "react";


const page = async ({
  params,
  searchParams,
}: {
  params: Promise<{ [key: string]: string | undefined }>;
  searchParams: Promise<{ query: string; qrScan: string }>;
}) => {
  const { id } = await params;

  const { qr_codes } = await fetchFromHasura(GET_QR_TABLE, {
    id: id?.[0],
  });

  const tableNumber = qr_codes[0].table_number;

  // console.log("Table Number:", tableNumber);

  if (tableNumber !== 0) {
    const { query: search } = await searchParams;
    const auth = await getAuthCookie();
    const hotelId = qr_codes[0].partner_id;

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
                String(value)
                  .toLowerCase()
                  .includes(search.trim().toLowerCase())
              )
            )
        : offers.filter(
            (offer) => new Date(offer.end_time).setHours(0, 0, 0, 0) >= today
          );
    }

    const theme = (
      typeof hoteldata?.theme === "string"
        ? JSON.parse(hoteldata?.theme)
        : hoteldata?.theme || {}
    ) as ThemeConfig;

    const socialLinks = getSocialLinks(hoteldata as HotelData);

    return (
      <HotelMenuPage
        socialLinks={socialLinks}
        auth={auth}
        hoteldata={hoteldata as HotelData}
        offers={filteredOffers}
        tableNumber={tableNumber}
        theme={theme}
      />
    );
  } else {
    return <QrPayment />;
  }
};

export default page;
