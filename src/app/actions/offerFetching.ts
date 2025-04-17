"use server";

import { Offer } from "@/store/offerStore_hasura";
import { isHotelNear } from "./isHotelNear";
import Fuse from "fuse.js";

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
    const endDate = new Date(offer.end_time);
    const today = new Date();
    const isValid = endDate.setHours(0,0,0,0) >= today.setHours(0,0,0,0);
    const matchesLocation = !location || offer.partner?.district === location;
    return isValid && matchesLocation;
  });

  // // Add the distance to each offer
  // const offersWithDistancePromises = currentOffers.map(async (offer) => {
  //   const distance = await isHotelNear(offer.partner?.location as string, { lat, lon });
  //   return { ...offer, distance }; // Attach the distance to each offer
  // });

  // const offersWithDistance = await Promise.all(offersWithDistancePromises);

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
  const fuse = new Fuse(currentOffers, fuseOptions);

  // Perform fuzzy search if there's a search query
  let allOffers = currentOffers;
  if (query) {
    const fuseResults = fuse.search(query);
    allOffers = fuseResults.map((result) => result.item);
  }

  // Log invalid distances for debugging
  // allOffers.forEach((offer) => {
  //   if (typeof offer.distance !== "number") {
  //     console.error(`Invalid distance for offer ${offer.id}:`, offer.distance);
  //   }
  // });

  // Sorting logic based on active tab
  if (activeTab === "popular") {
    // Sort by enquiries (descending order)
    allOffers.sort((a: Offer, b: Offer) => b.enquiries - a.enquiries);
  } else if (activeTab === "money saver") {
    // Sort by discount percentage (descending order)
    allOffers.sort((a: Offer, b: Offer) => {
      const discountA =
        ((a.menu.price - a.offer_price) / a.menu.price) * 100;
      const discountB =
        ((b.menu.price - b.offer_price) / b.menu.price) * 100;
      return discountB - discountA; // Higher discount comes first
    });
  } else {
    // Default sorting: sort by creation date (newest first) and then by distance
    allOffers.sort(
      (a: Offer, b: Offer) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    // allOffers.sort((a, b) => a.distance - b.distance);
  }

  return allOffers;
};