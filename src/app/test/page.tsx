// import { db } from "@/lib/firebase";
// import {
//   collection,
//   getDocs,
//   query,
//   where,
//   doc,
//   updateDoc,
//   getDoc,
// } from "firebase/firestore";
import React from "react";
// import { resolveShortUrl } from "../actions/extractLatLonFromGoogleMapsUrl";

const page = async () => {
  // const changeHotelLocationUrl = async () => {
  //   const usersCollection = collection(db, "users");
  //   const hotelQuery = query(usersCollection, where("role", "==", "hotel"));
  //   const hotelUsers = await getDocs(hotelQuery);
  //   const hotelData = hotelUsers.docs.map((doc) => {
  //     return {
  //       hotelName: doc.data().hotelName,
  //       location: doc.data().location,
  //       id: doc.id,
  //     };
  //   });

  //   for (const hotel of hotelData) {
  //     console.log("updating hotel location url", hotel.hotelName);
  //     const expandedUrl = await resolveShortUrl(hotel.location);
  //     console.log(expandedUrl);

  //     const hotelDoc = doc(db, "users", hotel.id);
  //     await updateDoc(hotelDoc, {
  //       location: expandedUrl,
  //     });

  //     await new Promise((resolve) => setTimeout(resolve, 3000));
  //     console.log("waiting");
  //   }
  // };

  // const changeOfferLocationUrl = async () => {
  //   const offersCollection = collection(db, "offers");
  //   const offers = await getDocs(offersCollection);
  //   const offerData = offers.docs.map((doc) => {
  //     return {
  //       dishName: doc.data().dishName,
  //       hotelId: doc.data().hotelId,
  //       id: doc.id,
  //     };
  //   });

  //   for (const offer of offerData) {
  //     console.log("updating offer location url", offer.dishName);
  //     const hotelDoc = doc(db, "users", offer.hotelId);
  //     const hotelSnapshot = await getDoc(hotelDoc);
  //     const hotelLocation = hotelSnapshot.data()?.location;
  //     console.log("Hotel location:", hotelLocation);

  //     await updateDoc(doc(db, "offers", offer.id), {
  //       hotelLocation: hotelLocation,
  //     });

  //     await new Promise((resolve) => setTimeout(resolve, 3000));
  //     console.log("waiting");
  //   }
  // };

  //   changeHotelLocationUrl();
  // changeOfferLocationUrl();

  return <div>page</div>;
};

export default page;
