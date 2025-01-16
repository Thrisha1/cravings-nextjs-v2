"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const LocationAccess = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const userLocation = localStorage.getItem("loc");
    const url = new URLSearchParams(searchParams.toString());

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location permission granted:", position);
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          url.set("lat", latitude.toString());
          url.set("lon", longitude.toString());
          localStorage.setItem("loc", "?" + url.toString());
          console.log("Location updated from position:", url.toString()); 
          
          router.replace(`?${url.toString()}`);
        },
        (error) => {
          const lat = searchParams.get("lat");
          const lon = searchParams.get("lon");

          if (lat && lon) {
            localStorage.setItem("loc", "?" + url.toString());
            console.log("Location updated from search params:", url.toString());
          } else {
            console.error("Location permission denied:", error);

            if (userLocation) {
              console.log("Location updated from local storage:", userLocation);
              router.replace(userLocation);
            }
          }

        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  useEffect(() => {
    const localLoc = localStorage.getItem("loc");
    console.log(
      "Location updated:",
      searchParams.get("lat"),
      searchParams.get("lon"),
      localLoc
    );
  }, [searchParams.get("lat"), searchParams.get("lon")]);
  return <></>;
};

export default LocationAccess;
