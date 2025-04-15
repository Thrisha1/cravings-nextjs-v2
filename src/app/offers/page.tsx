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

  const { offers } = await getCachedOffers();

  return <Offers offers={offers} />;
};

export default OfferMainPage;
