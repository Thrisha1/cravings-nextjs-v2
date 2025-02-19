"use client";
import { Button } from "@/components/ui/button";
// import { db } from "@/lib/firebase";
// import {
//   addDoc,
//   collection,
//   getDocs,
//   query,
//   updateDoc,
//   where,
// } from "firebase/firestore";
import React from "react";

const page =  () => {
  // const moveMenusToCollection = async () => {
  //   try {
  //     const usersRef = collection(db, "users");
  //     const usersQuery = query(usersRef, where("role", "==", "hotel"));
  //     const querySnapshot = await getDocs(usersQuery);

  //     const hotelUsers = querySnapshot.docs.map((doc) => ({
  //       id: doc.id,
  //       menu: doc.data().menu || [],
  //     }));
  //     console.log("Hotel users:", hotelUsers.length);

  //     let count = 0;
  //     let count2 = 0;
  //     const menusCollection = collection(db, "menuItems");
  //     for (const data of hotelUsers) {
  //       count++;
  //       for (const menuItem of data.menu) {
  //         try {
  //           count2++;
  //           console.log(menuItem?.name, count, count2);
  //           const insertData = {
  //             hotelId: data.id,
  //             ...menuItem,
  //           };
  //           await addDoc(menusCollection, insertData);
  //           await new Promise((resolve) => setTimeout(resolve, 3000)); // Keep 2 second delay
  //         } catch (itemError) {
  //           console.error(
  //             `Failed to add menu item ${menuItem?.name}:`,
  //             itemError
  //           );
  //           continue; // Continue with next item even if one fails
  //         }
  //       }
  //     }
  //   } catch (e) {
  //     console.error("Error in moveMenusToCollection:", e);
  //     throw e; // Re-throw the error for handling at a higher level
  //   }
  // };

  // const removeMenusFromUsers = async () => {
  //   try {
  //     const usersRef = collection(db, "users");
  //     const usersQuery = query(usersRef, where("role", "==", "hotel"));
  //     const querySnapshot = await getDocs(usersQuery);

  //     let count = 0;
  //     for (const doc of querySnapshot.docs) {
  //       count++;
  //       const userData = doc.data();
  //       delete userData.menu;
  //       await updateDoc(doc.ref, userData);
  //       console.log(count);

  //       await new Promise((resolve) => setTimeout(resolve, 1500)); // Rate limiting
  //     }

  //     console.log("Successfully removed menu field from all hotel users");
  //   } catch (e) {
  //     console.error("Error removing menus:", e);
  //     console.error(e);
  //   }
  // };

  // await removeMenusFromUsers();

  // await moveMenusToCollection();

  const onClickFn = async () => {
    // await moveMenusToCollection();
  };

  return <Button onClick={onClickFn}>Click</Button>;
};

export default page;
