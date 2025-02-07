'use client';

import { db } from "@/lib/firebase";
import HotelMenuPage, { MenuItem } from "@/screens/HotelMenuPage";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { unstable_cache } from "next/cache";
import React, { useEffect } from "react";
import { Offer } from "@/store/offerStore";
import { UserData } from "@/store/authStore";
import { saveCurrentRoute } from "@/utils/auth";

type SearchParams = Promise<{ [key: string]: string | undefined }>;
type Params = Promise<{ id: string }>;

const HotelPage = ({ searchParams, params }: { searchParams: SearchParams; params: Params }) => {
  useEffect(() => {
    saveCurrentRoute();
  }, []);

  const fetchData = async () => {
    const { query: search, qrScan } = await searchParams;
    const { id } = await params;

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
      [id || ""],
      { tags: [id || ""] }
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
      { tags: [id || ""] }
    );

    const offers = id ? await getHotelOffers(id) : null;
    const hoteldata = id ? await getHotelData(id) : null;
    const menuItems = (hoteldata?.menu || []).map((item: MenuItem) => ({
      id: crypto.randomUUID(),
      name: item.name,
      price: item.price,
      description: item.description,
      image: item.image || "/image_placeholder.webp"
    })) as MenuItem[];

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

    return {
      filteredOffers,
      hoteldata,
      menuItems,
      qrScan: qrScan || null
    };
  };

  const [data, setData] = React.useState<{
    filteredOffers: Offer[];
    hoteldata: UserData | null;
    menuItems: MenuItem[];
    qrScan: string | null;
  }>({
    filteredOffers: [],
    hoteldata: null,
    menuItems: [],
    qrScan: null
  });

  useEffect(() => {
    fetchData().then(setData);
  }, [searchParams, params]);

  return (
    <HotelMenuPage
      offers={data.filteredOffers}
      hoteldata={data.hoteldata as UserData}
      menu={data.menuItems}
      qrScan={data.qrScan}
    />
  );
};

export default HotelPage;
