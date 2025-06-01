"use client";
import { Partner, useAuthStore } from "@/store/authStore";
import useOrderStore, { Order } from "@/store/orderStore";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Howl } from "howler";
import { useRouter } from "next/navigation";
import { EditOrderModal } from "./pos/EditOrderModal";
import { usePOSStore } from "@/store/posStore";
import { getGstAmount } from "../hotelDetail/OrderDrawer";
import OrderItemCard from "./OrderItemCard";
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
import { revalidateTag } from "@/app/actions/revalidate";
import { update } from "firebase/database";

const OrdersTab = () => {
  const router = useRouter();
  const { userData, features } = useAuthStore();
  const prevOrdersRef = useRef<Order[]>([]);
  const {
    subscribeOrders,
    partnerOrders,
    deleteOrder,
    updateOrderStatus,
    updateOrderStatusHistory,
  } = useOrderStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"table" | "delivery" | "pos">(
    "delivery"
  );
  const [newOrders, setNewOrders] = useState({
    table: false,
    delivery: false,
    pos: false,
  });
  const [sortedOrders, setSortedOrders] = useState<Order[]>([]);
  const [newOrderAlert, setNewOrderAlert] = useState({
    show: false,
    tableCount: 0,
    deliveryCount: 0,
    posCount: 0,
  });
  const soundRef = useRef<Howl | null>(null);
  const { setOrder, setEditOrderModalOpen } = usePOSStore();

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

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const success = await deleteOrder(orderId);
      if (success) {
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order.id !== orderId)
        );
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

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: "pending" | "completed" | "cancelled"
  ) => {
    try {
      await updateOrderStatus(orders, orderId, status, setOrders);
      toast.success("Order status updated successfully");
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  const handleTabChange = (value: string) => {
    if (value === "table" || value === "delivery" || value === "pos") {
      setActiveTab(value);
      setNewOrders((prev) => ({ ...prev, [value]: false }));
      localStorage.setItem("ordersActiveTab", value);
    }
  };

  useEffect(() => {
    const filteredByTypeOrders = orders.filter((order) => {
      if (activeTab === "table") return order.type === "table_order";
      if (activeTab === "delivery") return order.type === "delivery";
      if (activeTab === "pos") return order.type === "pos";
      return false;
    });

    setSortedOrders(filteredByTypeOrders);
  }, [orders, activeTab]);

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

      const newPOSOrders = allOrders.filter(
        (order) =>
          order.status === "pending" &&
          order.type === "pos" &&
          !prevOrders.some((prevOrder) => prevOrder.id === order.id)
      );

      const totalNewOrders =
        newTableOrders.length + newDeliveryOrders.length + newPOSOrders.length;

      if (totalNewOrders > 0) {
        soundRef.current?.play();

        // Show alert dialog
        setNewOrderAlert({
          show: true,
          tableCount: newTableOrders.length,
          deliveryCount: newDeliveryOrders.length,
          posCount: newPOSOrders.length,
        });

        // Update new order indicators
        setNewOrders({
          table: newTableOrders.length > 0,
          delivery: newDeliveryOrders.length > 0,
          pos: newPOSOrders.length > 0,
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
    <div className="py-6 px-4 sm:px-[8%] max-w-7xl mx-auto">
      {/* New Order Alert Dialog */}
      <AlertDialog
        open={newOrderAlert.show}
        onOpenChange={(open) =>
          setNewOrderAlert((prev) => ({ ...prev, show: open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>New Orders Received!</AlertDialogTitle>
            <AlertDialogDescription>
              You have {newOrderAlert.tableCount} new table order(s),{" "}
              {newOrderAlert.deliveryCount} new delivery order(s), and{" "}
              {newOrderAlert.posCount} new POS order(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setNewOrderAlert({
                  show: false,
                  tableCount: 0,
                  deliveryCount: 0,
                  posCount: 0,
                });
                // Switch to the tab with most new orders
                const maxCount = Math.max(
                  newOrderAlert.tableCount,
                  newOrderAlert.deliveryCount,
                  newOrderAlert.posCount
                );
                if (newOrderAlert.tableCount === maxCount) {
                  setActiveTab("table");
                } else if (newOrderAlert.deliveryCount === maxCount) {
                  setActiveTab("delivery");
                } else {
                  setActiveTab("pos");
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
        <h2 className="text-2xl font-bold mb-4 sm:mb-0">Orders Management</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          {features?.pos.enabled && (
            <Button
              variant={"outline"}
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={handleCreateNewOrder}
            >
              Create New Order
            </Button>
          )}
          <Button 
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => router.push("/admin/orders/all")}
          >
            Show All Orders
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList
          className="flex w-full gap-1 mb-6 rounded-lg p-1 overflow-x-auto"
        >
          {features?.delivery.enabled && (
            <TabsTrigger value="delivery" className="relative flex-1 min-w-[100px] py-2">
              Deliveries
              {newOrders.delivery && (
                <span className="absolute -top-1 -right-1 h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="table" className="relative flex-1 min-w-[100px] py-2">
            Table Orders
            {newOrders.table && (
              <span className="absolute -top-1 -right-1 h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </TabsTrigger>
          {features?.pos.enabled && (
            <TabsTrigger value="pos" className="relative flex-1 min-w-[100px] py-2">
              POS Orders
              {newOrders.pos && (
                <span className="absolute -top-1 -right-1 h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin h-8 w-8" />
          </div>
        ) : (
          <>
            <TabsContent value="delivery">
              <div className="space-y-4">
                {sortedOrders.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg bg-gray-50">
                    <p className="text-gray-500">No deliveries found</p>
                  </div>
                ) : (
                  sortedOrders.map((order, index) => (
                    <OrderItemCard
                      gstAmount={getGstAmount(
                        order.items.reduce((sum, item) => {
                          return sum + item.price * item.quantity;
                        }, 0),
                        (userData as Partner)?.gst_percentage || 0
                      )}
                      grantTotal={order.totalPrice || 0}
                      key={`delivery-${order.id}-${index}`}
                      order={order}
                      deleteOrder={handleDeleteOrder}
                      updateOrderStatus={(status) => {
                        handleUpdateOrderStatus(order.id, status);
                      }}
                      setOrder={setOrder}
                      setEditOrderModalOpen={setEditOrderModalOpen}
                      gstPercentage={(userData as Partner)?.gst_percentage || 0}
                    />
                  ))
                )}
              </div>
            </TabsContent>
            <TabsContent value="table">
              <div className="space-y-4">
                {sortedOrders.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg bg-gray-50">
                    <p className="text-gray-500">No table orders found</p>
                  </div>
                ) : (
                  sortedOrders.map((order, index) => (
                    <OrderItemCard
                      key={`table-${order.id}-${index}`}
                      gstAmount={getGstAmount(
                        order.items.reduce((sum, item) => {
                          return sum + item.price * item.quantity;
                        }, 0),
                        (userData as Partner)?.gst_percentage || 0
                      )}
                      grantTotal={order.totalPrice || 0}
                      order={order}
                      deleteOrder={handleDeleteOrder}
                      updateOrderStatus={(status) => {
                        handleUpdateOrderStatus(order.id, status);
                      }}
                      setOrder={setOrder}
                      setEditOrderModalOpen={setEditOrderModalOpen}
                      gstPercentage={(userData as Partner)?.gst_percentage || 0}
                    />
                  ))
                )}
              </div>
            </TabsContent>
            <TabsContent value="pos">
              <div className="space-y-4">
                {sortedOrders.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg bg-gray-50">
                    <p className="text-gray-500">No POS orders found</p>
                  </div>
                ) : (
                  sortedOrders.map((order, index) => {
                    const gstPercentage =
                      (userData as Partner)?.gst_percentage || 0;
                    const foodSubtotal = order.items.reduce((sum, item) => {
                      return sum + item.price * item.quantity;
                    }, 0);
                    const gstAmount = getGstAmount(foodSubtotal, gstPercentage);
                    const totalPriceWithGst = foodSubtotal + gstAmount;
                    const extraChargesTotal = (
                      order?.extraCharges ?? []
                    ).reduce((acc, charge) => acc + charge.amount, 0);
                    const grandTotal = totalPriceWithGst + extraChargesTotal;

                    return (
                      <OrderItemCard
                        key={`pos-${order.id}-${index}`}
                        order={order}
                        deleteOrder={handleDeleteOrder}
                        updateOrderStatus={(status) => {
                          handleUpdateOrderStatus(order.id, status);
                        }}
                        setOrder={setOrder}
                        setEditOrderModalOpen={setEditOrderModalOpen}
                        gstPercentage={gstPercentage}
                        gstAmount={gstAmount}
                        grantTotal={grandTotal}
                      />
                    );
                  })
                )}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>

      <EditOrderModal />
    </div>
  );
};

export default OrdersTab;
