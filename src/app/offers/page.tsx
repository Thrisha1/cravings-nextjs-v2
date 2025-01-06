import { collection, getDocs, query, where } from "firebase/firestore";
import Offers from "@/screens/Offers";
import { unstable_cache } from "next/cache";
import React from "react";
import { Offer } from "@/store/offerStore";
import { db } from "@/lib/firebase";

type SearchParams = Promise<{ [key: string]: string | undefined }>;

const getOffers = unstable_cache(
  async () => {
    const now = new Date().toString();
    const offersCollection = collection(db, "offers");
    const offersQuery = query(offersCollection, where("toTime", "<", now));
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
  lat?: number | null;
  lon?: number | null;
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

  return sortedOffers;
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
    lat : Number(lat),
    lon :Number(lon),
  });

  return <Offers offers={filteredOffers} />;
};

export default page;
