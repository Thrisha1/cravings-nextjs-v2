import { getAllPartnersQuery } from '@/api/partners'
import HotelsList from '@/components/hotels/HotelsList';
import { fetchFromHasura } from "@/lib/hasuraClient";
import Image from 'next/image'
import Link from 'next/link'

export default async function HotelsPage() {
  const { partners ,  partners_aggregate } = await fetchFromHasura(getAllPartnersQuery,{
    limit: 6,
    offset: 0,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-gray-800">
        Our Partner Restaurants
      </h1>
      
      <HotelsList initialPartners={partners} totalCount={partners_aggregate.aggregate.count} />
    </div>
  )
}