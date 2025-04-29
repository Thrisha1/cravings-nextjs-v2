"use client";
import { HotelData } from "@/app/hotels/[id]/page";
import { Styles } from "@/screens/HotelMenuPage_v2";
import HeadingWithAccent from "@/components/HeadingWithAccent";
import React, { useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "../ui/button";
import useOrderStore from "@/store/orderStore";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";

const OrderDrawer = ({
  styles,
  hotelData,
  tableNumber,
  qrId,
}: {
  styles: Styles;
  hotelData: HotelData;
  tableNumber?: number;
  qrId?: string;
}) => {
  const { order, items, totalPrice, placeOrder , clearCart } = useOrderStore();
  const [isLoading, setIsLoading] = useState(false);

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    try {
      const result = await placeOrder(hotelData);
      if (result) {
        toast.success("Order placed successfully!");
        const whtasppMsg = `
        *Order Details:*
        *Hotel:* ${hotelData.name}
        *Table Number:* ${tableNumber || "N/A"}
        *Order ID:* ${result.id}
        *Items:*
        ${items
          .map(
            (item) =>
              `- ${item.name} (Qty: ${item.quantity}) - ${hotelData.currency}${(
                item.price * item.quantity
              ).toFixed(2)}`
          )
          .join("\n")}
        *Total Price:* ${hotelData.currency}${result.totalPrice.toFixed(2)}
        *Created At:* ${new Date(result.createdAt).toLocaleString()}`;
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${hotelData.phone}&text=${encodeURIComponent(
          whtasppMsg
        )}`;
        window.open(whatsappUrl, "_blank");
      } else {
        toast.error("Failed to place order. Please try again.");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer>
      {/* Bottom bar */}
      <div
        style={{
          ...styles.border,
        }}
        className="fixed bottom-0 z-[40] bg-white text-black w-full px-[8%] py-6 rounded-t-[35px] bottom-bar-shadow flex items-center justify-between"
      >
        {order ? (
          <div className="flex items-center gap-4 w-full justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle
                style={{ color: styles.accent }}
                className="w-5 h-5"
              />
              <span className="font-medium">Order #{order.id.slice(0, 8)}</span>
            </div>
            <DrawerTrigger
              style={{
                color: styles.accent,
              }}
              className="font-black"
            >
              View Order
            </DrawerTrigger>
          </div>
        ) : (
          <>
            <div>
              <div className="flex gap-2 items-center font-black text-xl">
                <div>PRICE : </div>
                <div style={{ color: styles.accent }}>
                  {hotelData.currency}
                  {totalPrice}
                </div>
              </div>
              <div className="flex gap-2 items-center text-sm text-black/70">
                <div>Items :</div>
                <div>{items.length}</div>
              </div>
            </div>

            <DrawerTrigger
              style={{
                color: styles.accent,
              }}
              className="font-black"
            >
              View Order
            </DrawerTrigger>
          </>
        )}
      </div>

      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle>
            <HeadingWithAccent
              accent={styles.accent}
              className="font-black text-xl tracking-wide"
            >
              {order ? "Order Details" : "Your Order"}
            </HeadingWithAccent>
          </DrawerTitle>
          <DrawerDescription>
            {order
              ? `Order #${order.id.slice(0, 8)} - ${order.status}`
              : "Review your items before placing order"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-12 gap-2 mb-2 font-semibold text-sm text-gray-500">
            <div className="col-span-6">ITEM</div>
            <div className="col-span-2 text-right">PRICE</div>
            <div className="col-span-2 text-center">QTY</div>
            <div className="col-span-2 text-right">TOTAL</div>
          </div>

          {(order ? order.items : items).map((item) => (
            <div
              key={`order-item-${item.id}`}
              className="grid grid-cols-12 gap-2 py-3 border-b border-gray-100 items-center"
            >
              <div className="col-span-6 font-medium">{item.name}</div>
              <div className="col-span-2 text-right">
                {hotelData.currency}
                {item.price}
              </div>
              <div className="col-span-2 text-center">{item.quantity}</div>
              <div className="col-span-2 text-right">
                {hotelData.currency}
                {(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <DrawerFooter className="border-t">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold">Grand Total:</span>
            <span
              className="font-bold text-lg"
              style={{ color: styles.accent }}
            >
              {hotelData.currency}
              {(order ? order.totalPrice : totalPrice).toFixed(2)}
            </span>
          </div>

          {!order ? (
            <Button
              onClick={handlePlaceOrder}
              style={{ backgroundColor: styles.accent }}
              className="flex-1 active:brightness-75"
              disabled={items.length === 0 || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                "Place Order"
              )}
            </Button>
          ) : (
            <div className="w-full text-center text-sm text-gray-500">
              Your order has been placed. Please wait for confirmation.
            </div>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default OrderDrawer;
