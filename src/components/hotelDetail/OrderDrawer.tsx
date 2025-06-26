"use client";
import { HotelData } from "@/app/hotels/[...id]/page";
import { Styles } from "@/screens/HotelMenuPage_v2";
import React, { useEffect, useState } from "react";
import useOrderStore from "@/store/orderStore";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { FeatureFlags, getFeatures } from "@/lib/getFeatures";
import { QrGroup } from "@/app/admin/qr-management/page";
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
    if (!restaurantCoords) return;

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
    const deliveryRate = hotelData?.delivery_rate || 0;

    const { delivery_radius, first_km_range, is_fixed_rate } =
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
    } else if (first_km_range?.km > 0) {
      if (distanceInKm <= first_km_range.km) {
        calculatedCost = first_km_range.rate;
      } else {
        const remainingDistance = distanceInKm - first_km_range.km;
        calculatedCost = first_km_range.rate + remainingDistance * deliveryRate;
      }
    } else {
      calculatedCost = distanceInKm * deliveryRate;
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
    items,
    orderId,
    open_drawer_bottom,
    setOpenDrawerBottom,
    open_order_drawer,
    setOpenPlaceOrderModal,
    setOpenOrderDrawer,
    deliveryInfo,
  } = useOrderStore();

  const pathname = usePathname();
  const [isQrScan, setIsQrScan] = useState(false);
  const [features, setFeatures] = useState<FeatureFlags | null>(null);
  const [isMoveUp, setMoveUp] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    setIsQrScan(pathname.includes("qrScan") && !!qrId && !(tableNumber === 0));
  }, [pathname, qrId, tableNumber]);

  useEffect(() => {
    if (hotelData) {
      setFeatures(getFeatures(hotelData?.feature_flags as string));
    }
  }, [hotelData]);

  useEffect(() => {
    setOpenDrawerBottom((items?.length || 0) > 0 ? true : false);
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
    
    ${qrGroup?.extra_charge
      ? `*${qrGroup.name}:* ${hotelData.currency}${qrCharge.toFixed(2)}`
      : ""}
    
    *Total Price:* ${hotelData.currency}${grandTotal.toFixed(2)}
    `;

    const number =
      selectedWhatsAppNumber ||
      hotelData?.whatsapp_numbers[0]?.number ||
      hotelData?.phone ||
      "8590115462";

    return `https://api.whatsapp.com/send?phone=${hotelData?.country_code || "+91"}${number}&text=${encodeURIComponent(
      whatsappMsg
    )}`;
  };

  useEffect(() => {
    setOpenPlaceOrderModal(false);
  }, [items]);

  const handlePlaceOrder = async () => {
    try {
      setOpenPlaceOrderModal(true);
      setOpenOrderDrawer(false);
      setOpenDrawerBottom(false);
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    }
  };



    useEffect(() => {
      const handleScroll = () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down - move drrawer down
          setMoveUp(false);
        } else if (currentScrollY < lastScrollY) {
          // Scrolling up -  move drawer up
          setMoveUp(true);
        }
        
        setLastScrollY(currentScrollY);
      };
  
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

  return (
    <>
      <PlaceOrderModal
        qrGroup={qrGroup || null}
        qrId={qrId || null}
        getWhatsappLink={getWhatsappLink}
        hotelData={hotelData}
        tableNumber={tableNumber || 0}
      />

      <div
        style={{ ...styles.border }}
        className={`fixed ${isMoveUp ? 'bottom-16 sm:bottom-0' : 'bottom-0'} z-[60] left-1/2 -translate-x-1/2 transition-all duration-300 ${
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
          onClick={handlePlaceOrder}
          style={{ color: styles.accent }} 
          className="font-black relative cursor-pointer"
        >
          View Order
        </div>
      </div>
    </>
  );
};

export default OrderDrawer;
