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
  ChevronRight
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

const ITEMS_PER_PAGE = 5;

const AnalyticsDashboard = () => {
  const [qrCodeData, setQrCodeData] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchQRData = async () => {
      try {
        setLoading(true);
        
        const result = await fetchFromHasura(getTopQRCodes, {
          limit: 50 // Fetch more items to handle pagination client-side
        });
        
        if (result && result.qr_codes) {
          setQrCodeData(result.qr_codes);
          setTotalItems(result.qr_codes.length);
          setTotalPages(Math.ceil(result.qr_codes.length / ITEMS_PER_PAGE));
        }
      } catch (error) {
        console.error('Error fetching QR code data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQRData();
  }, []);

  // Calculate conversion rate (placeholder calculation - adjust as needed)
  const calculateConversionRate = (scans: number) => {
    // Example: assume 10% conversion rate for every 100 scans
    const rate = (scans / 100) * 10;
    return Math.min(Math.max(rate, 0), 100).toFixed(2);
  };

  // Get current items for pagination
  const getCurrentItems = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return qrCodeData.slice(startIndex, endIndex);
  };

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
            <h3 className="text-lg font-semibold">Scan Statistics</h3>
            <button className="text-sm text-orange-600">Export CSV</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR ID</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table Number</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Scans</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion Rate</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-4 px-4 text-center">Loading scan data...</td>
                  </tr>
                ) : qrCodeData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 px-4 text-center">No QR code data available</td>
                  </tr>
                ) : (
                  getCurrentItems().map((qr) => (
                    <tr key={qr.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <Building size={16} />
                          </div>
                          <span>{qr.partner.name || 'Unknown Partner'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{qr.id.substring(0, 8)}...</td>
                      <td className="py-3 px-4 whitespace-nowrap">{qr.table_number || 'N/A'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{qr.no_of_scans}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{calculateConversionRate(qr.no_of_scans)}%</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          qr.no_of_scans > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {qr.no_of_scans > 0 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {!loading && qrCodeData.length > 0 && (
              <div className="flex items-center justify-between mt-4 px-4">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}
                  </span>{' '}
                  of <span className="font-medium">{totalItems}</span> results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-md ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-md ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                    <ChevronRight size={16} className="ml-1" />
                  </button>
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