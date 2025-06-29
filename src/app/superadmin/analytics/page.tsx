'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import Analytics from '@/components/superAdmin/Analytics';
import { 
  BarChart,
  ArrowLeft,
  Users,
  Building,
  Scan,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  X
} from 'lucide-react';
import Link from 'next/link';
import { fetchFromHasura } from '@/lib/hasuraClient';
import { getTopQRCodes } from '@/api/analytics';

interface QRCodeData {
  id: string;
  no_of_scans: number;
  partner_id: string;
  table_number?: number;
  partner: {
    name: string;
    phone: string;
  };
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const AnalyticsDashboard = () => {
  const [qrCodeData, setQrCodeData] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const fetchQRData = async (page: number, itemsPerPage: number, search: string) => {
    try {
      setLoading(true);
      const offset = (page - 1) * itemsPerPage;
      const searchPattern = search ? `%${search}%` : '%';
      
      const result = await fetchFromHasura(getTopQRCodes, {
        limit: itemsPerPage,
        offset: offset,
        search: searchPattern
      });
      
      if (result && result.qr_codes) {
        setQrCodeData(result.qr_codes);
        
        // Get total count from aggregate
        if (result.qr_codes_aggregate?.aggregate?.count) {
          const totalCount = result.qr_codes_aggregate.aggregate.count;
          setTotalItems(totalCount);
          setTotalPages(Math.ceil(totalCount / itemsPerPage));
        }
      }
    } catch (error) {
      console.error('Error fetching QR code data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRData(currentPage, pageSize, debouncedSearchTerm);
  }, [currentPage, pageSize, debouncedSearchTerm]);

  // Handle page changes
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = parseInt(e.target.value, 10);
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchQRData(currentPage, pageSize, debouncedSearchTerm);
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-8">
      <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
      <span className="ml-2 text-gray-600">Loading data...</span>
    </div>
  );

  return (
    <main className="px-3 py-5 sm:px-[7.5%] bg-[#FFF7EC] min-h-screen">
      <div className="mb-6">
        <Link href="/superadmin" className="flex items-center text-orange-600 mb-4 hover:underline">
          <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
        </Link>
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl lg:text-4xl font-bold">App Analytics</h1>
        </div>
      </div>
      
      {/* Include the Analytics component */}
      <Analytics />
      
      {/* Additional Data Tables Section */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        <Card className="p-4 border-2 border-[#ffba79]/20 bg-[#fffefd]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Partner Performance</h3>
            <button className="text-sm text-orange-600">Export CSV</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Scans</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Order Value</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[1, 2, 3, 4, 5].map((item) => (
                  <tr key={item} className="hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <Building size={16} />
                        </div>
                        <span>Partner {item}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">$$.$$</td>
                    <td className="py-3 px-4 whitespace-nowrap">$$.$$</td>
                    <td className="py-3 px-4 whitespace-nowrap">₹$$.$$</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item % 3 === 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {item % 3 === 0 ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        
        <Card className="p-4 border-2 border-[#ffba79]/20 bg-[#fffefd]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent User Activity</h3>
            <button className="text-sm text-orange-600">Export CSV</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity Type</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[1, 2, 3, 4, 5].map((item) => (
                  <tr key={item} className="hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <Users size={16} />
                        </div>
                        <span>User {item}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {['Scan', 'Order', 'Profile Update', 'Login', 'Registration'][item % 5]}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item % 2 === 0 ? `Partner ${item}` : '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      $$.$$.$$ | $$:$$
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item % 2 === 0 ? 'iOS' : 'Android'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        
        <Card className="p-4 border-2 border-[#ffba79]/20 bg-[#fffefd]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">QR Code Scan Statistics</h3>
            <div className="flex items-center">
              {loading && (
                <div className="flex items-center mr-4">
                  <Loader2 className="h-4 w-4 text-orange-500 animate-spin mr-1" />
                  <span className="text-xs text-gray-500">Refreshing...</span>
                </div>
              )}
              <button 
                onClick={handleRefresh} 
                className="text-sm text-orange-600 mr-4 hover:underline flex items-center"
                disabled={loading}
              >
                <Loader2 className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button className="text-sm text-orange-600 hover:underline">Export CSV</button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by partner name..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-10 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR ID</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table Number</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Scans</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading && qrCodeData.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : qrCodeData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 px-4 text-center">
                      {debouncedSearchTerm ? (
                        <div className="flex flex-col items-center py-6">
                          <Search className="h-8 w-8 text-gray-400 mb-2" />
                          <p>No QR codes found for "<span className="font-medium">{debouncedSearchTerm}</span>"</p>
                          <button 
                            onClick={handleClearSearch} 
                            className="mt-2 text-sm text-orange-600 hover:underline"
                          >
                            Clear search
                          </button>
                        </div>
                      ) : (
                        'No QR code data available'
                      )}
                    </td>
                  </tr>
                ) : (
                  qrCodeData.map((qr) => (
                    <tr key={qr.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <Building size={16} />
                          </div>
                          <span>{qr.partner.name || 'Unknown Partner'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{qr.id.substring(0, 7)}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{qr.table_number || 'N/A'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{qr.no_of_scans}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {!loading && qrCodeData.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-4 px-4 gap-4">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, totalItems)}
                  </span>{' '}
                  of <span className="font-medium">{totalItems}</span> results
                  {debouncedSearchTerm && (
                    <span className="ml-1">
                      for "<span className="font-medium">{debouncedSearchTerm}</span>"
                      <button 
                        onClick={handleClearSearch} 
                        className="ml-2 text-orange-600 hover:underline"
                      >
                        Clear
                      </button>
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <label htmlFor="pageSize" className="mr-2 text-sm text-gray-600">
                      Show:
                    </label>
                    <select
                      id="pageSize"
                      value={pageSize}
                      onChange={handlePageSizeChange}
                      className="border border-gray-300 rounded-md text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {PAGE_SIZE_OPTIONS.map(size => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1 || loading}
                      className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-md ${
                        currentPage === 1 || loading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ChevronLeft size={16} className="mr-1" />
                      Previous
                    </button>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages || loading}
                      className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-md ${
                        currentPage === totalPages || loading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Next
                      <ChevronRight size={16} className="ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
};

export default AnalyticsDashboard; 