"use client";

import { Partner } from "@/store/authStore";
import React, { useEffect, useState } from "react";
import PartnerCard from "./PartnerCard";
import { useInView } from "react-intersection-observer";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { toast } from "sonner";
import { getNearByPartnersQuery } from "@/api/partners";
import { useSearchParams } from "next/navigation";

const HotelsList = ({ 
  initialPartners,
  initialTotalCount,
  district = "all",
  limit = 10,
  query = ""
}: {
  initialPartners: Partner[];
  initialTotalCount: number;
  district?: string;
  limit?: number;
  query?: string;
}) => {
  const [partners, setPartners] = useState<Partner[]>(initialPartners);
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount);
  const [isLoading, setIsLoading] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(initialPartners.length);
  const searchParams = useSearchParams();
  const location = searchParams.get("location") || "";

  useEffect(() => {
    setPartners(initialPartners);
    setTotalCount(initialTotalCount);
    setCurrentOffset(initialPartners.length);
  }, [initialPartners]);

  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  const loadMorePartners = async () => {
    if (isLoading || partners.length >= totalCount) return;
    
    setIsLoading(true);
    try {
      // Get user location from localStorage
      const locCookie = localStorage.getItem("user-location-store");
      let userLat = 10.164529;
      let userLng = 76.228177;

      if (locCookie) {
        try {
          const locData = JSON.parse(locCookie);
          if (locData.state.coords) {
            userLat = locData.state.coords.lat;
            userLng = locData.state.coords.lng;
          }
        } catch (e) {
          console.error("Error parsing location cookie:", e);
        }
      }

      const data = await fetchFromHasura(getNearByPartnersQuery, {
        user_lat: userLat,
        user_lng: userLng,
        limit_count: limit,
        offset_count: currentOffset,
        district_filter: location ? `%${location}%` : "%",
        search_query: query ? `%${query}%` : ""
      });
      const newPartners = data.get_all_partners;
      const newTotalCount = data.get_all_partners_aggregate.aggregate.count;

      if (newPartners.length) {
        setPartners(prev => [...prev, ...newPartners]);
        setCurrentOffset(prev => prev + limit);
      }
      setTotalCount(newTotalCount);
    } catch (error) {
      console.error("Error loading more partners:", error);
      toast.error("Failed to load more hotels");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (inView) {
      loadMorePartners();
    }
  }, [inView]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-lg font-bold mb-4 text-gray-800">
        Discover the Best Hotels in Your Area
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
        {partners.map((partner, index) => (
          <PartnerCard 
            key={`${partner.id}-${index}`} 
            partner={partner} 
            ref={index === partners.length - 1 ? ref : null}
          />
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center mt-8">
          Loading....
        </div>
      )}
    </div>
  );
};

export default HotelsList;