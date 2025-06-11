import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface LocationSettingsProps {
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
  location: string;
  setLocation: (value: string) => void;
  locationSaving: boolean;
  locationEditing: boolean;
  setIsEditingLocation: (value: boolean) => void;
  handleSaveLocation: () => void;
}

export function LocationSettings({
  geoLocation,
  setGeoLocation,
  geoLoading,
  geoSaving,
  geoError,
  handleGetCurrentLocation,
  handleSaveGeoLocation,
  location,
  setLocation,
  locationSaving,
  locationEditing,
  setIsEditingLocation,
  handleSaveLocation,
}: LocationSettingsProps) {
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
      <div className="space-y-4 w-full" id="geo_location">
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
                  <p className="text-red-600">No location set</p>
                </div>
              )}
            </div>
            {(!geoLocation.latitude || !geoLocation.longitude) && (
              <p className="text-sm text-red-500">⚠️ Location coordinates are required. Please set your restaurant location.</p>
            )}
          </div>
        )}

        {geoError && <p className="text-sm text-red-500">{geoError}</p>}
      </div>

      {/* Map Dialog */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Location on Map</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div
              ref={mapContainer}
              className="h-96 w-full rounded-md overflow-hidden"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMapDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveMapLocation} disabled={!selectedLocation}>
                Save Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 