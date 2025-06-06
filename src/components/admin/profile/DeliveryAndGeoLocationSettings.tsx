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
  location: string;
  setLocation: (value: string) => void;
  locationSaving: boolean;
  locationEditing: boolean;
  setIsEditingLocation: (value: boolean) => void;
  handleSaveLocation: () => void;
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
  location,
  setLocation,
  locationSaving,
  locationEditing,
  setIsEditingLocation,
  handleSaveLocation,
}: DeliveryAndGeoLocationSettingsProps) {
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [marker, setMarker] = useState<mapboxgl.Marker | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (mapDialogOpen && mapContainer.current && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [
          geoLocation.longitude || 77.5946,
          geoLocation.latitude || 12.9716,
        ], // Default to Bangalore if no location
        zoom: 14,
      });

      // Add marker if geoLocation exists
      if (geoLocation.latitude && geoLocation.longitude) {
        const newMarker = new mapboxgl.Marker()
          .setLngLat([geoLocation.longitude, geoLocation.latitude])
          .addTo(map.current);
        setMarker(newMarker);
      }

      // Add click event to place marker
      map.current.on("click", (e) => {
        if (marker) {
          marker.remove();
        }
        const newMarker = new mapboxgl.Marker()
          .setLngLat(e.lngLat)
          .addTo(map.current!);
        setMarker(newMarker);
        setSelectedLocation({
          lat: e.lngLat.lat,
          lng: e.lngLat.lng,
        });
      });

      return () => {
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    }
  }, [mapDialogOpen, geoLocation]);

  const handleSaveMapLocation = () => {
    if (selectedLocation) {
      setGeoLocation({
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
      });
      handleSaveGeoLocation({
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
      });
      setMapDialogOpen(false);
    }
  };

  return (
    <div className="space-y-8 pt-2">
      {/* Geo Location Section */}
      <div className="space-y-4 w-full">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Location</h3>
          {locationEditing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditingLocation(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveLocation} disabled={locationSaving}>
                {locationSaving ? (
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
              onClick={() => setIsEditingLocation(true)}
              variant="ghost"
              className="gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>

        {locationEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Location Link</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter your location link"
              />
              <div className="h-px"></div>
              <a className="text-orange-600 underline" href="https://www.google.com/maps">Get Link {"-->"} </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            
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
                  <p className="text-muted-foreground">No location set</p>
                </div>
              )}
            </div>
          </div>
        )}

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
            {currency?.value})
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
                <Label>Amount ({currency?.value})</Label>
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
              ? `Flat rate of ${currency?.value}${deliveryRate.toFixed(
                  2
                )} will be applied for deliveries within ${
                  deliveryRules.delivery_radius
                } km`
              : deliveryRules.first_km_range.km > 0
              ? `First ${
                  deliveryRules.first_km_range.km
                } km will be charged at ${
                  currency?.value
                }${deliveryRules.first_km_range.rate.toFixed(2)}, then ${
                  currency?.value
                }${deliveryRate.toFixed(2)} per km for deliveries within ${
                  deliveryRules.delivery_radius
                } km`
              : `${currency?.value}${deliveryRate.toFixed(
                  2
                )} per km will be applied for deliveries within ${
                  deliveryRules.delivery_radius
                } km`}
          </p>
        )}
      </div>

      {/* Map Dialog */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Your Location</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-[calc(80vh-100px)]">
            <div
              ref={mapContainer}
              className="flex-1 rounded-md overflow-hidden"
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setMapDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveMapLocation}
                disabled={!selectedLocation}
              >
                Save Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
