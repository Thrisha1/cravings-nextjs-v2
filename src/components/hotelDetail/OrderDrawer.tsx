"use client";
import { HotelData } from "@/app/hotels/[...id]/page";
import { FeatureFlags, Styles } from "@/screens/HotelMenuPage_v2";
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
import useOrderStore, { OrderItem } from "@/store/orderStore";
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
import { log, table } from "console";
import { usePathname } from "next/navigation";
import { getFeatures } from "@/lib/getFeatures";
import { QrGroup } from "@/app/admin/qr-management/page";

export const getGstAmount = (price: number, gstPercentage: number) => {
  const gstAmount = (price * gstPercentage) / 100;
  return gstAmount;
};

export const getExtraCharge = (
  items: OrderItem[], 
  extraCharge: number, 
  chargeType: 'PER_ITEM' | 'FLAT_FEE'
) => {
  if (!extraCharge || extraCharge <= 0) return 0;
  if (items.length === 0) return 0;

  if (chargeType === 'PER_ITEM') {
    const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
    return totalQuantity * extraCharge;
  } else {
    // For FLAT_FEE, we just return the extra charge once
    return extraCharge;
  }
};

const OrderDrawer = ({
  styles,
  hotelData,
  tableNumber,
  qrId,
  qrGroup,
}: {
  styles: Styles;
  hotelData: HotelData;
  tableNumber?: number;
  qrId?: string;
  qrGroup?: QrGroup | null;
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
    open_order_drawer,
    setOpenOrderDrawer,
  } = useOrderStore();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [isQrScan, setIsQrScan] = useState(false);
  const [featrues, setFeatures] = useState<FeatureFlags | null>(null);

  useEffect(() => {
    if (hotelData) {
      console.log("User Data:", hotelData?.role, hotelData?.feature_flags);
      const feature = getFeatures(hotelData?.feature_flags as string);
      setFeatures(feature);
    }
  }, [hotelData]);

  useEffect(() => {
    if (pathname.includes("qrScan")) {
      setIsQrScan(true);
    }
  }, []);

  const calculateGrandTotal = () => {
    const baseTotal = order?.totalPrice ?? totalPrice ?? 0;
    let grandTotal = baseTotal;

    // Add GST if applicable
    if (hotelData?.gst_percentage) {
      grandTotal += getGstAmount(baseTotal, hotelData.gst_percentage);
    }

    const extraChargeTotal = getExtraCharge(
      items || [],
      qrGroup?.extra_charge || 0,
      qrGroup?.charge_type || "FLAT_FEE"
    );
    grandTotal += extraChargeTotal;

    return grandTotal.toFixed(2);
  };

  const getWhatsapLink = () => {
    const savedAddress = userAddress || "N/A";
    const selectedWhatsAppNumber = localStorage?.getItem(
      `hotel-${hotelData.id}-whatsapp-area`
    );

  const whatsappMsg = `
  *🍽️ Order Details 🍽️*
  
  *Order ID:* ${orderId?.slice(0, 8) || "N/A"}
  ${(tableNumber ?? 0) > 0 ? `*Table:* ${tableNumber}` : "*Order Type:* Delivery"}
  ${(tableNumber ?? 0) > 0 ? "" : `*Delivery Address:* ${savedAddress}`}
  *Time:* ${new Date().toLocaleTimeString()}
  
  *📋 Order Items:*
    ${items
        ?.map(
          (item, index) =>
            `${index + 1}. ${item.name} (${item.category.name})
     ➤ Qty: ${item.quantity} × ${hotelData.currency}${item.price.toFixed(
              2
            )} = ${hotelData.currency}${(item.price * item.quantity).toFixed(2)}`
        )
        .join("\n\n")}
  
  ${hotelData?.gst_percentage
        ? `*GST (${hotelData.gst_percentage}%):* ${hotelData.currency
        }${getGstAmount(totalPrice as number, hotelData.gst_percentage).toFixed(
          2
        )}`
      : ""
  }
  ${
    qrGroup?.extra_charge
      ? `*${qrGroup.name} :* ${hotelData.currency}${getExtraCharge(
          items || [],
          qrGroup?.extra_charge,
          qrGroup?.charge_type || "FLAT_FEE"
        ).toFixed(2)}`
      : ""
  }
  ${
    hotelData?.gst_percentage || qrGroup?.extra_charge
      ? `*Subtotal:* ${hotelData.currency}${totalPrice}`
      : ""
  }
  *Total Price:* ${hotelData.currency}${calculateGrandTotal()}
  `;

    const number =
      selectedWhatsAppNumber ||
      hotelData?.whatsapp_numbers[0]?.number ||
      hotelData?.phone ||
      "8590115462";

    const whatsappUrl = `https://api.whatsapp.com/send?phone=+91${number}&text=${encodeURIComponent(
      whatsappMsg
    )}`;

    return whatsappUrl;
  };

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    try {
      const extraCharge = {
        amount: qrGroup?.extra_charge,
        name: qrGroup?.name,
        charge_type: qrGroup?.charge_type,
      };

      const gstAmount = getGstAmount(
        totalPrice as number,
        hotelData?.gst_percentage as number
      );

      const result = await placeOrder(
        hotelData,
        tableNumber,
        qrId,
        gstAmount,
        extraCharge
      );
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
    const hotelArea = localStorage.getItem(
      `hotel-${hotelData.id}-whatsapp-area`
    );
    const needsAddress = !isQrScan && !userAddress;
    const needsWhatsAppArea = featrues?.multiwhatsapp.enabled && !hotelArea;

    if (needsAddress || needsWhatsAppArea) {
      setOpenAuthModal(true);
      return;
    }

    setOpenOrderDrawer(true);
  };

  return (
    <Drawer open={open_order_drawer} onOpenChange={setOpenOrderDrawer}>
      <div
        style={{
          ...styles.border,
        }}
        className="fixed bottom-0 z-[51] left-1/2 -translate-x-1/2 lg:max-w-[50%] bg-white text-black w-full px-[8%] py-6 rounded-t-[35px] bottom-bar-shadow flex items-center justify-between"
      >
        <>
          <div className="z-[51]">
            <div className="flex gap-2 items-center font-black text-xl ">
              <div>PRICE : </div>
              <div style={{ color: styles.accent }}>
                {hotelData.currency}
                {calculateGrandTotal() || 0}
              </div>
            </div>
            <div className="flex gap-2 items-center text-sm text-black/70">
              <div>Items :</div>
              <div>{items?.length}</div>
            </div>
          </div>

          <div className="flex gap-3">
            <div
              onClick={handleViewOrder}
              style={{
                color: styles.accent,
              }}
              className="font-black relative"
            >
              View Order
            </div>
          </div>
        </>
      </div>

      <DrawerContent className="max-h-[80vh] z-[52] lg:max-w-[50%] mx-auto">
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
          {hotelData?.gst_percentage || qrGroup?.extra_charge ? (
            <>
              <div className="flex justify-between items-center mb-2 text-sm">
                <span className="font-bold">Subtotal:</span>
                <span className="font-bold">
                  {hotelData.currency}
                  {(order?.totalPrice ?? totalPrice ?? 0).toFixed(2)}
                </span>
              </div>

              {hotelData?.gst_percentage !== 0 && (
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span className="font-bold">{`GST (${hotelData.gst_percentage}%):`}</span>
                  <span className="font-bold">
                    {hotelData.currency}
                    {getGstAmount(
                      order?.totalPrice ?? totalPrice ?? 0,
                      hotelData?.gst_percentage ?? 0
                    ).toFixed(2)}
                  </span>
                </div>
              )}

              {qrGroup?.extra_charge && (
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span className="font-bold">{`${qrGroup.name} Charge:`}</span>
                  <span className="font-bold">
                    {hotelData.currency}
                    {getExtraCharge(items || [], qrGroup?.extra_charge , qrGroup?.charge_type).toFixed(
                      2
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center mt-4">
                <span className="font-bold text-lg">Grand Total:</span>
                <span
                  className="font-bold text-lg"
                  style={{ color: styles.accent }}
                >
                  {hotelData.currency}
                  {calculateGrandTotal()}
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

          <>
            {items && items.length > 0 && (
              <>
                {!order ? (
                  <>
                    <Link
                      href={getWhatsapLink()}
                      onClick={handlePlaceOrder}
                      target="_blank"
                      style={{ backgroundColor: styles.accent }}
                      className="flex-1 flex items-center justify-center gap-2 active:brightness-75 text-white font-bold text-center py-3 px-5 rounded-lg"
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
              </>
            )}
          </>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default OrderDrawer;
