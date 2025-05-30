"use client";
import useOrderStore, { OrderItem } from "@/store/orderStore";
import React, { useEffect, useRef, useState } from "react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";
import { getGstAmount, calculateDeliveryDistanceAndCost } from "../OrderDrawer";
import { QrGroup } from "@/app/admin/qr-management/page";
import { table } from "console";
import { getExtraCharge } from "@/lib/getExtraCharge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFeatures } from "@/lib/getFeatures";
import DescriptionWithTextBreak from "@/components/DescriptionWithTextBreak";

const ItemsCard = ({
  items,
  increaseQuantity,
  decreaseQuantity,
  removeItem,
  currency,
}: {
  items: OrderItem[];
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  removeItem: (id: string) => void;
  currency: string;
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="font-bold text-lg mb-3">Your Order</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center border-b pb-2 gap-5"
          >
            <div>
              <DescriptionWithTextBreak accent="black" maxChars={15}>
                {item.name}
              </DescriptionWithTextBreak>
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

const TableNumberCard = ({ tableNumber }: { tableNumber: number }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="font-bold text-lg mb-3">Table Information</h3>
      <div className="flex items-center gap-2">
        <span className="font-medium">Table Number:</span>
        <span className="text-lg font-bold">{tableNumber}</span>
      </div>
    </div>
  );
};

interface AddressCardProps {
  address: string | null;
  setAddress: (address: string) => void;
  setShowMapModal: (show: boolean) => void;
  getLocation: () => void;
  isGeoLoading: boolean;
  geoError: string | null;
  deliveryInfo: any;
  hasLocation: boolean;
  hotelData: HotelData;
  selectedLocation: string | null;
  setSelectedLocation: (location: string) => void;
}

const AddressCard = ({
  address,
  setShowMapModal,
  getLocation,
  isGeoLoading,
  geoError,
  deliveryInfo,
  hasLocation,
  hotelData,
  selectedLocation,
  setSelectedLocation,
}: AddressCardProps) => {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  const hasMultiWhatsapp =
    getFeatures(hotelData?.feature_flags || "")?.multiwhatsapp?.enabled &&
    hotelData?.whatsapp_numbers?.length > 0;

  const handleGetLocation = () => {
    setShowPermissionDialog(true);
  };

  const handleConfirmPermission = () => {
    setShowPermissionDialog(false);
    getLocation();
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">Delivery Address</h3>
      </div>

      {hasMultiWhatsapp && (
        <div className="mb-4">
          <Label className="flex items-center gap-2 mb-2">
            Select Hotel Location
          </Label>
          <Select
            value={selectedLocation || ""}
            onValueChange={setSelectedLocation}
          >
            <SelectTrigger className="w-full">
              {selectedLocation
                ? selectedLocation.toUpperCase()
                : "Select Area"}
            </SelectTrigger>
            <SelectContent className="z-[60]">
              {hotelData.whatsapp_numbers.map((item) => (
                <SelectItem key={item.area} value={item.area}>
                  {item.area.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Textarea
        value={address || ""}
        readOnly
        className="min-h-[100px] mb-3 bg-gray-100"
        placeholder="Select your location to see the address"
      />

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Location
        </Label>

        <Button
          type="button"
          onClick={handleGetLocation}
          className="w-full"
          variant={hasLocation ? "outline" : "outline"}
          disabled={isGeoLoading}
          style={
            !hasLocation ? { borderColor: "#ef4444", color: "#ef4444" } : {}
          }
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

        {deliveryInfo?.isOutOfRange && (
          <div className="text-sm text-red-600 p-2 bg-red-50 rounded">
            Delivery is not available to your location. Please try a different
            address.
          </div>
        )}
      </div>

      {/* Location Permission Dialog */}
      <Dialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
      >
        <DialogContent className="z-[62] h-[100dvh] w-[100dvw]">
          <DialogHeader>
            <DialogTitle></DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <h1 className="text-xl font-semibold">
              Location Permission Required
            </h1>
            <p>
              To provide accurate delivery estimates, we need access to your
              location.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Please don't deny the location permission</li>
              <li>
                This helps us calculate accurate{" "}
                <span className="font-medium">delivery charges</span>
              </li>
              <li>Your location is only used for this order</li>
            </ul>
            <p className="font-medium">
              Click "Allow" when your browser asks for permission.
            </p>
          </div>
          <DialogFooter className=" gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPermissionDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmPermission}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface BillCardProps {
  items: OrderItem[];
  currency: string;
  gstPercentage?: number;
  deliveryInfo: any;
  isDelivery: boolean;
  qrGroup: QrGroup | null;
  tableNumber?: number;
}

const BillCard = ({
  items,
  currency,
  gstPercentage,
  deliveryInfo,
  isDelivery,
  qrGroup,
  tableNumber,
}: BillCardProps) => {
  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const qrExtraCharges = qrGroup?.extra_charge
    ? getExtraCharge(
        items,
        qrGroup.extra_charge,
        qrGroup.charge_type || "FLAT_FEE"
      )
    : 0;

  const deliveryCharges =
    isDelivery && deliveryInfo?.cost && !deliveryInfo?.isOutOfRange
      ? deliveryInfo.cost
      : 0;

  const taxableAmount = subtotal + qrExtraCharges;
  const gstAmount = (taxableAmount * (gstPercentage || 0)) / 100;

  const grandTotal = subtotal + qrExtraCharges + gstAmount + deliveryCharges;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-bold text-lg mb-3">Bill Summary</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Items Subtotal</span>
          <span>
            {currency}
            {subtotal.toFixed(2)}
          </span>
        </div>

        {qrGroup && qrExtraCharges > 0 ? (
          <div className="flex justify-between">
            <div>
              <span>{qrGroup.name || "Service Charge"}</span>
              <p className="text-xs text-gray-500">
                {qrGroup.charge_type === "PER_ITEM"
                  ? "Per item charge"
                  : "Fixed charge"}
              </p>
            </div>
            <span>
              {currency}
              {qrExtraCharges.toFixed(2)}
            </span>
          </div>
        ) : null}

        {gstPercentage ? (
          <div className="flex justify-between">
            <span>GST ({gstPercentage}%)</span>
            <span>
              {currency}
              {gstAmount.toFixed(2)}
            </span>
          </div>
        ) : null}

        {isDelivery && deliveryInfo?.cost && !deliveryInfo?.isOutOfRange ? (
          <div className="flex justify-between">
            <div>
              <span>Delivery Charge</span>
            </div>
            <span>
              {currency}
              {deliveryInfo.cost.toFixed(2)}
            </span>
          </div>
        ) : null}

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
      <DialogContent className="z-[62]">
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
  hotelData,
  setOpenPlaceOrderModal,
}: {
  showMapModal: boolean;
  setShowMapModal: (show: boolean) => void;
  setSelectedLocation: (coords: { lng: number; lat: number }) => void;
  setAddress: (address: string) => void;
  hotelData: HotelData;
  setOpenPlaceOrderModal: (open: boolean) => void;
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const geocoder = useRef<any | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);

  const initializeMap = async () => {
    if (!mapContainer.current || map.current) return;

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
    geocoder.current = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: false,
      placeholder: "Search for places...",
    });

    map.current.addControl(geocoder.current);

    geocoder.current.on("result", (e: any) => {
      const [lng, lat] = e.result.center;
      setSelectedLocation({ lng, lat });
      updateMarker(lng, lat);
      setAddress(e.result.place_name);
    });

    map.current.on("load", () => {
      setIsMapLoading(false);

      map.current!.on("click", (e) => {
        const { lng, lat } = e.lngLat;
        setSelectedLocation({ lng, lat });
        updateMarker(lng, lat);
        reverseGeocode(lng, lat);

        const setCoords = useLocationStore.getState().setCoords;
        setCoords({ lat, lng });
      });

      if (hotelData?.geo_location) {
        const hotelMarker = new mapboxgl.Marker({
          color: "#FF0000",
          scale: 1.5,
        })
          .setLngLat([
            hotelData.geo_location?.coordinates[0],
            hotelData.geo_location?.coordinates[1],
          ])
          .setPopup(
            new mapboxgl.Popup({
              offset: 0,
              closeButton: false,
              closeOnClick: false,
              closeOnMove: false,
              altitude: 100,
            }).setHTML(
              `<div style="width: 50px; height: 50px; border-radius: 50%; overflow: hidden;">
                <img src="${hotelData?.store_banner}" />
              </div>`
            )
          )
          .addTo(map.current!);
        hotelMarker.togglePopup();
        hotelMarker.getElement().style.cursor = "pointer";
        hotelMarker.getElement().style.pointerEvents = "none";
      }

      map.current!.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
          showUserLocation: true,
        })
      );

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

    if (showMapModal) {
      setOpenPlaceOrderModal(false);
      document.body.style.overflowY = "hidden !important";
      document.body.style.maxHeight = "100vh";
    } else {
      document.body.style.overflowY = "auto";
      document.body.style.maxHeight = "auto";
      setOpenPlaceOrderModal(true);

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

  if (!showMapModal) return null;

  return (
    <div
      className={`fixed top-0 left-0 z-[5000] h-screen w-screen ${
        showMapModal ? "overflow-hidden" : "hidden"
      }`}
    >
     
      <div className="flex items-center justify-center min-h-screen w-screen">
        <div
          className="relative z-[5000] bg-white rounded-lg w-screen h-[100dvh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-bold">Select Your Location</h2>
            <button
              onClick={() => setShowMapModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <div ref={mapContainer} className="h-full w-full" />
          </div>

          <div className="p-4 border-t">
            <button
              onClick={() => setShowMapModal(false)}
              className="w-full bg-black rounded-lg text-white py-2 px-4"
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
  getWhatsappLink,
  qrId,
  qrGroup,
}: {
  hotelData: HotelData;
  tableNumber: number;
  getWhatsappLink: (orderId: string) => string;
  qrId: string | null;
  qrGroup: QrGroup | null;
}) => {
  const {
    open_place_order_modal,
    setOpenDrawerBottom,
    setOpenPlaceOrderModal,
    items,
    orderId,
    placeOrder,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    coordinates: selectedCoords,
    setUserCoordinates: setSelectedCoords,
    setUserAddress: setAddress,
    userAddress: address,
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

  const [showMapModal, setShowMapModal] = useState(false);
  const [showLoginDrawer, setShowLoginDrawer] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const isDelivery = !tableNumber;
  const hasDelivery = hotelData?.geo_location && hotelData?.delivery_rate > 0;
  const isQrScan = qrId !== null && tableNumber !== 0;
  const hasLocation = !!selectedCoords || !!address;

  const hasMultiWhatsapp =
    getFeatures(hotelData?.feature_flags || "")?.multiwhatsapp?.enabled &&
    hotelData?.whatsapp_numbers?.length > 0;

  useEffect(() => {
    const selectedPhone = localStorage.getItem(
      `hotel-${hotelData.id}-whatsapp-area`
    );

    const selectedLocation = hotelData.whatsapp_numbers.find(
      (item) => item.area === selectedPhone
    );

    if (selectedLocation) {
      setSelectedLocation(selectedLocation.area);
    } else {
      setSelectedLocation(null);
    }
  }, []);

  const handleSelectHotelLocation = (location: string) => {
    setSelectedLocation(location);
    const phoneNumber = hotelData.whatsapp_numbers.find(
      (item) => item.area === location
    )?.number;
    localStorage.setItem(
      `hotel-${hotelData.id}-whatsapp-area`,
      phoneNumber || ""
    );
  };

  useEffect(() => {
    const checkGeolocationPermission = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({
          name: "geolocation",
        });

        if (permissionStatus.state === "denied") {
          useLocationStore.setState({
            error:
              "Location permission is denied. Please enable it in your browser settings.",
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("Error checking geolocation permission:", error);
      }
    };

    checkGeolocationPermission();
  }, []);

  useEffect(() => {
    if (isDelivery && hasDelivery && selectedCoords !== null && !isQrScan) {
      calculateDeliveryDistanceAndCost(hotelData as HotelData);
    }
  }, [selectedCoords, isDelivery, hasDelivery, isQrScan]);

  const handlePlaceOrder = async () => {
    if (isDelivery && !address && !isQrScan) {
      toast.error("Please enter your delivery address");
      return;
    }

    if (isDelivery && hasDelivery && !selectedCoords && !isQrScan) {
      toast.error("Please select your location");
      return;
    }

    if (isDelivery && deliveryInfo?.isOutOfRange && !isQrScan) {
      toast.error("Delivery is not available to your location");
      return;
    }

    if (hasMultiWhatsapp && !selectedLocation) {
      toast.error("Please select a hotel location");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const subtotal =
        items?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;
      const gstAmount = getGstAmount(
        subtotal,
        hotelData?.gst_percentage as number
      );

      const extraCharges = [];

      if (isQrScan && qrGroup && qrGroup.name) {
        const qrChargeAmount = getExtraCharge(
          items || [],
          qrGroup.extra_charge,
          qrGroup.charge_type || "FLAT_FEE"
        );

        if (qrChargeAmount > 0) {
          extraCharges.push({
            name: qrGroup.name,
            amount: qrChargeAmount,
            charge_type: qrGroup.charge_type || "FLAT_FEE",
          });
        }
      }

      if (!isQrScan && deliveryInfo?.cost && !deliveryInfo?.isOutOfRange) {
        extraCharges.push({
          name: "Delivery Charge",
          amount: deliveryInfo.cost,
          charge_type: "FLAT_FEE",
        });
      }

      const result = await placeOrder(
        hotelData,
        tableNumber,
        qrId as string,
        gstAmount,
        extraCharges.length > 0 ? extraCharges : null
      );

      if (result) {
        toast.success("Order placed successfully!");
        clearOrder();
      } else {
        toast.error("Failed to place order. Please try again.");
      }
      setOpenPlaceOrderModal(false);
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginDrawer(false);
  };

  useEffect(() => {
    if (items?.length === 0) {
      setOpenPlaceOrderModal(false);
      setOpenDrawerBottom(true);
      return;
    }
  }, [items]);

  const isPlaceOrderDisabled =
    isPlacingOrder ||
    (isDelivery && hasDelivery && !selectedCoords && !isQrScan) ||
    (isDelivery && deliveryInfo?.isOutOfRange && !isQrScan) ||
    (hasMultiWhatsapp && !selectedLocation);

  return (
    <>
     
        <MapModal
          setOpenPlaceOrderModal={setOpenPlaceOrderModal}
          showMapModal={showMapModal}
          setShowMapModal={setShowMapModal}
          setSelectedLocation={setSelectedCoords}
          setAddress={setAddress}
          hotelData={hotelData}
        />
  
      <Dialog
        open={open_place_order_modal}
        onOpenChange={setOpenPlaceOrderModal}
      >
        <DialogContent className="w-screen h-[100dvh] overflow-y-auto z-[60] bg-gray-50">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setOpenPlaceOrderModal(false);
                  setOpenDrawerBottom(true);
                }}
                className="p-2 rounded-full hover:bg-gray-200"
              >
                <ArrowLeft size={20} />
              </button>
              <DialogTitle>Review Your Order</DialogTitle>
            </div>
          </DialogHeader>

          {(items?.length ?? 0) > 0 && (
            <div className="space-y-4">
              <ItemsCard
                items={items || []}
                increaseQuantity={increaseQuantity}
                decreaseQuantity={decreaseQuantity}
                removeItem={removeItem}
                currency={hotelData?.currency || "₹"}
              />

              {isQrScan ? (
                <TableNumberCard tableNumber={tableNumber} />
              ) : isDelivery ? (
                <AddressCard
                  address={address}
                  setAddress={setAddress}
                  setShowMapModal={setShowMapModal}
                  getLocation={getLocation}
                  isGeoLoading={isGeoLoading}
                  geoError={geoError}
                  deliveryInfo={deliveryInfo}
                  hasLocation={hasLocation}
                  hotelData={hotelData}
                  selectedLocation={selectedLocation}
                  setSelectedLocation={handleSelectHotelLocation}
                />
              ) : null}

              <BillCard
                items={items || []}
                currency={hotelData?.currency || "₹"}
                gstPercentage={hotelData?.gst_percentage}
                deliveryInfo={deliveryInfo}
                isDelivery={isDelivery && !isQrScan}
                qrGroup={qrGroup}
                tableNumber={tableNumber}
              />

              {!user && <LoginCard setShowLoginDrawer={setShowLoginDrawer} />}

              {user && !isPlaceOrderDisabled ? (
                <>
                  <div></div>
                  <Link
                    className="pt-4"
                    href={getWhatsappLink(orderId as string)}
                    target="_blank"
                  >
                    <Button
                      onClick={handlePlaceOrder}
                      className="w-full"
                      disabled={isPlaceOrderDisabled || !user}
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
                  </Link>
                </>
              ) : (
                <Button
                  className="w-full"
                  disabled={isPlaceOrderDisabled || !user}
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

              {isDelivery && !isQrScan && deliveryInfo?.isOutOfRange && (
                <div className="text-sm text-red-600 p-2 bg-red-50 rounded text-center">
                  Delivery is not available to your selected location
                </div>
              )}
            </div>
          )}

          <LoginDrawer
            showLoginDrawer={showLoginDrawer}
            setShowLoginDrawer={setShowLoginDrawer}
            hotelId={hotelData?.id || ""}
            onLoginSuccess={handleLoginSuccess}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlaceOrderModal;
