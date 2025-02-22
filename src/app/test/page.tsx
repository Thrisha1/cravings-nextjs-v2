"use client";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, deleteField, getDocs, updateDoc } from "firebase/firestore";
import React from "react";

const page = () => {
  const removeIdFromMenuItems = async () => {
    try {
      const menuItemsCollection = collection(db, "menuItems");
      const querySnapshot = await getDocs(menuItemsCollection);

      let menuItemNumber = 0;
      for (const doc of querySnapshot.docs) {
        await updateDoc(doc.ref, { id: deleteField() });
        menuItemNumber++;
        console.log(`Updated menu item ${menuItemNumber}: ${doc.id}`);

        await new Promise((resolve) => setTimeout(resolve, 1500)); // Add delay for each doc
      }

      console.log("Successfully removed id field from all menu items");
    } catch (e) {
      console.error("Error removing id from menu items:", e);
    }
  };

  

  const onClickFn = async () => {
    await removeIdFromMenuItems();
  };

  return <Button onClick={onClickFn}>Click</Button>;
};

export default page;
