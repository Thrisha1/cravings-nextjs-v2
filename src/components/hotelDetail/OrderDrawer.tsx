"use client";
import { HotelData } from "@/app/hotels/[...id]/page";
import { Styles } from "@/screens/HotelMenuPage_v2";
import HeadingWithAccent from "@/components/HeadingWithAccent";
import React, { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import useOrderStore, { OrderItem } from "@/store/orderStore";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FeatureFlags, getFeatures } from "@/lib/getFeatures";
import { QrGroup, PricingRule } from "@/app/admin/qr-management/page";
import PlaceOrderModal from "./placeOrder/PlaceOrderModal";
import { getExtraCharge } from "@/lib/getExtraCharge";

export const getGstAmount = (price: number, gstPercentage: number) => {
  return (price * gstPercentage) / 100;
};

export const calculateDeliveryDistanceAndCost = async (
  hotelData: HotelData
) => {
  const { setDeliveryInfo } = useOrderStore.getState();



  try {



    const userCoordsStr = localStorage.getItem("user-location-store");
    if (!userCoordsStr) return;

    const userLocationData = JSON.parse(userCoordsStr);
    if (
      !userLocationData.state?.coords ||
      typeof userLocationData.state.coords.lng !== "number" ||
      typeof userLocationData.state.coords.lat !== "number"
    ) {
      return;
    }

    const restaurantCoords = hotelData?.geo_location?.coordinates;
    const restaurantCoords = hotelData?.geo_location?.coordinates;
    const userLocation = [
      userLocationData.state.coords.lng,
      userLocationData.state.coords.lat,
    ];

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) return;

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.join(
      ","
    )};${restaurantCoords.join(",")}?access_token=${mapboxToken}`;

    const response = await fetch(url);
    const data = await response.json();

    

    

    if (!data.routes || data.routes.length === 0) return;

    const exactDistance = data.routes[0].distance / 1000;
    const distanceInKm = Math.ceil(exactDistance);
    const deliveryRate = hotelData?.delivery_rate;
    const deliveryRate = hotelData?.delivery_rate;

    const { delivery_radius, first_km_range, is_fixed_rate } =
      hotelData?.delivery_rules || {};

    if (delivery_radius && distanceInKm > delivery_radius) {
      setDeliveryInfo({
        distance: distanceInKm,
        cost: 0,
        ratePerKm: deliveryRate,
        isOutOfRange: true,
      });  
     
  
      });  
     
  
      return;
    }

    let calculatedCost = 0;

    if (is_fixed_rate) {
      calculatedCost = deliveryRate;
    } else {
      if (first_km_range?.km > 0) {
        if (distanceInKm <= first_km_range.km) {
          calculatedCost = first_km_range.rate;
        } else {
          const remainingDistance = distanceInKm - first_km_range.km;
          calculatedCost =
            first_km_range.rate + remainingDistance * deliveryRate;
        }
      } else {
        calculatedCost = distanceInKm * deliveryRate;
      }
    }

    calculatedCost = Math.max(0, calculatedCost);


    setDeliveryInfo({
      distance: distanceInKm,
      cost: calculatedCost,
      ratePerKm: deliveryRate,
      isOutOfRange: false,
    });
  } catch (error) {
    console.error("Error calculating delivery distance:", error);
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
    increaseQuantity,
    decreaseQuantity,
    open_drawer_bottom,
    setOpenDrawerBottom,
    removeItem,
    coordinates,
    open_order_drawer,
    setOpenPlaceOrderModal,
    setOpenOrderDrawer,
    deliveryInfo,
    setDeliveryInfo,
  } = useOrderStore();

  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [isQrScan, setIsQrScan] = useState(false);
  const [features, setFeatures] = useState<FeatureFlags | null>(null);

  useEffect(() => {
    setIsQrScan(pathname.includes("qrScan") && !!qrId && !(tableNumber === 0));
  }, [pathname, qrId, tableNumber]);

  useEffect(() => {
    if (hotelData) {
      setFeatures(getFeatures(hotelData?.feature_flags as string));
    }
  }, [hotelData]);

  useEffect(() => {
    setOpenDrawerBottom(items?.length ? true : false);
  }, [items, setOpenDrawerBottom]);

  const calculateGrandTotal = () => {
    const baseTotal = items?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;
    let grandTotal = baseTotal;

    if (hotelData?.gst_percentage) {
      grandTotal += getGstAmount(baseTotal, hotelData.gst_percentage);
    }

    if (qrGroup?.extra_charge) {
      grandTotal += getExtraCharge(
        items || [],
        qrGroup.extra_charge,
        qrGroup.charge_type || "FLAT_FEE"
      );
    }

    return grandTotal.toFixed(2);
  };

  const getWhatsappLink = () => {
    const savedAddress = userAddress || "N/A";
    const selectedWhatsAppNumber = localStorage?.getItem(
      `hotel-${hotelData.id}-whatsapp-area`
    );

    let locationLink = "";
    const userLocationData = localStorage.getItem("user-location-store");
    if (userLocationData) {
      try {
        const location = JSON.parse(userLocationData);
        if (location.state?.coords) {
          const { lat, lng } = location.state.coords;
          locationLink = `\n*📍 Location:* https://www.google.com/maps?q=${lat},${lng}`;
        }
      } catch (error) {
        console.error("Error parsing location data:", error);
      }
    }

    const baseTotal = items?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;
    const gstAmount = hotelData?.gst_percentage
      ? getGstAmount(baseTotal, hotelData.gst_percentage)
      : 0;
    const qrCharge = qrGroup?.extra_charge
    const qrCharge = qrGroup?.extra_charge
      ? getExtraCharge(
          items || [],
          qrGroup.extra_charge,
          qrGroup.charge_type || "FLAT_FEE"
        )
      : 0;
    const deliveryCharge =
      !isQrScan && deliveryInfo?.cost && !deliveryInfo?.isOutOfRange
        ? deliveryInfo.cost
        : 0;
    const grandTotal = baseTotal + gstAmount + qrCharge + deliveryCharge;

    const whatsappMsg = `
    *🍽️ Order Details 🍽️*
    
    *Order ID:* ${orderId?.slice(0, 8) || "N/A"}
    ${(tableNumber ?? 0) > 0 ? `*Table:* ${tableNumber}` : "*Order Type:* Delivery"}
    ${(tableNumber ?? 0) > 0 ? "" : `*Delivery Address:* ${savedAddress}${locationLink}`}
    *Time:* ${new Date().toLocaleTimeString()}
    
    *📋 Order Items:*
    ${items?.map(
      (item, index) =>
        `${index + 1}. ${item.name} (${item.category.name})
       ➤ Qty: ${item.quantity} × ${hotelData.currency}${item.price.toFixed(2)} = ${hotelData.currency}${(
          item.price * item.quantity
        ).toFixed(2)}`
    ).join("\n\n")}
    
    *Subtotal:* ${hotelData.currency}${baseTotal.toFixed(2)}
    
    ${hotelData?.gst_percentage
      ? `*GST (${hotelData.gst_percentage}%):* ${hotelData.currency}${gstAmount.toFixed(2)}`
      : ""}
    
    ${!isQrScan && deliveryInfo?.cost && !deliveryInfo?.isOutOfRange
      ? `*Delivery Charge:* ${hotelData.currency}${deliveryInfo.cost.toFixed(2)}`
      : ""}
    
    ${
      qrGroup?.extra_charge
      qrGroup?.extra_charge
        ? `*${qrGroup.name}:* ${hotelData.currency}${qrCharge.toFixed(2)}`
        : ""
    }
    
    *Total Price:* ${hotelData.currency}${grandTotal.toFixed(2)}
    `;

    const number =
      selectedWhatsAppNumber ||
      hotelData?.whatsapp_numbers[0]?.number ||
      hotelData?.phone ||
      "8590115462";

    return `https://api.whatsapp.com/send?phone=+91${number}&text=${encodeURIComponent(
      whatsappMsg
    )}`;
  };

  const handlePlaceOrder = async () => {
    try {
      setOpenPlaceOrderModal(true);
      setOpenOrderDrawer(false);
      setOpenDrawerBottom(false);
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PlaceOrderModal
        qrGroup={qrGroup || null}
        qrId={qrId || null}
        getWhatsappLink={getWhatsappLink}
        hotelData={hotelData}
        tableNumber={tableNumber || 0}
      />
      <Drawer open={open_order_drawer} onOpenChange={setOpenOrderDrawer}>
        <div
          style={{ ...styles.border }}
          className={`fixed bottom-0 z-[51] left-1/2 -translate-x-1/2 transition-all duration-500 ${
            !open_drawer_bottom ? "translate-y-full" : "translate-y-0"
          } lg:max-w-[50%] bg-white text-black w-full px-[8%] py-6 rounded-t-[35px] bottom-bar-shadow flex items-center justify-between`}
        >
          <div>
            <div className="flex gap-2 items-center font-black text-xl">
              <div>PRICE : </div>
              <div style={{ color: styles.accent }}>
                {hotelData.currency}
                {items?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0}
              </div>
            </div>
            <div className="flex gap-2 items-center text-sm text-black/70">
              <div>Items :</div>
              <div>{items?.length}</div>
              {!isQrScan && deliveryInfo && items?.length && !deliveryInfo.isOutOfRange && (
                <div className="ml-2">(Delivery)</div>
              )}
            </div>
          </div>

          <div
            onClick={handlePlaceOrder}
            style={{ color: styles.accent }}
            className="font-black relative"
          >
            View Order
          </div>
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
            {order ? (
              <DrawerDescription>
                Order #{order.id.slice(0, 8)} - {order.status}
              </DrawerDescription>
            ) : (
              <DrawerDescription>
                Review your items before placing order
              </DrawerDescription>
            )}
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
            <div className="space-y-2">
              {/* Subtotal (items only) */}
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Items Subtotal:</span>
                <span className="font-medium">
                  {hotelData.currency}
                  {(items || [])
                    .reduce((acc, item) => acc + item.price * item.quantity, 0)
                    .toFixed(2)}
                </span>
              </div>

              {/* QR Group Extra Charges */}
              {qrGroup?.extra_charge && items?.length && (
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">
                    {qrGroup.name || "Extra Charge"}:
                  </span>
                  <span className="font-medium">
                    {hotelData.currency}
                    {getExtraCharge(
                      items || [],
                      qrGroup.extra_charge,
                      qrGroup.charge_type || "FLAT_FEE"
                    ).toFixed(2)}
                  </span>
                </div>
              )}

              {/* GST */}
              {hotelData?.gst_percentage && items?.length && (
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">
                    GST ({hotelData.gst_percentage}%):
                  </span>
                  <span className="font-medium">
                    {hotelData.currency}
                    {getGstAmount(
                      (items || []).reduce(
                        (acc, item) => acc + item.price * item.quantity,
                        0
                      ) +
                        (qrGroup?.extra_charge
                          ? getExtraCharge(
                              items || [],
                              qrGroup.extra_charge,
                              qrGroup.charge_type || "FLAT_FEE"
                            )
                          : 0),
                      hotelData.gst_percentage
                    ).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Delivery Charges (if applicable) */}
              {!isQrScan &&
                deliveryInfo &&
                items?.length &&
                !deliveryInfo.isOutOfRange && (
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium">Delivery Charge:</span>
                      <div className="text-xs text-gray-500">
                        {deliveryInfo.distance.toFixed(1)} km × {hotelData.currency}
                        {deliveryInfo.ratePerKm.toFixed(2)}/km
                      </div>
                    </div>
                    <span className="font-medium">
                      {hotelData.currency}
                      {deliveryInfo.cost.toFixed(2)}
                    </span>
                  </div>
                )}

              {/* Grand Total */}
              <div className="flex justify-between items-center py-2 border-t border-gray-200">
                <span className="font-bold text-lg">Grand Total:</span>
                <span
                  className="font-bold text-lg"
                  style={{ color: styles.accent }}
                >
                  {hotelData.currency}
                  {(() => {
                    const itemsSubtotal = (items || []).reduce(
                      (acc, item) => acc + item.price * item.quantity,
                      0
                    );
                    const extraCharges = qrGroup?.extra_charge
                      ? getExtraCharge(
                          items || [],
                          qrGroup.extra_charge,
                          qrGroup.charge_type || "FLAT_FEE"
                        )
                      : 0;
                    const gstAmount = hotelData?.gst_percentage
                      ? getGstAmount(
                          itemsSubtotal + extraCharges,
                          hotelData.gst_percentage
                        )
                      : 0;
                    const deliveryCharges =
                      !isQrScan &&
                      deliveryInfo?.cost &&
                      !deliveryInfo?.isOutOfRange
                        ? deliveryInfo.cost
                        : 0;

                    return (
                      itemsSubtotal +
                      extraCharges +
                      gstAmount +
                      deliveryCharges
                    ).toFixed(2);
                  })()}
                </span>
              </div>
              </div>

            {items?.length && (
              <>
                {!order ? (
                  <Link
                    href="#"
                    onClick={handlePlaceOrder}
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
                ) : (
                  <div className="w-full text-center text-sm text-gray-500">
                    Your order has been placed. Please wait for confirmation.
                  </div>
                )}
              </>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default OrderDrawer;
