"use client";

import { useEffect, useState } from "react";

const NotificationAccess = () => {

  const [loacationAccess , setLocationAccess] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location permission granted:", position);
          setLocationAccess(true);
        },
        (error) => {
          console.error("Location permission denied:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);
  return <>
    <div className={`w-2 aspect-square rounded-full ${loacationAccess ? 'bg-green-600' : 'bg-red-600'}`} />
  </>;
};

export default NotificationAccess;
