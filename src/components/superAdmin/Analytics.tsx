'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { 
  BarChart, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Building,
  Scan,
  Activity,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { fetchFromHasura } from '@/lib/hasuraClient';
import { Progress } from '@/components/ui/progress';
import { getOrderStatusMetrics } from '@/api/analytics';

const Analytics = () => {
  const [orderStats, setOrderStats] = useState({
    cancelled: 0,
    completed: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderStats = async () => {
      try {
        const result = await fetchFromHasura(getOrderStatusMetrics);
        if (result) {
          setOrderStats({
            cancelled: result.cancelled.aggregate.count || 0,
            completed: result.completed.aggregate.count || 0,
            pending: result.pending.aggregate.count || 0
          });
        }
      } catch (error) {
        console.error('Error fetching order stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderStats();
  }, []);

  // Calculate total orders and percentages
  const totalOrders = orderStats.cancelled + orderStats.completed + orderStats.pending;
  const completedPercentage = totalOrders > 0 ? Math.round((orderStats.completed / totalOrders) * 100) : 0;
  const pendingPercentage = totalOrders > 0 ? Math.round((orderStats.pending / totalOrders) * 100) : 0;
  const cancelledPercentage = totalOrders > 0 ? Math.round((orderStats.cancelled / totalOrders) * 100) : 0;

  return (
    <div>
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 border-2 border-[#ffba79]/20 bg-[#fffefd]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Traffic</p>
              <h3 className="text-2xl font-bold">$$.$$</h3>
              <p className="text-xs text-green-500">+$$.$$% from last period</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Activity size={24} className="text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-2 border-[#ffba79]/20 bg-[#fffefd]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New Users</p>
              <h3 className="text-2xl font-bold">$$.$$</h3>
              <p className="text-xs text-green-500">+$$.$$% from last period</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <Users size={24} className="text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-2 border-[#ffba79]/20 bg-[#fffefd]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">No. of Orders</p>
              <h3 className="text-2xl font-bold">{loading ? "..." : totalOrders}</h3>
              <p className="text-xs text-green-500">+$$.$$% from last period</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <ShoppingBag size={24} className="text-purple-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-2 border-[#ffba79]/20 bg-[#fffefd]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Order Value</p>
              <h3 className="text-2xl font-bold">₹$$.$$</h3>
              <p className="text-xs text-green-500">+$$.$$% from last period</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <DollarSign size={24} className="text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Order Status Cards */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Order Status Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-2 border-[#ffba79]/20 bg-[#fffefd]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-gray-600">Completed Orders</p>
                <h3 className="text-2xl font-bold">{loading ? "..." : orderStats.completed}</h3>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </div>
            <Progress value={completedPercentage} className="h-2 bg-gray-200" />
            <p className="text-xs text-gray-500 mt-2">{completedPercentage}% of total orders</p>
          </Card>
          
          <Card className="p-4 border-2 border-[#ffba79]/20 bg-[#fffefd]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-gray-600">Pending Orders</p>
                <h3 className="text-2xl font-bold">{loading ? "..." : orderStats.pending}</h3>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock size={24} className="text-yellow-600" />
              </div>
            </div>
            <Progress value={pendingPercentage} className="h-2 bg-gray-200" />
            <p className="text-xs text-gray-500 mt-2">{pendingPercentage}% of total orders</p>
          </Card>
          
          <Card className="p-4 border-2 border-[#ffba79]/20 bg-[#fffefd]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-gray-600">Cancelled Orders</p>
                <h3 className="text-2xl font-bold">{loading ? "..." : orderStats.cancelled}</h3>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <XCircle size={24} className="text-red-600" />
              </div>
            </div>
            <Progress value={cancelledPercentage} className="h-2 bg-gray-200" />
            <p className="text-xs text-gray-500 mt-2">{cancelledPercentage}% of total orders</p>
          </Card>
        </div>
      </div>

      {/* Second Row of KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 border-2 border-[#ffba79]/20 bg-[#fffefd]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Partners</p>
              <h3 className="text-2xl font-bold">$$.$$</h3>
              <p className="text-xs text-green-500">+$$.$$% from last period</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Building size={24} className="text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-2 border-[#ffba79]/20 bg-[#fffefd]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Partners Created Per Day</p>
              <h3 className="text-2xl font-bold">$$.$$</h3>
              <p className="text-xs text-green-500">+$$.$$% from last period</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <Building size={24} className="text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-2 border-[#ffba79]/20 bg-[#fffefd]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Per Hotel Scan</p>
              <h3 className="text-2xl font-bold">$$.$$</h3>
              <p className="text-xs text-green-500">+$$.$$% from last period</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Scan size={24} className="text-purple-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-2 border-[#ffba79]/20 bg-[#fffefd]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Scan</p>
              <h3 className="text-2xl font-bold">$$.$$</h3>
              <p className="text-xs text-green-500">+$$.$$% from last period</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <Scan size={24} className="text-orange-600" />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Active Users Card (Marked as Least Priority) */}
      <div className="mb-6">
        <Card className="p-4 border-2 border-[#ffba79]/20 bg-[#fffefd] relative">
          <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-bl">
            Least Priority
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <h3 className="text-2xl font-bold">$$.$$</h3>
              <p className="text-xs text-green-500">+$$.$$% from last period</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100">
              <Users size={24} className="text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4 border-2 border-[#ffba79]/20 bg-[#fffefd]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Traffic & User Trends</h3>
            <TrendingUp size={18} className="text-orange-600" />
          </div>
          
          <div className="h-[250px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="flex flex-col items-center text-gray-500">
              <BarChart size={48} />
              <p className="mt-2">Traffic & User Chart Placeholder</p>
              <p className="text-xs">(Will be populated with actual data later)</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-2 border-[#ffba79]/20 bg-[#fffefd]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Order & Scan Statistics</h3>
            <BarChart size={18} className="text-orange-600" />
          </div>
          
          <div className="h-[250px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="flex flex-col items-center text-gray-500">
              <BarChart size={48} />
              <p className="mt-2">Order & Scan Chart Placeholder</p>
              <p className="text-xs">(Will be populated with actual data later)</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics; 