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
              onChange={(e) => setPhoneNumber(e.target.value)}
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

          {/* Add WhatsApp area selection if multiwhatsapp is enabled */}
          {getFeatures(hoteldata?.feature_flags || "").multiwhatsapp
            .enabled && (
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
              }
            }}
            className="w-full"
            style={{
              backgroundColor: styles.accent,
              color: "#fff",
            }}
          >
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
