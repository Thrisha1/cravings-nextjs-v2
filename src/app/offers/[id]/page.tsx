import { rtdb } from "@/lib/firebase";
import OfferDetail from "@/screens/OfferDetail";
import { Offer } from "@/store/offerStore";
import { get, ref } from "firebase/database";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  params: Promise<{ id: string }>;
};

const fetchOfferDetails = async (offerId: string) => {
  try {
    const offerRef = ref(rtdb, `offers/${offerId}`);
    const snapshot = await get(offerRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      throw new Error("Offer not found.");
    }
  } catch (err) {
    console.error(err);
  }
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const id = (await params).id;
  const product = await fetchOfferDetails(id);
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
  if (!offerId) redirect("/offers");

  const offerData: Offer = await fetchOfferDetails(offerId);

  return <OfferDetail offer={offerData} />;
};

export default page;
