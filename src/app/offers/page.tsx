import { getAllCommonOffers } from "@/api/common_offers";
import { getOffers } from "@/api/offers";
import { fetchFromHasura } from "@/lib/hasuraClient";
import Offers from "@/screens/Offers";
import { unstable_cache } from "next/cache";
import React from "react";

const OfferMainPage = async () => {
  
  const getCachedOffers = await unstable_cache(
    async () => {
      return fetchFromHasura(getOffers);
    },
    ["all-offers", "offers"],
    {
      tags: ["all-offers", "offers"],
    }
  );

  const getCommonOffers = async () => {
    return fetchFromHasura(getAllCommonOffers);
  }

  const { offers } = await getCachedOffers();
  const { common_offers } = await getCommonOffers();

  console.log("offers", common_offers);
  

  return <Offers offers={offers} />;
};

export default OfferMainPage;
