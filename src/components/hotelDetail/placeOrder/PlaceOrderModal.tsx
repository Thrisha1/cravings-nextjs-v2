"use client";
import useOrderStore, { OrderItem } from "@/store/orderStore";
import React, { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Loader2, ArrowLeft, MapPin, LocateFixed, X } from "lucide-react";
import { useLocationStore } from "@/store/geolocationStore";
import mapboxgl, { LngLatLike, IControl } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HotelData } from "@/app/hotels/[...id]/page";
import Link from "next/link";
import { getGstAmount, calculateDeliveryDistanceAndCost } from "../OrderDrawer";
import { QrGroup } from "@/app/admin/qr-management/page";
import { getExtraCharge } from "@/lib/getExtraCharge";
import { getFeatures } from "@/lib/getFeatures";
import DescriptionWithTextBreak from "@/components/DescriptionWithTextBreak";

// Add type for deliveryInfo
interface DeliveryInfo {
  distance: number;
  cost: number;
  ratePerKm: number;
  isOutOfRange: boolean;
}

// Add type for MapboxGeocoder
type MapboxGeocoder = IControl & {
  on: (
    event: string,
    callback: (e: {
      result: { center: [number, number]; place_name: string };
    }) => void
  ) => void;
};

// Order Type Card Component
const OrderTypeCard = ({
  orderType,
  setOrderType,
}: {
  orderType: 'takeaway' | 'delivery' | null;
  setOrderType: (type: 'takeaway' | 'delivery') => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = [
    { value: 'takeaway', label: 'Takeaway' },
    { value: 'delivery', label: 'Delivery' }
  ];

  return (
    <div className="border rounded-lg p-4 bg-white relative" ref={dropdownRef}>
      <h3 className="font-medium mb-3">Order Type</h3>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-3 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-left flex justify-between items-center"
        >
          <span>{orderType ? options.find(opt => opt.value === orderType)?.label : 'Select order type'}</span>
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
            <div
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setOrderType('takeaway');
                setIsOpen(false);
              }}
            >
              Takeaway
            </div>
            <div
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setOrderType('delivery');
                setIsOpen(false);
              }}
            >
              Delivery
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Multi WhatsApp Card Component
const MultiWhatsappCard = ({
  hotelData,
  selectedLocation,
  setSelectedLocation,
}: {
  hotelData: HotelData;
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
}) => {
  const hasMultiWhatsapp =
    getFeatures(hotelData?.feature_flags || "")?.multiwhatsapp?.enabled &&
    hotelData?.whatsapp_numbers?.length > 0;

  if (!hasMultiWhatsapp) return null;

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="border rounded-lg p-4 bg-white relative" ref={dropdownRef}>
      <h3 className="font-medium mb-3">Select Hotel Location</h3>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-3 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-left flex justify-between items-center"
        >
          <span>{selectedLocation ? selectedLocation.toUpperCase() : 'Select Area'}</span>
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
            <div
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setSelectedLocation('');
                setIsOpen(false);
              }}
            >
              Select Area
            </div>
            {hotelData.whatsapp_numbers.map((item) => (
              <div
                key={item.area}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setSelectedLocation(item.area);
                  setIsOpen(false);
                }}
              >
                {item.area.toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

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
              <DescriptionWithTextBreak
                spanClassName="text-sm text-black"
                accent="black"
                maxChars={15}
              >
                {item.name}
              </DescriptionWithTextBreak>
              <p className="text-xs text-gray-500">{item.category.name}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* <span className="font-medium">
                {currency}
                {item.price.toFixed(2)}
              </span> */}
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
  deliveryInfo: DeliveryInfo | null;
  hasLocation: boolean;
}

