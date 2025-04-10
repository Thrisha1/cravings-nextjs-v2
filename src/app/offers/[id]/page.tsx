import { db } from "@/lib/firebase";
import OfferDetail from "@/screens/OfferDetail";
import { UserData } from "@/store/authStore";
import { Offer } from "@/store/offerStore";
import { doc, getDoc } from "firebase/firestore";
import { Metadata } from "next";
import { unstable_cache } from "next/cache";
import React from "react";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const getOffer = unstable_cache(
    async (id: string) => {
      const offerDocRef = doc(db, "offers", id);
      const offerDoc = await getDoc(offerDocRef);
      if (!offerDoc.exists()) {
        throw new Error("Offer not found");
      }
      const offer = { id: offerDoc.id, ...offerDoc.data() } as Offer;

      return offer;
    },
    [id],
    { tags: [id] }
  );

  const product = await getOffer(id);

  if (!product) {
    throw new Error("Offer not found");
  }

  return {
    title: product.dishName,
    icons: [product.dishImage],
    description: `Get ${product.dishName} at ${product.hotelName} with Cravings for just ₹${product.newPrice}`,
    openGraph: {
      images: [product.dishImage],
      title: product.dishName,
      description: `Get ${product.dishName} at ${product.hotelName} with Cravings for just ₹${product.newPrice}`,
    },
  };
}

const page = async ({ params }: Props) => {
  const offerId = (await params).id;

  const getOffer = unstable_cache(
    async (id: string) => {
      const offerDocRef = doc(db, "offers", id);
      const offerDoc = await getDoc(offerDocRef);
      if (!offerDoc.exists()) {
        throw new Error("Offer not found");
      }
      const offer = { id: offerDoc.id, ...offerDoc.data() } as Offer;

      return offer;
    },
    [offerId],
    { tags: [offerId] }
  );

  const offerData: Offer = await getOffer(offerId);

  const getHotelData = unstable_cache(
    async (id: string) => {
      const usersCollection = doc(db, "users", id);
      const user = await getDoc(usersCollection);
      const userData = user.data();

      return {
        id,
        ...userData,
      } as UserData;
    },
    [offerData.hotelId || ""],
    {
      tags: [offerData.hotelId || ""],
    }
  );

  const hotelData = await getHotelData(offerData?.hotelId);

  return <OfferDetail offer={offerData} hotelData={hotelData} />;
};

export default page;
