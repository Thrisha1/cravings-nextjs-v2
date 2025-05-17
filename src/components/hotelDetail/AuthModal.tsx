"use client";
import useOrderStore from "@/store/orderStore";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Styles } from "@/screens/HotelMenuPage_v2";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { HotelData } from "@/app/hotels/[...id]/page";
import { Button } from "../ui/button";
import { useAuthStore } from "@/store/authStore";
import { getFeatures } from "@/lib/getFeatures";
import { useLocationStore } from "@/store/geolocationStore";
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";

const AuthModal = ({
  styles,
  hoteldata,
  tableNumber,
}: {
  styles: Styles;
  hoteldata: HotelData;
  tableNumber: number;
}) => {
  const { open_auth_modal, setUserAddress, setOpenAuthModal } = useOrderStore();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const { coords, error: geoError, getLocation, isLoading: isGeoLoading } = useLocationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Removed the useEffect that was automatically fetching location when modal opens

  const handleSubmit = async () => {
    if (!phoneNumber) {
      toast.error("Please enter your phone number");
      return;
    }

    if (!tableNumber && !address) {
      toast.error("Please enter your delivery address");
      return;
    }

    if (!coords) {
      toast.error("Please allow location access to continue");
      return;
    }

    setIsSubmitting(true);
    try {
      setUserAddress(address);
      const result = await useAuthStore.getState().signInWithPhone(phoneNumber, hoteldata?.id);
      if (result) {
        console.log("Login successful", result);
        useOrderStore.getState().setOpenAuthModal(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open_auth_modal} onOpenChange={setOpenAuthModal}>
      <DialogContent
        className="rounded-lg"
        style={{
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          border: `${styles.border.borderWidth} ${styles.border.borderStyle} ${styles.border.borderColor}`,
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl" style={{ color: styles.accent }}>
            Please enter your details to place order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="phone" className="mb-2">
              Phone Number
            </Label>
            <Input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
              style={{
                backgroundColor: styles.backgroundColor,
                color: styles.color,
                border: `${styles.border.borderWidth} ${styles.border.borderStyle} ${styles.border.borderColor}`,
              }}
              placeholder="Enter your phone number"
            />
          </div>

          {!tableNumber && (
            <div>
              <Label htmlFor="address" className="mb-2">
                Delivery Address
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

          {/* Location Section */}
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
            <div className="p-4 rounded-lg border mt-2" style={{ borderColor: styles.border.borderColor }}>
              {isGeoLoading ? (
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Getting your location...
                </div>
              ) : coords ? (
                <div className="text-sm">
                  <div className="font-medium text-green-600">Location found</div>
                </div>
              ) : geoError ? (
                <div className="text-sm text-red-600">
                  {geoError}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  Please get your location to continue
                </div>
              )}
            </div>
          </div>

          {/* Add WhatsApp area selection if multiwhatsapp is enabled */}
          {getFeatures(hoteldata?.feature_flags || "")?.multiwhatsapp?.enabled && (
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
              >
                <option value="">Select your area</option>
                {hoteldata.whatsapp_numbers.map((number) => (
                  <option key={number.number} value={number.number}>
                    {number.area || `Area ${number.number}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            onClick={async () => {
              if (!phoneNumber) {
                alert("Please enter both phone number and address.");
                return;
              }
              if (!tableNumber && !address) {
                alert("Please enter the delivery address.");
                return;
              }
              setUserAddress(address);
              const result = await useAuthStore
                .getState()
                .signInWithPhone(phoneNumber, hoteldata?.id);
              if (result) {
                console.log("Login successful", result);
                useOrderStore.getState().setOpenAuthModal(false);
                useOrderStore.getState().setOpenOrderDrawer(true);
              }
            }}
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