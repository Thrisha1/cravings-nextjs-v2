"use client";
import { filterAndSortCommonOffers } from "@/app/actions/offerFetching";
import CommonOfferCard from "@/components/explore/CommonOfferCard";
import LocationSelection from "@/components/LocationSelection";
import NoOffersFound from "@/components/NoOffersFound";
import OfferCardsLoading from "@/components/OfferCardsLoading";
import OfferTabs from "@/components/OfferTabs";
import SearchBox from "@/components/SearchBox";
import { CommonOffer } from "@/components/superAdmin/OfferUploadSuperAdmin";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const Explore = ({ commonOffers }: { commonOffers: CommonOffer[] }) => {
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
    const [offers, setOffers] = useState<CommonOffer[]>([]);

  const fetchOffers = async () => {
    const filteredOffs = await filterAndSortCommonOffers({
      offers: commonOffers,
      searchQuery: searchParams.get("query") || "",
      location: searchParams.get("location") || null,
    });
    setOffers(filteredOffs as CommonOffer[]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOffers();
  }, [
    searchParams.get("location"),
    searchParams.get("query"),
    commonOffers,
  ]);

  return (
    <div className="min-h-screen w-full bg-orange-50 px-3 py-3 relative pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start md:items-center gap-3 my-4">
          <div className="flex flex-col">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">
              Explore Delicious Foods
            </h1>
          </div>
          <LocationSelection />
        </div>

        <SearchBox />

        <section className="mt-5">
          {isLoading ? (
            <OfferCardsLoading />
          ) : (
            <>
              {offers.length > 0 ? (
                <>
                  {/* offer list  */}
                  <div className="grid gap-2 gap-y-5 grid-cols-2 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
                    {offers.map((offer) => {
                      return (
                        <CommonOfferCard key={offer.id} commonOffer={offer} />
                      );
                    })}
                  </div>
                </>
              ) : (
                <NoOffersFound />
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Explore;
