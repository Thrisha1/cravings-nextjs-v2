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
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          url.set("lat", latitude.toString());
          url.set("lon", longitude.toString());
          localStorage.setItem("loc", "?" + url.toString());
          
          router.replace(`?${url.toString()}`);
        },
        (error) => {
          const lat = searchParams.get("lat");
          const lon = searchParams.get("lon");

          if (lat && lon) {
            localStorage.setItem("loc", "?" + url.toString());
          } else {
            console.error("Location permission denied:", error);

            if (userLocation) {
              router.replace(userLocation);
            }
          }

        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  return <></>;
};

export default LocationAccess;
