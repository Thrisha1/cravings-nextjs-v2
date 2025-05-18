"use client";
import { HotelData } from "@/app/hotels/[...id]/page";
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
import { FeatureFlags, getFeatures } from "@/lib/getFeatures";
import { QrGroup } from "@/app/admin/qr-management/page";
// import { fetchFromHasura } from "@/lib/hasuraClient";

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
    deliveryInfo,
    deliveryCost,
  } = useOrderStore();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  
  const [isQrScan, setIsQrScan] = useState(false);
  const [featrues, setFeatures] = useState<FeatureFlags | null>(null);

  useEffect(() => {
    // Set isQrScan based on pathname and qrId
    setIsQrScan(pathname.includes("qrScan") && !!qrId);
  }, [pathname, qrId]);

  useEffect(() => {
    if (hotelData) {
      console.log("User Data:", hotelData?.role, hotelData?.feature_flags);
      const feature = getFeatures(hotelData?.feature_flags as string);
      setFeatures(feature);
    }
  }, [hotelData]);

  // const calculateDeliveryDistanceAndCost = async () => {
  //   console.log("🗺️ Starting delivery distance calculation...");
  //   try {
  //     // Get restaurant data from localStorage
  //     const restaurantDataStr = localStorage.getItem(`restaurant-${hotelData.id}-delivery-data`);
  //     console.log("🏪 Restaurant data from localStorage:", restaurantDataStr);
      
  //     if (!restaurantDataStr) {
  //       console.error("❌ Restaurant delivery data not found in localStorage");
  //       return null;
  //     }
  //     const restaurantData = JSON.parse(restaurantDataStr);
      
  //     // Validate essential data is present
  //     if (!restaurantData?.geo_location?.coordinates || !restaurantData?.delivery_rate) {
  //       console.error("❌ Restaurant geo_location or delivery_rate not found in localStorage");
  //       return null;
  //     }

  //     // Get user coordinates from localStorage
  //     const userCoordsStr = localStorage.getItem('user-location-store');
  //     console.log("👤 User location from localStorage:", userCoordsStr);
      
  //     if (!userCoordsStr) {
  //       console.error("❌ User coordinates not found in localStorage");
  //       return null;
  //     }
  //     const userLocationData = JSON.parse(userCoordsStr);
  //     if (!userLocationData.state?.coords || typeof userLocationData.state.coords.lng !== 'number' || typeof userLocationData.state.coords.lat !== 'number') {
  //       console.error("❌ Invalid user location format or coordinates in localStorage");
  //       return null;
  //     }

  //     // Extract coordinates
  //     const restaurantCoords = restaurantData.geo_location.coordinates; // [lng, lat]
  //     const userLocation = [userLocationData.state.coords.lng, userLocationData.state.coords.lat]; // [lng, lat]

  //     console.log("📍 Restaurant coordinates:", restaurantCoords);
  //     console.log("📍 User coordinates:", userLocation);

  //     // Calculate distance using Mapbox Directions API
  //     const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  //     if (!mapboxToken) {
  //       console.error("❌ Mapbox token not found in environment variables");
  //       return null;
  //     }
      
  //     const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.join(',')};${restaurantCoords.join(',')}?access_token=${mapboxToken}`;
  //     console.log("🌐 Calling Mapbox API...");
      
  //     const response = await fetch(url);
  //     const data = await response.json();
  //     console.log("🗺️ Mapbox API response:", data);

  //     if (!data.routes || data.routes.length === 0) {
  //       console.error("❌ No route found between user and restaurant");
  //       return null;
  //     }

  //     // Get distance in kilometers
  //     const distanceInKm = data.routes[0].distance / 1000;
  //     const deliveryRate = parseFloat(restaurantData.delivery_rate);
  //     const deliveryCost = distanceInKm * deliveryRate;

  //     console.log("📏 Distance (km):", distanceInKm);
  //     console.log("💰 Delivery rate per km:", deliveryRate);
  //     console.log("💵 (at order drawer)Calculated delivery cost:", deliveryCost);

  //     return {
  //       distance: distanceInKm,
  //       deliveryCost: deliveryCost
  //     };
  //   } catch (error) {
  //     console.error("❌ Error calculating delivery distance:", error);
  //     return null;
  //   }
  // };

  const calculateGrandTotal = () => {
    const baseTotal = order?.totalPrice ?? totalPrice ?? 0;
    let grandTotal = baseTotal;

    // Add GST if applicable
    if (hotelData?.gst_percentage) {
      grandTotal += getGstAmount(baseTotal, hotelData.gst_percentage);
    }

    // Add delivery cost for delivery orders
    if (!isQrScan && deliveryCost && items && items.length > 0) {
      grandTotal += deliveryCost;
    }

    // Add extra charges if applicable
    if (qrGroup?.extra_charge) {
      const extraChargeTotal = getExtraCharge(
        items || [],
        qrGroup.extra_charge,
        qrGroup.charge_type || "FLAT_FEE"
      );
      grandTotal += extraChargeTotal;
    }

    return grandTotal.toFixed(2);
  };

  const getWhatsapLink = () => {
    const savedAddress = userAddress || "N/A";
    const selectedWhatsAppNumber = localStorage?.getItem(
      `hotel-${hotelData.id}-whatsapp-area`
    );

    // Get user location from localStorage
    const userLocationData = localStorage.getItem('user-location-store');
    let locationLink = '';
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

    const whatsappMsg = `
    *🍽️ Order Details 🍽️*
    
    *Order ID:* ${orderId?.slice(0, 8) || "N/A"}
    ${(tableNumber ?? 0) > 0 ? `*Table:* ${tableNumber}` : "*Order Type:* Delivery"}
    ${(tableNumber ?? 0) > 0 ? "" : `*Delivery Address:* ${savedAddress}${locationLink}`}
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
      !isQrScan && deliveryCost 
        ? `*Delivery Charge:* ${hotelData.currency}${deliveryCost.toFixed(2)}`
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
      hotelData?.gst_percentage || qrGroup?.extra_charge || (!isQrScan && deliveryCost)
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
    console.log("🚀 Starting order placement...");
    console.log("📱 Is QR Scan:", isQrScan);
    console.log("🏪 Hotel Data:", hotelData);
    console.log("📍 User Address:", userAddress);
    console.log("🔍 QR Group:", qrGroup);
    
    setIsLoading(true);
    try {
      // Calculate subtotal (sum of all items' prices)
      const subtotal = items?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0;
      console.log("💰 Subtotal:", subtotal);

      // Use existing delivery cost if available
      let finalDeliveryCost = deliveryCost || 0;
      
      // If no delivery cost is set yet and it's a delivery order, calculate it
      if (!isQrScan && !finalDeliveryCost) {
        console.log("📦 Calculating delivery cost for delivery order...");
        const deliveryCalculation = deliveryCost;
        console.log("📊 Delivery calculation result:", deliveryCost);
        
        // if (deliveryCalculation) {
        //   finalDeliveryCost = deliveryCalculation.deliveryCost;
        //   console.log("✅ Final delivery cost:", finalDeliveryCost);
        // } else {
        //   console.log("⚠️ No delivery calculation available");
        // }
      } 
      // else if (isQrScan) {
      //   console.log("🍽️ Skipping delivery calculation for QR scan order");
      //   finalDeliveryCost = 0;
      // }

      // Only create extraCharge if we have valid qrGroup data and it's a QR scan order
      const extraCharge = isQrScan && qrGroup && qrGroup.extra_charge > 0 && qrGroup.name ? {
        amount: qrGroup.extra_charge,
        name: qrGroup.name,
        charge_type: qrGroup.charge_type || "FLAT_FEE",
      } : null;
      console.log("💰 Extra charges:", extraCharge);

      const gstAmount = getGstAmount(
        subtotal,
        hotelData?.gst_percentage as number
      );
      console.log("🧾 GST Amount:", gstAmount);

      // Place order with all information
      const result = await placeOrder(
        hotelData,
        tableNumber,
        qrId,
        gstAmount,
        extraCharge,
        finalDeliveryCost
      );
      
      console.log("📝 Order placement result:", result);
      
      if (result) {
        toast.success("Order placed successfully!");
        clearOrder();
      } else {
        toast.error("Failed to place order. Please try again.");
      }
    } catch (error) {
      console.error("❌ Error placing order:", error);
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
              {!isQrScan && deliveryInfo && items && items.length > 0 && (
                <div className="ml-2">(+Delivery)</div>
              )}
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
            {items && items.length > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold">Subtotal:</span>
                <span className="font-bold">
                  {hotelData.currency}
                  {items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}
                </span>
              </div>
            )}

            {hotelData?.gst_percentage && items && items.length > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold">{`GST (${hotelData.gst_percentage}%):`}</span>
                <span className="font-bold">
                  {hotelData.currency}
                  {getGstAmount(
                    items?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0,
                    hotelData.gst_percentage
                  ).toFixed(2)}
                </span>
              </div>
            )}

            {!isQrScan && deliveryInfo?.cost && items && items.length > 0 && (
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="font-bold">Delivery Charge:</span>
                  <div className="text-xs text-gray-500">
                    {deliveryInfo.distance.toFixed(1)} km × {hotelData.currency}{deliveryInfo.ratePerKm.toFixed(2)}/km
                  </div>
                </div>
                <span className="font-bold">
                  {hotelData.currency}
                  {deliveryInfo.cost.toFixed(2)}
                </span>
              </div>
            )}

            {qrGroup?.extra_charge && items && items.length > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold">{qrGroup.name || "Extra Charge"}:</span>
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

            <div className="flex justify-between items-center mt-4 pt-2 border-t">
              <span className="font-bold text-lg">Grand Total:</span>
              <span
                className="font-bold text-lg"
                style={{ color: styles.accent }}
              >
                {hotelData.currency}
                {calculateGrandTotal()}
              </span>
            </div>
          </div>

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