
// import { db } from "@/lib/firebase";
// import { collection, getDocs, query, where } from "firebase/firestore";
import React from "react";

const page = async () => {

  // const newUsers  = async(date : string) => {


  //   const usersCollection = await collection(db, "users");
  //   const getQuery = query(usersCollection, where("createdAt", ">", date));
  //   const users = await getDocs(getQuery);

  //   return users;
  // }

  // const users = await newUsers("2025-01-16");
  // const userDocs = users.docs.map((doc) => {
  //   return {
  //     email : doc.data().email,
  //     createdAt : doc.data().createdAt,
  //     name : doc.data().fullName ?? doc.data().hotelName,
  //   }
  // });

  // console.table(userDocs);
  

  return <div>page</div>;
};

export default page;
