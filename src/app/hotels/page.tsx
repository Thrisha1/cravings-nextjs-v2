import { getAllPartnersQuery } from "@/api/partners";
import HotelsList from "@/components/hotels/HotelsList";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { unstable_cache } from "next/cache";

export default async function HotelsPage() {

  const getCachedPartners = unstable_cache(
    async () => {
      return fetchFromHasura(getAllPartnersQuery, {
        limit: 6,
        offset: 0,
      });
    },
    ["partners-offset-0" , "partners"],
    {
      tags: ["partners-offset-0" , "partners"],
    }
  );

  const { partners, partners_aggregate } = await getCachedPartners();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-gray-800">
        Our Partner Restaurants
      </h1>

      <HotelsList
        initialPartners={partners}
        totalCount={partners_aggregate.aggregate.count}
      />
    </div>
  );
}
