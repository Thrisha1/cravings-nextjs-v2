import { fetchFromHasura } from "@/lib/hasuraClient";
import React from "react";

const Page = async () => {
  const { common_offers } = await fetchFromHasura(`
    query {
      common_offers(where: {location: {_is_null: false}}) {
        id
        partner_name
        item_name
        location
        coordinates
      }
    }`);

  return (
    <div className="container  px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Common Offers</h1>
      <p className="text-gray-600 mb-8">
        Browse through our current partnership offers and their locations.
      </p>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partner
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coordinates
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {common_offers.map((offer: any, index: number) => (
                <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {offer.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {offer.partner_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {offer.item_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {offer.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {offer.coordinates ? JSON.stringify(offer.coordinates) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {common_offers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No offers available at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default Page;