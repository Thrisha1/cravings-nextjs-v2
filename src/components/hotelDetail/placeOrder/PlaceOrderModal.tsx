"use client";
import useOrderStore from "@/store/orderStore";
import React, { useEffect, useRef, useState } from "react";
import {
  calculateDeliveryDistanceAndCost,
  DeliveryHotelData,
} from "../AuthModal";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Loader2, ArrowLeft, MapPin, LocateFixed, X } from "lucide-react";
import { useLocationStore } from "@/store/geolocationStore";
import mapboxgl, { LngLatLike } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HotelData } from "@/app/hotels/[...id]/page";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const ItemsCard = ({
  items,
  increaseQuantity,
  decreaseQuantity,
  removeItem,
  currency,
}: {
  items: any[];
  increaseQuantity: any;
  decreaseQuantity: any;
  removeItem: any;
  currency: any;
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="font-bold text-lg mb-3">Your Order</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center border-b pb-2"
          >
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-gray-500">{item.category.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium">
                {currency}
                {item.price.toFixed(2)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (item.quantity > 1) {
                      decreaseQuantity(item.id);
                    } else {
                      removeItem(item.id);
                    }
                  }}
                  className="w-6 h-6 rounded-full flex items-center justify-center border"
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() => increaseQuantity(item.id)}
                  className="w-6 h-6 rounded-full flex items-center justify-center border"
                >
                  +
                </button>
              </div>
              <span className="font-medium min-w-[60px] text-right">
                {currency}
                {(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AddressCard = ({
  address,
  setAddress,
  setShowMapModal,
  getLocation,
  isGeoLoading,
  coords,
  geoError,
}: {
  address: any;
  setAddress: any;
  setShowMapModal: any;
  getLocation: any;
  isGeoLoading: any;
  coords: any;
  geoError: any;
}) => {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">Delivery Address</h3>
      </div>

      <Textarea
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="min-h-[100px] mb-3"
        placeholder="Enter your delivery address"
      />

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Location
        </Label>

        <Button
          type="button"
          onClick={getLocation}
          className="w-full"
          variant="outline"
          disabled={isGeoLoading}
        >
          {isGeoLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting Location...
            </>
          ) : (
            <>
              <LocateFixed className="mr-2 h-4 w-4" />
              Use My Current Location
            </>
          )}
        </Button>

        <Button
          type="button"
          onClick={() => setShowMapModal(true)}
          className="w-full"
          variant="outline"
        >
          Select Location on Map
        </Button>

        {geoError && (
          <div className="text-sm text-red-600 p-2 bg-red-50 rounded">
            {geoError}
          </div>
        )}
      </div>
    </div>
  );
};

