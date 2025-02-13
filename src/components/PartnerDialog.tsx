"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";
import { useLocationStore } from "@/store/locationStore";
import { MapPin } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { resolveShortUrl } from "@/app/actions/extractLatLonFromGoogleMapsUrl";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function PartnerDialog() {
  const router = useRouter();
  const { signInWithGoogleForPartner } = useAuthStore();
  const { locations } = useLocationStore();
  const [formData, setFormData] = useState({
    hotelName: "",
    area: "",
    location: "",
    category: "hotel",
    phone: "",
    upiId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateUpiId = (upiId: string) => {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
    return upiRegex.test(upiId);
  };

  const validateForm = async() => {
    if (!validateUpiId(formData.upiId)) {
      setError("Please enter a valid UPI ID (format: username@bankname)");
      return false;
    }

    if (!formData.hotelName || !formData.area || !formData.location || !formData.phone || !formData.upiId) {
      setError("Please fill in all required fields");
      return false;
    }
    const urlWithCoordinates = await resolveShortUrl(formData.location);
      
      // Save form data to localStorage
      localStorage.setItem("partnerFormData", JSON.stringify({
        ...formData,
        location: urlWithCoordinates ?? formData.location
      }));
    return true;
  };
  

  const handleGoogleSignIn = async () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      

      // Initiate Google sign in
      await signInWithGoogleForPartner(
        formData.hotelName,
        formData.area,
        formData.location,
        formData.category,
        formData.phone,
        formData.upiId
      );
      router.push("/admin");
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openGoogleMaps = () => {
    window.open("https://www.google.com/maps", "_blank");
  };

  return (
    <div className="bg-white rounded-lg h-full flex flex-col">
      <div className="px-6 pt-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Register as Partner
        </h2>
      </div>
      <ScrollArea className="flex-1 px-6">
        <form onSubmit={handleGoogleSignIn} className="space-y-6 pb-10 px-2">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="hotelName" className="text-sm font-medium text-gray-700">
              Business Name
            </Label>
            <Input
              id="hotelName"
              placeholder="Enter your business name"
              value={formData.hotelName}
              onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="upiId" className="text-sm font-medium text-gray-700">
              UPI ID
            </Label>
            <Input
              id="upiId"
              placeholder="Enter your UPI ID (e.g. username@bankname)"
              value={formData.upiId}
              onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area" className="text-sm font-medium text-gray-700">
              Area
            </Label>
            <Select
              value={formData.area}
              onValueChange={(value) => setFormData({ ...formData, area: value })}
            >
              <SelectTrigger id="area" className="w-full">
                <SelectValue placeholder="Select your area" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium text-gray-700">
              Google Map Location
            </Label>
            <div className="relative">
              <Textarea
                id="location"
                placeholder="Paste your gmap location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="min-h-[100px] pr-10"
                required
              />
              <Button
                type="button"
                className="absolute right-2 top-2"
                onClick={openGoogleMaps}
              >
                <MapPin className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 mt-6 text-black bg-white hover:bg-gray-50 border-[1px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "Please wait..."
            ) : (
              <>
                <Image
                  width={5}
                  height={5}
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  className="w-5 h-5"
                />
                Sign up with Google
              </>
            )}
          </Button>
        </form>
      </ScrollArea>
    </div>
  );
}
