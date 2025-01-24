"use server";

import { db } from "@/lib/firebase";
import { Offer } from "@/store/offerStore";
import { collection, getDocs, query, where } from "firebase/firestore";
import { unstable_cache } from "next/cache";
import { isHotelNear } from "./isHotelNear";
import Fuse from "fuse.js";


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
  // Convert search query to lowercase for case-insensitive matching
  const query = searchQuery.toLowerCase();

  // Filter offers based on validity and location
  const currentOffers = offers.filter((offer) => {
    const isValid = new Date(offer.toTime) > new Date();
    const matchesLocation = !location || offer.area === location;
    return isValid && matchesLocation;
  });

  // Add the distance to each offer
  const offersWithDistancePromises = currentOffers.map(async (offer) => {
    const distance = await isHotelNear(offer.hotelLocation, { lat, lon });
    return { ...offer, distance }; // Attach the distance to each offer
  });

  const offersWithDistance = await Promise.all(offersWithDistancePromises);

  // Configure Fuse.js for fuzzy searching
  const fuseOptions = {
    keys: [
      "dishName",
      "hotelName",
      "newPrice",
      "originalPrice",
      "hotelName",
      "distance",
      "newPrice"
    ],
    includeScore: true, // Include match score for sorting
    threshold: 0.3, // Adjust the threshold for fuzzy matching (0 = exact match, 1 = very loose match)
    ignoreLocation: true, // Search across the entire string
    minMatchCharLength: 2, // Minimum number of characters to match
  };

  // Create a Fuse instance with the offers
  const fuse = new Fuse(offersWithDistance, fuseOptions);

  // Perform fuzzy search if there's a search query
  let filteredOffersWithDistance = offersWithDistance;
  if (query) {
    const fuseResults = fuse.search(query);
    filteredOffersWithDistance = fuseResults.map((result) => result.item);
  }

  // Log invalid distances for debugging
  filteredOffersWithDistance.forEach((offer) => {
    if (typeof offer.distance !== "number") {
      console.error(`Invalid distance for offer ${offer.id}:`, offer.distance);
    }
  });

  // Sorting logic based on active tab
  if (activeTab === "popular") {
    // Sort by enquiries (descending order)
    filteredOffersWithDistance.sort((a: Offer, b: Offer) => b.enquiries - a.enquiries);
  } else if (activeTab === "money saver") {
    // Sort by discount percentage (descending order)
    filteredOffersWithDistance.sort((a: Offer, b: Offer) => {
      const discountA =
        ((a.originalPrice - a.newPrice) / a.originalPrice) * 100;
      const discountB =
        ((b.originalPrice - b.newPrice) / b.originalPrice) * 100;
      return discountB - discountA; // Higher discount comes first
    });
  } else {
    // Default sorting: sort by creation date (newest first) and then by distance
    filteredOffersWithDistance.sort(
      (a: Offer, b: Offer) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    filteredOffersWithDistance.sort((a, b) => a.distance - b.distance);
  }

  return filteredOffersWithDistance;
};