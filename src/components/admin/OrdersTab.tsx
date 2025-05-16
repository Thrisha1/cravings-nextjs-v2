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
import { getExtraCharge, getGstAmount } from "../hotelDetail/OrderDrawer";
import OrderItemCard from "./OrderItemCard";
import { QrGroup } from "@/app/qr-management/page";
import TodaysEarnings from "./orders/TodaysEarnings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const OrdersTab = () => {
  const router = useRouter();
  const { userData, features } = useAuthStore();
  const prevOrdersRef = useRef<Order[]>([]);
  const { subscribeOrders, partnerOrders, deleteOrder } = useOrderStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyPending, setShowOnlyPending] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("oldest");
  const [activeTab, setActiveTab] = useState<"table" | "delivery">("table");
  const [newOrders, setNewOrders] = useState({ table: false, delivery: false });
  const [sortedOrders, setSortedOrders] = useState<Order[]>([]);
  const [newOrderAlert, setNewOrderAlert] = useState({
    show: false,
    tableCount: 0,
    deliveryCount: 0,
  });
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

    if (storedFilter === "all") {
      setShowOnlyPending(false);
    } else {
      setShowOnlyPending(true);
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

      // Count new pending orders
      const newTableOrders = allOrders.filter(
        (order) =>
          order.status === "pending" &&
          order.type === "table_order" &&
          !prevOrders.some((prevOrder) => prevOrder.id === order.id)
      );

      const newDeliveryOrders = allOrders.filter(
        (order) =>
          order.status === "pending" &&
          order.type === "delivery" &&
          !prevOrders.some((prevOrder) => prevOrder.id === order.id)
      );

      const totalNewOrders = newTableOrders.length + newDeliveryOrders.length;

      if (totalNewOrders > 0) {
        soundRef.current?.play();
        
        // Show alert dialog
        setNewOrderAlert({
          show: true,
          tableCount: newTableOrders.length,
          deliveryCount: newDeliveryOrders.length,
        });

        // Update new order indicators
        setNewOrders({
          table: newTableOrders.length > 0,
          delivery: newDeliveryOrders.length > 0,
        });

      }

      prevOrdersRef.current = allOrders;
    });

    return () => {
      unsubscribe();
    };
  }, [userData?.id]);

  const handleCreateNewOrder = () => {
    router.push("/admin/pos");
  };

  return (
    <div className="py-10 px-[8%]">
      {/* New Order Alert Dialog */}
      <AlertDialog
        open={newOrderAlert.show}
        onOpenChange={(open) => setNewOrderAlert(prev => ({...prev, show: open}))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>New Orders Received!</AlertDialogTitle>
            <AlertDialogDescription>
              You have {newOrderAlert.tableCount} new table order(s) and{" "}
              {newOrderAlert.deliveryCount} new delivery order(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setNewOrderAlert({ show: false, tableCount: 0, deliveryCount: 0 });
                // Switch to the tab with most new orders
                if (newOrderAlert.tableCount > newOrderAlert.deliveryCount) {
                  setActiveTab("table");
                } else if (newOrderAlert.deliveryCount > 0) {
                  setActiveTab("delivery");
                }
              }}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TodaysEarnings orders={orders} />
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
                sortedOrders.map((order, index) => {
                  const gstPercentage =
                    (userData as Partner)?.gst_percentage || 0;

                  const foodSubtotal = order.items.reduce((sum, item) => {
                    return sum + item.price * item.quantity;
                  }, 0);

                  const gstAmount = getGstAmount(foodSubtotal, gstPercentage);
                  const totalPriceWithGst = foodSubtotal + gstAmount;

                  const extraChargesTotal = (order?.extraCharges ?? []).reduce(
                    (acc, charge) =>
                      acc +
                        getExtraCharge(
                          order?.items || [],
                          charge.amount,
                          charge.charge_type as QrGroup["charge_type"]
                        ) || 0,
                    0
                  );
                  const grandTotal = totalPriceWithGst + extraChargesTotal;

                  return (
                    <OrderItemCard
                      deleteOrder={deleteOrder}
                      key={order.id + "-" + index}
                      grantTotal={grandTotal}
                      gstAmount={gstAmount}
                      gstPercentage={gstPercentage}
                      order={order}
                      setEditOrderModalOpen={setEditOrderModalOpen}
                      setOrder={setOrder}
                      updateOrderStatus={updateOrderStatus}
                    />
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