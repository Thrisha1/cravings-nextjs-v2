import { fetchFromHasura } from "@/lib/hasuraClient";
import React from "react";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const id = (await params).id;

  const { whatsapp_qr_codes_by_pk } = await fetchFromHasura(
    `query GetQrCode($id: uuid!) {
  whatsapp_qr_codes_by_pk(id: $id) {
    id
    number
    partner_id
    no_of_scans
    created_at
    whatsapp_group_id
    whatsapp_group {
      name
      link
      location
    }
    partner {
      id
      store_name
    }
  }
}`,
    {
      id,
    }
  );

  return <pre>{JSON.stringify(whatsapp_qr_codes_by_pk, null, 2)}</pre>;
};

export default page;
