"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Trash2,
  ExternalLink,
  Phone,
} from "lucide-react";
import { format } from "date-fns";
import { Partner, useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import useOrderStore from "@/store/orderStore";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { cancelOrderMutation } from "@/api/orders";
import { getGstAmount } from "@/components/hotelDetail/OrderDrawer";
import Link from "next/link";
import { getExtraCharge } from "@/lib/getExtraCharge";
import { getStatusDisplay } from "@/lib/getStatusDisplay";

const Page = () => {
  const { userData } = useAuthStore();
  const { userOrders, subscribeUserOrders } = useOrderStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.id) {
      const unsubscribe = subscribeUserOrders(() => {
        setLoading(false);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [userData]);

  const handleCancelOrder = async (orderId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );
    if (!confirmed) return;

    try {
      await fetchFromHasura(cancelOrderMutation, {
        orderId,
      });
      toast.success("Order cancelled successfully");
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Failed to cancel order");
    }
  };



  const getPaymentStatusDisplay = (paymentStatus?: string) => {
    switch (paymentStatus) {
      case "completed":
        return { text: "Paid", className: "bg-green-100 text-green-800" };
      case "failed":
        return { text: "Payment Failed", className: "bg-red-100 text-red-800" };
      case "cancelled":
        return { text: "Payment Cancelled", className: "bg-gray-100 text-gray-800" };
      case "pending":
      default:
        return { text: "Payment Pending", className: "bg-yellow-100 text-yellow-800" };
    }
  };

  const handleCallRestaurant = (order: any) => {
    const partner = order.partner as Partner;
    console.log("partner",partner)
    if (!partner) return;
    
    let phoneNumber = '';
    const countryCode = partner.country_code || '+91';
    console.log("countryCode",countryCode)


    // Check if there are WhatsApp numbers first
    if (partner.whatsapp_numbers && partner.whatsapp_numbers.length > 0) {
      phoneNumber = partner.whatsapp_numbers[0].number;
    } else if (partner.phone) {
      phoneNumber = partner.phone;
    }

    if (phoneNumber) {
      console.log("phoneNumber",phoneNumber)
      const fullNumber = `${countryCode}${phoneNumber}`;
      window.open(`tel:${fullNumber}`, '_self');
    } else {
      toast.error("Restaurant phone number not available");
    }
  };

  return (
    <div className="container mx-auto sm:px-4 px-2 py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : userOrders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          You haven&apos;t placed any orders yet.
        </div>
      ) : (
        <div className="space-y-6">
          {userOrders.map((order, index) => {
            const gstPercentage =
              (order.partner as Partner)?.gst_percentage || 0;
            const foodTotal = (order.items || []).reduce(
              (sum: number, item: any) => sum + item.price * item.quantity,
              0
            );
            const gstAmount = getGstAmount(foodTotal, gstPercentage);
            const extraChargesTotal =
              (order.extraCharges || []).reduce(
                (sum: number, charge: any) =>
                  sum +
                    getExtraCharge(
                      order?.items || [],
                      charge.amount,
                      charge.charge_type
                    ) || 0,
                0
              ) || 0;

            const grandTotal = foodTotal + extraChargesTotal + gstAmount;
            const statusDisplay = getStatusDisplay(order);

            if (index == 0) {
              console.log("Order Data:", order);
            }

            return (
              <div
                id={`order-${order.id}`}
                key={order.id}
                className="border rounded-lg sm:p-4 p-2 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-xs text-gray-500">
                      Order Id : #{order.id.split("-")[0]}
                    </h3>
                    <h3 className="font-medium">
                      Store : {order.partner?.store_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(order.createdAt), "PPPp")}
                    </p>
                  </div>
                  <div className="flex justify-end items-center gap-2 flex-wrap">
                    <Link
                      href={`/order/${order.id}`}
                      className={`px-2 py-1 rounded-full font-medium text-xs bg-blue-500 text-white flex items-center gap-1`}
                    >
                      <ExternalLink className="inline mr-1 w-4 h-4" />
                      <span>Track</span>
                    </Link>
                    <button
                      onClick={() => handleCallRestaurant(order)}
                      className="px-2 py-1 rounded-full font-medium text-xs bg-green-500 text-white flex items-center gap-1 hover:bg-green-600 transition-colors"
                    >
                      <Phone className="inline mr-1 w-4 h-4" />
                      <span>Call</span>
                    </button>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${statusDisplay.className}`}
                    >
                      {statusDisplay.text}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getPaymentStatusDisplay(order.payment_status).className}`}
                    >
                      {getPaymentStatusDisplay(order.payment_status).text}
                    </span>
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
                      <span className="font-medium">Delivery Address:</span>{" "}
                      {order.deliveryAddress}
                    </p>
                  )}

                  {order.delivery_location && (
                    <p className="text-sm">
                      {/* <span className="font-medium">Delivery Location:</span>{" "} */}
                      <a
                        className="text-blue-500 hover:underline"
                        href={`https://www.google.com/maps?q=${order.delivery_location.coordinates[1]},${order.delivery_location.coordinates[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Location
                      </a>
                    </p>
                  )}

                  {order.notes && (
                    <p className="text-sm text-orange-500 mt-2">
                      Notes : {order.notes}
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
                          {(order.partner as Partner)?.currency || "$"}
                          {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {(order?.extraCharges || []).length > 0 && (
                  <div className="border-t pt-3">
                    <h4 className="font-medium mb-2">Extra Charges</h4>
                    <ul className="space-y-2">
                      {(order?.extraCharges || []).map(
                        (charge: any, index: number) => (
                          <li key={index} className="flex justify-between">
                            <span>{charge.name}</span>
                            <span>
                              {(order.partner as Partner)?.currency || "$"}
                              {getExtraCharge(
                                order?.items || [],
                                charge.amount,
                                charge.charge_type
                              ).toFixed(2)}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                <div className="border-t pt-3 space-y-2">
                  {gstPercentage > 0 && (
                    <div className="flex justify-between">
                      <span>GST ({gstPercentage}%):</span>
                      <span>
                        {(order.partner as Partner)?.currency || "$"}
                        {gstAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold">
                    <span>Grand Total:</span>
                    <span>
                      {(order.partner as Partner)?.currency || "$"}
                      {grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 mt-4">
                  {order.status === "pending" && (
                    <>
                      {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditOrder(order)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button> */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Page;
