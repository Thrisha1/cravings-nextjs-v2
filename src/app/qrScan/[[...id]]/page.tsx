import { GET_QR_TABLE } from "@/api/qrcodes";
import { fetchFromHasura } from "@/lib/hasuraClient";
import QrPayment from "@/screens/QrPayment";
import { redirect } from "next/navigation";
import React from "react";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { qr_codes } = await fetchFromHasura(GET_QR_TABLE, {
    id: id[0],
  });

  const tableNumber = qr_codes[0].table_number;

  console.log("Table Number:", tableNumber);
  

  if (tableNumber === 0) {
    return redirect(`/hotels/${qr_codes[0].partner_id}/`);
  } else {
    return <QrPayment />;
  }
};

export default page;
