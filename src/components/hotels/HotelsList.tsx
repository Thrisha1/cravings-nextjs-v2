"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Partner {
  id: string;
  store_name: string;
  store_banner: string;
  description: string;
  district: string;
  location: string;
}

interface HotelsListProps {
  initialPartners: Partner[];
  totalCount: number;
}

export default function HotelsList({ initialPartners, totalCount }: HotelsListProps) {
  const [partners, setPartners] = useState<Partner[]>(initialPartners);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const partnersPerPage = 10;
  
  const totalPages = Math.ceil(totalCount / partnersPerPage);
  const hasMore = currentPage < totalPages;
  
  const fetchPartners = async (page: number) => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * partnersPerPage; 
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      fetchPartners(newPage);
    }
  };

  const handleNext = () => {
    if (hasMore) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      fetchPartners(newPage);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-10">Loading...</div>
        ) : (
          partners.map((partner) => (
            <div 
              key={partner.id} 
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col border-2"
            >
              {/* Rest of your partner card JSX remains the same */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800">{partner.store_name}</h3>
                <p className="text-sm text-gray-600 mt-1">{partner.district}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 flex justify-center gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1 || isLoading}
          className={`px-4 py-2 rounded ${
            currentPage === 1 || isLoading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
        >
          Previous
        </button>
        <span className="flex items-center px-4">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={!hasMore || isLoading}
          className={`px-4 py-2 rounded ${
            !hasMore || isLoading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}