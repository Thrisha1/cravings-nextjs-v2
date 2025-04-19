import { getAllCommonOffers } from "@/api/common_offers";
import { fetchFromHasura } from "@/lib/hasuraClient";
import Explore from "@/screens/Explore";
import { unstable_cache } from "next/cache";
import React from "react";

const page = async () => {
  const limit = 8;

  const getCommonOffers = await unstable_cache(
    async () => {
      return fetchFromHasura(getAllCommonOffers, {
        limit: limit,
        offset: 0,
      });
    },
    ["all-common-offers", "common-offers"],
    {
      tags: ["all-common-offers", "common-offers"],
    }
  );

  const { common_offers , common_offers_aggregate } = await getCommonOffers();

  return <Explore commonOffers={common_offers} limit={limit} totalOffers={common_offers_aggregate.aggregate.count} />;
};

export default page;
