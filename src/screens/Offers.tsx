"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useOfferStore, type Offer } from "@/store/offerStore";
import { OfferTicket } from "@/components/OfferTicket";
import { useClaimedOffersStore } from "@/store/claimedOffersStore";
import { useLocationStore } from "@/store/locationStore";
import { useAuthStore } from "@/store/authStore";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBox from "@/components/SearchBox";
import LocationSelection from "@/components/LocationSelection";
import OfferTabs from "@/components/OfferTabs";
import OfferCard from "@/components/OfferCard";

export default function Offers() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams?.get("query") || "";
  const location = searchParams?.get("location") || "";
  const activeTab = searchParams?.get("filter") || "all";

  const navigate = useRouter();
  const { user } = useAuthStore();
  const {
    offers,
    loading,
    error,
    subscribeToOffers,
    unsubscribeFromOffers,
    incrementEnquiry,
  } = useOfferStore();
  const { isOfferClaimed, getClaimedOffer } = useClaimedOffersStore();
  const { locations } = useLocationStore();

  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);

  const handleOfferClick = (offer: Offer) => {
    if (!user) {
      navigate.push("/login");
      return;
    }
    setSelectedOffer(offer);
    if (!isOfferClaimed(offer.id)) {
      incrementEnquiry(offer.id, offer.hotelId);
    }
  };

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
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          <span className="text-lg text-gray-600">Loading offers...</span>
        </div>
      </div>
    );
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
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 px-8 py-3 relative pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 my-4">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900">
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
          <OfferTabs />

          {/* offer list  */}
          <div className="grid gap-5 md:grid-cols-3">
            {filteredOffers.length > 0 ? (
              <>
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
                      claimed={isOfferClaimed(offer.id)}
                      handleOfferClick={handleOfferClick}
                    />
                  );
                })}
              </>
            ) : (
              "No offers found"
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
