"use client";
import { getAllCommonOffers } from "@/api/common_offers";
import CommonOfferCard from "@/components/explore/CommonOfferCard";
import LocationSelection from "@/components/LocationSelection";
import NoOffersFound from "@/components/NoOffersFound";
import OfferCardsLoading from "@/components/OfferCardsLoading";
import SearchBox from "@/components/SearchBox";
import { CommonOffer } from "@/components/superAdmin/OfferUploadSuperAdmin";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";

const Explore = ({
  commonOffers,
  limit,
  totalOffers,
  initialDistrict,
  initialSearchQuery
}: {
  commonOffers: CommonOffer[];
  limit: number;
  totalOffers: number;
  initialDistrict: string | null;
  initialSearchQuery: string;
}) => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const searchParams = useSearchParams();
  const [offers, setOffers] = useState<CommonOffer[]>(commonOffers);
  const [currentDistrict, setCurrentDistrict] = useState(initialDistrict);
  const [currentSearchQuery, setCurrentSearchQuery] = useState(initialSearchQuery);

  const { ref, inView, entry } = useInView({
    threshold: 0,
  });

  const loadMore = async () => {
    try {
      if (!inView || isLoadingMore || offers.length >= totalOffers) return;
      
      setIsLoadingMore(true);
      
      // Prepare variables object conditionally
      const variables: any = {
        limit: limit,
        offset: offers.length + 1
      };
      
      if (currentDistrict) {
        variables.district = currentDistrict;
      }
      
      if (currentSearchQuery) {
        variables.searchQuery = `%${currentSearchQuery}%`;
      }
      
      const newOffers = await fetchFromHasura(getAllCommonOffers(currentDistrict, currentSearchQuery), variables);
      
      const { common_offers } = newOffers;
      if (common_offers?.length) {
        setOffers(prev => [...prev, ...common_offers]);
      }
    } catch (error) {
      console.error("Error loading more offers:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };


  useEffect(() => {
    loadMore();
  }, [inView, entry]);

  useEffect(() => {
    setOffers(commonOffers);
  },[commonOffers]);

  useEffect(() => {
    if (isLoadingMore) {
      toast.loading("Loading more items...");
    } else {
      toast.dismiss();
    }
  }, [isLoadingMore]);

  return (
    <div className="min-h-[100dvh] w-full bg-orange-50 px-3 py-3 relative pb-24">
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
          {offers.length > 0 ? (
            <>
              {/* offer list  */}
              <div className="grid gap-2 gap-y-5 grid-cols-2 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
                {offers.map((offer, index) => {
                  const isLast = index === offers.length - 1;
                  return (
                    <div
                      key={offer.id}
                      ref={isLast ? ref : null}
                    >
                      <CommonOfferCard commonOffer={offer} />
                    </div>
                  );
                })}
              </div>
              {isLoadingMore && <OfferCardsLoading />}
            </>
          ) : (
            <NoOffersFound />
          )}
        </section>
      </div>
    </div>
  );
};

export default Explore;