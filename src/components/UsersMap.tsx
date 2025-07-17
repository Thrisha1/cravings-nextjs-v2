"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import { Partner } from "@/store/authStore"; // Assuming Partner type is defined here
import "mapbox-gl/dist/mapbox-gl.css";
import { revalidateTag } from "@/app/actions/revalidate";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYWJoaW4yazMiLCJhIjoiY20wbWh5ZHFwMDJwcjJqcHVjM3kyZjZlNyJ9.cagUWYMuMzLdJQhMbYB50A";

const UsersMap = ({ partners }: { partners: Partner[] }) => {
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  // State for filters
  const [statusFilter, setStatusFilter] = useState<string>(""); // e.g., 'active', 'inactive'
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [districtFilter, setDistrictFilter] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Memoize derived data to avoid re-calculating on every render
  const uniqueCountries = useMemo(() => {
    return [...new Set(partners.map((p) => p.country).filter(Boolean))].sort();
  }, [partners]);

  const uniqueDistricts = useMemo(() => {
    return [...new Set(partners.map((p) => p.district).filter(Boolean))].sort();
  }, [partners]);

  // Apply filters to the partners list
  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      const statusMatch = !statusFilter || partner.status === statusFilter;
      const countryMatch = !countryFilter || partner.country === countryFilter;
      const districtMatch = !districtFilter || partner.district === districtFilter;
      return statusMatch && countryMatch && districtMatch;
    });
  }, [partners, statusFilter, countryFilter, districtFilter]);

  // Initialize map (runs only once)
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
    filteredPartners.forEach((partner) => {
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
          <img src="${partner.store_banner || '/default-store-banner.jpg'}" alt="${partner.store_name}" class="w-20 h-20 rounded-full object-cover mx-auto mb-2 border-2 border-gray-200" />
          <h3 class="font-bold text-md mb-1">${partner.store_name}</h3>
          <a href="https://cravings.live/hotels/${partner.id}" target="_blank" rel="noopener noreferrer" class="text-orange-600 hover:text-orange-800 text-sm font-medium">View Hotel →</a>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 35, closeButton: false, className: "custom-popup" })
        .setHTML(popupContent);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([
          partner.geo_location.coordinates[0],
          partner.geo_location.coordinates[1],
        ])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);
    });

  }, [filteredPartners]); // This effect now depends on the *filtered* list

  const handleRefresh = async () => {
      setIsRefreshing(true);
      await revalidateTag("partners-geo-loc");
      // Note: The page will automatically receive new props and re-render.
      // We don't need to call router.refresh() if the action is in a form.
      // But since we are calling it programmatically, we let Next.js handle the data refetch.
      setIsRefreshing(false);
      window.location.reload(); // Reload the page to reflect changes
  };

  return (
    <div className="relative w-full h-screen">
      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-lg w-72">
        <h2 className="text-xl font-bold mb-2">Partner Filters</h2>
        <p className="text-sm text-gray-600 mb-4">
          Showing <strong>{filteredPartners.length}</strong> of <strong>{partners.length}</strong> partners.
        </p>

        {/* Filters */}
        <div className="space-y-3">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select id="status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
            <select id="country" value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md">
              <option value="">All Countries</option>
              {uniqueCountries.map(country => <option key={country} value={country}>{country}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="district" className="block text-sm font-medium text-gray-700">District</label>
            <select id="district" value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md">
              <option value="">All Districts</option>
              {uniqueDistricts.map(district => <option key={district} value={district}>{district}</option>)}
            </select>
          </div>
        </div>
        
        {/* Refresh Button using a Form */}
        <form action={() => handleRefresh()} className="mt-4">
            <button type="submit" disabled={isRefreshing} className="w-full bg-orange-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                {isRefreshing ? "Refreshing..." : "🔄 Refresh Data"}
            </button>
        </form>
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