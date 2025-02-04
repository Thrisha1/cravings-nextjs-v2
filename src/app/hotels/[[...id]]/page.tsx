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
type Params = Promise<{ id: string }>;

const page = async ({ searchParams, params }: { searchParams: SearchParams; params: Params }) => {
  const { query: search , qrScan } = await searchParams;
  const { id: idArray } = await params;
  const id = idArray[0];

  const getHotelOffers = unstable_cache(
    async (id: string) => {
      try {
        const offersQuery = query(
          collection(db, "offers"),
          where("hotelId", "==", id),
          where("toTime", ">", new Date().toISOString())
        );
        const offers = await getDocs(offersQuery);
        const offersData = offers.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
          } as Offer;
        });
        return offersData;
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    [(id as string) || ""],
    {
      tags: [(id as string) || ""],
    }
  );

  const getHotelData = unstable_cache(
    async (id: string) => {
      try {
        const usersCollection = doc(db, "users", id);
        const user = await getDoc(usersCollection);
        const userData = user.data();

        if (!userData) {
          return null;
        }

        return {
          id,
          ...userData,
        } as UserData;
      } catch (error) {
        console.error("Error fetching hotel data:", error);
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

  // if (!hoteldata) {
  //   throw new Error("Hotel not found!");
  // }

  const menuItems = hoteldata?.menu || [];

  let filteredOffers: Offer[] = [];
  if (offers) {
    filteredOffers = search
      ? offers.filter((offer) =>
          Object.values(offer).some((value) =>
            String(value).toLowerCase().includes(search.trim().toLowerCase())
          )
        )
      : offers;
  }

  return (
      <HotelMenuPage
        offers={filteredOffers}
        hoteldata={hoteldata as UserData}
        menu={menuItems}
        qrScan={qrScan ?? null}
      />
  );
};

export default page;
