'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import Analytics from '@/components/superAdmin/Analytics';
import { 
  BarChart,
  ArrowLeft,
  Users,
  Building,
  Scan
} from 'lucide-react';
import Link from 'next/link';

const AnalyticsDashboard = () => {
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
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Scans</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Users</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion Rate</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[1, 2, 3, 4, 5].map((item) => (
                  <tr key={item} className="hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <Scan size={16} />
                        </div>
                        <span>Hotel {item}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">$$.$$</td>
                    <td className="py-3 px-4 whitespace-nowrap">$$.$$</td>
                    <td className="py-3 px-4 whitespace-nowrap">$$.$$ %</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item % 5 === 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {item % 5 === 0 ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
};

export default AnalyticsDashboard; 