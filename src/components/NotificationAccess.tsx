"use client";

import { useEffect } from "react";

const NotificationAccess = () => {
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location permission granted:", position);
        },
        (error) => {
          console.error("Location permission denied:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);
  return <></>;
};

export default NotificationAccess;
