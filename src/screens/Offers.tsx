"use client";

import { useEffect, useState } from "react";
import { useOfferStore, type Offer } from "@/store/offerStore";
import { OfferTicket } from "@/components/OfferTicket";
import { useClaimedOffersStore } from "@/store/claimedOffersStore";
import { useLocationStore } from "@/store/locationStore";
import { useSearchParams } from "next/navigation";
import SearchBox from "@/components/SearchBox";
import LocationSelection from "@/components/LocationSelection";
import OfferTabs from "@/components/OfferTabs";
import OfferCard from "@/components/OfferCard";
import OfferLoadinPage from "@/components/OfferLoadinPage";
import NoOffersFound from "@/components/NoOffersFound";

export default function Offers() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams?.get("query") || "";
  const location = searchParams?.get("location") || "";
  const activeTab = searchParams?.get("filter") || "all";
  const {
    offers,
    loading,
    error,
    subscribeToOffers,
    unsubscribeFromOffers,
  } = useOfferStore();
  const {  getClaimedOffer } = useClaimedOffersStore();
  const { locations } = useLocationStore();

  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);

  // const handleOfferClick = (offer: Offer) => {
  //   if (!user) {
  //     navigate.push("/login");
  //     return;
  //   }
  //   setSelectedOffer(offer);
  //   if (!isOfferClaimed(offer.id)) {
  //     incrementEnquiry(offer.id, offer.hotelId);
  //   }
  // };

  useEffect(() => {
    subscribeToOffers();
    return () => unsubscribeFromOffers();
  }, [subscribeToOffers, unsubscribeFromOffers]);

  useEffect(() => {
    const currentOffers = offers.filter((offer) => {
      const isValid = new Date(offer.toTime) > new Date();
      const matchesLocation = !location || offer.area === location;
      const matchesSearch =
        !searchQuery ||
        offer.dishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.hotelName.toLowerCase().includes(searchQuery.toLowerCase());

      return isValid && matchesLocation && matchesSearch;
    });

    const sortedOffers = [...currentOffers];

    if (activeTab === "popular") {
      sortedOffers.sort((a: Offer, b: Offer) => b.enquiries - a.enquiries);
    } else if (activeTab === "money saver") {
      sortedOffers.sort((a: Offer, b: Offer) => {
        const discountA =
          ((a.originalPrice - a.newPrice) / a.originalPrice) * 100;
        const discountB =
          ((b.originalPrice - b.newPrice) / b.originalPrice) * 100;
        return discountB - discountA;
      });
    } else {
      sortedOffers.sort(
        (a: Offer, b: Offer) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    setFilteredOffers(sortedOffers);
  }, [offers, location, searchQuery, activeTab]);

  if (loading) {
    return <OfferLoadinPage />;
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg max-w-md text-center">
          <p>Error loading offers: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 px-3 py-3 relative pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start md:items-center gap-3 my-4">
          <div className="flex flex-col">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">
              Today&apos;s Special Offers
            </h1>
          </div>
          <LocationSelection locations={locations} />
        </div>

        <SearchBox />

        {/* offer ticket  */}

        {selectedOffer && (
          <OfferTicket
            isOpen={!!selectedOffer}
            onClose={() => setSelectedOffer(null)}
            offer={selectedOffer}
            claimedOffer={
              selectedOffer ? getClaimedOffer(selectedOffer.id) : undefined
            }
          />
        )}

        {/* offers section  */}

        <section>
          {filteredOffers.length > 0 ? (
            <>
              <OfferTabs />
              {/* offer list  */}
              <div className="grid gap-2 gap-y-5 grid-cols-2 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
                {filteredOffers.map((offer) => {
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
          )}
        </section>
      </div>
    </div>
  );
}
