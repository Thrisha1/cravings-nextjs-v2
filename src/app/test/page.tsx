"use client";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, deleteField, getDocs, updateDoc, query, where } from "firebase/firestore";
import React from "react";

const page = () => {
  const removeMenuFieldFromHotels = async () => {
    try {
      const usersCollection = collection(db, "users");
      const hotelQuery = query(usersCollection, where("role", "==", "hotel"));
      const querySnapshot = await getDocs(hotelQuery);

      let hotelNumber = 0;
      for (const doc of querySnapshot.docs) {
        await updateDoc(doc.ref, { menu: deleteField() });
        hotelNumber++;
        console.log(`Updated hotel ${hotelNumber}: ${doc.id}`);

        await new Promise((resolve) => setTimeout(resolve, 1500)); // Add delay for each doc
      }

      console.log("Successfully removed menu field from all hotels");
    } catch (e) {
      console.error("Error removing menu field from hotels:", e);
    }
  };

  const onClickFn = async () => {
    await removeMenuFieldFromHotels();
  };

  return <Button onClick={onClickFn}>Click</Button>;
};

export default page;
