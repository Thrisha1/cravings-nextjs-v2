"use client";
import HotelsList from "@/components/hotels/HotelsList";
import RecentVisits from "@/components/hotels/RecentVisits";
import LocationSelection from "@/components/LocationSelection";
import { Partner } from "@/store/authStore";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const HotelsPage = ({
  partnersData,
  recentVisitsData,
  district = "all",
}: {
  partnersData: {
    partners: Partner[];
    totalCount: number;
  };
  recentVisitsData: {
    recentVisits: Partner[];
    totalCount: number;
  };
  district?: string;
}) => {
  return (
    <div className="sm:px-[15%]">
      <RecentVisits
        initialRecentVisits={recentVisitsData.recentVisits}
        totalCount={recentVisitsData.totalCount}
      />
      <div className="px-4 flex justify-end">
        <LocationSelection />
      </div>
      <HotelsList
        initialPartners={partnersData.partners}
        initialTotalCount={partnersData.totalCount}
        initialDistrict={district}
      />
    </div>
  );
};

export default HotelsPage;
