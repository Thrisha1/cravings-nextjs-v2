"use client";
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { Partner } from "@/store/authStore";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYWJoaW4yazMiLCJhIjoiY20wbWh5ZHFwMDJwcjJqcHVjM3kyZjZlNyJ9.cagUWYMuMzLdJQhMbYB50A";

const UsersMap = ({ partners }: { partners: Partner[] }) => {
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    map.current = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [76.379693, 9.943894],
      zoom: 9,
    });

    return () => {
      // Clean up markers when component unmounts
      markers.current.forEach((marker) => marker.remove());
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Add new markers for each partner
    partners.forEach((partner) => {
      if (!partner?.geo_location?.coordinates) return;

      // Create a div element for the custom marker
      const el = document.createElement("div");
      el.className = "custom-marker";

      // Create the image element
      const img = document.createElement("img");
      img.src = partner.store_banner || "/default-store-banner.jpg"; // fallback image
      img.alt = partner.store_name || "Partner location";
      img.style.width = "40px";
      img.style.height = "40px";
      img.style.borderRadius = "50%";
      img.style.objectFit = "cover";
      img.style.border = "2px solid white";
      img.style.boxShadow = "0 2px 5px rgba(0,0,0,0.3)";

      el.appendChild(img);

      // Create popup content
      const popupContent = document.createElement("div");
      popupContent.className = "max-w-xs p-4 flex flex-col items-center ";

      if (partner.store_banner) {
        const popupImg = document.createElement("img");
        popupImg.src = partner.store_banner;
        popupImg.alt = partner.store_name || "Store banner";
        popupImg.className =
          "w-24 h-24 object-cover rounded-full overflow-hidden ";
        popupContent.appendChild(popupImg);
      }

      const popupText = document.createElement("div");
      popupText.className = "p-2 text-center";

      if (partner.store_name) {
        const name = document.createElement("h3");
        name.className = "font-bold text-lg mb-1";
        name.textContent = partner.store_name;
        popupText.appendChild(name);
      }

      const link = document.createElement("a");
      link.href = `https://cravings.live/hotels/${partner.id}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "text-orange-600 hover:text-orange-800 text-sm font-medium text-center w-full focus:outline-none";
      link.textContent = "View Hotel →";
      popupText.appendChild(link);

      popupContent.appendChild(popupText);

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        className: "custom-popup",
      }).setDOMContent(popupContent);

      // Create and add the marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([
          partner.geo_location.coordinates[0],
          partner.geo_location.coordinates[1],
        ])
        .setPopup(popup)
        .addTo(map.current!);

      // Add click event to open popup
      el.addEventListener("click", () => {
        marker.togglePopup();
      });

      markers.current.push(marker);
    });
  }, [partners]);

  return (
    <div className="w-full h-screen">
      <div id="map" className="w-full h-full"></div>
      <style jsx global>{`
        .custom-popup .mapboxgl-popup-content {
          padding: 0;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .custom-popup .mapboxgl-popup-tip {
          border-bottom-color: rgba(0, 0, 0, 0.1) !important;
        }
        .custom-popup .mapboxgl-popup-content {
          border-radius: 20px !important;
        }
      `}</style>
    </div>
  );
};

export default UsersMap;
