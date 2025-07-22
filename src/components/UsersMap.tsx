"use client";
import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Partner, User } from "@/store/authStore";
import "mapbox-gl/dist/mapbox-gl.css";
import { revalidateTag } from "@/app/actions/revalidate";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYWJoaW4yazMiLCJhIjoiY20wbWh5ZHFwMDJwcjJqcHVjM3kyZjZlNyJ9.cagUWYMuMzLdJQhMbYB50A";

// --- NEW HELPER FUNCTION ---
// This function creates a GeoJSON Polygon feature that approximates a circle.
const createGeoJSONCircle = (center: [number, number], radiusInKm: number, points: number = 64) => {
  const coords = [];
  const distance = radiusInKm;
  const earthRadius = 6371; // in kilometers

  const lat = (center[1] * Math.PI) / 180;
  const lon = (center[0] * Math.PI) / 180;

  for (let i = 0; i < points; i++) {
    const bearing = (2 * Math.PI * i) / points;
    const newLat = Math.asin(
      Math.sin(lat) * Math.cos(distance / earthRadius) +
        Math.cos(lat) * Math.sin(distance / earthRadius) * Math.cos(bearing)
    );
    const newLon =
      lon +
      Math.atan2(
        Math.sin(bearing) * Math.sin(distance / earthRadius) * Math.cos(lat),
        Math.cos(distance / earthRadius) - Math.sin(lat) * Math.sin(newLat)
      );

    const newLatDeg = (newLat * 180) / Math.PI;
    const newLonDeg = (newLon * 180) / Math.PI;
    coords.push([newLonDeg, newLatDeg]);
  }
  coords.push(coords[0]); // Close the polygon

  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        geometry: {
          type: "Polygon" as const,
          coordinates: [coords],
        },
        properties: {},
      },
    ],
  };
};

const UsersMap = ({
  partners,
  users,
  temp_users,
}: {
  partners: Partner[];
  users: User[];
  temp_users: User[];
}) => {
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [showPartners, setShowPartners] = useState(true);
  const [showUsers, setShowUsers] = useState(true);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [76.379693, 9.943894], // Default center
      zoom: 9,
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when filtered partners change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Add new markers for each filtered partner
    if (showPartners) {
      partners.forEach((partner) => {
        if (!partner?.geo_location?.coordinates) return;

        const el = document.createElement("div");
        el.className = "custom-marker";
        el.style.width = "40px";
        el.style.height = "40px";

        const img = document.createElement("img");
        img.src = partner.store_banner || "/default-store-banner.jpg";
        img.alt = partner.store_name || "Partner location";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.borderRadius = "50%";
        img.style.objectFit = "cover";
        img.style.border = "2px solid white";
        img.style.boxShadow = "0 2px 5px rgba(0,0,0,0.3)";
        el.appendChild(img);

        const popupContent = `
        <div class="p-3 text-center" style="max-width: 200px;">
          <img src="${
            partner.store_banner || "/default-store-banner.jpg"
          }" alt="${
          partner.store_name
        }" class="w-20 h-20 rounded-full object-cover mx-auto mb-2 border-2 border-gray-200" />
          <h3 class="font-bold text-md mb-1">${partner.store_name}</h3>
          <a href="https://cravings.live/hotels/${
            partner.id
          }" target="_blank" rel="noopener noreferrer" class="text-orange-600 hover:text-orange-800 text-sm font-medium">View Hotel →</a>
        </div>
      `;

        const popup = new mapboxgl.Popup({
          offset: 35,
          closeButton: false,
          className: "custom-popup",
        }).setHTML(popupContent);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([
            partner.geo_location.coordinates[0],
            partner.geo_location.coordinates[1],
          ])
          .setPopup(popup)
          .addTo(map.current!);

        markers.current.push(marker);
      });
    }

    if (showUsers) {
      [...(Array.isArray(users) ? users : [users]), ...temp_users].forEach((user) => {
        if (!user?.location?.coordinates) return;
        const userEl = document.createElement("div");
        userEl.innerText = "❤️";
        userEl.style.fontSize = "24px";
        userEl.style.cursor = "pointer"; // --- MODIFICATION: Make it look clickable ---
        userEl.title = "Click to show 10km radius"; // --- MODIFICATION: Add a tooltip ---
        userEl.style.filter = user?.phone ? "none" : "grayscale(100%)"; // --- MODIFICATION: Grayscale if no name

        // --- MODIFICATION: Add click event listener to draw the circle ---
        userEl.addEventListener("click", () => {
          const mapInstance = map.current;
          if (!mapInstance) return;

          const sourceId = "circle-source";
          const fillLayerId = "circle-fill-layer";
          const outlineLayerId = "circle-outline-layer";
          
          // Remove previous circle if it exists
          if (mapInstance.getSource(sourceId)) {
            mapInstance.removeLayer(fillLayerId);
            mapInstance.removeLayer(outlineLayerId);
            mapInstance.removeSource(sourceId);
            return;
          }
          
          // Create new circle GeoJSON
          const circleGeoJSON = createGeoJSONCircle(
            [user?.location?.coordinates?.[0] || 0, user?.location?.coordinates?.[1] || 0],
            10 // Radius in KM
          );

          // Add source and layers for the new circle
          mapInstance.addSource(sourceId, {
            type: "geojson",
            data: circleGeoJSON,
          });

          mapInstance.addLayer({
            id: fillLayerId,
            type: "fill",
            source: sourceId,
            paint: {
              "fill-color": "#4A90E2", // A nice blue color
              "fill-opacity": 0.2,
            },
          });

          mapInstance.addLayer({
            id: outlineLayerId,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": "#4A90E2",
              "line-width": 2,
            },
          });
        });
        
        const userMarker = new mapboxgl.Marker(userEl)
          .setLngLat([
            user.location.coordinates[0],
            user.location.coordinates[1],
          ])
          .addTo(map.current!);

        markers.current.push(userMarker);
      });
    }
  }, [partners, users, showPartners, showUsers]);

  return (
    <div className="relative w-full h-screen">
      {/* refersh button  */}
      <div>
        <button
          onClick={async() => {
            await revalidateTag("partners-geo-loc");
            await revalidateTag("users-location");
            window.location.reload();
          }}
          className="absolute z-50 text-sm top-4 right-10 bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md hover:bg-gray-100 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* user  partner toggle  */}
      <div className="absolute z-50 top-4 left-4 bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md hover:bg-gray-100 transition-colors">
        <label className="flex items-center">
          <input
            type="checkbox"
            className="mr-2"
            checked={showUsers}
            onChange={() => setShowUsers(!showUsers)}
          />
          Show User Locations
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            className="mr-2"
            checked={showPartners}
            onChange={() => setShowPartners(!showPartners)}
          />
          Show Partner Locations
        </label>
      </div>

      <div id="map" className="w-full h-full"></div>

      <style jsx global>{`
        .custom-popup .mapboxgl-popup-content {
          padding: 0;
          overflow: hidden;
          border-radius: 12px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .custom-popup .mapboxgl-popup-tip {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default UsersMap;