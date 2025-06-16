"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search } from "lucide-react";
import { Partner, useAuthStore } from "@/store/authStore";
import useOrderStore, { Order } from "@/store/orderStore";
import OrderItemCard from "@/components/admin/OrderItemCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { usePOSStore } from "@/store/posStore";

const OrdersPage = () => {
  const { fetchOrderOfPartner, deleteOrder, updateOrderStatus } = useOrderStore();
  const { setEditOrderModalOpen, setOrder } = usePOSStore();
  const { userData } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"delivery" | "table" | "pos">("delivery");
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]);
  const [sortedOrders, setSortedOrders] = useState<Order[]>([]);

  // Helper function to sort orders
  const sortOrders = (ordersToSort: Order[]) => {
    return [...ordersToSort].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Always newest first
    });
  };

  // Helper function to process and filter orders
  const processAndFilterOrders = (fetchedOrders: Order[]) => {
    if (!fetchedOrders) return [];
    
    let result = [...fetchedOrders];

    // Filter by tab
    result = result.filter((order) => {
      if (activeTab === "delivery") return order.type === "delivery";
      if (activeTab === "table") return order.type === "table_order";
      if (activeTab === "pos") return order.type === "pos";
      return false;
    });

    // Filter by status
    if (filter !== "all") {
      result = result.filter((order) => order.status === filter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((order) => {
        return (
          order.id.toLowerCase().includes(query) ||
          (order.user?.phone?.toLowerCase().includes(query) ?? false) ||
          order.items.some((item) => item.name.toLowerCase().includes(query)) ||
          order.phone?.includes(query) ||
          (order.tableNumber?.toString().includes(query) ?? false)
        );
      });
    }

    // Sort results
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      switch (sortBy) {
        case "newest":
          return dateB - dateA;
        case "oldest":
          return dateA - dateB;
        case "highest":
          return b.totalPrice - a.totalPrice;
        case "lowest":
          return a.totalPrice - b.totalPrice;
        default:
          return dateB - dateA;
      }
    });

    return result;
  };

  useEffect(() => {
    const loadOrders = async () => {
      if (userData?.id) {
        setLoading(true);
        setError(null);
        try {
          const partnerOrders = await fetchOrderOfPartner(userData.id);
          if (partnerOrders) {
            setOrders(partnerOrders);
          } else {
            setError("Failed to load orders");
          }
        } catch (error) {
          console.error("Failed to fetch orders:", error);
          setError("Failed to load orders. Please try again.");
          toast.error("Failed to load orders");
        } finally {
          setLoading(false);
        }
      }
    };

    loadOrders();
  }, [userData?.id, fetchOrderOfPartner]);

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const success = await deleteOrder(orderId);
      if (success) {
        setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
        toast.success("Order deleted successfully");
        return true;
      } else {
        toast.error("Failed to delete order");
        return false;
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
      return false;
    }
  };

  // Apply pagination to filtered orders
  useEffect(() => {
    const filteredOrders = processAndFilterOrders(orders);
    setSortedOrders(filteredOrders);
    setTotalOrders(filteredOrders.length);
    
    // Reset to first page when filters change
    setCurrentPage(1);
    const startIndex = 0;
    const endIndex = ordersPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
    setDisplayedOrders(paginatedOrders);
    setHasMoreOrders(filteredOrders.length > ordersPerPage);
  }, [orders, activeTab, filter, sortBy, searchQuery]);

  const filteredOrders = processAndFilterOrders(orders);

  // Pagination functions - fetch next 10 orders when Next is pressed
  const fetchNextPage = async () => {
    if (!userData?.id || !hasMoreOrders) return;

    try {
      setLoading(true);
      const offset = currentPage * ordersPerPage;
      
      const fetchedOrders = await fetchOrderOfPartner(userData.id);
      
      if (!fetchedOrders) return;

      const processedOrders = processAndFilterOrders(fetchedOrders);
      const paginatedOrders = processedOrders.slice(offset, offset + ordersPerPage);
      setDisplayedOrders(prevOrders => [...prevOrders, ...paginatedOrders]);
      setHasMoreOrders(processedOrders.length > offset + ordersPerPage);
      setCurrentPage(prev => prev + 1);
    } catch (error) {
      toast.error("Failed to load more orders");
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (hasMoreOrders) {
      fetchNextPage();
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      // Calculate the start index for the previous page
      const startIndex = (currentPage - 2) * ordersPerPage;
      // Show the previous page's orders
      setDisplayedOrders(prevOrders => prevOrders.slice(0, startIndex + ordersPerPage));
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalOrders / ordersPerPage);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">All Orders</h1>
        
        <div className="flex flex-col w-full md:w-auto gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-[200px]">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="highest">Highest Amount</SelectItem>
                  <SelectItem value="lowest">Lowest Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "delivery" | "table" | "pos")}
      >
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="delivery">Delivery Orders</TabsTrigger>
          <TabsTrigger value="table">Table Orders</TabsTrigger>
          <TabsTrigger value="pos">POS Orders</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin h-8 w-8" />
          </div>
        ) : (
          <>
            <TabsContent value="delivery">
              <div className="space-y-4">
                {displayedOrders.length === 0 ? (
                  <p className="text-gray-500">No delivery orders found matching your criteria</p>
                ) : (
                  displayedOrders.map((order) => {
                    const grandTotal = order.totalPrice || 0;
                    const gstPercentage = (userData as Partner)?.gst_percentage || 0;
                    const foodTotal = order.items.reduce(
                      (total, item) => total + (item.price || 0) * item.quantity,
                      0
                    );
                    const gstAmount = order.gstIncluded
                      ? (foodTotal * gstPercentage) / 100
                      : 0;

                    return (
                      <OrderItemCard
                        key={order.id}
                        order={order}
                        grantTotal={grandTotal}
                        gstAmount={gstAmount}
                        gstPercentage={gstPercentage}
                        deleteOrder={handleDeleteOrder}
                        setEditOrderModalOpen={setEditOrderModalOpen}
                        setOrder={setOrder}
                        updateOrderStatus={(status) => {
                          updateOrderStatus(
                            orders,
                            order.id,
                            status,
                            setOrders
                          );
                        }}
                      />
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="table">
              <div className="space-y-4">
                {displayedOrders.length === 0 ? (
                  <p className="text-gray-500">No table orders found matching your criteria</p>
                ) : (
                  displayedOrders.map((order) => {
                    const grandTotal = order.totalPrice || 0;
                    const foodTotal = order.items.reduce(
                      (total, item) => total + (item.price || 0) * item.quantity,
                      0
                    );
                    const gstPercentage = (userData as Partner)?.gst_percentage || 0;
                    const gstAmount = order.gstIncluded
                      ? (foodTotal * gstPercentage) / 100
                      : 0;

                    return (
                      <OrderItemCard
                        key={order.id}
                        order={order}
                        grantTotal={grandTotal}
                        gstAmount={gstAmount}
                        gstPercentage={gstPercentage}
                        deleteOrder={handleDeleteOrder}
                        setEditOrderModalOpen={setEditOrderModalOpen}
                        setOrder={setOrder}
                        updateOrderStatus={(status) => {
                          updateOrderStatus(
                            orders,
                            order.id,
                            status,
                            setOrders
                          );
                        }}
                      />
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="pos">
              <div className="space-y-4">
                {displayedOrders.length === 0 ? (
                  <p className="text-gray-500">No POS orders found matching your criteria</p>
                ) : (
                  displayedOrders.map((order) => {
                    const grandTotal = order.totalPrice || 0;
                    const foodTotal = order.items.reduce(
                      (total, item) => total + (item.price || 0) * item.quantity,
                      0
                    );
                    const gstPercentage = (userData as Partner)?.gst_percentage || 0;
                    const gstAmount = order.gstIncluded
                      ? (foodTotal * gstPercentage) / 100
                      : 0;

                    return (
                      <OrderItemCard
                        key={order.id}
                        order={order}
                        grantTotal={grandTotal}
                        gstAmount={gstAmount}
                        gstPercentage={gstPercentage}
                        deleteOrder={handleDeleteOrder}
                        setEditOrderModalOpen={setEditOrderModalOpen}
                        setOrder={setOrder}
                        updateOrderStatus={(status) => {
                          updateOrderStatus(
                            orders,
                            order.id,
                            status,
                            setOrders
                          );
                        }}
                      />
                    );
                  })
                )}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex-none p-4 border-t flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={!hasMoreOrders}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;