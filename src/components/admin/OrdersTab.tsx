"use client";
import { Partner, useAuthStore } from "@/store/authStore";
import useOrderStore, { Order, OrderItem } from "@/store/orderStore";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Loader2, Printer, Edit } from "lucide-react";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { HotelData } from "@/app/hotels/[...id]/page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { formatDate } from "@/lib/formatDate";
import { Howl } from "howler";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import BillTemplate from "./pos/BillTemplate";
import KOTTemplate from "./pos/KOTTemplate";
import { EditOrderModal } from "./pos/EditOrderModal";
import { usePOSStore } from "@/store/posStore";

const OrdersTab = () => {
  const router = useRouter();
  const { userData, features } = useAuthStore();
  const prevOrdersRef = useRef<Order[]>([]);
  const { subscribeOrders, partnerOrders } = useOrderStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyPending, setShowOnlyPending] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("oldest");
  const [activeTab, setActiveTab] = useState<"table" | "delivery">("table");
  const [newOrders, setNewOrders] = useState({ table: false, delivery: false });
  const [sortedOrders, setSortedOrders] = useState<Order[]>([]);
  const prevPendingOrdersCount = useRef({ table: 0, delivery: 0 });
  const soundRef = useRef<Howl | null>(null);
  const billRef = useRef<HTMLDivElement>(null);
  const kotRef = useRef<HTMLDivElement>(null);
  const {
    order,
    setOrder,
    editOrderModalOpen: isOpen,
    setEditOrderModalOpen,
  } = usePOSStore();

  const handlePrintBill = useReactToPrint({
    contentRef: billRef,
  });

  const handlePrintKOT = useReactToPrint({
    contentRef: kotRef,
  });

  useEffect(() => {
    soundRef.current = new Howl({
      src: ["/audio/tone.wav"],
      volume: 1,
      preload: true,
    });

    return () => {
      soundRef.current?.unload();
    };
  }, []);

  useEffect(() => {
    if (partnerOrders) {
      setOrders(partnerOrders);
      setLoading(false);
    }
  }, [partnerOrders]);

  useEffect(() => {
    const storedFilter = localStorage.getItem("ordersFilter");
    const orderFilter = localStorage.getItem("ordersSortOrder");
    const storedTab = localStorage.getItem("ordersActiveTab");

    if (storedTab === "delivery") {
      setActiveTab("delivery");
    }

    if (storedFilter === "pending") {
      setShowOnlyPending(true);
    } else {
      setShowOnlyPending(false);
    }

    if (orderFilter === "newest") {
      setSortOrder("newest");
    } else {
      setSortOrder("oldest");
    }
  }, []);

  const updateOrderStatus = async (
    orderId: string,
    newStatus: "completed" | "cancelled"
  ) => {
    try {
      const response = await fetchFromHasura(
        `mutation UpdateOrderStatus($orderId: uuid!, $status: String!) {
          update_orders_by_pk(pk_columns: {id: $orderId}, _set: {status: $status}) {
            id
            status
          }
        }`,
        { orderId, status: newStatus }
      );

      if (response.errors) throw new Error(response.errors[0].message);

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to update order status`);
    }
  };

  const togglePendingFilter = () => {
    const newValue = !showOnlyPending;
    setShowOnlyPending(newValue);
    localStorage.setItem("ordersFilter", newValue ? "pending" : "all");
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "newest" ? "oldest" : "newest");
    localStorage.setItem(
      "ordersSortOrder",
      sortOrder === "newest" ? "oldest" : "newest"
    );
  };

  const handleTabChange = (value: string) => {
    if (value === "table" || value === "delivery") {
      setActiveTab(value);
      setNewOrders((prev) => ({ ...prev, [value]: false }));
      localStorage.setItem("ordersActiveTab", value);
    }
  };

  useEffect(() => {
    const filteredByTypeOrders = orders.filter((order) =>
      activeTab === "table"
        ? order.type === "table_order"
        : order.type === "delivery"
    );

    const filteredOrders = showOnlyPending
      ? filteredByTypeOrders.filter((order) => order.status === "pending")
      : filteredByTypeOrders;

    const sortedOrders = [...filteredOrders].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    setSortedOrders(sortedOrders);
  }, [orders, activeTab, showOnlyPending, sortOrder]);

  useEffect(() => {
    if (!userData?.id) return;

    const unsubscribe = subscribeOrders((allOrders) => {
      const prevOrders = prevOrdersRef.current;

      const newPendingOrders = allOrders.filter(
        (order) =>
          order.status === "pending" &&
          ((activeTab === "table" && order.type === "table_order") ||
            (activeTab === "delivery" && order.type === "delivery")) &&
          !prevOrders.some((prevOrder) => prevOrder.id === order.id)
      );

      if (newPendingOrders.length > 0) {
        soundRef.current?.play();

        if (Notification.permission === "granted") {
          newPendingOrders.forEach((order) => {
            new Notification(
              `New ${activeTab === "table" ? "Table Order" : "Delivery"}`,
              {
                body: `Order #${order.id.slice(0, 8)} received`,
              }
            );
          });
        }

        setNewOrders((prev) => ({
          ...prev,
          [activeTab]: true,
        }));
      }

      prevOrdersRef.current = allOrders;
    });

    return () => {
      // unsubscribe();
    };
  }, [userData?.id, activeTab]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        console.log("Notification permission:", permission);
      });
    }
  }, []);

  const handleCreateNewOrder = () => {
    router.push("/admin/pos");
  };

  const calculateGst = (amount: number) => {
    const gstPercentage = (userData as HotelData)?.gst_percentage || 0;
    return (amount * gstPercentage) / 100;
  };

  return (
    <div className="py-10 px-[8%]">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold mb-5 sm:mb-0">Orders Management</h2>
        <div className="flex gap-2">
          {features?.pos.enabled && (
            <Button size="sm" onClick={handleCreateNewOrder}>
              Create New Order
            </Button>
          )}
          <Button size="sm" onClick={togglePendingFilter}>
            {showOnlyPending ? "Show All Orders" : "Show Only Pending"}
          </Button>
          <Button size="sm" variant="outline" onClick={toggleSortOrder}>
            {sortOrder === "newest" ? "Show Oldest First" : "Show Newest First"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2 mb-6 relative">
          <TabsTrigger value="table" className="relative">
            Table Orders
            {newOrders.table && (
              <span className="absolute -top-1 -right-1 h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="delivery" className="relative">
            Deliveries
            {newOrders.delivery && (
              <span className="absolute -top-1 -right-1 h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin h-8 w-8" />
          </div>
        ) : (
          <TabsContent value={activeTab}>
            <div className="space-y-4">
              {sortedOrders.length === 0 ? (
                <p className="text-gray-500">
                  No {activeTab === "table" ? "table orders" : "deliveries"}{" "}
                  found
                </p>
              ) : (
                sortedOrders.map((order) => {
                  const gstAmount = calculateGst(order.totalPrice);
                  const grandTotal = order.totalPrice + gstAmount;

                  return (
                    <div
                      key={order.id}
                      className="border rounded-lg p-4 relative"
                    >
                      {order.status === "pending" && (
                        <span className="absolute -top-1 -left-1 h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                      )}

                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">
                            Order #{order.id.slice(0, 8)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              order.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : order.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 flex justify-between">
                        <div>
                          {order.type === "table_order" && (
                            <p className="text-sm">
                              Table: {order.tableNumber || "N/A"}
                            </p>
                          )}
                          <p className="text-sm">
                            Customer:{" "}
                            {order.user?.phone || order.phone
                              ? `+91${order.user?.phone || order.phone}`
                              : "Unknown"}
                          </p>
                          {order.type === "delivery" && (
                            <p className="text-sm mt-3">
                              Delivery Address:{" "}
                              {order.deliveryAddress || "Unknown"}
                            </p>
                          )}
                        </div>
                        <p className="font-medium">
                          Total: {(userData as HotelData)?.currency}
                          {order?.totalPrice?.toFixed(2)}
                        </p>
                      </div>

                      <div className="mt-4 border-t pt-4">
                        <h4 className="font-medium mb-2">Order Items</h4>
                        <div className="space-y-2">
                          {order.items?.length ? (
                            order.items.map((item: OrderItem) => (
                              <div
                                key={item.id}
                                className="flex justify-between text-sm"
                              >
                                <div>
                                  <span className="font-medium">
                                    {item.name}
                                  </span>
                                  <span className="text-gray-500 ml-2">
                                    x{item.quantity}
                                  </span>
                                  {item.category && (
                                    <span className="text-gray-400 text-xs ml-2 capitalize">
                                      ({item.category.name.trim()})
                                    </span>
                                  )}
                                </div>
                                <span>
                                  {(userData as HotelData)?.currency}
                                  {(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm">
                              No items found
                            </p>
                          )}
                        </div>

                        <div className="mt-4 flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handlePrintKOT}
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Print KOT
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handlePrintBill}
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Print Bill
                          </Button>

                          {order.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setOrder(order);
                                  setEditOrderModalOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Order
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  updateOrderStatus(order.id, "completed")
                                }
                              >
                                Mark Completed
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  updateOrderStatus(order.id, "cancelled")
                                }
                              >
                                Cancel Order
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Hidden elements for printing */}
                      <div className="hidden">
                        {/* KOT Template */}
                        <KOTTemplate ref={kotRef} order={order} />

                        {/* Bill Template */}
                        <BillTemplate
                          ref={billRef}
                          order={order}
                          userData={userData as Partner}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      <EditOrderModal />
    </div>
  );
};

export default OrdersTab;
