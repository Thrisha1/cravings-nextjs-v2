"use client";
import { useAuthStore } from "@/store/authStore";
import useOrderStore, { Order, OrderItem } from "@/store/orderStore";
import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { Partner } from "@/api/partners";
import { HotelData } from "@/app/hotels/[id]/page";

const OrdersTab = () => {
  const { userData } = useAuthStore();
  const { fetchOrderOfPartner } = useOrderStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOnlyPending, setShowOnlyPending] = useState<boolean>(false);

  useEffect(() => {
    const storedFilter = localStorage.getItem("ordersFilter");
    if (storedFilter === "pending") {
      setShowOnlyPending(true);
    } else {
      setShowOnlyPending(false);
    }
  }, []);

  const loadOrders = async () => {
    if (!userData?.id) return;

    setLoading(true);
    try {
      const partnerOrders = await fetchOrderOfPartner(userData.id);
      if (partnerOrders) {
        setOrders(partnerOrders);
      }
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

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
      toast.error(`Failed to update order status`);
    }
  };

  const togglePendingFilter = () => {
    const newValue = !showOnlyPending;
    setShowOnlyPending(newValue);
    localStorage.setItem("ordersFilter", newValue ? "pending" : "all");
  };

  const filteredOrders = showOnlyPending
    ? orders.filter((order) => order.status === "pending")
    : orders;

  useEffect(() => {
    loadOrders();
  }, [userData?.id]);

  return (
    <div className="py-10 px-[8%]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Orders Management</h2>
        <Button size="sm" onClick={togglePendingFilter}>
          {showOnlyPending ? "Show All Orders" : "Show Only Pending"}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-8 w-8" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <p className="text-gray-500">No orders found</p>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">
                      Order #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
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
                      Customer:+91{order.user?.phone || "Unknown"}
                    </p>
                    {order.type === "delivery" && (
                      <p className="text-sm mt-3">
                        Delivery Address: {order.deliveryAddress || "Unknown"}
                      </p>
                    )}
                  </div>
                  <p className="font-medium">
                    Total: {(userData as HotelData)?.currency}
                    {order.totalPrice.toFixed(2)}
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
                            <span className="font-medium">{item.name}</span>
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
                      <p className="text-gray-500 text-sm">No items found</p>
                    )}
                  </div>

                  {order.status === "pending" && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, "completed")}
                      >
                        Mark Completed
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateOrderStatus(order.id, "cancelled")}
                      >
                        Cancel Order
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
