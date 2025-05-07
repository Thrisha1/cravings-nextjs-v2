"use client";
import { HotelData } from "@/app/hotels/[id]/page";
import { Styles } from "@/screens/HotelMenuPage_v2";
import HeadingWithAccent from "@/components/HeadingWithAccent";
import React, { useEffect, useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import Link from "next/link";
import { table } from "console";
import { usePathname } from "next/navigation";

export const getGstAmount = (price: number, gstPercentage: number) => {
  const gstAmount = (price * gstPercentage) / 100;
  return gstAmount;
};

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
  const {
    userAddress,
    order,
    items,
    orderId,
    totalPrice,
    placeOrder,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    setOpenAuthModal,
    clearOrder,
  } = useOrderStore();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isQrScan, setIsQrScan] = useState(false);

  useEffect(() => {
    if (pathname.includes("qrScan")) {
      setIsQrScan(true);
    }
  }, []);

  const getWhatsapLink = () => {
    const savedAddress = userAddress || "N/A";

    const whatsappMsg = `
*🍽️ Order Details 🍽️*

*Table:* ${tableNumber || "N/A"}
*Order ID:* ${orderId?.slice(0, 8) || "N/A"}
${tableNumber ? `*Table:* ${tableNumber}` : "Order Type : Delivery"}
${tableNumber ? "" : `*Delivery Address:* ${savedAddress}`}
*Time:* ${new Date().toLocaleTimeString()}

*📋 Order Items:*
  ${items
    ?.map(
      (item, index) =>
        `${index + 1}. ${item.name} (${item.category.name})
   ➤ Qty: ${item.quantity} × ${hotelData.currency}${item.price.toFixed(2)} = ${
          hotelData.currency
        }${(item.price * item.quantity).toFixed(2)}`
    )
    .join("\n\n")}

${
  hotelData?.gst_percentage
    ? `*GST (${hotelData.gst_percentage}%):* ${
        hotelData.currency
      }${getGstAmount(totalPrice as number, hotelData.gst_percentage).toFixed(
        2
      )}`
    : ""
}
${
  hotelData?.gst_percentage
    ? `*Subtotal:* ${hotelData.currency}${totalPrice}`
    : ""
}
${
  hotelData?.gst_percentage
    ? `*Total Price:* ${hotelData.currency}${(
        (totalPrice as number) +
        getGstAmount(totalPrice as number, hotelData.gst_percentage)
      ).toFixed(2)}`
    : `*Total Price:* ${hotelData.currency}${totalPrice}`
}
`;
    const number =
      hotelData?.whatsapp_number || hotelData?.phone || "8590115462";

    const whatsappUrl = `https://api.whatsapp.com/send?phone=+91${number}&text=${encodeURIComponent(
      whatsappMsg
    )}`;

    return whatsappUrl;
  };

  const handlePlaceOrder = async () => {
    setIsLoading(true);

    try {
      const result = await placeOrder(hotelData, tableNumber, qrId);
      if (result) {
        toast.success("Order placed successfully!");
        clearOrder();
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

  const handleViewOrder = () => {
    if (!isQrScan && !userAddress) {
      setOpenAuthModal(true);
      return;
    }

    setIsOpen(true);
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      {/* Bottom bar */}
      <div
        style={{
          ...styles.border,
        }}
        className="fixed bottom-0 z-[51] bg-white text-black w-full px-[8%] py-6 rounded-t-[35px] bottom-bar-shadow flex items-center justify-between"
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
            <div
              onClick={handleViewOrder}
              style={{
                color: styles.accent,
              }}
              className="font-black"
            >
              View Order
            </div>
          </div>
        ) : (
          <>
            <div className="z-[51]">
              <div className="flex gap-2 items-center font-black text-xl ">
                <div>PRICE : </div>
                <div style={{ color: styles.accent }}>
                  {hotelData.currency}
                  {totalPrice}
                </div>
              </div>
              <div className="flex gap-2 items-center text-sm text-black/70">
                <div>Items :</div>
                <div>{items?.length}</div>
              </div>
            </div>

            <div
              onClick={handleViewOrder}
              style={{
                color: styles.accent,
              }}
              className="font-black relative"
            >
              View Order
            </div>
          </>
        )}
      </div>

      <DrawerContent className="max-h-[80vh] z-[52]">
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
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[50%] font-semibold text-sm text-gray-500">
                  ITEM
                </TableHead>
                <TableHead className="text-right font-semibold text-sm text-gray-500">
                  PRICE
                </TableHead>
                <TableHead className="text-center font-semibold text-sm text-gray-500">
                  QTY
                </TableHead>
                <TableHead className="text-right font-semibold text-sm text-gray-500">
                  TOTAL
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items || []).map((item) => (
                <TableRow
                  key={`order-item-${item.id}`}
                  className="hover:bg-transparent border-b border-gray-100"
                >
                  <TableCell className="font-medium py-3">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    {hotelData.currency}
                    {item.price}
                  </TableCell>
                  <TableCell className="text-center py-3">
                    {order ? (
                      item.quantity
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            if (item.quantity > 1) {
                              decreaseQuantity(item.id as string);
                            } else {
                              removeItem(item.id as string);
                            }
                          }}
                          className="w-6 h-6 rounded-full flex items-center justify-center border"
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => increaseQuantity(item.id as string)}
                          className="w-6 h-6 rounded-full flex items-center justify-center border"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    {hotelData.currency}
                    {(item.price * item.quantity).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DrawerFooter className="border-t">
          {hotelData?.gst_percentage ? (
            <>
              <div className="flex justify-between items-center mb-4 text-sm">
                <span className="font-bold">Total:</span>
                <span
                  className="font-bold"
                  style={{ color: styles.accent }}
                >
                  {hotelData.currency}
                  {(order?.totalPrice ?? totalPrice ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold">{`Grand Total (+ GST (${hotelData.gst_percentage}%)):`}</span>
                <span
                  className="font-bold text-lg"
                  style={{ color: styles.accent }}
                >
                  {hotelData.currency}
                  {(
                    getGstAmount(
                      order?.totalPrice ?? totalPrice ?? 0,
                      hotelData.gst_percentage
                    ) +
                    (order?.totalPrice ?? totalPrice ?? 0)
                  ).toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold">Grand Total:</span>
                <span
                  className="font-bold text-lg"
                  style={{ color: styles.accent }}
                >
                  {hotelData.currency}
                  {(order?.totalPrice ?? totalPrice ?? 0).toFixed(2)}
                </span>
              </div>
            </>
          )}

          {!order ? (
            <>
              <Link
                href={getWhatsapLink()}
                onClick={handlePlaceOrder}
                target="_blank"
                // onClick={handlePlaceOrder}
                style={{ backgroundColor: styles.accent }}
                className="flex-1 active:brightness-75 text-white font-bold text-center py-3 px-5 rounded-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>Place Order</>
                )}
              </Link>
            </>
          ) : (
            <>
              <div className="w-full text-center text-sm text-gray-500">
                Your order has been placed. Please wait for confirmation.
              </div>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default OrderDrawer;
