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
import { Offer } from "@/store/offerStore";
import { UserData } from "@/store/authStore";

type SearchParams = Promise<{ [key: string]: string | undefined }>;

const page = async (props: { searchParams: SearchParams }) => {
  
  const searchParams = await props.searchParams;
  const { id, query: search } = searchParams;

  const getHotelOffers = unstable_cache(
    async (id: string) => {
      try {
        const offersQuery = query(
          collection(db, "offers"),
          where("hotelId", "==", id)
        );
        const offers = await getDocs(offersQuery);
        const offersData = offers.docs.map((doc) => {
          const data = doc.data();
          return data as Offer;
        });
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

        return userData as UserData;
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
  const filteredOffers: Offer[] = search
    ? offers.filter((offer) =>
        Object.values(offer).some((value) =>
          String(value).toLowerCase().includes(search.trim().toLowerCase())
        )
      )
    : offers;

  return <HotelMenuPage offers={filteredOffers} hoteldata={hoteldata} />;
};

export default page;
