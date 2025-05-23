"use client";
import useOrderStore, { DeliveryInfo } from "@/store/orderStore";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Styles } from "@/screens/HotelMenuPage_v2";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { HotelData } from "@/app/hotels/[...id]/page";

// Define the exact geo_location structure based on the provided format
interface GeoLocation {
  type: string;
  crs: {
    type: string;
    properties: {
      name: string;
    };
  };
  coordinates: number[];
}

// Instead of extending HotelData, create a separate type for the function parameter
export type DeliveryHotelData = Omit<HotelData, "geo_location"> & {
  geo_location: GeoLocation;
  delivery_rate: string;
};
import { Button } from "../ui/button";
import { useAuthStore } from "@/store/authStore";
import { getFeatures } from "@/lib/getFeatures";
import { useLocationStore } from "@/store/geolocationStore";
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export const calculateDeliveryDistanceAndCost = async (
  hotelData: DeliveryHotelData
): Promise<DeliveryInfo | null> => {
  console.log("🗺️ Starting delivery distance calculation...");

  // Validate hotel data
  if (!hotelData?.geo_location?.coordinates || !hotelData?.delivery_rate) {
    console.error("❌ Missing required hotel data for delivery calculation");
    return null;
  }

  // Validate coordinates format
  const restaurantCoords = hotelData.geo_location.coordinates;
  if (
    !Array.isArray(restaurantCoords) ||
    restaurantCoords.length !== 2 ||
    typeof restaurantCoords[0] !== "number" ||
    typeof restaurantCoords[1] !== "number"
  ) {
    console.error("❌ Invalid restaurant coordinates format");
    return null;
  }

  // Get and validate user coordinates
  const userLocationData = useLocationStore.getState();
  if (
    !userLocationData.coords ||
    typeof userLocationData.coords.lng !== "number" ||
    typeof userLocationData.coords.lat !== "number"
  ) {
    console.error("❌ Invalid user location coordinates");
    return null;
  }

  const userLocation: [number, number] = [
    userLocationData.coords.lng,
    userLocationData.coords.lat,
  ];

  // Validate Mapbox token
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!mapboxToken) {
    console.error("❌ Mapbox access token not configured");
    return null;
  }

  try {
    // Call Mapbox Directions API
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.join(
      ","
    )};${restaurantCoords.join(",")}?access_token=${mapboxToken}`;

    console.log("🌐 Calling Mapbox API...");
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`❌ Mapbox API error: ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.error("❌ No route found between locations");
      return null;
    }

    // Calculate distance and cost
    const distanceInKm = data.routes[0].distance / 1000;
    const deliveryRate = Number(hotelData.delivery_rate);
    const maxDeliveryDistance = hotelData.delivery_rules?.delivery_radius || 0;
    const isOutOfRange = distanceInKm > maxDeliveryDistance;

    // Calculate cost (0 if out of range)
    const deliveryCost = isOutOfRange ? 0 : distanceInKm * deliveryRate;

    console.log("📏 Delivery details:", {
      distance: distanceInKm,
      rate: deliveryRate,
      cost: deliveryCost,
      maxDistance: maxDeliveryDistance,
      isOutOfRange,
    });

    // Return delivery information
    return {
      distance: parseFloat(distanceInKm.toFixed(2)),
      cost: parseFloat(deliveryCost.toFixed(2)),
      ratePerKm: deliveryRate,
      isOutOfRange,      
    };
  } catch (error) {
    console.error("❌ Error calculating delivery:", error instanceof Error ? error.message : error);
    return null;
  }
};

