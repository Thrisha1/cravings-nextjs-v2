"use client";

import { getAllPartnersQuery } from "@/api/partners";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { Partner } from "@/store/authStore";
import { usePartnerStore } from "@/store/partnerStore";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

interface HotelsListProps {
  initialPartners: Partner[];
  totalCount: number;
}

export default function HotelsList({
  initialPartners,
  totalCount,
}: HotelsListProps) {
  const { ref, inView, entry } = useInView({
    /* Optional options */
    threshold: 0,
  });
  const { partners, setPartners, fetchPartners } = usePartnerStore();

  const loadMore = async () => {
    if (!inView) return;

    if (partners.length == totalCount) return;

    // console.log("Loading more partners...", partners.length);

    await fetchPartners(6, partners.length);
  };

  useEffect(() => {
    if (partners.length === 0) {
      setPartners(initialPartners);
    }
  }, [initialPartners]);

  useEffect(() => {
    loadMore();
  }, [inView, entry]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {partners.map((partner: any, index: number) => (
        <div
          ref={index === partners.length - 1 ? ref : null}
          key={partner.id}
          className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col"
        >
          <div className="relative h-32 w-full">
            <Image
              src={partner.store_banner || "/default-banner.jpg"}
              alt={partner.store_name}
              fill
              className="object-cover rounded-t-lg"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={false}
            />
          </div>

          <div className="p-3 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-1">
              <h2 className="text-sm md:text-base font-semibold text-gray-800 line-clamp-1">
                {partner.store_name}
              </h2>
              <span className="bg-orange-100 text-orange-800 text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap">
                {partner.district}
              </span>
            </div>

            <p className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-2">
              {partner.description}
            </p>

            <div className="mt-auto flex flex-row-reverse items-center justify-between">
              <Link
                href={partner.location}
                target="_blank"
                className="text-gray-500 hover:text-orange-500 transition-colors p-1 bg-orange-500 text-white text-sm md:text-sm font-medium py-1.5 px-2 rounded transition-colors duration-200 text-center"
                aria-label="View location on map"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </Link>

              <Link
                href={`/hotels/${partner.id}`}
                className="w-[75%] bg-orange-500 hover:bg-orange-600 text-white text-xs md:text-sm font-medium py-1.5 px-2 rounded transition-colors duration-200 text-center"
              >
                View Menu
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
