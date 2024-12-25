import { db } from "@/lib/firebase";
import HotelMenuPage from "@/screens/HotelMenuPage";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { unstable_cache } from "next/cache";
import React from "react";

const page = async ({
  searchParams,
}: {
  searchParams: { id: string | undefined; query: string | undefined };
}) => {
  const { id, query: search } = searchParams;

  const getHotelOffers = unstable_cache(
    async (id: string) => {
      try {
        const offersQuery = query(
          collection(db, "offers"),
          where("hotelId", "==", id)
        );
        const offers = await getDocs(offersQuery);
        const offersData = offers.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        return offersData;
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    [id || ""],
    {
      tags: [id || ""],
    }
  );

  const getHotelData = unstable_cache(
    async (id: string) => {
      try {
        const usersCollection = doc(db, "users", id);
        const user = await getDoc(usersCollection);
        const userData = user.data();

        return userData;
      } catch (error) {
        console.error("Error fetching hoteldata:", error);
        return null;
      }
    },
    [id || ""],
    {
      tags: [id || ""],
    }
  );

  const offers = id ? await getHotelOffers(id) : null;
  const hoteldata = id ? await getHotelData(id) : null;

  if (!offers || !hoteldata) {
    throw new Error("Hotel not found!");
  }

  // Filter offers based on the search query
  const filteredOffers = search
    ? offers.filter((offer) =>
        Object.values(offer).some((value) =>
          String(value).toLowerCase().includes(search.trim().toLowerCase())
        )
      )
    : offers;

  return <HotelMenuPage offers={filteredOffers} hoteldata={hoteldata} />;
};

export default page;
