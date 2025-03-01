"use client";

import SearchBox from "@/components/SearchBox";
import LocationSelection from "@/components/LocationSelection";
import OfferTabs from "@/components/OfferTabs";
import OfferCard from "@/components/OfferCard";
import NoOffersFound from "@/components/NoOffersFound";
// import SurveyDialog from "@/components/SurveyDialog";
import { useEffect, useState } from "react";
import { Offer } from "@/store/offerStore";
import { useSearchParams } from "next/navigation";
import { filterAndSortOffers, getOffers } from "@/app/actions/offerFetching";
import OfferCardsLoading from "@/components/OfferCardsLoading";
import CravingsCashInfoModal from "@/components/CravingsCashInfoModal";

export default function Offers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const searchParams = useSearchParams();
  const [isLoading, setLoading] = useState(true);
  
  const fetchOffers = async () => {
    const offs = await getOffers();
    const filteredOffs = await filterAndSortOffers({
      offers: offs,
      activeTab: searchParams.get("filter") || "all",
      searchQuery: searchParams.get("query") || "",
      location: searchParams.get("location") || null,
      lat: Number(searchParams.get("lat")) || 0,
      lon: Number(searchParams.get("lon")) || 0,
    });
    setOffers(filteredOffs as Offer[]);
    setLoading(false);
  };


  useEffect(() => {
    fetchOffers();
  }, [
    searchParams.get("filter"), 
    searchParams.get("location"), 
    searchParams.get("lat"), 
    searchParams.get("lon"), 
    searchParams.get("query")
  ]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 px-3 py-3 relative pb-10">
      {/* <ScanButton /> */}
      <CravingsCashInfoModal />

      {/* survey is currently turned off */}

      {/* <SurveyDialog offers={offers} /> */}
      
      {/* christmas lights  */}
      {/* <div className="absolute top-0 gap-7 left-0 flex items-center max-w-screen overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <Image
            key={i}
            src="/christmas-lights.png"
            alt="christmas lights"
            width={400}
            height={400}
            className="scale-[110%]"
          />
        ))}
      </div> */}

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start md:items-center gap-3 my-4">
          <div className="flex flex-col">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">
              Today&apos;s Special Offers
            </h1>
          </div>
          <LocationSelection />
        </div>

        <SearchBox />

        {/* offers section  */}

        <section>
          {isLoading ? (
            <OfferCardsLoading/>
          ) : (
            <>
              {offers.length > 0 ? (
                <>
                  <OfferTabs />
                  {/* offer list  */}
                  <div className="grid gap-2 gap-y-5 grid-cols-2 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
                    {offers.map((offer) => {
                      const discount = Math.round(
                        ((offer.originalPrice - offer.newPrice) /
                          offer.originalPrice) *
                          100
                      );
                      const isUpcoming = new Date(offer.fromTime) > new Date();

                      return (
                        <OfferCard
                          key={offer.id}
                          discount={discount}
                          isUpcoming={isUpcoming}
                          offer={offer}
                        />
                      );
                    })}
                  </div>
                </>
              ) : (
                <NoOffersFound />
              )}{" "}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
