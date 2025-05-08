import { fetchFromHasura } from '@/lib/hasuraClient'
import React from 'react'

interface WhatsappNumber {
  number: string,
  area: string
}

const page = async () => {
  // Fetch partners with whatsapp numbers
  const response = await fetchFromHasura(
     `query GetPartnersWithWhatsapp {
      partners(where: {whatsapp_number: {_is_null: false}}) {
        id
        whatsapp_number
        whatsapp_numbers
      }
    }`
  );

  // Process each partner to update their whatsapp_numbers
  const partnersWithUpdatedNumbers = response.partners.map(partner => {
    // If whatsapp_number exists but whatsapp_numbers is empty/null
    if (partner.whatsapp_number && (!partner.whatsapp_numbers || partner.whatsapp_numbers.length === 0)) {
      return {
        ...partner,
        whatsapp_numbers: [{ number: partner.whatsapp_number, area: "default" }]
      };
    }
    return partner;
  });

  console.log('Updated partners data:', partnersWithUpdatedNumbers);

  // Update each partner in Hasura
  // await Promise.all(partnersWithUpdatedNumbers.map(async (partner) => {
  //   await fetchFromHasura(
  //     `mutation UpdatePartner($id: uuid!, $whatsapp_numbers: jsonb!) {
  //       update_partners_by_pk(
  //         pk_columns: {id: $id},
  //         _set: {whatsapp_numbers: $whatsapp_numbers}
  //       ) {
  //         id
  //       }
  //     }`,
  //   {
  //       id: partner.id,
  //       whatsapp_numbers: partner.whatsapp_numbers
  //     }
  //   );
  // }));

  return (
    <div>
      <h1>Partners Page</h1>
      <p>Processed {partnersWithUpdatedNumbers.length} partners</p>
    </div>
  )
}

export default page