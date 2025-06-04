"use client";

import { Partner } from "@/store/authStore";
import React, { useEffect, useState } from "react";
import PartnerCard from "./PartnerCard";
import { useInView } from "react-intersection-observer";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { toast } from "sonner";
import { getAllPartnersQuery } from "@/api/partners";
import { useSearchParams } from "next/navigation";



const HotelsList = ({ 
  initialPartners,
  initialTotalCount,
  initialDistrict = "all"
}: {
  initialPartners: Partner[];
  initialTotalCount: number;
  initialDistrict?: string;
}) => {
  const [partners, setPartners] = useState<Partner[]>(initialPartners);
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount);
  const [isLoading, setIsLoading] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(initialPartners.length);
  const serachParams = useSearchParams();
  const location = serachParams.get("location") || "";

  const limit = 12; 

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
      const variables = {
        limit,
        offset: currentOffset + 1,
        district: initialDistrict ? `%${location}%` : "%",
      };

      const data = await fetchFromHasura(getAllPartnersQuery, variables);
      const newPartners = data.partners;
      const newTotalCount = data.partners_aggregate.aggregate.count;

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