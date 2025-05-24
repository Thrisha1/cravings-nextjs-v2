import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Pencil, MapPin, LocateFixed, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeliveryRules } from "@/store/orderStore";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface DeliveryAndGeoLocationSettingsProps {
  // GeoLocation props
  geoLocation: {
    latitude: number;
    longitude: number;
  };
  setGeoLocation: (location: { latitude: number; longitude: number }) => void;
  geoLoading: boolean;
  geoSaving: boolean;
  geoError: string | null;
  handleGetCurrentLocation: () => Promise<
    { latitude: number; longitude: number } | null | undefined
  >;
  handleSaveGeoLocation: (location?: {
    latitude: number;
    longitude: number;
  }) => void;

  // Delivery Settings props
  currency: {
    value: string;
  };
  deliveryRate: number;
  setDeliveryRate: (value: number) => void;
  deliveryRules: DeliveryRules;
  setDeliveryRules: (rules: DeliveryRules) => void;
  isEditingDelivery: boolean;
  setIsEditingDelivery: (value: boolean) => void;
  deliverySaving: boolean;
  handleSaveDeliverySettings: () => void;
}

export function DeliveryAndGeoLocationSettings({
  geoLocation,
  setGeoLocation,
  geoLoading,
  geoSaving,
  geoError,
  handleGetCurrentLocation,
  handleSaveGeoLocation,
  currency,
  deliveryRate,
  setDeliveryRate,
  deliveryRules,
  setDeliveryRules,
  isEditingDelivery,
  setIsEditingDelivery,
  deliverySaving,
  handleSaveDeliverySettings,
}: DeliveryAndGeoLocationSettingsProps) {
  const [showMapModal, setShowMapModal] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const geocoder = useRef<any>(null);

  // Initialize map when modal opens
  useEffect(() => {
    if (!showMapModal || !mapContainer.current) return;

    console.log("Initializing map...");

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [
        geoLocation.longitude || 77.5946,
        geoLocation.latitude || 12.9716,
      ],
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
      console.log(e.result, "result");

      const [lng, lat] = e.result.center;
      // Update or create marker
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      } else {
        marker.current = new mapboxgl.Marker()
          .setLngLat([lng, lat])
          .addTo(map.current!);
      }
      setGeoLocation({ latitude: lat, longitude: lng });
    });

    // Add marker if location exists
    if (geoLocation.latitude && geoLocation.longitude) {
      marker.current = new mapboxgl.Marker({
        color: "#FF0000",
        draggable: true,
      })
        .setLngLat([geoLocation.longitude, geoLocation.latitude])
        .addTo(map.current);
    }

    // Add click handler to update location
    map.current.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      setGeoLocation({ latitude: lat, longitude: lng });

      // Update or create marker
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      } else {
        marker.current = new mapboxgl.Marker()
          .setLngLat([lng, lat])
          .addTo(map.current!);
      }
    });

    // Add geolocate control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserLocation: true,
      })
    );

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl());

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [showMapModal]);

  return (
    <div className="space-y-8">
      {/* Geo Location Section */}
      <div className="space-y-4 w-full">
        <label htmlFor="placeId" className="text-lg font-semibold">
          Location
        </label>

        {/* Map Preview */}
        <div className="h-48 w-full rounded-md overflow-hidden relative border">
          {geoLocation.latitude && geoLocation.longitude ? (
            <div className="h-full w-full bg-gray-100 relative">
              <img
                src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+ff0000(${geoLocation.longitude},${geoLocation.latitude})/${geoLocation.longitude},${geoLocation.latitude},16/600x300?access_token=${mapboxgl.accessToken}`}
                alt="Map preview"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-full w-full bg-gray-100 flex items-center justify-center">
              <Button
                onClick={() => setShowMapModal(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Select Location on Map
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={async () => {
              const location = await handleGetCurrentLocation();
              if (location) {
                setGeoLocation(location);
                handleSaveGeoLocation(location);
              }
            }}
            variant="outline"
            className="text-xs"
            disabled={geoLoading}
          >
            {geoLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <LocateFixed className="mr-2 h-4 w-4" />
                Use Current Location
              </>
            )}
          </Button>
          <Button
            onClick={() => setShowMapModal(true)}
            variant="outline"
            className="flex items-center gap-2 text-xs bg-white"
          >
            <MapPin className="w-4 h-4" />
            Change Location
          </Button>
        </div>
        {geoError && <p className="text-sm text-red-500">{geoError}</p>}
      </div>

      {/* Delivery Settings Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Delivery Settings</h3>
          {isEditingDelivery ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditingDelivery(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveDeliverySettings}
                disabled={deliverySaving}
              >
                {deliverySaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsEditingDelivery(true)}
              variant="ghost"
              className="gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>

        {/* Delivery Rate */}
        <div className="space-y-2">
          <Label>
            Delivery Rate {deliveryRules.is_fixed_rate ? "" : "(Per Km)"} (
            {currency.value})
          </Label>
          {isEditingDelivery ? (
            <Input
              type="number"
              min="0"
              step="0.01"
              value={deliveryRate}
              onChange={(e) => setDeliveryRate(Number(e.target.value))}
            />
          ) : (
            <div className="p-3 rounded-md border bg-muted/50">
              {deliveryRate ? deliveryRate.toFixed(2) : "Not set"}
            </div>
          )}
        </div>

        {/* Delivery Rules */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Delivery Radius */}
          <div className="space-y-2">
            <Label>Delivery Radius (km)</Label>
            {isEditingDelivery ? (
              <Input
                type="number"
                min="1"
                value={deliveryRules.delivery_radius}
                onChange={(e) =>
                  setDeliveryRules({
                    ...deliveryRules,
                    delivery_radius: Number(e.target.value),
                  })
                }
              />
            ) : (
              <div className="p-3 rounded-md border bg-muted/50">
                {deliveryRules.delivery_radius} km
              </div>
            )}
          </div>

          {/* Rate Type */}
          <div className="space-y-2">
            <Label>Rate Type</Label>
            {isEditingDelivery ? (
              <Select
                value={deliveryRules.is_fixed_rate ? "fixed" : "variable"}
                onValueChange={(value) =>
                  setDeliveryRules({
                    ...deliveryRules,
                    is_fixed_rate: value === "fixed",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rate type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Rate</SelectItem>
                  <SelectItem value="variable">Variable (per km)</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="p-3 rounded-md border bg-muted/50">
                {deliveryRules.is_fixed_rate
                  ? "Fixed Rate"
                  : "Variable (per km)"}
              </div>
            )}
          </div>

          {/* First KM Range and Amount */}
          {!deliveryRules.is_fixed_rate && (
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="space-y-2">
                <Label>First KM Range</Label>
                {isEditingDelivery ? (
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={deliveryRules.first_km_range.km}
                    onChange={(e) =>
                      setDeliveryRules({
                        ...deliveryRules,
                        first_km_range: {
                          ...deliveryRules.first_km_range,
                          km: Number(e.target.value),
                        },
                      })
                    }
                    placeholder="Enter KM range"
                  />
                ) : (
                  <div className="p-3 rounded-md border bg-muted/50">
                    {deliveryRules.first_km_range.km} km
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Amount ({currency.value})</Label>
                {isEditingDelivery ? (
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={deliveryRules.first_km_range.rate}
                    onChange={(e) =>
                      setDeliveryRules({
                        ...deliveryRules,
                        first_km_range: {
                          ...deliveryRules.first_km_range,
                          rate: Number(e.target.value),
                        },
                      })
                    }
                    placeholder="Enter amount"
                  />
                ) : (
                  <div className="p-3 rounded-md border bg-muted/50">
                    {deliveryRules.first_km_range.rate.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Help Text */}
        {!isEditingDelivery && (
          <p className="text-sm text-muted-foreground">
            {deliveryRules.is_fixed_rate
              ? `Flat rate of ${currency.value}${deliveryRate.toFixed(
                  2
                )} will be applied for deliveries within ${
                  deliveryRules.delivery_radius
                } km`
              : deliveryRules.first_km_range.km > 0
              ? `First ${
                  deliveryRules.first_km_range.km
                } km will be charged at ${
                  currency.value
                }${deliveryRules.first_km_range.rate.toFixed(2)}, then ${
                  currency.value
                }${deliveryRate.toFixed(2)} per km for deliveries within ${
                  deliveryRules.delivery_radius
                } km`
              : `${currency.value}${deliveryRate.toFixed(
                  2
                )} per km will be applied for deliveries within ${
                  deliveryRules.delivery_radius
                } km`}
          </p>
        )}
      </div>

      {/* Map Modal */}

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${
          showMapModal ? "block" : "hidden"
        }`}
      >
        <div className="bg-white rounded-lg p-4 w-[90vw] h-[90vh] relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold">Select Location</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMapModal(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div
            ref={mapContainer}
            className="h-[calc(100%-8rem)] w-full rounded-md"
          />
          <div className="flex justify-between items-center mt-4">
            <div>
              {geoLocation.latitude && geoLocation.longitude && (
                <p className="text-sm text-muted-foreground">
                  Selected: {geoLocation.latitude.toFixed(6)},{" "}
                  {geoLocation.longitude.toFixed(6)}
                </p>
              )}
            </div>
            <Button
              onClick={() => {
                setShowMapModal(false);
                handleSaveGeoLocation();
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
