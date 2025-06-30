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
  X,
  ArrowDown,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { fetchFromHasura } from '@/lib/hasuraClient';
import { getTopQRCodes, getPartnerPerformance } from '@/api/analytics';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

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

interface PartnerData {
  id: string;
  name: string;
  district?: string;
  phone?: string;
  qr_codes_aggregate: {
    aggregate: {
      sum: {
        no_of_scans: number;
      };
    };
  };
  orders_aggregate: {
    aggregate: {
      count: number;
      sum: {
        total_price: number;
      };
    };
  };
}

type SortField = 'name' | 'scans' | 'orders' | 'avgOrderValue';

// Add type for date filter
type DateFilter = 'today' | 'week' | 'month' | 'all' | 'custom';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const AnalyticsDashboard = () => {
  const [qrCodeData, setQrCodeData] = useState<QRCodeData[]>([]);
  const [partnerData, setPartnerData] = useState<PartnerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerLoading, setPartnerLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [partnerCurrentPage, setPartnerCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPartners, setTotalPartners] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPartnerPages, setTotalPartnerPages] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [partnerPageSize, setPartnerPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [partnerSearchTerm, setPartnerSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [debouncedPartnerSearchTerm, setDebouncedPartnerSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(endDate);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Debounce partner search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPartnerSearchTerm(partnerSearchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [partnerSearchTerm]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Reset to first page when partner search term changes
  useEffect(() => {
    setPartnerCurrentPage(1);
  }, [debouncedPartnerSearchTerm]);
  
  // Update total pages when partner data or page size changes
  useEffect(() => {
    if (partnerData && partnerData.length > 0) {
      setTotalPartnerPages(Math.ceil(partnerData.length / partnerPageSize));
      setTotalPartners(partnerData.length);
    }
  }, [partnerData, partnerPageSize]);

  // Update date range based on selected filter
  const updateDateRange = (filter: DateFilter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let start = new Date();
    const end = new Date();
    
    switch (filter) {
      case 'today':
        start = new Date(today);
        break;
      case 'week':
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start = new Date(today);
        start.setDate(today.getDate() - 30);
        break;
      case 'all':
        start = new Date(2020, 0, 1); // Set a far past date
        break;
      case 'custom':
        // Keep current start and end dates
        return;
    }
    
    setStartDate(start);
    setEndDate(end);
    setDateFilter(filter);
  };
  
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    if (datePickerType === 'start') {
      setTempStartDate(date);
      setDatePickerType('end');
    } else {
      setTempEndDate(date);
      setCalendarOpen(false);
      
      // Ensure end date is after start date
      if (tempStartDate && date >= tempStartDate) {
        setStartDate(tempStartDate);
        setEndDate(date);
        setDateFilter('custom');
      } else {
        // If end date is before start date, swap them
        if (tempStartDate) {
          setStartDate(date);
          setEndDate(tempStartDate);
          setDateFilter('custom');
        }
      }
    }
  };
  
  const openDatePicker = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setDatePickerType('start');
    setCalendarOpen(true);
  };

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

  const fetchPartnerData = async (search: string) => {
    try {
      setPartnerLoading(true);
      const searchPattern = search ? `%${search}%` : '%';
      
      const result = await fetchFromHasura(getPartnerPerformance, {
        limit: 500, // Fetch a large number to handle client-side pagination
        offset: 0,
        search: searchPattern,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      if (result && result.partners) {
        setPartnerData(result.partners);
        
        // Get total count from aggregate or use the length of the array
        const totalCount = result.partners_aggregate?.aggregate?.count || result.partners.length;
        setTotalPartners(totalCount);
        setTotalPartnerPages(Math.ceil(totalCount / partnerPageSize));
        
        // Reset to first page when data changes
        setPartnerCurrentPage(1);
      }
    } catch (error) {
      console.error('Error fetching partner data:', error);
    } finally {
      setPartnerLoading(false);
    }
  };

  useEffect(() => {
    fetchQRData(currentPage, pageSize, debouncedSearchTerm);
  }, [currentPage, pageSize, debouncedSearchTerm]);
  
  useEffect(() => {
    fetchPartnerData(debouncedPartnerSearchTerm);
  }, [debouncedPartnerSearchTerm, startDate, endDate]);

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
  
  // Handle partner pagination
  const handlePartnerPreviousPage = () => {
    if (partnerCurrentPage > 1) {
      setPartnerCurrentPage(partnerCurrentPage - 1);
    }
  };

  const handlePartnerNextPage = () => {
    if (partnerCurrentPage < totalPartnerPages) {
      setPartnerCurrentPage(partnerCurrentPage + 1);
    }
  };

  // Handle partner page size change
  const handlePartnerPageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = parseInt(e.target.value, 10);
    setPartnerPageSize(newPageSize);
    setPartnerCurrentPage(1); // Reset to first page when changing page size
    
    // Update total pages based on the new page size
    setTotalPartnerPages(Math.ceil(totalPartners / newPageSize));
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle partner search input change
  const handlePartnerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPartnerSearchTerm(e.target.value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };
  
  // Clear partner search
  const handleClearPartnerSearch = () => {
    setPartnerSearchTerm('');
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchQRData(currentPage, pageSize, debouncedSearchTerm);
  };
  
  // Handle partner refresh button click
  const handlePartnerRefresh = () => {
    fetchPartnerData(debouncedPartnerSearchTerm);
  };
  
  // Handle column sorting - only sets the sort field
  const handleSort = (field: SortField) => {
    setSortField(field);
  };
  
  // Get sort icon for column headers
  const getSortIcon = (field: SortField) => {
    if (sortField === field) {
      return <ArrowDown className="h-4 w-4 text-orange-500" aria-label="Sorted in descending order" />;
    }
    return null;
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-8">
      <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
      <span className="ml-2 text-gray-600">Loading data...</span>
    </div>
  );

  // Sort and paginate the data based on current sort field (always descending)
  const sortedAndPaginatedPartnerData = React.useMemo(() => {
    if (!partnerData || partnerData.length === 0) return [];
    
    // First sort all data (always descending order)
    const sorted = [...partnerData].sort((a, b) => {
      // Calculate metrics for partner A
      const aOrders = a.orders_aggregate?.aggregate?.count || 0;
      const aRevenue = a.orders_aggregate?.aggregate?.sum?.total_price || 0;
      const aScans = a.qr_codes_aggregate?.aggregate?.sum?.no_of_scans || 0;
      const aAvgOrder = aOrders > 0 ? aRevenue / aOrders : 0;
      
      // Calculate metrics for partner B
      const bOrders = b.orders_aggregate?.aggregate?.count || 0;
      const bRevenue = b.orders_aggregate?.aggregate?.sum?.total_price || 0;
      const bScans = b.qr_codes_aggregate?.aggregate?.sum?.no_of_scans || 0;
      const bAvgOrder = bOrders > 0 ? bRevenue / bOrders : 0;
      
      // Always sort in descending order for all fields
      switch (sortField) {
        case 'name':
          return b.name.localeCompare(a.name); // Descending alphabetical
        case 'scans':
          return bScans - aScans; // Highest scans first
        case 'orders':
          return bOrders - aOrders; // Highest orders first
        case 'avgOrderValue':
          return bAvgOrder - aAvgOrder; // Highest average order first
        default:
          return b.name.localeCompare(a.name); // Default to name descending
      }
    });
    
    // Then apply pagination
    const startIndex = (partnerCurrentPage - 1) * partnerPageSize;
    const endIndex = startIndex + partnerPageSize;
    return sorted.slice(startIndex, endIndex);
  }, [partnerData, sortField, partnerCurrentPage, partnerPageSize]);

  // Date range filter component
  const DateRangeFilter = () => (
    <div className="flex flex-col md:flex-row items-center gap-2 mb-4">
      <div className="text-sm text-gray-500">Filter by:</div>
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={dateFilter === 'today' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => updateDateRange('today')}
        >
          Today
        </Button>
        <Button 
          variant={dateFilter === 'week' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => updateDateRange('week')}
        >
          Last 7 Days
        </Button>
        <Button 
          variant={dateFilter === 'month' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => updateDateRange('month')}
        >
          Last 30 Days
        </Button>
        <Button 
          variant={dateFilter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => updateDateRange('all')}
        >
          All Time
        </Button>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant={dateFilter === 'custom' ? 'default' : 'outline'} 
              size="sm" 
              onClick={openDatePicker}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              {dateFilter === 'custom' 
                ? `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`
                : 'Custom Range'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <div className="p-3">
              <div className="text-center mb-2 font-medium">
                {datePickerType === 'start' ? 'Select Start Date' : 'Select End Date'}
              </div>
              <CalendarComponent
                mode="single"
                selected={datePickerType === 'start' ? tempStartDate : tempEndDate}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  if (datePickerType === 'end' && tempStartDate) {
                    // Disable dates before start date when selecting end date
                    return date < tempStartDate;
                  }
                  return false;
                }}
                initialFocus
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
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
            <div className="flex items-center">
              {partnerLoading && (
                <div className="flex items-center mr-4">
                  <Loader2 className="h-4 w-4 text-orange-500 animate-spin mr-1" />
                  <span className="text-xs text-gray-500">Refreshing...</span>
                </div>
              )}
              <button 
                onClick={handlePartnerRefresh} 
                className="text-sm text-orange-600 mr-4 hover:underline flex items-center"
                disabled={partnerLoading}
              >
                <Loader2 className={`h-4 w-4 mr-1 ${partnerLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button className="text-sm text-orange-600 hover:underline">Export CSV</button>
            </div>
          </div>
          
          <DateRangeFilter />
          
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by partner name..."
                value={partnerSearchTerm}
                onChange={handlePartnerSearchChange}
                className="pl-10 pr-10 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {partnerSearchTerm && (
                <button
                  onClick={handleClearPartnerSearch}
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
                  <th 
                    className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                    title="Click to sort by partner name (Z-A)"
                  >
                    <div className="flex items-center justify-start gap-1">
                      <span>Partner</span>
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('scans')}
                    title="Click to sort by highest scan count first"
                  >
                    <div className="flex items-center justify-start gap-1">
                      <span>Total Scans</span>
                      {getSortIcon('scans')}
                    </div>
                  </th>
                  <th 
                    className="py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('orders')}
                    title="Click to sort by highest order count first"
                  >
                    <div className="flex items-center justify-start gap-1">
                      <span>Orders</span>
                      {getSortIcon('orders')}
                    </div>
                  </th>
                  <th 
                    className="py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('avgOrderValue')}
                    title="Click to sort by highest average order value first"
                  >
                    <div className="flex items-center justify-start gap-1">
                      <span>Avg Order Value</span>
                      {getSortIcon('avgOrderValue')}
                    </div>
                  </th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {partnerLoading && partnerData.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : partnerData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 px-4 text-center">
                      {debouncedPartnerSearchTerm ? (
                        <div className="flex flex-col items-center py-6">
                          <Search className="h-8 w-8 text-gray-400 mb-2" />
                          <p>No partners found for "<span className="font-medium">{debouncedPartnerSearchTerm}</span>"</p>
                          <button 
                            onClick={handleClearPartnerSearch} 
                            className="mt-2 text-sm text-orange-600 hover:underline"
                          >
                            Clear search
                          </button>
                        </div>
                      ) : (
                        'No partner data available'
                      )}
                    </td>
                  </tr>
                ) : (
                  sortedAndPaginatedPartnerData.map((partner) => {
                    // Calculate average order value
                    const totalOrders = partner.orders_aggregate?.aggregate?.count || 0;
                    const totalRevenue = partner.orders_aggregate?.aggregate?.sum?.total_price || 0;
                    const avgOrderValue = totalOrders > 0 
                      ? (totalRevenue / totalOrders).toFixed(2) 
                      : '0.00';
                    
                    // Get total scans
                    const totalScans = partner.qr_codes_aggregate?.aggregate?.sum?.no_of_scans || 0;
                  
                  return (
                    <tr key={partner.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <Building size={16} />
                          </div>
                          <span>{partner.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{totalScans}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{totalOrders}</td>
                      <td className="py-3 px-4 whitespace-nowrap">₹{avgOrderValue}</td>
                                                <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        totalOrders > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {totalOrders > 0 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {!partnerLoading && partnerData.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-4 px-4 gap-4">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(partnerCurrentPage - 1) * partnerPageSize + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(partnerCurrentPage * partnerPageSize, totalPartners)}
                  </span>{' '}
                  of <span className="font-medium">{totalPartners}</span> results
                  {debouncedPartnerSearchTerm && (
                    <span className="ml-1">
                      for "<span className="font-medium">{debouncedPartnerSearchTerm}</span>"
                      <button 
                        onClick={handleClearPartnerSearch} 
                        className="ml-2 text-orange-600 hover:underline"
                      >
                        Clear
                      </button>
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <label htmlFor="partnerPageSize" className="mr-2 text-sm text-gray-600">
                      Show:
                    </label>
                    <select
                      id="partnerPageSize"
                      value={partnerPageSize}
                      onChange={handlePartnerPageSizeChange}
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
                      onClick={handlePartnerPreviousPage}
                      disabled={partnerCurrentPage === 1 || partnerLoading}
                      className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-md ${
                        partnerCurrentPage === 1 || partnerLoading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ChevronLeft size={16} className="mr-1" />
                      Previous
                    </button>
                    <button
                      onClick={handlePartnerNextPage}
                      disabled={partnerCurrentPage === totalPartnerPages || partnerLoading}
                      className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-md ${
                        partnerCurrentPage === totalPartnerPages || partnerLoading
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