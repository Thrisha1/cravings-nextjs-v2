"use client";
import { HotelData, HotelDataMenus } from "@/app/hotels/[...id]/page";
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
import useOrderStore, { OrderItem } from "@/store/orderStore";
import { useAuthStore } from "@/store/authStore";
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
import { QrGroup } from "@/app/admin/qr-management/page";
import PlaceOrderModal from "./placeOrder/PlaceOrderModal";

export const getGstAmount = (price: number, gstPercentage: number) => {
  return (price * gstPercentage) / 100;
};

export const calculateDeliveryDistanceAndCost = async (
  hotelData: HotelData
) => {
  const { setDeliveryInfo } = useOrderStore.getState();

  try {
    const restaurantDataStr = localStorage.getItem(
      `restaurant-${hotelData.id}-delivery-data`
    );
    if (!restaurantDataStr) return;

    const restaurantData = JSON.parse(restaurantDataStr);
    if (
      !restaurantData?.geo_location?.coordinates ||
      !restaurantData?.delivery_rate
    ) {
      return;
    }

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

    const restaurantCoords = restaurantData.geo_location.coordinates;
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

    const distanceInKm = data.routes[0].distance / 1000;
    const deliveryRate = parseFloat(restaurantData.delivery_rate);

    const { delivery_radius, first_km_free, is_fixed_rate } =
      hotelData?.delivery_rules || {};

    if (delivery_radius && distanceInKm > delivery_radius) {
      setDeliveryInfo({
        distance: distanceInKm,
        cost: 0,
        ratePerKm: deliveryRate,
        isOutOfRange: true,
      });
      return;
    }

    let calculatedCost = 0;

    if (is_fixed_rate) {
      calculatedCost = deliveryRate;
    } else {
      calculatedCost = distanceInKm * deliveryRate;
    }

    if (distanceInKm <= first_km_free) {
      calculatedCost = 0;
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

export const getExtraCharge = (
  items: OrderItem[],
  extraCharge: number,
  chargeType: "PER_ITEM" | "FLAT_FEE"
) => {
  if (!extraCharge || extraCharge <= 0) return 0;
  if (items.length === 0) return 0;

  return chargeType === "PER_ITEM"
    ? items.reduce((acc, item) => acc + item.quantity, 0) * extraCharge
    : extraCharge;
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
    open_drawer_bottom,
    setOpenDrawerBottom,
    removeItem,
    setOpenAuthModal,
    coordinates,
    clearOrder,
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
    setIsQrScan(pathname.includes("qrScan") && !!qrId);
  }, [pathname, qrId]);

  useEffect(() => {
    if (items?.length && !isQrScan) {
      calculateDeliveryDistanceAndCost();
    }
  }, [items]);

  useEffect(() => {
    if (hotelData) {
      setFeatures(getFeatures(hotelData?.feature_flags as string));
    }
  }, [hotelData]);

  const calculateDeliveryDistanceAndCost = async () => {
    try {
      const restaurantDataStr = localStorage.getItem(
        `restaurant-${hotelData.id}-delivery-data`
      );
      if (!restaurantDataStr) return;

      const restaurantData = JSON.parse(restaurantDataStr);
      if (
        !restaurantData?.geo_location?.coordinates ||
        !restaurantData?.delivery_rate
      ) {
        return;
      }

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

      const restaurantCoords = restaurantData.geo_location.coordinates;
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

      const distanceInKm = data.routes[0].distance / 1000;
      const deliveryRate = parseFloat(restaurantData.delivery_rate);

      const { delivery_radius, first_km_free, is_fixed_rate } =
        hotelData.delivery_rules || {};

      if (delivery_radius && distanceInKm > delivery_radius) {
        setDeliveryInfo({
          distance: distanceInKm,
          cost: 0,
          ratePerKm: deliveryRate,
          isOutOfRange: true,
        });
        return;
      }

      let calculatedCost = 0;

      if (is_fixed_rate) {
        calculatedCost = deliveryRate;
      } else {
        calculatedCost = distanceInKm * deliveryRate;
      }

      if (distanceInKm <= first_km_free) {
        calculatedCost = 0;
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

  const calculateGrandTotal = () => {
    const baseTotal =
      items?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;
    let grandTotal = baseTotal;

    if (hotelData?.gst_percentage) {
      grandTotal += getGstAmount(baseTotal, hotelData.gst_percentage);
    }

    // if (
    //   !isQrScan &&
    //   deliveryInfo?.cost &&
    //   items?.length &&
    //   !deliveryInfo?.isOutOfRange
    // ) {
    //   grandTotal += deliveryInfo.cost;
    // }

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

    const baseTotal =
      items?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;
    const gstAmount = hotelData?.gst_percentage
      ? getGstAmount(baseTotal, hotelData.gst_percentage)
      : 0;
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
    ${
      (tableNumber ?? 0) > 0
        ? `*Table:* ${tableNumber}`
        : "*Order Type:* Delivery"
    }
    ${
      (tableNumber ?? 0) > 0
        ? ""
        : `*Delivery Address:* ${savedAddress}${locationLink}`
    }
    *Time:* ${new Date().toLocaleTimeString()}
    
    *📋 Order Items:*
      ${items
        ?.map(
          (item, index) =>
            `${index + 1}. ${item.name} (${item.category.name})
       ➤ Qty: ${item.quantity} × ${hotelData.currency}${item.price.toFixed(
              2
            )} = ${hotelData.currency}${(item.price * item.quantity).toFixed(
              2
            )}`
        )
        .join("\n\n")}
    
    *Subtotal:* ${hotelData.currency}${baseTotal.toFixed(2)}
    
    ${
      hotelData?.gst_percentage
        ? `*GST (${hotelData.gst_percentage}%):* ${
            hotelData.currency
          }${gstAmount.toFixed(2)}`
        : ""
    }
    
    ${
      !isQrScan && deliveryInfo?.cost && !deliveryInfo?.isOutOfRange
        ? `*Delivery Charge:* ${hotelData.currency}${deliveryInfo.cost.toFixed(
            2
          )}`
        : ""
    }
    
    ${
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
    // setIsLoading(true);
    try {
      setOpenPlaceOrderModal(true);
      setOpenOrderDrawer(false);
      setOpenDrawerBottom(false);
      //   const subtotal =
      //     items?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;
      //   const gstAmount = getGstAmount(
      //     subtotal,
      //     hotelData?.gst_percentage as number
      //   );

      //   // Prepare extra charges array
      //   const extraCharges = [];

      //   // Add QR group charge if applicable
      //   if (isQrScan && qrGroup && qrGroup.extra_charge > 0 && qrGroup.name) {
      //     extraCharges.push({
      //       name: qrGroup.name,
      //       amount: qrGroup.extra_charge,
      //       charge_type: qrGroup.charge_type || "FLAT_FEE",
      //     });
      //   }

      //   // Add delivery charge if applicable
      //   if (!isQrScan && deliveryInfo?.cost && !deliveryInfo?.isOutOfRange) {
      //     extraCharges.push({
      //       name: "Delivery Charge",
      //       amount: deliveryInfo.cost,
      //       charge_type: "FLAT_FEE",
      //     });
      //   }

      //   const result = await placeOrder(
      //     hotelData,
      //     tableNumber,
      //     qrId,
      //     gstAmount,
      //     extraCharges.length > 0 ? extraCharges : null
      //   );

      //   if (result) {
      //     toast.success("Order placed successfully!");
      //     clearOrder();
      //   } else {
      //     toast.error("Failed to place order. Please try again.");
      //   }
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
    const needsCoordinates =
      features?.delivery.enabled &&
      hotelData?.delivery_rate &&
      hotelData?.geo_location &&
      !coordinates;
    const needsWhatsAppArea = features?.multiwhatsapp.enabled && !hotelArea;

    // if (needsAddress || needsWhatsAppArea || needsCoordinates) {
    //   setOpenAuthModal(true);
    //   return;
    // }

    setOpenOrderDrawer(true);
  };

  useEffect(() => {
    setOpenDrawerBottom(items?.length ? true : false);
  }, [items]);

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
                {items?.reduce((acc, item) => {
                  return acc + item.price * item.quantity;
                }, 0) || 0}
              </div>
            </div>
            <div className="flex gap-2 items-center text-sm text-black/70">
              <div>Items :</div>
              <div>{items?.length}</div>
              {!isQrScan &&
                deliveryInfo &&
                items?.length &&
                !deliveryInfo.isOutOfRange && (
                  <div className="ml-2">(Delivery)</div>
                )}
            </div>
          </div>

          <div
            onClick={handleViewOrder}
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
              {/* {items?.length && (
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold">Subtotal:</span>
                <span className="font-bold">
                  {hotelData.currency}
                  {items
                    .reduce((acc, item) => acc + item.price * item.quantity, 0)
                    .toFixed(2)}
                </span>
              </div>
            )} */}
              {/* 
            {hotelData?.gst_percentage && items?.length && (
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold">{`GST (${hotelData.gst_percentage}%):`}</span>
                <span className="font-bold">
                  {hotelData.currency}
                  {getGstAmount(
                    items.reduce(
                      (acc, item) => acc + item.price * item.quantity,
                      0
                    ),
                    hotelData.gst_percentage
                  ).toFixed(2)}
                </span>
              </div>
            )} */}

              {/* {!isQrScan &&
              deliveryInfo &&
              items?.length &&
              (deliveryInfo.isOutOfRange ? null : (
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-bold">Delivery Charge:</span>
                    <div className="text-xs text-gray-500">
                      {deliveryInfo.distance.toFixed(1)} km ×{" "}
                      {hotelData.currency}
                      {deliveryInfo.ratePerKm.toFixed(2)}/km
                      {hotelData?.delivery_rules?.first_km_free
                        ? ` (First ${hotelData?.delivery_rules?.first_km_free}km free)`
                        : ""}
                    </div>
                  </div>
                  <span className="font-bold">
                    {hotelData.currency}
                    {deliveryInfo.cost.toFixed(2)}
                  </span>
                </div>
              ))} */}

              {qrGroup?.extra_charge && items?.length && (
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold">
                    {qrGroup.name || "Extra Charge"}:
                  </span>
                  <span className="font-bold">
                    {hotelData.currency}
                    {getExtraCharge(
                      items || [],
                      qrGroup.extra_charge,
                      qrGroup.charge_type || "FLAT_FEE"
                    ).toFixed(2)}
                  </span>
                </div>
              )}

              {/* <div className="flex justify-between items-center mt-4 pt-2 border-t">
              <span className="font-bold text-lg">Grand Total:</span>
              <span
                className="font-bold text-lg"
                style={{ color: styles.accent }}
              >
                {hotelData.currency}
                {calculateGrandTotal()}
              </span>
            </div> */}

              <div className="flex justify-between items-center py-2">
                <span className="font-bold text-lg">Sub Total:</span>
                <span
                  className="font-bold text-lg"
                  style={{ color: styles.accent }}
                >
                  {hotelData.currency}
                  {(items || [])
                    .reduce((acc, item) => acc + item.price * item.quantity, 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>

            {items?.length && (
              <>
                {!order ? (
                  <>
                    {/* {!deliveryInfo?.isOutOfRange || isQrScan ? ( */}
                    <Link
                      href={"#"}
                      onClick={handlePlaceOrder}
                      // target="_blank"
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
