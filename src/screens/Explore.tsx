"use client";
import CommonOfferCard from "@/components/explore/CommonOfferCard";
import LocationSelection from "@/components/LocationSelection";
import NoOffersFound from "@/components/NoOffersFound";
import OfferCardsLoading from "@/components/OfferCardsLoading";
import OfferTabs from "@/components/OfferTabs";
import SearchBox from "@/components/SearchBox";
import { CommonOffer } from "@/components/superAdmin/OfferUploadSuperAdmin";
import React, { useState } from "react";

const Explore = ({ commonOffers }: { commonOffers: CommonOffer[] }) => {
  const [isLoading, setIsLoading] = useState(false);

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
              {commonOffers.length > 0 ? (
                <>
                  {/* offer list  */}
                  <div className="grid gap-2 gap-y-5 grid-cols-2 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
                    {commonOffers.map((offer) => {
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
