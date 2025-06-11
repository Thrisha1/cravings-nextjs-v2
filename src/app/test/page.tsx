import { fetchFromHasura } from '@/lib/hasuraClient'
import React from 'react'
import convertLocToCoord from '../actions/convertLocToCoord';

const isValidLocation = (location: string | null): boolean => {
  if (!location) return false;
  
  return location.match(
    /^(https?:\/\/)?(www\.)?(google\.com\/maps|maps\.app\.goo\.gl)\/.+/i
  ) !== null;
}

const updatePartnerGeoLocation = async (id: string, geoLocation: string) => {
  await fetchFromHasura(
    `mutation UpdatePartnerGeoLocation($id: uuid!, $geoLocation: geography!) {
      update_partners_by_pk(
        pk_columns: { id: $id },
        _set: { geo_location: $geoLocation }
      ) {
        id
      }
    }`,
    {
      id,
      geoLocation
    }
  );
}

const page = async() => {
    const { partners } = await fetchFromHasura(
        `query PartnersWithMissingLocationData {
  partners(where: {
    _or: [
      { geo_location: { _is_null: true } },
      { location: { _is_null: true } }
    ]
  }) {
    id
    location
    geo_location
    store_name
  }
  partners_aggregate(where: {
    _or: [
      { geo_location: { _is_null: true } },
      { location: { _is_null: true } }
    ]
  }) {
    aggregate {
      count
    }
  }
}`
    )

    // Process partners with valid locations but missing geo_location
    for (const partner of partners) {
      if (partner.location && isValidLocation(partner.location) && !partner.geo_location) {
        try {
          const coords = await convertLocToCoord(partner.location);
          if (coords) {

            await updatePartnerGeoLocation(partner.id, coords);
            // Update the local data
            partner.geo_location = coords;
          }
        } catch (error) {
          console.error(`Failed to convert location for partner ${partner.id}:`, error);
        }
      }
    }

  return (
    <div className="p-4 max-w-[100vw]">
        <h1 className="text-2xl font-bold mb-4">Partners with missing location data</h1>
        <p className="mb-4">Total partners: {partners.length}</p>
        <div className="w-full">
          <table className="w-full table-fixed border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 w-1/4">Store Name</th>
                <th className="border border-gray-300 px-4 py-2 w-2/5">Location</th>
                <th className="border border-gray-300 px-4 py-2 w-[35%]">Geo Location</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((partner: {
                id: string,
                store_name: string,
                location: string | null,
                geo_location: string | null
              }) => (
                <tr key={partner.id}>
                  <td className="border border-gray-300 px-4 py-2 break-words">{partner.store_name}</td>
                  <td className={`border border-gray-300 px-4 py-2 break-words ${!isValidLocation(partner.location) ? 'bg-red-200' : ''}`}>
                    {partner.location || 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 break-words">{partner.geo_location || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  )
}

export default page