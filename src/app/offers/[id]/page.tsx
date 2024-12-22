import { db } from "@/lib/firebase";
import OfferDetail from "@/screens/OfferDetail";
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

      console.log(offer);

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

      console.log(offer);

      return offer;
    },
    [offerId],
    { tags: [offerId] }
  );

  const offerData: Offer = await getOffer(offerId);

  return <OfferDetail offer={offerData} />;
};

export default page;
