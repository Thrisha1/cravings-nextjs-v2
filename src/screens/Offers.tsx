"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Tag, Loader2, Search } from "lucide-react";
import { useOfferStore, type Offer } from "@/store/offerStore";
import { CountdownTimer } from "@/components/CountdownTimer";
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
import Share from "@/components/Share";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'moneySaver' | 'foodie' | 'mart'>('all');

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

    let sortedFiltered = { foodie: [...filtered.foodie], mart: [...filtered.mart] };

    switch (activeTab) {
      case "popular":
        sortedFiltered = {
          foodie: [...filtered.foodie].sort((a, b) => b.enquiries - a.enquiries),
          mart: [...filtered.mart].sort((a, b) => b.enquiries - a.enquiries),
        };
        break;

      case "moneySaver":
        sortedFiltered = {
          foodie: [...filtered.foodie].sort((a, b) => {
            const discountA = ((a.originalPrice - a.newPrice) / a.originalPrice) * 100;
            const discountB = ((b.originalPrice - b.newPrice) / b.originalPrice) * 100;
            return discountB - discountA; // Sorting in descending order
          }),
          mart: [...filtered.mart].sort((a, b) => {
            const discountA = ((a.originalPrice - a.newPrice) / a.originalPrice) * 100;
            const discountB = ((b.originalPrice - b.newPrice) / b.originalPrice) * 100;
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
  }, [offers, selectedLocation, searchQuery, activeTab]);


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
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 px-8 py-3 relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 my-4">
          <div className="flex flex-col ">
            <h1 className="text-3xl font-bold text-gray-900">
              Today&apos;s Special Offers
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
            placeholder="Search dishes or hotels"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        {/* <Tabs defaultValue="filter" className="w-full border-1 my-4 border-t-[1.5px]">
          
        </Tabs>          */}

        <Tabs defaultValue="foodie" className="w-full ">
          <TabsList className="fixed bottom-0 left-0 w-full grid grid-cols-2 bg-orange-100 shadow-lg z-50 h-12 border-t-2 border-orange-200">
            <TabsTrigger value="foodie"
              onClick={() => setActiveTab('foodie')}
              className={activeTab === 'foodie' ? 'bg-white' : ''}
            >
              Foodie Offers</TabsTrigger>
            <TabsTrigger value="mart"
              onClick={() => setActiveTab('mart')}
              className={activeTab === 'mart' ? 'bg-white' : ''}
            >
              Crave Mart</TabsTrigger>
          </TabsList>

          <TabsList className="w-full grid grid-cols-3 shadow-lg z-50 h-12 bg-orange-50">
            <TabsTrigger
              value="all"
              onClick={() => setActiveTab('all')}
              className={activeTab === 'all' ? 'bg-white' : ''}
            >
              All
            </TabsTrigger>
            <TabsTrigger value="popular"
              onClick={() => setActiveTab('popular')}
              className={activeTab === 'popular' ? 'bg-white' : ''}
            >
              Popular</TabsTrigger>
            <TabsTrigger value="moneySaver"
              onClick={() => setActiveTab('moneySaver')}
              className={activeTab === 'moneySaver' ? 'bg-white' : ''}
            >
              Money Saver</TabsTrigger>
          </TabsList>

          <TabsContent value="foodie">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredOffers.foodie.map((offer) => {
                  const isUpcoming = new Date(offer.fromTime) > new Date();
                  const discount = Math.round(
                    ((offer.originalPrice - offer.newPrice) / offer.originalPrice) * 100
                  );
                  const claimed = isOfferClaimed(offer.id);

                  return (
                    <Card
                      key={offer.id}
                      className="overflow-hidden hover:shadow-xl transition-shadow"
                    >
                      <Link href={`/offers/${offer.id}`}>
                        <Image
                          src={offer.dishImage}
                          alt={offer.dishName}
                          width={300}
                          height={300}
                          className="w-full h-48 object-cover"
                        />
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <CardTitle className="text-xl font-bold">
                                {offer.dishName}
                              </CardTitle>
                              {offer.description && (
                                <p className="text-sm text-gray-600 leading-snug">
                                  {offer.description}
                                </p>
                              )}
                              <p className="text-base font-medium text-gray-700">
                                {offer.hotelName}
                              </p>
                            </div>
                            <Badge variant="destructive" className="bg-orange-600">
                              {discount}% OFF
                            </Badge>
                          </div>
                        </CardHeader>
                      </Link>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 line-through">
                              ₹{offer.originalPrice.toFixed(2)}
                            </span>
                            <span className="text-2xl font-bold text-orange-600">
                              ₹{offer.newPrice.toFixed(2)}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <div className="flex flex-col gap-3">
                                {!isUpcoming && (
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Clock className="w-4 h-4 mr-2" />
                                    <CountdownTimer
                                      endTime={offer.toTime}
                                      upcomming={false}
                                    />
                                  </div>
                                )}
                                <div className="flex items-center text-sm text-gray-500">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  {offer.area}
                                </div>
                              </div>
                              <Share offerId={offer.id} />
                            </div>
                            <div className="flex gap-3">
                              <div className="flex flex-wrap gap-2 mt-4">
                                <Badge
                                  variant="secondary"
                                  className="bg-orange-100 text-orange-800"
                                >
                                  <Tag className="w-3 h-3 mr-1" />
                                  {offer.itemsAvailable} items{" "}
                                  {isUpcoming ? "left" : "available"}
                                </Badge>
                              </div>
                              {claimed && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-600 text-white"
                                  >
                                    Claimed
                                  </Badge>
                                </div>
                              )}
                              {offer.enquiries > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                  <Badge
                                    variant="secondary"
                                    className={
                                      offer.enquiries > offer.itemsAvailable
                                        ? "bg-red-600 text-white"
                                        : "bg-orange-500 text-white"
                                    }
                                  >
                                    {offer.enquiries > offer.itemsAvailable
                                      ? "High Demand"
                                      : "In Demand"}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-3">
                            {/* Claim Button */}
                            <Button
                              disabled={isUpcoming}
                              onClick={
                                isUpcoming
                                  ? undefined
                                  : () => handleOfferClick(offer)
                              }
                              className={`w-full ${isUpcoming
                                ? "bg-gray-100 disabled:opacity-100 text-[#E63946] font-bold shadow-xl border border-gray-200"
                                : "bg-orange-600 hover:bg-orange-700"
                                }`}
                            >
                              {claimed ? (
                                "View Ticket"
                              ) : isUpcoming ? (
                                <div className="">
                                  Offer Activates in :{" "}
                                  <CountdownTimer
                                    endTime={offer.fromTime}
                                    upcomming={true}
                                  />
                                </div>
                              ) : (
                                "Claim Offer"
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mart">
            {filteredOffers.mart.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">
                  {searchQuery
                    ? `No matching supermarket offers found for "${searchQuery}"`
                    : selectedLocation
                      ? `No active supermarket offers in ${selectedLocation} at the moment.`
                      : "No active supermarket offers at the moment."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredOffers.mart.map((offer) => {
                  const isUpcoming = new Date(offer.fromTime) > new Date();
                  const discount = Math.round(
                    ((offer.originalPrice - offer.newPrice) /
                      offer.originalPrice) *
                    100
                  );
                  const claimed = isOfferClaimed(offer.id);

                  return (
                    <Card
                      key={offer.id}
                      className="overflow-hidden hover:shadow-xl transition-shadow"
                    >
                      <Image
                        src={offer.dishImage}
                        alt={offer.dishName}
                        width={300}
                        height={300}
                        className="w-full h-48 object-cover"
                      />
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <CardTitle className="text-xl font-bold">
                              {offer.dishName}
                            </CardTitle>
                            {offer.description && (
                              <p className="text-sm text-gray-600 leading-snug">
                                {offer.description}
                              </p>
                            )}
                            <p className="text-base font-medium text-gray-700">
                              {offer.hotelName}
                            </p>
                          </div>
                          <Badge
                            variant="destructive"
                            className="bg-orange-600"
                          >
                            {discount}% OFF
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 line-through">
                              ₹{offer.originalPrice.toFixed(2)}
                            </span>
                            <span className="text-2xl font-bold text-orange-600">
                              ₹{offer.newPrice.toFixed(2)}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {!isUpcoming && (
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="w-4 h-4 mr-2" />
                                <CountdownTimer
                                  endTime={offer.toTime}
                                  upcomming={false}
                                />
                              </div>
                            )}
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="w-4 h-4 mr-2" />
                              {offer.area}
                            </div>
                            <div className="flex gap-3">
                              <div className="flex flex-wrap gap-2 mt-4">
                                <Badge
                                  variant="secondary"
                                  className="bg-orange-100 text-orange-800"
                                >
                                  <Tag className="w-3 h-3 mr-1" />
                                  {offer.itemsAvailable} items{" "}
                                  {isUpcoming ? "left" : "available"}
                                </Badge>
                              </div>
                              {claimed && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-600 text-white"
                                  >
                                    Claimed
                                  </Badge>
                                </div>
                              )}
                              {offer.enquiries > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                  <Badge
                                    variant="secondary"
                                    className={
                                      offer.enquiries > offer.itemsAvailable
                                        ? "bg-red-600 text-white"
                                        : "bg-orange-500 text-white"
                                    }
                                  >
                                    {offer.enquiries > offer.itemsAvailable
                                      ? "High Demand"
                                      : "In Demand"}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>

                          <Button
                            disabled={isUpcoming}
                            onClick={
                              isUpcoming
                                ? undefined
                                : () => handleOfferClick(offer)
                            }
                            className={`w-full ${isUpcoming
                              ? "bg-gray-100 disabled:opacity-100 text-[#E63946] font-bold shadow-xl border border-gray-200"
                              : "bg-orange-600 hover:bg-orange-700"
                              }`}
                          >
                            {claimed ? (
                              "View Ticket"
                            ) : isUpcoming ? (
                              <div className="">
                                Claim your offer in :{" "}
                                <CountdownTimer
                                  endTime={offer.fromTime}
                                  upcomming={true}
                                />
                              </div>
                            ) : (
                              "Claim Offer"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all">
            {filteredOffers.foodie.length === 0 && filteredOffers.mart.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">
                  {searchQuery
                    ? `No matching offers found for "${searchQuery}"`
                    : selectedLocation
                      ? `No active offers in ${selectedLocation} at the moment.`
                      : "No active offers at the moment."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...filteredOffers.foodie, ...filteredOffers.mart].map((offer) => {
                  const isUpcoming = new Date(offer.fromTime) > new Date();
                  const discount = Math.round(
                    ((offer.originalPrice - offer.newPrice) / offer.originalPrice) * 100
                  );
                  const claimed = isOfferClaimed(offer.id);

                  return (
                    <Card
                      key={offer.id}
                      className="overflow-hidden hover:shadow-xl transition-shadow"
                    >
                      <Link href={`/offers/${offer.id}`}>
                        <Image
                          src={offer.dishImage}
                          alt={offer.dishName}
                          width={300}
                          height={300}
                          className="w-full h-48 object-cover"
                        />
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <CardTitle className="text-xl font-bold">
                                {offer.dishName}
                              </CardTitle>
                              <p className="text-base font-medium text-gray-700">
                                {offer.hotelName}
                              </p>
                            </div>
                            <Badge variant="destructive" className="bg-orange-600">
                              {discount}% OFF
                            </Badge>
                          </div>
                        </CardHeader>
                      </Link>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 line-through">
                              ₹{offer.originalPrice.toFixed(2)}
                            </span>
                            <span className="text-2xl font-bold text-orange-600">
                              ₹{offer.newPrice.toFixed(2)}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <div className="flex flex-col gap-3">
                                {!isUpcoming && (
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Clock className="w-4 h-4 mr-2" />
                                    <CountdownTimer
                                      endTime={offer.toTime}
                                      upcomming={false}
                                    />
                                  </div>
                                )}
                                <div className="flex items-center text-sm text-gray-500">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  {offer.area}
                                </div>
                              </div>
                              <Share offerId={offer.id} />
                            </div>
                            <div className="flex gap-3">
                              <div className="flex flex-wrap gap-2 mt-4">
                                <Badge
                                  variant="secondary"
                                  className="bg-orange-100 text-orange-800"
                                >
                                  <Tag className="w-3 h-3 mr-1" />
                                  {offer.itemsAvailable} items{" "}
                                  {isUpcoming ? "left" : "available"}
                                </Badge>
                              </div>
                              {claimed && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-600 text-white"
                                  >
                                    Claimed
                                  </Badge>
                                </div>
                              )}
                              {offer.enquiries > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                  <Badge
                                    variant="secondary"
                                    className={
                                      offer.enquiries > offer.itemsAvailable
                                        ? "bg-red-600 text-white"
                                        : "bg-orange-500 text-white"
                                    }
                                  >
                                    {offer.enquiries > offer.itemsAvailable
                                      ? "High Demand"
                                      : "In Demand"}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-3">
                            {/* Claim Button */}
                            <Button
                              disabled={isUpcoming}
                              onClick={
                                isUpcoming
                                  ? undefined
                                  : () => handleOfferClick(offer)
                              }
                              className={`w-full ${isUpcoming
                                ? "bg-gray-100 disabled:opacity-100 text-[#E63946] font-bold shadow-xl border border-gray-200"
                                : "bg-orange-600 hover:bg-orange-700"
                                }`}
                            >
                              {claimed ? (
                                "View Ticket"
                              ) : isUpcoming ? (
                                <div className="">
                                  Offer Activates in :{" "}
                                  <CountdownTimer
                                    endTime={offer.fromTime}
                                    upcomming={true}
                                  />
                                </div>
                              ) : (
                                "Claim Offer"
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="popular">
            {filteredOffers.foodie.length === 0 && filteredOffers.mart.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">
                  No popular offers available at the moment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...filteredOffers.foodie, ...filteredOffers.mart] // Only popular offers
                  .map((offer) => {
                    const isUpcoming = new Date(offer.fromTime) > new Date();
                    const discount = Math.round(
                      ((offer.originalPrice - offer.newPrice) / offer.originalPrice) * 100
                    );
                    const claimed = isOfferClaimed(offer.id);
                    return (
                      <Card
                        key={offer.id}
                        className="overflow-hidden hover:shadow-xl transition-shadow"
                      >
                        <Link href={`/offers/${offer.id}`}>
                          <Image
                            src={offer.dishImage}
                            alt={offer.dishName}
                            width={300}
                            height={300}
                            className="w-full h-48 object-cover"
                          />
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <CardTitle className="text-xl font-bold">
                                  {offer.dishName}
                                </CardTitle>
                                <p className="text-base font-medium text-gray-700">
                                  {offer.hotelName}
                                </p>
                              </div>
                              <Badge variant="destructive" className="bg-orange-600">
                                {discount}% OFF
                              </Badge>
                            </div>
                          </CardHeader>
                        </Link>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500 line-through">
                                ₹{offer.originalPrice.toFixed(2)}
                              </span>
                              <span className="text-2xl font-bold text-orange-600">
                                ₹{offer.newPrice.toFixed(2)}
                              </span>
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <div className="flex flex-col gap-3">
                                  {!isUpcoming && (
                                    <div className="flex items-center text-sm text-gray-500">
                                      <Clock className="w-4 h-4 mr-2" />
                                      <CountdownTimer
                                        endTime={offer.toTime}
                                        upcomming={false}
                                      />
                                    </div>
                                  )}
                                  <div className="flex items-center text-sm text-gray-500">
                                    <MapPin className="w-4 h-4 mr-2" />
                                    {offer.area}
                                  </div>
                                </div>
                                <Share offerId={offer.id} />
                              </div>
                              <div className="flex gap-3">
                                <div className="flex flex-wrap gap-2 mt-4">
                                  <Badge
                                    variant="secondary"
                                    className="bg-orange-100 text-orange-800"
                                  >
                                    <Tag className="w-3 h-3 mr-1" />
                                    {offer.itemsAvailable} items{" "}
                                    {isUpcoming ? "left" : "available"}
                                  </Badge>
                                </div>
                                {claimed && (
                                  <div className="flex flex-wrap gap-2 mt-4">
                                    <Badge
                                      variant="secondary"
                                      className="bg-green-600 text-white"
                                    >
                                      Claimed
                                    </Badge>
                                  </div>
                                )}
                                {offer.enquiries > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-4">
                                    <Badge
                                      variant="secondary"
                                      className={
                                        offer.enquiries > offer.itemsAvailable
                                          ? "bg-red-600 text-white"
                                          : "bg-orange-500 text-white"
                                      }
                                    >
                                      {offer.enquiries > offer.itemsAvailable
                                        ? "High Demand"
                                        : "In Demand"}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-3">
                              {/* Claim Button */}
                              <Button
                                disabled={isUpcoming}
                                onClick={
                                  isUpcoming
                                    ? undefined
                                    : () => handleOfferClick(offer)
                                }
                                className={`w-full ${isUpcoming
                                  ? "bg-gray-100 disabled:opacity-100 text-[#E63946] font-bold shadow-xl border border-gray-200"
                                  : "bg-orange-600 hover:bg-orange-700"
                                  }`}
                              >
                                {claimed ? (
                                  "View Ticket"
                                ) : isUpcoming ? (
                                  <div className="">
                                    Offer Activates in :{" "}
                                    <CountdownTimer
                                      endTime={offer.fromTime}
                                      upcomming={true}
                                    />
                                  </div>
                                ) : (
                                  "Claim Offer"
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="moneySaver">
            {filteredOffers.foodie.length === 0 && filteredOffers.mart.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">
                  No money saver offers available at the moment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...filteredOffers.foodie, ...filteredOffers.mart]
                  .map((offer) => {
                    const isUpcoming = new Date(offer.fromTime) > new Date();
                    const discount = Math.round(
                      ((offer.originalPrice - offer.newPrice) / offer.originalPrice) * 100
                    );
                    const claimed = isOfferClaimed(offer.id);
                    return (
                      <Card
                        key={offer.id}
                        className="overflow-hidden hover:shadow-xl transition-shadow"
                      >
                        <Link href={`/offers/${offer.id}`}>
                          <Image
                            src={offer.dishImage}
                            alt={offer.dishName}
                            width={300}
                            height={300}
                            className="w-full h-48 object-cover"
                          />
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <CardTitle className="text-xl font-bold">
                                  {offer.dishName}
                                </CardTitle>
                                <p className="text-base font-medium text-gray-700">
                                  {offer.hotelName}
                                </p>
                              </div>
                              <Badge variant="destructive" className="bg-orange-600">
                                {discount}% OFF
                              </Badge>
                            </div>
                          </CardHeader>
                        </Link>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500 line-through">
                                ₹{offer.originalPrice.toFixed(2)}
                              </span>
                              <span className="text-2xl font-bold text-orange-600">
                                ₹{offer.newPrice.toFixed(2)}
                              </span>
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <div className="flex flex-col gap-3">
                                  {!isUpcoming && (
                                    <div className="flex items-center text-sm text-gray-500">
                                      <Clock className="w-4 h-4 mr-2" />
                                      <CountdownTimer
                                        endTime={offer.toTime}
                                        upcomming={false}
                                      />
                                    </div>
                                  )}
                                  <div className="flex items-center text-sm text-gray-500">
                                    <MapPin className="w-4 h-4 mr-2" />
                                    {offer.area}
                                  </div>
                                </div>
                                <Share offerId={offer.id} />
                              </div>
                              <div className="flex gap-3">
                                <div className="flex flex-wrap gap-2 mt-4">
                                  <Badge
                                    variant="secondary"
                                    className="bg-orange-100 text-orange-800"
                                  >
                                    <Tag className="w-3 h-3 mr-1" />
                                    {offer.itemsAvailable} items{" "}
                                    {isUpcoming ? "left" : "available"}
                                  </Badge>
                                </div>
                                {claimed && (
                                  <div className="flex flex-wrap gap-2 mt-4">
                                    <Badge
                                      variant="secondary"
                                      className="bg-green-600 text-white"
                                    >
                                      Claimed
                                    </Badge>
                                  </div>
                                )}
                                {offer.enquiries > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-4">
                                    <Badge
                                      variant="secondary"
                                      className={
                                        offer.enquiries > offer.itemsAvailable
                                          ? "bg-red-600 text-white"
                                          : "bg-orange-500 text-white"
                                      }
                                    >
                                      {offer.enquiries > offer.itemsAvailable
                                        ? "High Demand"
                                        : "In Demand"}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-3">
                              {/* Claim Button */}
                              <Button
                                disabled={isUpcoming}
                                onClick={
                                  isUpcoming
                                    ? undefined
                                    : () => handleOfferClick(offer)
                                }
                                className={`w-full ${isUpcoming
                                  ? "bg-gray-100 disabled:opacity-100 text-[#E63946] font-bold shadow-xl border border-gray-200"
                                  : "bg-orange-600 hover:bg-orange-700"
                                  }`}
                              >
                                {claimed ? (
                                  "View Ticket"
                                ) : isUpcoming ? (
                                  <div className="">
                                    Offer Activates in :{" "}
                                    <CountdownTimer
                                      endTime={offer.fromTime}
                                      upcomming={true}
                                    />
                                  </div>
                                ) : (
                                  "Claim Offer"
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </TabsContent>

        </Tabs>

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
    </div>
  );
}
