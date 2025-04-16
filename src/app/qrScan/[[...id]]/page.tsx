import { GET_QR_TABLE } from "@/api/qrcodes";
import HotelPage from "@/app/hotels/[id]/page";
import { fetchFromHasura } from "@/lib/hasuraClient";
import QrPayment from "@/screens/QrPayment";
import React from "react";

const page = async ({
  params,
  searchParams,
}: {
  params: Promise<{ [key: string]: string | undefined }>;
  searchParams: Promise<{ query: string , qrScan: string }>;
}) => {
  const { id } = await params;

  const { qr_codes } = await fetchFromHasura(GET_QR_TABLE, {
    id: id?.[0],
  });

  const tableNumber = qr_codes[0].table_number;

  console.log("Table Number:", tableNumber);

  if (tableNumber !== 0) {
    return <HotelPage params={params} searchParams={searchParams} hId={qr_codes[0].partner_id} />;
  } else {
    return <QrPayment />;
  }
};

export default page;
