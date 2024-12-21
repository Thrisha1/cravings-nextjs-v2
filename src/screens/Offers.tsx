"use client";
import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useOfferStore, type Offer } from "@/store/offerStore";
import { OfferTicket } from "@/components/OfferTicket";
import { useClaimedOffersStore } from "@/store/claimedOffersStore";
import { useLocationStore } from "@/store/locationStore";
import { useAuthStore } from "@/store/authStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import ListingCard from "@/components/ListingCard";

export default function Offers() {
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
  const { locations, selectedLocation, setSelectedLocation } =
    useLocationStore();
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOffers, setFilteredOffers] = useState<{
    foodie: Offer[];
    mart: Offer[];
  }>({ foodie: [], mart: [] });
  const [activeMainTab, setActiveMainTab] = useState<"foodie" | "mart">(
    "foodie"
  );
  const [activeSubTab, setActiveSubTab] = useState<
    "all" | "popular" | "moneySaver"
  >("all");

  useEffect(() => {
    subscribeToOffers();
    return () => unsubscribeFromOffers();
  }, [subscribeToOffers, unsubscribeFromOffers]);

  useEffect(() => {
    const filtered = offers.reduce(
      (acc, offer) => {
        const isValid = new Date(offer.toTime) > new Date();
        const matchesLocation =
          !selectedLocation || offer.area === selectedLocation;
        const matchesSearch =
          !searchQuery ||
          offer.dishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          offer.hotelName.toLowerCase().includes(searchQuery.toLowerCase());

        if (isValid && matchesLocation && matchesSearch) {
          if (offer.category === "hotel") {
            acc.foodie.push(offer);
          } else if (offer.category === "supermarket") {
            acc.mart.push(offer);
          }
        }
        return acc;
      },
      { foodie: [] as Offer[], mart: [] as Offer[] }
    );

    let sortedFiltered = {
      foodie: [...filtered.foodie],
      mart: [...filtered.mart],
    };

    switch (activeSubTab) {
      case "popular":
        sortedFiltered = {
          foodie: [...filtered.foodie].sort(
            (a, b) => b.enquiries - a.enquiries
          ),
          mart: [...filtered.mart].sort((a, b) => b.enquiries - a.enquiries),
        };
        break;

      case "moneySaver":
        sortedFiltered = {
          foodie: [...filtered.foodie].sort((a, b) => {
            const discountA =
              ((a.originalPrice - a.newPrice) / a.originalPrice) * 100;
            const discountB =
              ((b.originalPrice - b.newPrice) / b.originalPrice) * 100;
            return discountB - discountA; // Sorting in descending order
          }),
          mart: [...filtered.mart].sort((a, b) => {
            const discountA =
              ((a.originalPrice - a.newPrice) / a.originalPrice) * 100;
            const discountB =
              ((b.originalPrice - b.newPrice) / b.originalPrice) * 100;
            return discountB - discountA; // Sorting in descending order
          }),
        };
        break;

      default: // "all" tab sorts by createdAt
        sortedFiltered = {
          foodie: [...filtered.foodie].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
          mart: [...filtered.mart].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
        };
        break;
    }

    setFilteredOffers(sortedFiltered);
  }, [offers, selectedLocation, searchQuery, activeSubTab]);

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
              Today&apos;s {activeMainTab} Offers
            </h1>
          </div>
          <div className="w-full md:w-64">
            <Select
              value={selectedLocation || "all"}
              onValueChange={(value) =>
                setSelectedLocation(value === "all" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder={`${
              activeMainTab === "foodie"
                ? "Search dishes or restaurants"
                : "Search groceries or supermarkets "
            }`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <Tabs defaultValue="foodie" className="w-full">
          <TabsList className="fixed bottom-0 left-0 w-full grid grid-cols-2 bg-orange-100 shadow-lg z-50 h-12 border-t-2 border-orange-200">
            <TabsTrigger
              value="foodie"
              onClick={() => {
                setActiveMainTab("foodie");
                setActiveSubTab("all");
              }}
              className={activeMainTab === "foodie" ? "bg-white" : ""}
            >
              Foodie Offers
            </TabsTrigger>
            <TabsTrigger
              value="mart"
              onClick={() => {
                setActiveMainTab("mart");
                setActiveSubTab("all");
              }}
              className={activeMainTab === "mart" ? "bg-white" : ""}
            >
              Crave Mart
            </TabsTrigger>
          </TabsList>

          <TabsContent value="foodie">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full grid grid-cols-3 shadow-lg z-50 h-12 bg-orange-50">
                <TabsTrigger
                  value="all"
                  onClick={() => setActiveSubTab("all")}
                  className={activeSubTab === "all" ? "bg-white" : ""}
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="popular"
                  onClick={() => setActiveSubTab("popular")}
                  className={activeSubTab === "popular" ? "bg-white" : ""}
                >
                  Popular
                </TabsTrigger>
                <TabsTrigger
                  value="moneySaver"
                  onClick={() => setActiveSubTab("moneySaver")}
                  className={activeSubTab === "moneySaver" ? "bg-white" : ""}
                >
                  Money Saver
                </TabsTrigger>
              </TabsList>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredOffers.foodie.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-xl text-gray-600">
                      {searchQuery
                        ? `No matching food offers found for "${searchQuery}"`
                        : selectedLocation
                        ? `No active food offers in ${selectedLocation} at the moment.`
                        : "No active food offers at the moment."}
                    </p>
                  </div>
                ) : (
                  filteredOffers.foodie.map((offer) => {
                    const isUpcoming = new Date(offer.fromTime) > new Date();
                    const discount = Math.round(
                      ((offer.originalPrice - offer.newPrice) /
                        offer.originalPrice) *
                        100
                    );
                    const claimed = isOfferClaimed(offer.id);

                    return (
                      <ListingCard
                        key={offer.id}
                        offer={offer}
                        discount={discount}
                        claimed={claimed}
                        isUpcoming={isUpcoming}
                        handleOfferClick={handleOfferClick}
                      />
                    );
                  })
                )}
              </div>
            </Tabs>
          </TabsContent>

          <TabsContent value="mart">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full grid grid-cols-3 shadow-lg z-50 h-12 bg-orange-50">
                <TabsTrigger
                  value="all"
                  onClick={() => setActiveSubTab("all")}
                  className={activeSubTab === "all" ? "bg-white" : ""}
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="popular"
                  onClick={() => setActiveSubTab("popular")}
                  className={activeSubTab === "popular" ? "bg-white" : ""}
                >
                  Popular
                </TabsTrigger>
                <TabsTrigger
                  value="moneySaver"
                  onClick={() => setActiveSubTab("moneySaver")}
                  className={activeSubTab === "moneySaver" ? "bg-white" : ""}
                >
                  Money Saver
                </TabsTrigger>
              </TabsList>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredOffers.mart.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-xl text-gray-600">
                      {searchQuery
                        ? `No matching mart offers found for "${searchQuery}"`
                        : selectedLocation
                        ? `No active mart offers in ${selectedLocation} at the moment.`
                        : "No active mart offers at the moment."}
                    </p>
                  </div>
                ) : (
                  filteredOffers.mart.map((offer) => {
                    const isUpcoming = new Date(offer.fromTime) > new Date();
                    const discount = Math.round(
                      ((offer.originalPrice - offer.newPrice) /
                        offer.originalPrice) *
                        100
                    );
                    const claimed = isOfferClaimed(offer.id);

                    return (
                      <ListingCard
                        key={offer.id}
                        offer={offer}
                        discount={discount}
                        claimed={claimed}
                        isUpcoming={isUpcoming}
                        handleOfferClick={handleOfferClick}
                      />
                    );
                  })
                )}
              </div>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

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
    </div>
  );
}
