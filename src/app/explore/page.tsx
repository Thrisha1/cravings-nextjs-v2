import { getAllCommonOffers } from "@/api/common_offers";
import { fetchFromHasura } from "@/lib/hasuraClient";
import Explore from "@/screens/Explore";
import { unstable_cache } from "next/cache";
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
}

interface CommonOffersResponse {
  common_offers: CommonOffer[];
  common_offers_aggregate: {
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


  const getCommonOffers = unstable_cache(
    async () => {
      const variables: Record<string, any> = {
        limit: limit,
        offset: 0,
      };

      if (district) variables.district = district;
      if (searchQuery) variables.searchQuery = `%${searchQuery}%`;

      const response = await fetchFromHasura(
        getAllCommonOffers(district, searchQuery),
        variables
      );
      return (
        response || {
          common_offers: [],
          common_offers_aggregate: { aggregate: { count: 0 } },
        }
      );
    },
    [
      "all-common-offers",
      "common-offers",
      district || "all",
      searchQuery || "all",
    ],
    {
      tags: [
        "all-common-offers",
        "common-offers",
        "district:" + (district || "all"),
        "searchQuery:" + (searchQuery || "all"),
      ],
    }
  );

  const { common_offers, common_offers_aggregate } = await getCommonOffers();


  return (
    <Explore
      commonOffers={common_offers}
      limit={limit}
      totalOffers={common_offers_aggregate.aggregate.count}
      initialDistrict={district}
      initialSearchQuery={searchQuery}
    />
  );
};

export default page;
