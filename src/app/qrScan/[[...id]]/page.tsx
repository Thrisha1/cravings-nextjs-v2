import { getPartnerAndOffersQuery } from "@/api/partners";
import { GET_QR_TABLE } from "@/api/qrcodes";
import { getAuthCookie } from "@/app/auth/actions";
import { HotelData } from "@/app/hotels/[...id]/page";
import { ThemeConfig } from "@/components/hotelDetail/ThemeChangeButton";
import { getFeatures } from "@/lib/getFeatures";
import { getSocialLinks } from "@/lib/getSocialLinks";
import { fetchFromHasura } from "@/lib/hasuraClient";
import HotelMenuPage from "@/screens/HotelMenuPage_v2";
import QrPayment from "@/screens/QrPayment";
import { Offer } from "@/store/offerStore_hasura";
import { AlertTriangle } from "lucide-react";
import { unstable_cache } from "next/cache";
import React from "react";

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const page = async ({
  params,
  searchParams,
}: {
  params: Promise<{ [key: string]: string | undefined }>;
  searchParams: Promise<{ query: string; qrScan: string }>;
}) => {
  const { id: qrId } = await params;

  const id = isUUID(qrId?.[0] || "") ? qrId?.[0] : qrId?.[1];

  const { qr_codes } = await fetchFromHasura(GET_QR_TABLE, {
    id: id,
  });

  // console.log("🔍 QR Code Data:", {
  //   qrCode: qr_codes[0],
  //   hasGroup: !!qr_codes[0].qr_group,
  //   groupData: qr_codes[0].qr_group,
  //   tableNumber: qr_codes[0].table_number,
  //   partnerId: qr_codes[0].partner_id
  // });
  

  const tableNumber = qr_codes[0].table_number;

  // console.log("Table Number:", tableNumber);

  // if (tableNumber !== 0) {
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
              String(value).toLowerCase().includes(search.trim().toLowerCase())
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

  if (hoteldata) {
    const features = getFeatures(hoteldata.feature_flags as string);
    const isOrderingEnabled = features?.ordering.enabled && tableNumber !== 0;
    const isDeliveryEnabled = features?.delivery.enabled && tableNumber === 0;

    // if (isOrderingEnabled || isDeliveryEnabled) {
      return (
        <HotelMenuPage
          socialLinks={socialLinks}
          auth={auth}
          hoteldata={hotelDataWithOfferPrice as HotelData}
          offers={filteredOffers}
          tableNumber={tableNumber}
          theme={theme}
          qrGroup={qr_codes[0].qr_group}
        />
      );
    // }

    // return (
    //   <div className="flex h-screen w-full items-center justify-center bg-gray-50 p-4">
    //     <div className="w-full max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
    //       <div className="flex flex-col space-y-4 text-center">
    //         <div className="space-y-2">
    //           <AlertTriangle className="mx-auto h-10 w-10 text-yellow-500" />
    //           <h2 className="text-2xl font-bold tracking-tight">
    //             Access Restricted
    //           </h2>
    //           <p className="text-muted-foreground">
    //             {tableNumber === 0
    //               ? "Delivery is not enabled for this hotel."
    //               : "In-restaurant ordering is not enabled for this hotel."}
    //           </p>
    //         </div>
    //         <p className="text-sm text-muted-foreground">
    //           Please contact staff for assistance.
    //         </p>
    //       </div>
    //     </div>
    //   </div>
    // );
  }

  // } else {
  //   return <QrPayment />;
  // }
};

export default page;
