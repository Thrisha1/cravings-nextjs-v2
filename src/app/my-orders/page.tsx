"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useAuthStore } from "@/store/authStore";
import { usePOSStore } from "@/store/posStore";
import { toast } from "sonner";
import useOrderStore from "@/store/orderStore";
import { EditOrderModal } from "@/components/admin/pos/EditOrderModal";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { cancelOrderMutation } from "@/api/orders";

const Page = () => {
  const { userData } = useAuthStore();
  const { userOrders, subscribeUserOrders } = useOrderStore();
  const { setOrder, setEditOrderModalOpen } = usePOSStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.id) {
      const unsubscribe = subscribeUserOrders((orders) => {
        setLoading(false);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [userData]);

  const handleEditOrder = (order: any) => {
    setOrder({
      id: order.id,
      totalPrice: order.totalPrice,
      tableNumber: order.tableNumber,
      phone: order.phone,
      items: order.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
      })),
      createdAt: order.createdAt,
      status: order.status,
      partnerId: order.partnerId,
    });
    setEditOrderModalOpen(true);
  };

  const handleCancelOrder = async (orderId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );
    if (!confirmed) return;

    try {
      await fetchFromHasura(cancelOrderMutation, {
        orderId
      });

      toast.success("Order cancelled successfully");
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Failed to cancel order");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : userOrders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          You haven't placed any orders yet.
        </div>
      ) : (
        <div className="space-y-6">
          {userOrders.map((order) => (
            <div
              key={order.id}
              className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">
                    Order #{order.id.split("-")[0]}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(order.createdAt), "PPPp")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      order.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : order.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>
                  {order.status === "pending" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditOrder(order)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-3">
                {order.tableNumber && (
                  <p className="text-sm">
                    <span className="font-medium">Table:</span>{" "}
                    {order.tableNumber}
                  </p>
                )}
                {order.phone && (
                  <p className="text-sm">
                    <span className="font-medium">Phone:</span> {order.phone}
                  </p>
                )}
                {order.deliveryAddress && (
                  <p className="text-sm">
                    <span className="font-medium">Address:</span>{" "}
                    {order.deliveryAddress}
                  </p>
                )}
              </div>

              <div className="border-t pt-3">
                <h4 className="font-medium mb-2">Items</h4>
                <ul className="space-y-2">
                  {order.items.map((item: any) => (
                    <li key={item.id} className="flex justify-between">
                      <span>
                        {item.quantity} × {item.name}
                      </span>
                      <span>
                        {/* {order.partner?.currency || "$"} */}
                        {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-3 flex justify-between font-medium">
                <span>Total</span>
                <span>
                  {/* {order.user?.partner?.currency || "$"} */}
                  {order.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <EditOrderModal />
    </div>
  );
};

export default Page;
