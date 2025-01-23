"use server";

import { db } from "@/lib/firebase";
import { Offer } from "@/store/offerStore";
import { collection, getDocs, query, where } from "firebase/firestore";
import { unstable_cache } from "next/cache";
import { isHotelNear } from "./isHotelNear";

export const getOffers = unstable_cache(
    async () => {
      const now = new Date().toISOString();
      const offersCollection = collection(db, "offers");
      const offersQuery = query(offersCollection, where("toTime", ">", now));
      const querySnapshot = await getDocs(offersQuery);
      const offers: Offer[] = [];
      querySnapshot.forEach((doc) => {
        offers.push({ id: doc.id, ...doc.data() } as Offer);
      });
      return offers;
    },
    ["offers"],
    { tags: ["offers"] }
  );
  
  export const filterAndSortOffers = async ({
    offers,
    activeTab = "all",
    searchQuery = "",
    location = null,
    lat,
    lon,
  }: {
    offers: Offer[];
    activeTab?: string;
    searchQuery?: string;
    location?: string | null;
    lat: number;
    lon: number;
  }) => {
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
  
    // Add the distance to each offer
    const offersWithDistancePromises = sortedOffers.map(async (offer) => {
      const distance = await isHotelNear(offer.hotelLocation, { lat, lon });
      return { ...offer, distance }; // Attach the distance to each offer
    });
  
    const offersWithDistance = await Promise.all(offersWithDistancePromises);
  
    offersWithDistance.forEach((offer) => {
      if (typeof offer.distance !== "number") {
        console.error(`Invalid distance for offer ${offer.id}:`, offer.distance);
      }
    });
  
    // Sort offers by distance (ascending order)
  
    // Sorting based on active tab options
    if (activeTab === "popular") {
      offersWithDistance.sort((a: Offer, b: Offer) => b.enquiries - a.enquiries);
    } else if (activeTab === "money saver") {
      offersWithDistance.sort((a: Offer, b: Offer) => {
        const discountA =
          ((a.originalPrice - a.newPrice) / a.originalPrice) * 100;
        const discountB =
          ((b.originalPrice - b.newPrice) / b.originalPrice) * 100;
        return discountB - discountA;
      });
    } else {
      offersWithDistance.sort(
        (a: Offer, b: Offer) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      offersWithDistance.sort((a, b) => a.distance - b.distance);
    }
  
    return offersWithDistance;
  };