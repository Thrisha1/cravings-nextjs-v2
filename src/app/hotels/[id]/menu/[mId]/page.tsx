import { db } from "@/lib/firebase";
import MenuDetail from "@/screens/MenuDetail";
import { UserData } from "@/store/authStore";
import { MenuItem } from "@/store/menuStore";
import { doc, getDoc } from "firebase/firestore";
import { Metadata } from "next";
import React from "react";

type Params = Promise<{ id: string, mId: string }>;

interface Props {
  params: Params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: hotelId, mId: menuId } = await params;

  const hotelDoc = await getDoc(doc(db, "users", hotelId));
  if (!hotelDoc.exists()) {
    throw new Error("Hotel not found");
  }
  const hotelData = hotelDoc.data() as UserData;

  const menuItemDoc = await getDoc(doc(db, "menuItems", menuId));
  if (!menuItemDoc.exists()) {
    throw new Error("Menu item not found");
  }
  const menuItem = menuItemDoc.data() as MenuItem;

  return {
    title: menuItem.name,
    icons: [menuItem.image],
    description: `Get ${menuItem.name} at ${hotelData.hotelName} for just ₹${menuItem.price}`,
    openGraph: {
      images: [menuItem.image],
      title: menuItem.name,
      description: `Get ${menuItem.name} at ${hotelData.hotelName} for just ₹${menuItem.price}`,
    },
  };
}

const page = async ({ params }: Props) => {
  const { id: hotelId, mId: menuId } = await params;

  const hotelDoc = await getDoc(doc(db, "users", hotelId));
  if (!hotelDoc.exists()) {
    throw new Error("Hotel not found");
  }

  const { claimableupdatedat, offersClaimableUpdatedAt, ...cleanedHotelData } = hotelDoc.data();
  console.log(claimableupdatedat , offersClaimableUpdatedAt);
  const hotelData = {
    id: hotelId,
    ...cleanedHotelData
  } as UserData;

  const menuItemDoc = await getDoc(doc(db, "menuItems", menuId));
  if (!menuItemDoc.exists()) {
    throw new Error("Menu item not found");
  }
  const menuItem ={
    id: menuId,
    ...menuItemDoc.data()
  } as MenuItem;

  return <MenuDetail menuItem={menuItem} hotelData={hotelData} />;
};

export default page;