const AddressCard = ({
  address,
  setShowMapModal,
  setAddress,
  getLocation,
  isGeoLoading,
  geoError,
  deliveryInfo,
  hasLocation,
}: AddressCardProps) => {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

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

      <Textarea
        disabled
        value={address || ""}
        onChange={(e) => setAddress(e.target.value)}
        className="min-h-[100px] mb-3"
        placeholder="Delivery address"
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
          variant="outline"
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

      {/* Location Permission Dialog (custom, not Dialog) */}
      {showPermissionDialog && (
        <div className="fixed inset-0 z-[62] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-[90vw] max-w-md shadow-lg">
            <h1 className="text-xl font-semibold mb-2">
              Location Permission Required
            </h1>
            <p className="mb-2">
              To provide accurate delivery estimates, we need access to your
              location.
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-2">
              <li>Please don&apos;t deny the location permission</li>
              <li>
                This helps us calculate accurate{" "}
                <span className="font-medium">delivery charges</span>
              </li>
              <li>Your location is only used for this order</li>
            </ul>
            <p className="font-medium mb-4">
              Click &quot;Allow&quot; when your browser asks for permission.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowPermissionDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmPermission}>Continue</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface BillCardProps {
  items: OrderItem[];
  currency: string;
  gstPercentage?: number;
  deliveryInfo: DeliveryInfo | null;
  isDelivery: boolean;
  qrGroup: QrGroup | null;
}

const BillCard = ({
  items,
  currency,
  gstPercentage,
  deliveryInfo,
  isDelivery,
  qrGroup,
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
    } catch {
      toast.error("Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showLoginDrawer) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg p-6 w-[90vw] max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-2">Login</h2>
        <p className="text-gray-600 mb-4">Enter your phone number to proceed</p>
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
      </div>
    </div>
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
  const geocoder = useRef<MapboxGeocoder | null>(null);

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
    } catch (err) {
      console.warn("Could not get user location:", err);
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialCenter as LngLatLike,
      zoom: 12,
    });

    try {
      // Import MapboxGeocoder dynamically to avoid require() style import
      const { MapboxGeocoder } = await import("@mapbox/mapbox-gl-geocoder");
      const geocoderInstance = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
        placeholder: "Search for places...",
      }) as MapboxGeocoder;

      geocoder.current = geocoderInstance;
      map.current.addControl(geocoderInstance);

      geocoderInstance.on("result", (e) => {
        const [lng, lat] = e.result.center;
        setSelectedLocation({ lng, lat });
        updateMarker(lng, lat);
        setAddress(e.result.place_name);
      });
    } catch (err) {
      console.warn("Could not initialize geocoder:", err);
    }

    map.current.on("load", () => {
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
  };

  useEffect(() => {
    if (showMapModal) {
      initializeMap();
    }

    if (showMapModal) {
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


  return (
    <div
      className={`fixed top-0 left-0 z-[5000] h-screen w-screen ${showMapModal ? "overflow-hidden" : "hidden"
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
    totalPrice,
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
    orderNote,
    setOrderNote,
    orderType,
    setOrderType,
  } = useOrderStore();

  const { userData: user } = useAuthStore();
  const {
    error: geoError,
    getLocation,
    isLoading: isGeoLoading,
  } = useLocationStore();

  const [showMapModal, setShowMapModal] = useState(false);
  const [showLoginDrawer, setShowLoginDrawer] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Debug: Log orderId and other key values
  console.log('PlaceOrderModal state:', {
    orderId,
    itemsLength: items?.length,
    user: !!user,
    selectedLocation,
    hasMultiWhatsapp: getFeatures(hotelData?.feature_flags || "")?.multiwhatsapp?.enabled
  });

  const isDelivery = tableNumber === 0 ? orderType === 'delivery' : !tableNumber;
  const hasDelivery = hotelData?.geo_location && hotelData?.delivery_rate > 0;
  const isQrScan = qrId !== null && tableNumber !== 0;
  const hasLocation = !!selectedCoords || !!address;

  useEffect(() => {
    if (open_place_order_modal && items?.length === 0) {
      setOpenPlaceOrderModal(false);
      setOpenDrawerBottom(true);
    }
  }, [open_place_order_modal, items]);

  // Set default order type to delivery when modal opens
  useEffect(() => {
    if (open_place_order_modal && tableNumber === 0 && !orderType) {
      setOrderType('delivery');
    }
  }, [open_place_order_modal, tableNumber, orderType, setOrderType]);

  // Keyboard detection
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;

        // If visual viewport is significantly smaller than window height, keyboard is probably open
        if (windowHeight - currentHeight > 150) {
          setKeyboardOpen(true);
        } else {
          setKeyboardOpen(false);
        }
      }
    };

    // Add the event listener
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    }

    // Clean up
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  // Check if multi-whatsapp feature is enabled

  const hasMultiWhatsapp =
    getFeatures(hotelData?.feature_flags || "")?.multiwhatsapp?.enabled &&
    hotelData?.whatsapp_numbers?.length > 0;

  useEffect(() => {
    console.log('Location useEffect triggered:', {
      selectedLocation,
      hotelId: hotelData.id,
      whatsappNumbers: hotelData.whatsapp_numbers?.length
    });

    // If we already have a valid selected location, don't change it
    if (selectedLocation && hotelData.whatsapp_numbers?.some(item => item.area === selectedLocation)) {
      console.log('Valid selected location already set:', selectedLocation);
      return;
    }

    // Try to restore location from localStorage
    const savedArea = localStorage.getItem(`hotel-${hotelData.id}-selected-area`);
    console.log('Checking saved area from localStorage:', savedArea);

    if (savedArea && hotelData.whatsapp_numbers?.some(item => item.area === savedArea)) {
      console.log('Restoring location from localStorage:', savedArea);
      setSelectedLocation(savedArea);
      return;
    }

    // Get the selected location from localStorage
    const selectedPhone = localStorage.getItem(
      `hotel-${hotelData.id}-whatsapp-area`
    );

    console.log('Checking selected phone from localStorage:', selectedPhone);

    if (selectedPhone) {
      // Find the area name by phone number
      const selectedLocation = hotelData.whatsapp_numbers?.find(
        (item) => item.number === selectedPhone
      );

      if (selectedLocation) {
        console.log('Found location by phone number:', selectedLocation.area);
        setSelectedLocation(selectedLocation.area);
      }
    } else {
      // If no saved location, try to find by area name (for backward compatibility)
      console.log('No saved location found, setting empty');
      setSelectedLocation("");
    }
  }, [hotelData.id, hotelData.whatsapp_numbers, selectedLocation]);

  // Watch for user login state changes and restore location
  useEffect(() => {
    console.log('User state changed:', {
      user: !!user,
      selectedLocation,
      // hasLoggedIn // This line is removed
    });

    // If user just logged in and we have a saved location, restore it
    if (user && !selectedLocation) {
      const savedArea = localStorage.getItem(`hotel-${hotelData.id}-selected-area`);
      console.log('User logged in, checking for saved location:', savedArea);
      
      if (savedArea && hotelData.whatsapp_numbers?.some(item => item.area === savedArea)) {
        console.log('Restoring location after user login:', savedArea);
        setSelectedLocation(savedArea);
      }
    }
  }, [user, selectedLocation, hotelData.id, hotelData.whatsapp_numbers]);

  const handleSelectHotelLocation = (location: string | null) => {
    setSelectedLocation(location || "");
    
    // Save both the area name and phone number for persistence
    if (location) {
      const phoneNumber = hotelData.whatsapp_numbers?.find(
        (item) => item.area === location
      )?.number;
      
      localStorage.setItem(
        `hotel-${hotelData.id}-whatsapp-area`,
        phoneNumber || ""
      );
      localStorage.setItem(
        `hotel-${hotelData.id}-selected-area`,
        location
      );
      
      // Force a small delay to ensure localStorage is updated
      setTimeout(() => {
        console.log('Location saved to localStorage:', {
          location,
          phoneNumber,
          savedArea: localStorage.getItem(`hotel-${hotelData.id}-selected-area`)
        });
      }, 100);
    } else {
      localStorage.removeItem(`hotel-${hotelData.id}-whatsapp-area`);
      localStorage.removeItem(`hotel-${hotelData.id}-selected-area`);
    }
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
    if (isDelivery && hasDelivery && selectedCoords !== null && !isQrScan && orderType === 'delivery') {
      calculateDeliveryDistanceAndCost(hotelData as HotelData);
    }
  }, [selectedCoords, isDelivery, hasDelivery, isQrScan, orderType]);

  const handlePlaceOrder = async () => {
    if (tableNumber === 0 && !orderType) {
      toast.error("Please select an order type");
      return;
    }

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

    // Blur any focused inputs to dismiss keyboard
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
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

      // Add table 0 extra charges for delivery orders (when tableNumber is 0 and qrGroup exists)
      if (!isQrScan && tableNumber === 0 && qrGroup && qrGroup.name && orderType === 'delivery') {
        const table0ChargeAmount = getExtraCharge(
          items || [],
          qrGroup.extra_charge,
          qrGroup.charge_type || "FLAT_FEE"
        );

        if (table0ChargeAmount > 0) {
          extraCharges.push({
            name: qrGroup.name,
            amount: table0ChargeAmount,
            charge_type: qrGroup.charge_type || "FLAT_FEE",
          });
        }
      }

      if (!isQrScan && deliveryInfo?.cost && !deliveryInfo?.isOutOfRange && orderType === 'delivery') {
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
        extraCharges.length > 0 ? extraCharges : null,
        undefined, // deliveryCharge
        orderNote || "" // pass the note, always a string
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
    console.log('Login success - checking location preservation');
    const savedArea = localStorage.getItem(`hotel-${hotelData.id}-selected-area`);
    console.log('Saved area after login:', savedArea);
    
    // Ensure location is preserved after login
    if (savedArea && !selectedLocation) {
      console.log('Restoring location after login:', savedArea);
      setSelectedLocation(savedArea);
    }

    setShowLoginDrawer(false);
  };

  // Determine if place order button should be disabled

  const minimumOrderAmount =deliveryInfo?.minimumOrderAmount || 0;

  const isPlaceOrderDisabled =
    isPlacingOrder ||
    (tableNumber === 0 && !orderType) ||
    (isDelivery && hasDelivery && !selectedCoords && !isQrScan) ||
    (isDelivery && deliveryInfo?.isOutOfRange && !isQrScan) ||
    (hasMultiWhatsapp && !selectedLocation);

  return (
    <>
      <div
        className={`fixed inset-0 z-[600] bg-gray-50 overflow-y-auto text-black ${open_place_order_modal ? "block" : "hidden"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0  bg-white border-b">
          <div className="flex items-center gap-4 p-4">
            <button
              onClick={() => {
                setOpenPlaceOrderModal(false);
                setOpenDrawerBottom(true);
              }}
              className="p-2 rounded-full hover:bg-gray-200"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Review Your Order</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 pb-32">
          {(items?.length ?? 0) > 0 && (
            <div className="space-y-4 max-w-2xl mx-auto">
              {/* Items Card */}
              <ItemsCard
                items={items || []}
                increaseQuantity={increaseQuantity}
                decreaseQuantity={decreaseQuantity}
                removeItem={removeItem}
                currency={hotelData?.currency || "₹"}
              />

              {/* Order Type Card - Show only when tableNumber is 0 */}
              {tableNumber === 0 && (
                <OrderTypeCard
                  orderType={orderType}
                  setOrderType={setOrderType}
                />
              )}

              {/* Add spacing between dropdowns */}
              {tableNumber === 0 && hasMultiWhatsapp && (
                <div className="h-2"></div>
              )}

              {/* Multi WhatsApp Card - Show when multi-whatsapp is enabled */}
              <MultiWhatsappCard
                hotelData={hotelData}
                selectedLocation={selectedLocation}
                setSelectedLocation={handleSelectHotelLocation}
              />

              {/* Show table number for QR scan or address for delivery */}
              {isQrScan ? (
                <TableNumberCard tableNumber={tableNumber} />
              ) : isDelivery && orderType === 'delivery' ? (
                <AddressCard
                  address={address}
                  setAddress={setAddress}
                  setShowMapModal={setShowMapModal}
                  getLocation={getLocation}
                  isGeoLoading={isGeoLoading}
                  geoError={geoError}
                  deliveryInfo={deliveryInfo}
                  hasLocation={hasLocation}
                />
              ) : null}

              {/* Bill Card */}
              <BillCard
                items={items || []}
                currency={hotelData?.currency || "₹"}
                gstPercentage={hotelData?.gst_percentage}
                deliveryInfo={deliveryInfo}
                isDelivery={isDelivery && !isQrScan && orderType === 'delivery'}
                qrGroup={qrGroup}
              />

              {/* Note Input */}
              <div className="border rounded-lg p-4 bg-white">
                <h3 className="font-medium mb-3">Order Note</h3>
                <textarea
                  placeholder="Add any special instructions or notes for this order..."
                  value={orderNote ?? ""}
                  onChange={(e) => setOrderNote(e.target.value)}
                  className="w-full p-3 border rounded-md resize-none bg-white text-black"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-black bg-white mt-1">
                  {(orderNote ?? "").length}/500 characters
                </div>
              </div>

              {/* Login Card (if not logged in) */}
              {!user && <LoginCard setShowLoginDrawer={setShowLoginDrawer} />}

              {isDelivery && !isQrScan && orderType === 'delivery' && deliveryInfo?.isOutOfRange && (
                <div className="text-sm text-red-600 p-2 bg-red-50 rounded text-center">
                  Delivery is not available to your selected location
                </div>
              )}

              {/* minimum amount msg  */}
              {(items?.length === 0 || (isDelivery && orderType === 'delivery' && (totalPrice ?? 0) < minimumOrderAmount)) && (
                <div className="text-sm text-red-600 p-2 bg-red-50 rounded text-center">
                  Minimum order amount for delivery is{" "}
                  {hotelData?.currency || "₹"}
                  {deliveryInfo?.minimumOrderAmount.toFixed(2)}
                </div>
              )}

              

              {/* Place Order and Back Buttons */}
              <div className="flex flex-col gap-3 mt-6">
                {/* Debug: Test getWhatsappLink call */}
                {(() => {
                  console.log('Testing getWhatsappLink call...');
                  try {
                    // Add a small delay to ensure state updates are processed
                    setTimeout(() => {
                      const testLink = getWhatsappLink(orderId as string);
                      console.log('getWhatsappLink result:', testLink);
                    }, 50);
                  } catch (error) {
                    console.error('Error calling getWhatsappLink:', error);
                  }
                  return null;
                })()}

                {user ? (
                  (() => {
                    // Debug: Check current location before generating link
                    const currentSelectedArea = localStorage.getItem(`hotel-${hotelData.id}-selected-area`);
                    console.log('Current selected area before Link:', currentSelectedArea);
                    return (
                  <Link
                    href={getWhatsappLink(orderId as string)}
                    target="_blank"
                    onClick={(e) => {
                      console.log('Link clicked, orderId:', orderId);
                      console.log('getWhatsappLink function:', typeof getWhatsappLink);
                      if (isPlaceOrderDisabled) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <Button
                      onClick={handlePlaceOrder}
                      disabled={isPlaceOrderDisabled || !user || items?.length === 0 || (isDelivery && orderType === 'delivery' && (totalPrice ?? 0) < minimumOrderAmount)}
                      className="w-full"
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
                    );
                  })()
                ) : null}
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpenPlaceOrderModal(false);
                    setOpenDrawerBottom(true);
                  }}
                  className="w-full"
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer - Empty now, just for spacing */}
        <div
          className="fixed bottom-0 left-0 right-0 bg-white border-t h-4 "
          style={{
            bottom: keyboardOpen
              ? `${window.visualViewport?.offsetTop || 0}px`
              : "0",
          }}
        />

        {/* Login Drawer */}
        <LoginDrawer
          showLoginDrawer={showLoginDrawer}
          setShowLoginDrawer={setShowLoginDrawer}
          hotelId={hotelData?.id || ""}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
      {/* Map Modal */}
      {!isQrScan && (
        <MapModal
          showMapModal={showMapModal}
          setShowMapModal={setShowMapModal}
          setSelectedLocation={setSelectedCoords}
          setAddress={setAddress}
          hotelData={hotelData}
          setOpenPlaceOrderModal={setOpenPlaceOrderModal}
        />
      )}
    </>
  );
};

export default PlaceOrderModal;
