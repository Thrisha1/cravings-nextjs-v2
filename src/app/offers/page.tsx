import { collection, getDocs, query, where } from "firebase/firestore";
import Offers from "@/screens/Offers";
import { unstable_cache } from "next/cache";
import React from "react";
import { Offer } from "@/store/offerStore";
import { db } from "@/lib/firebase";
import { isHotelNear } from "../actions/isHotelNear";

type SearchParams = Promise<{ [key: string]: string | undefined }>;

const getOffers = unstable_cache(
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

const filterAndSortOffers = async ({
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
  const offersWithDistance = sortedOffers.map((offer) => {
    const distance = isHotelNear(offer.hotelLocation, { lat, lon });
    return { ...offer, distance }; // Attach the distance to each offer
  });

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

const page = async (props: { searchParams: SearchParams }) => {
  const searchParams = await props.searchParams;
  const {
    query: searchQuery,
    filter: activeTab,
    location,
    lat,
    lon,
  } = searchParams;

  const offers: Offer[] = await getOffers();
  const filteredOffers = await filterAndSortOffers({
    offers,
    activeTab,
    searchQuery,
    location,
    lat: Number(lat),
    lon: Number(lon),
  });

  return <Offers offers={filteredOffers} />;
};

export default page;