const AuthModal = ({
  styles,
  hoteldata,
  tableNumber,
}: {
  styles: Styles;
  hoteldata: HotelData;
  tableNumber: number;
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const {
    open_auth_modal,
    setUserAddress,
    setOpenAuthModal,
    setUserCoordinates,
    userAddress,
  } = useOrderStore();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState(userAddress || "");
  const {
    coords,
    error: geoError,
    getLocation,
    isLoading: isGeoLoading,
  } = useLocationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userData: user } = useAuthStore();
  const hasDelivery = hoteldata?.geo_location && hoteldata?.delivery_rate > 0;

  // Load previous address from localStorage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAddress = localStorage.getItem(
        `hotel-${hoteldata.id}-delivery-address`
      );
      if (savedAddress && !address) {
        setAddress(savedAddress);
      }
    }
  }, [hoteldata.id, address]);

  const handleSubmit = async () => {
    if (!tableNumber && !address) {
      toast.error("Please enter your delivery address");
      return;
    }

    if (hasDelivery && !coords) {
      toast.error("Please allow location access to continue");
      return;
    }

    // Save address to localStorage
    if (address && typeof window !== "undefined") {
      localStorage.setItem(
        `hotel-${hoteldata.id}-delivery-address`,
        address
      );
    }

    if (user) {
      setUserAddress(address);
      setUserCoordinates({
        lat: coords?.lat || 0,
        lng: coords?.lng || 0,
      });
      setOpenAuthModal(false);
      return;
    }

    if (!phoneNumber) {
      toast.error("Please enter your phone number");
      return;
    }

    setIsSubmitting(true);
    try {
      let deliveryCalculationResult = null;
      // Calculate delivery distance and cost for delivery orders
      if (!tableNumber) {
        console.log("📦 Calculating delivery cost for delivery order...");
        // Type assertion to help TypeScript understand the structure
        deliveryCalculationResult = await calculateDeliveryDistanceAndCost(
          hoteldata as unknown as DeliveryHotelData
        );
        console.log(
          "📊 Delivery calculation result:",
          deliveryCalculationResult
        );

        if (deliveryCalculationResult) {
          // Update the order store with delivery info
          useOrderStore.getState().setDeliveryInfo({
            cost: deliveryCalculationResult.cost,
            distance: deliveryCalculationResult.distance,
            isOutOfRange: false,
            ratePerKm: deliveryCalculationResult.ratePerKm,
          });
          useOrderStore
            .getState()
            .setDeliveryCost(deliveryCalculationResult.cost);
          toast.success(
            `Delivery cost: ${
              hoteldata.currency
            }${deliveryCalculationResult.cost.toFixed(2)}`
          );
        } else {
          toast.error(
            "Could not calculate delivery cost. Please ensure location services are enabled and try again."
          );
          setIsSubmitting(false);
          return;
        }
      }

      // Proceed with user login and opening the order drawer
      setUserAddress(address);
      setUserCoordinates({
        lat: coords?.lat || 0,
        lng: coords?.lng || 0,
      });
      const result = await useAuthStore
        .getState()
        .signInWithPhone(phoneNumber, hoteldata?.id);
      if (result) {
        useOrderStore.getState().setOpenAuthModal(false);
        // Ensure order drawer opens *after* delivery cost is calculated and stored
        useOrderStore.getState().setOpenOrderDrawer(true);
      } else {
        toast.error("Sign in failed. Please check your phone number.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to process your request. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open_auth_modal} onOpenChange={setOpenAuthModal}>
      <DialogContent
        className={`rounded-lg `}
        style={{
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          border: `${styles.border.borderWidth} ${styles.border.borderStyle} ${styles.border.borderColor}`,
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl" style={{ color: styles.accent }}>
            {user
              ? "Confirm your details"
              : "Please enter your details to place order"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!user && (
            <div>
              <Label htmlFor="phone" className="mb-2">
                Phone Number
              </Label>
              <Input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={(e) =>
                  setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                style={{
                  backgroundColor: styles.backgroundColor,
                  color: styles.color,
                  border: `${styles.border.borderWidth} ${styles.border.borderStyle} ${styles.border.borderColor}`,
                }}
                placeholder="Enter your phone number"
              />
            </div>
          )}

          {!tableNumber && (
            <div>
              <Label htmlFor="address" className="mb-2">
                {user ? "Delivery Address" : "Delivery Address"}
              </Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="min-h-[100px]"
                style={{
                  backgroundColor: styles.backgroundColor,
                  color: styles.color,
                  border: `${styles.border.borderWidth} ${styles.border.borderStyle} ${styles.border.borderColor}`,
                }}
                placeholder="Enter your delivery address (House no, Building, Street, Area)"
              />
            </div>
          )}

          {/* Only show location section if hotel has delivery */}
          {hasDelivery && (
            <div className="space-y-2">
              <Label className="mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location Access
              </Label>

              <Button
                type="button"
                onClick={() => getLocation()}
                className="w-full"
                variant="outline"
                disabled={isGeoLoading}
                style={{
                  borderColor: styles.border.borderColor,
                }}
              >
                {isGeoLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  "Get Current Location"
                )}
              </Button>

              {/* Location Status Display */}
              <div
                className="p-4 rounded-lg border mt-2"
                style={{ borderColor: styles.border.borderColor }}
              >
                {isGeoLoading ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Getting your location...
                  </div>
                ) : coords ? (
                  <div className="text-sm">
                    <div className="font-medium text-green-600">
                      Location found
                    </div>
                  </div>
                ) : geoError ? (
                  <div className="text-sm text-red-600">{geoError}</div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Please get your location to continue
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add WhatsApp area selection if multiwhatsapp is enabled */}
          {getFeatures(hoteldata?.feature_flags || "")?.multiwhatsapp
            ?.enabled &&
            hoteldata?.whatsapp_numbers &&
            hoteldata.whatsapp_numbers.length > 0 && (
              <div>
                <Label htmlFor="whatsapp-area" className="mb-2">
                  Select Delivery Area
                </Label>
                <select
                  id="whatsapp-area"
                  onChange={(e) => {
                    localStorage.setItem(
                      `hotel-${hoteldata.id}-whatsapp-area`,
                      e.target.value
                    );
                  }}
                  className="w-full p-2 rounded border"
                  style={{
                    backgroundColor: styles.backgroundColor,
                    color: styles.color,
                    border: `${styles.border.borderWidth} ${styles.border.borderStyle} ${styles.border.borderColor}`,
                  }}
                  defaultValue={
                    typeof window !== "undefined"
                      ? localStorage.getItem(
                          `hotel-${hoteldata.id}-whatsapp-area`
                        ) || ""
                      : ""
                  }
                >
                  <option value="">Select your area</option>
                  {hoteldata.whatsapp_numbers.map((number) => (
                    <option key={number.number} value={number.number}>
                      {number.area || number.number}
                    </option>
                  ))}
                </select>
              </div>
            )}

          <Button
            onClick={handleSubmit}
            disabled={Boolean(isSubmitting || (hasDelivery && !coords))}
            className="w-full"
            style={{
              backgroundColor: styles.accent,
              color: "#fff",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : user ? (
              "Confirm"
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;