import { getAllCommonOffers } from "@/api/common_offers";
import { fetchFromHasura } from "@/lib/hasuraClient";
import Explore from "@/screens/Explore";
import React from "react";
import { getLocationCookie } from "../auth/actions";

interface CommonOffer {
  id: string;
  partner_name: string;
  item_name: string;
  price: number;
  image_url: string;
  district: string;
  created_at: string;
  coordinates: any;
  distance_meters: number;
}

interface CommonOffersResponse {
  get_offers_near_location: CommonOffer[];
  get_offers_near_location_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

const page = async ({
  searchParams,
}: {
  searchParams: Promise<{ location?: string | null; query?: string }>;
}) => {
  const limit = 8;
  const district = (await searchParams)?.location?.toLowerCase() || "";
  const searchQuery = (await searchParams)?.query || "";
  const location = await getLocationCookie();

  const getCommonOffers = async () => {
    const variables: Record<string, any> = {
      limit_count: limit,
      offset_count: 0
    };

    if (district) variables.district_filter = district;
    if (searchQuery) variables.search_query = `%${searchQuery}%`;


      variables.user_lat = location?.lat || 0;
      variables.user_lng = location?.lng || 0; 

      const loc = {
        lat: location?.lat || 0,
        lng: location?.lng || 0,
      }
    

    const response = await fetchFromHasura(
      getAllCommonOffers( location || undefined ),
      variables
    );

    return (
      response || {
        get_offers_near_location: [],
        get_offers_near_location_aggregate: { aggregate: { count: 0 } },
      }
    );
  };

  const { get_offers_near_location, get_offers_near_location_aggregate } =
    await getCommonOffers();


  return (
    <Explore
      hasUserLocation={!!location}
      commonOffers={get_offers_near_location}
      limit={limit}
      totalOffers={get_offers_near_location_aggregate.aggregate.count}
      initialDistrict={district}
      initialSearchQuery={searchQuery}
    />
  );
};

export default page;
