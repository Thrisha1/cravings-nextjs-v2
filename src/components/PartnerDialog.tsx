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
// import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";


export function PartnerDialog() {
  const router = useRouter();
  const { signUpWithEmailForPartner, loading } =
    useAuthStore();
  const { locationData, countries } = useLocationStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    hotelName: "",
    area: "", 
    location: "",
    phone: "",
    upiId: "",
    isInIndia: true,
    state: "",
    country: "India",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [authMethod, setAuthMethod] = useState<"google" | "email">("google");

  // const validateUpiId = (upiId: string) => {
  //   const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
  //   return upiRegex.test(upiId);
  // };

  const validateForm = async () => {
    // if (!validateUpiId(formData.upiId)) {
    //   setError("Please enter a valid UPI ID (format: username@bankname)");
    //   setIsSubmitting(false);
    //   return false;
    // }

    if (
      !formData.hotelName ||
      !formData.location ||
      !formData.phone ||
      !formData.country ||
      (formData.country === "India" && (!formData.state || !formData.area))
    ) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return false;
    }
    const urlWithCoordinates = await resolveShortUrl(formData.location);

    // Save form data to localStorage
    localStorage.setItem(
      "partnerFormData",
      JSON.stringify({
        ...formData,
        location: urlWithCoordinates ?? formData.location,
      })
    );
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!(await validateForm())) {
      return;
    }

    try {
        await signUpWithEmailForPartner(
          formData.hotelName,
          formData.phone,
          formData.upiId,
          formData.area,
          formData.location,
          formData.email,
          formData.password,
          formData.country,
          formData.state
        );
        toast.success("Account created successfully!");
        setTimeout(() => {
          router.push("/admin");
        }, 1000);
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      setIsSubmitting(false);
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
      <ScrollArea className="flex-1 px-6 mt-5">
        <form className="space-y-6 pb-10 px-2">
          

          <div className="space-y-2">
            <Label
              htmlFor="hotelName"
              className="text-sm font-medium text-gray-700"
            >
              Business Name
            </Label>
            <Input
              id="hotelName"
              placeholder="Enter your business name"
              value={formData.hotelName}
              onChange={(e) =>
                setFormData({ ...formData, hotelName: e.target.value })
              }
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="phone"
              className="text-sm font-medium text-gray-700"
            >
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full"
              required
            />
          </div>

          {/* <div className="space-y-2">
            <Label
              htmlFor="upiId"
              className="text-sm font-medium text-gray-700"
            >
              UPI ID
            </Label>
            <Input
              id="upiId"
              placeholder="Enter your UPI ID (e.g. username@bankname)"
              value={formData.upiId}
              onChange={(e) =>
                setFormData({ ...formData, upiId: e.target.value })
              }
              className="w-full"
              required
            />
          </div> */}

          <div className="space-y-2">
            <div className="flex items-center justify-between space-x-2 mb-4">
              <Label htmlFor="location-type" className="text-sm text-gray-600">
                Is your business located in India?
              </Label>
              <Switch
                id="location-type"
                checked={formData.isInIndia}
                onCheckedChange={(checked) =>
                  setFormData({ 
                    ...formData, 
                    isInIndia: checked, 
                    state: "", 
                    area: "", 
                    country: checked ? "India" : "" 
                  })
                }
                className="data-[state=checked]:bg-orange-600"
              />
            </div>

            {formData.isInIndia ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                    State
                  </Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) =>
                      setFormData({ ...formData, state: value, area: "" })
                    }
                  >
                    <SelectTrigger id="state" className="w-full">
                      <SelectValue placeholder="Select your state" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationData.map((stateData) => (
                        <SelectItem key={stateData.state} value={stateData.state}>
                          {stateData.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area" className="text-sm font-medium text-gray-700">
                    District
                  </Label>
                  <Select
                    value={formData.area}
                    onValueChange={(value) =>
                      setFormData({ ...formData, area: value })
                    }
                    disabled={!formData.state}
                  >
                    <SelectTrigger id="area" className="w-full">
                      <SelectValue placeholder="Select your district" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.state &&
                        locationData
                          .find((state) => state.state === formData.state)
                          ?.districts.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                  Country
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) =>
                    setFormData({ ...formData, country: value })
                  }
                >
                  <SelectTrigger id="country" className="w-full">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country: string) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="location"
              className="text-sm font-medium text-gray-700"
            >
              Google Map Location
            </Label>
            <div className="relative">
              <Textarea
                id="location"
                placeholder="Paste your gmap location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
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

          {/* <div className="flex items-center justify-between space-x-2 mt-6">
            <Label htmlFor="auth-method" className="text-sm text-gray-600">
              {"Sign up with Email"}
            </Label>
            <Switch
              id="auth-method"
              checked={authMethod === "email"}
              onCheckedChange={(checked) =>
                setAuthMethod(checked ? "email" : "google")
              }
              className="data-[state=checked]:bg-orange-600"
            />
          </div> */}
            <>
              <div className="space-y-2 text-gray-700">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2 text-gray-700">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={6}
                />
              </div>
            </>

            {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <Button
            onClick={(e)=>handleSubmit(e)}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
            disabled={isSubmitting}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800"></div>
            ): (
              "Sign up with Email"
            )}
          </Button>
        </form>
      </ScrollArea>
    </div>
  );
}
