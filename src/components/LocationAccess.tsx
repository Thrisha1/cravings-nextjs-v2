"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const LocationAccess = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const userLocation = localStorage.getItem("loc");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location permission granted:", position);
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          const url = new URLSearchParams(searchParams.toString());
          url.set("lat", latitude.toString());
          url.set("lon", longitude.toString());
          localStorage.setItem("loc", "?" + url.toString());
          router.replace(`?${url.toString()}`);
        },
        (error) => {
          if (userLocation) {
            router.replace(userLocation);
          }
          console.error("Location permission denied:", error);
        }
      );
    } else if (userLocation) {
      router.replace(userLocation);
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  useEffect(() => {
    console.log(
      "Location updated:",
      searchParams.get("lat"),
      searchParams.get("lon")
    );
  }, []);
  return <></>;
};

export default LocationAccess;
