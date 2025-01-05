"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const NotificationAccess = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location permission granted:", position);
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          const url = new URLSearchParams(searchParams.toString());
          url.set("lat", latitude.toString());
          url.set("lon", longitude.toString());
          router.replace(`?${url.toString()}`);
        },
        (error) => {
          console.error("Location permission denied:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  useEffect(() => {
    console.log("Location updated:", searchParams.get('lat'), searchParams.get('lon'));
  },[]);
  return <></>;
};

export default NotificationAccess;