const BillCard = ({
  items,
  currency,
  gstPercentage,
  deliveryInfo,
  isDelivery,
}: {
  items: any[];
  currency: any;
  gstPercentage: any;
  deliveryInfo: any;
  isDelivery: any;
}) => {
  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const gstAmount = (subtotal * (gstPercentage || 0)) / 100;
  const deliveryCost = isDelivery && deliveryInfo?.cost ? deliveryInfo.cost : 0;
  const grandTotal = subtotal + gstAmount + deliveryCost;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-bold text-lg mb-3">Bill Summary</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>
            {currency}
            {subtotal.toFixed(2)}
          </span>
        </div>

        {gstPercentage && (
          <div className="flex justify-between">
            <span>GST ({gstPercentage}%)</span>
            <span>
              {currency}
              {gstAmount.toFixed(2)}
            </span>
          </div>
        )}

        {isDelivery && deliveryInfo?.cost && (
          <div className="flex justify-between">
            <div>
              <span>Delivery Charge</span>
              {deliveryInfo.distance && (
                <p className="text-xs text-gray-500">
                  {deliveryInfo.distance.toFixed(1)} km × {currency}
                  {deliveryInfo.ratePerKm.toFixed(2)}/km
                </p>
              )}
            </div>
            <span>
              {currency}
              {deliveryInfo.cost.toFixed(2)}
            </span>
          </div>
        )}

        <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
          <span>Grand Total</span>
          <span>
            {currency}
            {grandTotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

const LoginCard = ({
  setShowLoginDrawer,
}: {
  setShowLoginDrawer: (show: boolean) => void;
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="font-bold text-lg mb-2">Almost there!</h3>
      <p className="text-gray-600 mb-4">
        Login/create account quickly to place order
      </p>
      <Button onClick={() => setShowLoginDrawer(true)} className="w-full">
        Proceed with Phone Number
      </Button>
    </div>
  );
};

const LoginDrawer = ({
  showLoginDrawer,
  setShowLoginDrawer,
  hotelId,
  onLoginSuccess,
}: {
  showLoginDrawer: boolean;
  setShowLoginDrawer: (show: boolean) => void;
  hotelId: string;
  onLoginSuccess: () => void;
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signInWithPhone } = useAuthStore();

  const handleLogin = async () => {
    if (!phoneNumber) {
      toast.error("Please enter your phone number");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signInWithPhone(phoneNumber, hotelId);
      if (result) {
        toast.success("Logged in successfully");
        onLoginSuccess();
        setShowLoginDrawer(false);
      } else {
        toast.error("Login failed. Please try again.");
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={showLoginDrawer} onOpenChange={setShowLoginDrawer}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Login</DialogTitle>
          <DialogDescription>
            Enter your phone number to proceed
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            type="tel"
            id="phone"
            value={phoneNumber}
            onChange={(e) =>
              setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="Enter your phone number"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowLoginDrawer(false)}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleLogin}
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Continuing...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MapModal = ({
  showMapModal,
  setShowMapModal,
  setSelectedLocation,
  setAddress,
}: {
  showMapModal: boolean;
  setShowMapModal: (show: boolean) => void;
  setSelectedLocation: (location: { lng: number; lat: number } | null) => void;
  setAddress: (address: string) => void;
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const geocoder = useRef<any | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);

  const initializeMap = async () => {
    if (!mapContainer.current || map.current) return;

    console.log("Initializing Mapbox...");

    // Try to get user location first
    const defaultCenter = [77.5946, 12.9716];
    let initialCenter = defaultCenter;

    try {
      if ("geolocation" in navigator) {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          }
        );
        initialCenter = [position.coords.longitude, position.coords.latitude];
      }
    } catch (error) {
      console.warn("Could not get user location:", error);
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialCenter as LngLatLike,
      zoom: 12,
    });

    const MapboxGeocoder = require("@mapbox/mapbox-gl-geocoder");
    // Add geocoder control
    geocoder.current = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: false,
      placeholder: "Search for places...",
    });

    map.current.addControl(geocoder.current);

    // Handle geocoder result
    geocoder.current.on("result", (e: any) => {
      const [lng, lat] = e.result.center;
      setSelectedLocation({ lng, lat });
      updateMarker(lng, lat);
      setAddress(e.result.place_name);
    });

    map.current.on("load", () => {
      setIsMapLoading(false);

      // Add click event to set marker
      map.current!.on("click", (e) => {
        const { lng, lat } = e.lngLat;
        setSelectedLocation({ lng, lat });
        updateMarker(lng, lat);
        reverseGeocode(lng, lat);
      });

      // Add geolocate control
      map.current!.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
          showUserLocation: true,
        })
      );

      // Add navigation control
      map.current!.addControl(new mapboxgl.NavigationControl());
    });

    map.current.on("error", () => {
      setIsMapLoading(false);
    });
  };

  useEffect(() => {
    if (showMapModal) {
      initializeMap();
    }
  }, [showMapModal]);

  const updateMarker = (lng: number, lat: number) => {
    if (marker.current) marker.current.remove();

    marker.current = new mapboxgl.Marker()
      .setLngLat([lng, lat])
      .addTo(map.current!);

    map.current?.flyTo({
      center: [lng, lat],
      zoom: 14,
    });
  };

  const reverseGeocode = async (lng: number, lat: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        setAddress(data.features[0].place_name);
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
  };

  return (
    <div
      className={`fixed inset-0 left-0 z-50 h-screen w-screen  ${
        showMapModal ? "" : "hidden"
      }`}
    >
      <div
        className={`fixed inset-0 bg-black/50 w-full h-full  ${
          showMapModal ? "" : "hidden"
        }`}
        onClick={() => setShowMapModal(false)}
      />

      <div className="flex items-center justify-center min-h-screen">
        <div className="relative bg-white rounded-lg max-w-screen-lg w-full h-[90vh] m-4 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-bold">Select Your Location</h2>
            <button
              onClick={() => setShowMapModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex-1">
            {/* {isMapLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 z-10">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )} */}
            <div ref={mapContainer} className="h-full w-full" />
          </div>

          <div className="p-4 border-t">
            <button
              onClick={() => setShowMapModal(false)}
              className="w-full bg-black rounded-lg text-white py-2 px-4 "
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlaceOrderModal = ({
  hotelData,
  tableNumber,
}: {
  hotelData: HotelData;
  tableNumber: number;
}) => {
  const {
    open_place_order_modal,
    setOpenPlaceOrderModal,
    items,
    orderId,
    placeOrder,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    coordinates,
    setUserCoordinates,
    setUserAddress,
    userAddress,
    clearOrder,
    deliveryInfo,
    setDeliveryInfo,
  } = useOrderStore();

  const { userData: user } = useAuthStore();
  const {
    coords,
    error: geoError,
    getLocation,
    isLoading: isGeoLoading,
  } = useLocationStore();

  const [address, setAddress] = useState(userAddress || "");
  const [selectedLocation, setSelectedLocation] = useState(coordinates || null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showLoginDrawer, setShowLoginDrawer] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const isDelivery = !tableNumber;
  const hasDelivery = hotelData?.geo_location && hotelData?.delivery_rate > 0;

  useEffect(() => {
    setAddress(userAddress || "");
    setSelectedLocation(coordinates || null);
  }, [userAddress]);

  useEffect(() => {
    calculateDeliveryDistanceAndCost(hotelData as unknown as DeliveryHotelData);
  }, [coordinates]);

  const handlePlaceOrder = async () => {
    if (isDelivery && !address) {
      toast.error("Please enter your delivery address");
      return;
    }

    if (isDelivery && hasDelivery && !selectedLocation) {
      toast.error("Please select your location");
      return;
    }

    setIsPlacingOrder(true);
    try {
      // Update address and coordinates in store
      setUserAddress(address);
      if (selectedLocation) {
        setUserCoordinates(selectedLocation);
      }

      // Calculate delivery cost if needed
      let deliveryCalculationResult = null;
      if (isDelivery && hasDelivery && selectedLocation) {
        deliveryCalculationResult = await calculateDeliveryDistanceAndCost(
          hotelData as unknown as DeliveryHotelData
        );

        if (deliveryCalculationResult) {
          setDeliveryInfo({
            cost: deliveryCalculationResult.cost,
            distance: deliveryCalculationResult.distance,
            isOutOfRange: false,
            ratePerKm: deliveryCalculationResult.ratePerKm,
          });
        }
      }

      // Place the order
      const result = await placeOrder(hotelData);
      if (result) {
        toast.success("Order placed successfully!");
        setOpenPlaceOrderModal(false);
        clearOrder();
      } else {
        toast.error("Failed to place order. Please try again.");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginDrawer(false);
    // After login, user can proceed to place order
  };

  return (
    <Dialog open={open_place_order_modal} onOpenChange={setOpenPlaceOrderModal}>
      <DialogContent className="max-w-md max-h-[100vh] overflow-y-auto z-[60] bg-gray-50">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setOpenPlaceOrderModal(false)}
              className="p-2 rounded-full hover:bg-gray-200"
            >
              <ArrowLeft size={20} />
            </button>
            <DialogTitle>Review Your Order</DialogTitle>
          </div>
        </DialogHeader>

        {(items?.length ?? 0) > 0 && (
          <div className="space-y-4">
            {/* Items Card */}
            <ItemsCard
              items={items || []}
              increaseQuantity={increaseQuantity}
              decreaseQuantity={decreaseQuantity}
              removeItem={removeItem}
              currency={hotelData?.currency || "₹"}
            />

            {/* Address Card (only for delivery) */}
            {isDelivery && (
              <AddressCard
                address={address}
                setAddress={setAddress}
                setShowMapModal={setShowMapModal}
                getLocation={getLocation}
                isGeoLoading={isGeoLoading}
                coords={selectedLocation || coords}
                geoError={geoError}
              />
            )}

            {/* Bill Card */}
            <BillCard
              items={items || []}
              currency={hotelData?.currency || "₹"}
              gstPercentage={hotelData?.gst_percentage}
              deliveryInfo={deliveryInfo}
              isDelivery={isDelivery}
            />

            {/* Login Card (if not logged in) */}
            {!user && <LoginCard setShowLoginDrawer={setShowLoginDrawer} />}

            {/* Place Order Button (if logged in) */}
            {user && (
              <Button
                onClick={handlePlaceOrder}
                className="w-full"
                disabled={
                  isPlacingOrder ||
                  (isDelivery && hasDelivery && !selectedLocation)
                }
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>
            )}
          </div>
        )}

        {/* Map Modal */}
        <MapModal
          showMapModal={showMapModal}
          setShowMapModal={setShowMapModal}
          setSelectedLocation={setSelectedLocation}
          setAddress={setAddress}
        />

        {/* Login Drawer */}
        <LoginDrawer
          showLoginDrawer={showLoginDrawer}
          setShowLoginDrawer={setShowLoginDrawer}
          hotelId={hotelData?.id}
          onLoginSuccess={handleLoginSuccess}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PlaceOrderModal;
