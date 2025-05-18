"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UtensilsCrossed,
  Tag,
  LogOutIcon,
  Pencil,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { Partner, useAuthStore } from "@/store/authStore";
import { useLocationStore } from "@/store/geolocationStore";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import OfferLoadinPage from "@/components/OfferLoadinPage";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { AlertDialogCancel } from "@radix-ui/react-alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
// import Image from "next/image";
import { deleteFileFromS3, uploadFileToS3 } from "../actions/aws-s3";
import { deleteUserMutation } from "@/api/auth";
import { updatePartnerMutation } from "@/api/partners";
import { fetchFromHasura } from "@/lib/hasuraClient";
import Link from "next/link";
import { useClaimedOffersStore } from "@/store/claimedOfferStore_hasura";
import { revalidateTag } from "../actions/revalidate";
import { processImage } from "@/lib/processImage";
import { Textarea } from "@/components/ui/textarea";
import Img from "@/components/Img";
import { Select } from "@radix-ui/react-select";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { HotelData, SocialLinks } from "../hotels/[...id]/page";
import { getSocialLinks } from "@/lib/getSocialLinks";
import { FeatureFlags, getFeatures, revertFeatureToString } from "@/lib/getFeatures";
import { updateAuthCookie } from "../auth/actions";

interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number];
}

const Currencies = [
  { label: "INR", value: "₹" },
  { label: "USD", value: "$" },
  { label: "SR", value: "SR" },
  { label: "AED", value: "AED" },
  { label: "EUR", value: "€" },
  { label: "GBP", value: "£" },
  { label: "KWD", value: "د.ك" },
  { label: "BHD", value: "د.ب" },
  { label: "None", value: " " },
];

export default function ProfilePage() {
  const { userData, loading: authLoading, signOut, setState } = useAuthStore();
  const {
    coords,
    geoString,
    error: geoError,
    getLocation,
  } = useLocationStore();
  const [deliveryRate, setDeliveryRate] = useState<number>(0);
  const [geoLocation, setGeoLocation] = useState({
    latitude: "",
    longitude: "",
  });
  const { claimedOffers } = useClaimedOffersStore();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upiId, setUpiId] = useState("");
  const [isSaving, setIsSaving] = useState({
    upiId: false,
    placeId: false,
    description: false,
    currency: false,
    whatsappNumber: false,
    footNote: false,
    geoLocation: false,
    deliveryRate: false,
    instaLink: false,
    gst: false,
  });
  const [isEditing, setIsEditing] = useState({
    upiId: false,
    placeId: false,
    description: false,
    whatsappNumber: false,
    currency: false,
    footNote: false,
    geoLocation: false,
    deliveryRate: false,
    instaLink: false,
    gst: false,
  });
  const [placeId, setPlaceId] = useState("");
  const [gst, setGst] = useState({
    gst_no: "",
    gst_percentage: 0,
    enabled: false,
  });
  const [description, setDescription] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappNumbers, setWhatsappNumbers] = useState<
    { number: string; area: string }[]
  >([]);
  const [currency, setCurrency] = useState(Currencies[0]);
  const [bannerImage, setBannerImage] = useState<string | null>(
    userData?.role === "partner" ? userData.store_banner || null : null
  );
  const [isBannerUploading, setBannerUploading] = useState(false);
  const [isBannerChanged, setIsBannerChanged] = useState(false);
  const [showPricing, setShowPricing] = useState(true);
  const [features, setFeatures] = useState<FeatureFlags | null>(null);
  const [userFeatures, setUserFeatures] = useState<FeatureFlags | null>(null);
  const [footNote, setFootNote] = useState<string>("");
  const [instaLink, setInstaLink] = useState<string>("");

  const isLoading = authLoading;

  useEffect(() => {
    if (userData?.role === "partner") {
      // console.log("Debug - UserData:", {
      //   delivery_rate: userData.delivery_rate,
      //   geo_location: userData.geo_location,
      //   raw_userData: userData
      // });

      setBannerImage(userData.store_banner || null);
      setUpiId(userData.upi_id || "");
      setPlaceId(userData.place_id || "");
      setDescription(userData.description || "");
      
      // Debug log before setting delivery rate
      console.log("Debug - Setting delivery rate:", userData.delivery_rate);
      const deliveryRateValue = typeof userData.delivery_rate === 'number' ? userData.delivery_rate : 
                              typeof userData.delivery_rate === 'string' ? parseFloat(userData.delivery_rate) : 0;
      setDeliveryRate(deliveryRateValue);
      console.log("Debug - Delivery rate set to:", deliveryRateValue);

      setCurrency(
        Currencies.find(
          (curr) => curr.value === userData.currency
        ) as (typeof Currencies)[0]
      );
      setShowPricing(userData.currency === "🚫" ? false : true);
      setFeatures(
        userData?.role === "partner"
          ? getFeatures(userData.feature_flags || "")
          : null
      );
      setWhatsappNumber(
        userData.whatsapp_numbers[0]?.number || userData.phone || ""
      );
      setWhatsappNumbers(
        userData.whatsapp_numbers?.length > 0
          ? userData.whatsapp_numbers
          : [{ number: userData.phone || "", area: "default" }]
      );
      setFootNote(userData.footnote || "");
      const socialLinks = getSocialLinks(userData as HotelData);
      setInstaLink(socialLinks.instagram || "");
      setGst({
        gst_no: userData.gst_no || "",
        gst_percentage: userData.gst_percentage || 0,
        enabled: (userData.gst_percentage || 0) > 0 ? true : false,
      });
      setIsShopOpen(userData.is_shop_open);

      // Debug log before setting geo location
      // console.log("Debug - Setting geo location:", userData.geo_location);
      
      // Initialize location from userData.geo_location
      if (userData.geo_location) {
        try {
          let lat, lng;
          const geoLocationData = userData.geo_location;
          console.log("Debug - Geo location data type:", typeof geoLocationData);

          if (typeof geoLocationData === 'string') {
            // Handle string format (SRID or GeoJSON string)
            if (geoLocationData.includes('POINT')) {
              // Handle SRID format: SRID=4326;POINT(lng lat)
              const match = geoLocationData.match(/POINT\(([^ ]+) ([^)]+)\)/);
              console.log("Debug - POINT match:", match);
              if (match) {
                [, lng, lat] = match;
              }
            } else {
              try {
                // Handle GeoJSON string format
                const geoJson = JSON.parse(geoLocationData) as GeoJSONPoint;
                if (geoJson.type === 'Point' && Array.isArray(geoJson.coordinates)) {
                  [lng, lat] = geoJson.coordinates;
                }
              } catch (e) {
                console.error("Debug - Failed to parse GeoJSON string:", e);
              }
            }
          } else if (typeof geoLocationData === 'object') {
            // Handle object format (GeoJSON object)
            const geoJson = geoLocationData as GeoJSONPoint;
            if (geoJson.type === 'Point' && Array.isArray(geoJson.coordinates)) {
              [lng, lat] = geoJson.coordinates;
            }
          }
          
          console.log("Debug - Extracted coordinates:", { lat, lng });
          
          if (lat && lng) {
            const newGeoLocation = {
              latitude: lat.toString(),
              longitude: lng.toString()
            };
            console.log("Debug - Setting new geo location:", newGeoLocation);
            setGeoLocation(newGeoLocation);
          }
        } catch (error) {
          console.error('Debug - Error parsing location:', error);
        }
      }
    }
  }, [userData]);

  // Add effect to log state changes
  useEffect(() => {
    console.log("Debug - Current state:", {
      deliveryRate,
      geoLocation,
      isEditing: {
        deliveryRate: isEditing.deliveryRate,
        geoLocation: isEditing.geoLocation
      }
    });
  }, [deliveryRate, geoLocation, isEditing.deliveryRate, isEditing.geoLocation]);

  const profile = {
    name:
      userData?.role === "partner"
        ? userData?.name
        : userData?.role === "user"
        ? userData?.full_name
        : userData?.role === "superadmin"
        ? "Super Admin"
        : "Guest",
    offersClaimed: claimedOffers.length || 0,
    restaurantsSubscribed: 0,
    claimedOffers: claimedOffers.map((offer) => ({
      id: offer.id,
      foodName: offer.offer?.menu.name,
      restaurant: offer.partner?.store_name,
      originalPrice: offer.offer?.menu.price,
      newPrice: offer.offer?.offer_price,
    })),
  };

  const handleDeleteAccount = async () => {
    if (!userData) {
      setError("No user is currently logged in.");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await fetchFromHasura(deleteUserMutation, {
        id: userData?.id,
      });
      revalidateTag(userData?.id as string);
      signOut();
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      setError("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      console.log("Fetching location...");
      
      const newCoords = await getLocation();
      
      if (newCoords) {
        console.log("Location received:", newCoords);
        setGeoLocation({
          latitude: newCoords.lat.toString(),
          longitude: newCoords.lng.toString()
        });
      }
    } catch (error) {
      console.error("Error getting location:", error);
      toast.error(error instanceof Error ? error.message : "Failed to get location");
    }
  };
  
  // Also add this effect to watch store changes
  useEffect(() => {
    console.log("Store changed:", {
      coords,
      geoString,
      error
    });
  
    if (coords && isEditing.geoLocation) {
      console.log("Updating geoLocation from store:", {
        lat: coords.lat,
        lng: coords.lng
      });
  
      setGeoLocation({
        latitude: coords.lat.toString(),
        longitude: coords.lng.toString()
      });
    }
  }, [coords, geoString, error, isEditing.geoLocation]);

  const handleSaveGeoLocation = async () => {
    try {
      const { latitude, longitude } = geoLocation;

      // Validate coordinates are present
      if (!latitude || !longitude) {
        toast.error("Please enter both latitude and longitude");
        return;
      }

      // Convert to numbers and validate ranges
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        toast.error("Please enter valid numeric coordinates");
        return;
      }

      // Validate coordinate ranges
      if (lat < -90 || lat > 90) {
        toast.error("Latitude must be between -90 and 90 degrees");
        return;
      }

      if (lng < -180 || lng > 180) {
        toast.error("Longitude must be between -180 and 180 degrees");
        return;
      }

      // Create GeoJSON format for the point
      const geoJsonPoint = {
        type: "Point",
        coordinates: [lng, lat],
        crs: {
          type: "name",
          properties: {
            name: "urn:ogc:def:crs:OGC:1.3:CRS84"
          }
        }
      };

      const geoJsonString = JSON.stringify(geoJsonPoint);
      console.log("Saving location with format:", geoJsonString); // Debug log

      setIsSaving((prev) => ({ ...prev, geoLocation: true }));
      toast.loading("Updating location...");

      const response = await fetchFromHasura(updatePartnerMutation, {
        id: userData?.id,
        updates: {
          geo_location: geoJsonString,
        },
      });
      revalidateTag(userData?.id as string);

      console.log("Hasura response:", response); // Debug log

      if (!response) {
        throw new Error("No response from server");
      }

      // Update local state with the SRID format for display
      const geographyFormat = `SRID=4326;POINT(${lng} ${lat})`;
      setState({ geo_location: geographyFormat });
      toast.dismiss();
      toast.success("Location updated successfully!");
      setIsEditing((prev) => ({ ...prev, geoLocation: false }));
    } catch (error) {
      console.error("Error updating location:", error);
      toast.dismiss();
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes("permission denied")) {
          toast.error("You don't have permission to update the location");
        } else if (error.message.includes("invalid input syntax")) {
          toast.error("Invalid coordinate format. Please check your input");
        } else {
          toast.error(`Failed to update location: ${error.message}`);
        }
      } else {
        toast.error("Failed to update location. Please try again.");
      }
    } finally {
      setIsSaving((prev) => ({ ...prev, geoLocation: false }));
    }
  };
  

  const handleSaveUpiId = async () => {
    if (!userData) return;

    setIsSaving((prev) => {
      return { ...prev, upiId: true };
    });
    try {
      await fetchFromHasura(updatePartnerMutation, {
        id: userData?.id,
        updates: upiId,
      });
      revalidateTag(userData?.id as string);
      setState({ upi_id: upiId });
      toast.success("UPI ID updated successfully!");
      setIsEditing((prev) => {
        return { ...prev, upiId: false };
      });
    } catch (error) {
      console.error("Error updating UPI ID:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update UPI ID"
      );
    } finally {
      setIsSaving((prev) => ({ ...prev, upiId: false }));
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = e.target.files;
      if (!files || !files[0]) return;
      const file = files[0];

      //convert to local blob
      const blobUrl = URL.createObjectURL(file);
      setBannerImage(blobUrl);

      setIsBannerChanged(true);
    } catch (error) {
      console.error("Error updating banner:", error);
    }
  };

  const handleBannerUpload = async () => {
    if (!userData) return;

    setBannerUploading(true);
    try {
      toast.loading("Updating banner...");

      const webpBase64WithPrefix = await processImage(
        bannerImage as string,
        "local"
      );

      const prevImgUrl =
        userData.role === "partner" ? userData?.store_banner : "";

      //Has previous uploaded image delete it
      if (prevImgUrl?.includes("cravingsbucket")) {
        await deleteFileFromS3(prevImgUrl);
      }

      let nextVersion = "v0";

      // Check if the image URL already has a version number
      if (prevImgUrl) {
        const onlyImageName = prevImgUrl
          .split(
            "https://cravingsbucket.s3.ap-southeast-2.amazonaws.com/hotel_banners/"
          )
          .pop();

        if (onlyImageName && onlyImageName.includes("_v")) {
          const versionPart = onlyImageName.split("_v").pop();
          const removedExtension = versionPart?.split(".").shift();
          const versionNumber = parseInt(removedExtension || "0");

          const incrementedVersion = versionNumber + 1;
          nextVersion = `v${incrementedVersion}`;
        } else {
          nextVersion = "v0";
        }
      }

      // Upload to S3
      const imgUrl = await uploadFileToS3(
        webpBase64WithPrefix,
        `hotel_banners/${userData.id + "_" + nextVersion}.webp`
      );

      setBannerImage(imgUrl);
      setState({ store_banner: imgUrl });

      if (!imgUrl) {
        throw new Error("Failed to upload image to S3");
      }
      // // console.log("Image uploaded to S3:", imgUrl);

      // Update user data
      await fetchFromHasura(updatePartnerMutation, {
        id: userData?.id,
        updates: {
          store_banner: imgUrl,
        },
      });
      toast.dismiss();
      toast.success("Banner updated successfully!");
      revalidateTag(userData?.id as string);
      setIsBannerChanged(false);
    } catch (error) {
      toast.dismiss();
      console.error("Error updating banner:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update banner"
      );
    } finally {
      setBannerUploading(false);
    }
  };

  const handleSavePlaceId = async () => {
    try {
      if (!userData) return;
      toast.loading("Updating Place ID...");

      if (!placeId) {
        toast.dismiss();
        toast.error("Please enter a valid Place ID");
        return;
      }

      setIsSaving((prev) => {
        return { ...prev, placeId: true };
      });
      await fetchFromHasura(updatePartnerMutation, {
        id: userData?.id,
        updates: {
          place_id: placeId,
        },
      });
      revalidateTag(userData?.id as string);
      setState({ place_id: placeId });
      toast.dismiss();
      toast.success("Place ID updated successfully!");
      setIsSaving((prev) => {
        return { ...prev, placeId: false };
      });
      setIsEditing((prev) => {
        return { ...prev, placeId: false };
      });
    } catch (error) {
      setIsSaving((prev) => {
        return { ...prev, placeId: false };
      });
      setIsEditing((prev) => {
        return { ...prev, placeId: false };
      });
      toast.dismiss();
      toast.error("Failed to update Place ID");
      console.error("Error updating Place ID:", error);
    }
  };

  const handleSaveCurrency = async () => {
    try {
      if (!userData) return;
      toast.loading("Updating Currency...");

      if (!currency) {
        toast.dismiss();
        toast.error("Please enter a valid Currency");
        return;
      }

      setIsSaving((prev) => {
        return { ...prev, currency: true };
      });
      await fetchFromHasura(updatePartnerMutation, {
        id: userData?.id,
        updates: {
          currency: currency.value,
        },
      });
      revalidateTag(userData?.id as string);
      setState({ currency: currency.value });
      toast.dismiss();
      toast.success("Curreny updated successfully!");
      setIsSaving((prev) => {
        return { ...prev, currency: false };
      });
      setIsEditing((prev) => {
        return { ...prev, currency: false };
      });
    } catch (error) {
      setIsSaving((prev) => {
        return { ...prev, currency: false };
      });
      setIsEditing((prev) => {
        return { ...prev, currency: false };
      });
      toast.dismiss();
      toast.error("Failed to update Currency");
      console.error("Error updating Currency:", error);
    }
  };

  const handleSaveDescription = async () => {
    try {
      toast.loading("Updating description...");
      setIsSaving((prev) => {
        return { ...prev, description: true };
      });
      await fetchFromHasura(updatePartnerMutation, {
        id: userData?.id,
        updates: {
          description,
        },
      });
      revalidateTag(userData?.id as string);
      setState({ description: description });
      toast.dismiss();
      toast.success("Description updated successfully!");
      setIsSaving((prev) => {
        return { ...prev, description: false };
      });
      setIsEditing((prev) => {
        return { ...prev, description: false };
      });
    } catch (error) {
      setIsSaving((prev) => {
        return { ...prev, description: false };
      });
      setIsEditing((prev) => {
        return { ...prev, description: false };
      });
      toast.dismiss();
      toast.error("Failed to update description");
      console.error("Error updating description:", error);
    }
  };

  const handleShowPricingChange = async (checked: boolean) => {
    try {
      toast.loading(`Setting pricing to ${checked ? "show" : "hide"}...`);
      setShowPricing(checked);

      let currencyValue = "🚫";

      if (checked) {
        currencyValue = Currencies[0].value;
      }

      await fetchFromHasura(updatePartnerMutation, {
        id: userData?.id,
        updates: {
          currency: currencyValue,
        },
      });
      revalidateTag(userData?.id as string);
      toast.dismiss();
      toast.success(
        `Pricing set to ${checked ? "show" : "hide"} successfully!`
      );
      setState({ currency: currencyValue });
    } catch (error) {
      toast.dismiss();
      toast.error(`Failed to set pricing to ${checked ? "show" : "hide"}`);
      setShowPricing(!checked);
      console.error(
        `Error setting pricing to ${checked ? "show" : "hide"}`,
        error
      );
    }
  };

  const handleFeatureEnabledChange = async (updates: FeatureFlags) => {
    const stringedFeature = revertFeatureToString(updates);

    try {
      toast.loading("Updating feature flags...");
      await fetchFromHasura(updatePartnerMutation, {
        id: userData?.id,
        updates: {
          feature_flags: stringedFeature,
        },
      });
      revalidateTag(userData?.id as string);
      updateAuthCookie({ feature_flags: stringedFeature });
      toast.dismiss();
      toast.success("Feature flags updated successfully!");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to update feature flags");
    }
  };

  const handleSaveWhatsappNumber = async () => {
    try {
      if (!whatsappNumber || whatsappNumber.length !== 10) {
        toast.error("Please enter a valid Whatsapp Number");
        return;
      }

      toast.loading("Updating Whatsapp Number...", {
        id: "whatsapp-num",
      });

      setIsSaving((prev) => {
        return { ...prev, whatsappNumber: true };
      });
      await fetchFromHasura(updatePartnerMutation, {
        id: userData?.id,
        updates: {
          whatsapp_numbers: [
            {
              number: whatsappNumber,
              area: "default",
            },
          ],
        },
      });
      revalidateTag(userData?.id as string);
      setState({
        whatsapp_numbers: [
          {
            number: whatsappNumber,
            area: "default",
          },
        ],
      });
      toast.dismiss("whatsapp-num");
      toast.success("Whatsapp Number updated successfully!");
      setIsSaving((prev) => {
        return { ...prev, whatsappNumber: false };
      });
      setIsEditing((prev) => {
        return { ...prev, whatsappNumber: false };
      });
    } catch (error) {
      toast.dismiss("whatsapp-num");
      console.error("Error updating Whatsapp Number:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update Whatsapp Number"
      );
    }
  };

  const handleSaveWhatsappNumbers = async () => {
    try {
      // Validate all numbers
      for (const item of whatsappNumbers) {
        if (!item.number || item.number.length !== 10) {
          toast.error(
            `Please enter a valid Whatsapp Number for ${
              item.area || "unnamed area"
            }`
          );
          return;
        }
        if (!item.area) {
          toast.error("Please specify an area for each number");
          return;
        }
      }

      toast.loading("Updating Whatsapp Numbers...", {
        id: "whatsapp-nums",
      });

      setIsSaving((prev) => ({ ...prev, whatsappNumber: true }));

      await fetchFromHasura(updatePartnerMutation, {
        id: userData?.id,
        updates: {
          whatsapp_numbers: whatsappNumbers,
        },
      });

      revalidateTag(userData?.id as string);
      setState({
        whatsapp_numbers: whatsappNumbers,
      });

      toast.dismiss("whatsapp-nums");
      toast.success("Whatsapp Numbers updated successfully!");
      setIsSaving((prev) => ({ ...prev, whatsappNumber: false }));
    } catch (error) {
      toast.dismiss("whatsapp-nums");
      console.error("Error updating Whatsapp Numbers:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update Whatsapp Numbers"
      );
      setIsSaving((prev) => ({ ...prev, whatsappNumber: false }));
    }
  };

  const handleSaveFootNote = async () => {
    try {
      toast.loading("Updating Footnote...", {
        id: "foot-note",
      });

      setIsSaving((prev) => {
        return { ...prev, footNote: true };
      });
      await fetchFromHasura(updatePartnerMutation, {
        id: userData?.id,
        updates: {
          footnote: footNote,
        },
      });
      revalidateTag(userData?.id as string);
      setState({ footnote: footNote });
      toast.dismiss("foot-note");
      toast.success("Footnote updated successfully!");
      setIsSaving((prev) => {
        return { ...prev, footNote: false };
      });
      setIsEditing((prev) => {
        return { ...prev, footNote: false };
      });
    } catch (error) {
      toast.dismiss("foot-note");
      console.error("Error updating Footnote:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update footNote"
      );
    }
  };

  const handleSaveInstaLink = async () => {
    try {
      if (
        !instaLink ||
        instaLink.match(
          /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/
        ) === null
      ) {
        toast.error("Please enter a valid Instagram Link");
        return;
      }

      toast.loading("Updating Instagram Link...", {
        id: "insta-link",
      });

      setIsSaving((prev) => {
        return { ...prev, instaLink: true };
      });

      const socialLinks = getSocialLinks(userData as HotelData);
      const instaLinkData = {
        ...socialLinks,
        instagram: instaLink,
      };

      await fetchFromHasura(updatePartnerMutation, {
        id: userData?.id,
        updates: {
          social_links: JSON.stringify(instaLinkData),
        },
      });
      revalidateTag(userData?.id as string);
      setState({ social_links: JSON.stringify(instaLinkData) });
      toast.dismiss("insta-link");
      toast.success("Instagram Link updated successfully!");
      setIsSaving((prev) => {
        return { ...prev, instaLink: false };
      });
      setIsEditing((prev) => {
        return { ...prev, instaLink: false };
      });
    } catch (error) {
      toast.dismiss("insta-link");
      console.error("Error updating Instagram Link:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update Instargram Link"
      );
    }
  };

  const handleSaveGst = async (
    e?: React.FormEvent | null,
    isDisabled?: boolean
  ) => {
    e?.preventDefault();

    const gstPercent = !isDisabled ? gst.gst_percentage : 0;

    try {
      if (gstPercent < 0) {
        toast.error("Please enter a valid GST");
        return;
      }

      toast.loading("Updating GST...", {
        id: "gst",
      });

      setIsSaving((prev) => {
        return { ...prev, gst: true };
      });
      await fetchFromHasura(updatePartnerMutation, {
        id: userData?.id,
        updates: {
          gst_no: gst.gst_no,
          gst_percentage: gstPercent,
        },
      });
      revalidateTag(userData?.id as string);
      setState({ gst_no: gst.gst_no, gst_percentage: gstPercent });
      toast.dismiss("gst");
      toast.success("GST updated successfully!");
      setIsSaving((prev) => {
        return { ...prev, gst: false };
      });
      setIsEditing((prev) => {
        return { ...prev, gst: false };
      });
    } catch (error) {
      toast.dismiss("gst");
      console.error("Error updating GST:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update GST"
      );
      setIsSaving((prev) => {
        return { ...prev, gst: false };
      });
      setIsEditing((prev) => {
        return { ...prev, gst: false };
      });
    }
  };

  const handleSaveDeliveryRate = async () => {
    try {
      if (!userData) return;
      toast.loading("Updating delivery rate...");

      setIsSaving((prev) => ({ ...prev, deliveryRate: true }));

      // Validate delivery rate is a positive number
      if (isNaN(deliveryRate) || deliveryRate < 0) {
        toast.dismiss();
        toast.error("Please enter a valid delivery rate (must be a positive number)");
        return;
      }

      await fetchFromHasura(updatePartnerMutation, {
        id: userData?.id,
        updates: {
          delivery_rate: deliveryRate,
        },
      });
      

      revalidateTag(userData?.id as string);
      setState({ delivery_rate: deliveryRate });
      toast.dismiss();
      toast.success("Delivery rate updated successfully!");
      setIsEditing((prev) => ({ ...prev, deliveryRate: false }));
    } catch (error) {
      console.error("Error updating delivery rate:", error);
      toast.dismiss();
      toast.error(
        error instanceof Error ? error.message : "Failed to update delivery rate"
      );
    } finally {
      setIsSaving((prev) => ({ ...prev, deliveryRate: false }));
    }
  };

  const handleShopOpenClose = async () => {
    try {
      if (!userData) return;

      setIsShopOpen((prev) => !prev);

      const isShopOpen = (userData as Partner)?.is_shop_open;

      toast.loading(`Setting shop to ${isShopOpen ? "close" : "open"}...`, {
        id: "shop-status",
      });

      await fetchFromHasura(updatePartnerMutation, {
        id: userData?.id,
        updates: {
          is_shop_open: !isShopOpen,
        },
      });
      revalidateTag(userData?.id as string);
      setState({ is_shop_open: !isShopOpen });
      toast.dismiss("shop-status");
      toast.success(
        `Shop status updated to ${!isShopOpen ? "open" : "close"} successfully!`
      );
    } catch (error) {
      setIsShopOpen((prev) => !prev);
      console.error("Error updating shop status:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update shop status"
      );
    }
  };

  if (isLoading) {
    return <OfferLoadinPage message="Loading Profile...." />;
  }

  return (
    <div className="min-h-screen w-full bg-orange-50 p-2">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome Section */}
        <Card className="overflow-hidden hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex justify-between">
              <CardTitle className="text-2xl sm:text-4xl font-bold flex-1">
                Welcome back, {profile.name}!
              </CardTitle>
              <div
                onClick={() => {
                  signOut();
                  router.push("/offers");
                }}
                className="cursor-pointer hover:text-red-500 transition-all rounded-full flex flex-col items-center justify-center gap-1 text-gray-500"
              >
                <LogOutIcon className="w-5 h-5" />
                <span className="text-sm ">Sign Out</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex md:flex-row flex-col gap-4">
              {userData?.role === "user" && (
                <>
                  <Badge className="text-sm bg-orange-100 text-orange-800 sm:text-lg  sm:p-4 p-2 hover:bg-orange-800 hover:text-orange-100 transition-colors">
                    <Tag className="sm:size-4 size-8 mr-2" />
                    {profile.offersClaimed} Offers Claimed
                  </Badge>
                  <Badge className="text-sm bg-orange-100 text-orange-800 sm:text-lg  sm:p-4 p-2 hover:bg-orange-800 hover:text-orange-100 transition-colors">
                    <UtensilsCrossed className="sm:size-4 size-8 mr-2" />
                    {profile.restaurantsSubscribed} Restaurants Subscribed
                  </Badge>
                </>
              )}
              {userData?.role === "partner" && (
                <>
                  <Link
                    href={`/hotels/${userData?.id}`}
                    className="flex items-center font-semibold rounded-lg text-sm bg-orange-100 text-orange-800 sm:text-lg  sm:p-4 p-2 hover:bg-orange-800 hover:text-orange-100 transition-colors"
                  >
                    <Tag className="sm:size-4 size-8 mr-2" />
                    View My Business Website
                  </Link>
                  <Button
                    onClick={handleShopOpenClose}
                    className={`flex items-center h-[60px] font-semibold rounded-lg text-sm  sm:text-lg  sm:p-4 p-2  transition-colors ${
                      isShopOpen ? "bg-red-500" : "bg-green-600"
                    }`}
                  >
                    {isShopOpen ? "Close Shop" : "Open Shop"}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Claimed Offers Section */}
        {userData?.role === "user" && (
          <Card className="overflow-hidden hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Your Claimed Offers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.claimedOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="p-4 border border-orange-300 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className=" sm:text-xl font-semibold">
                        {offer.foodName}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <UtensilsCrossed className="w-4 h-4" />
                        {offer.restaurant}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 line-through text-sm">
                        ₹{offer?.originalPrice?.toFixed(0)}
                      </p>
                      <p className="text-xl font-bold text-orange-600">
                        ₹{offer?.newPrice?.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Account Settings Section (Only for hotel) */}
        {userData?.role === "partner" && (
          <Card className="overflow-hidden hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 divide-y-2">
              {/* //your hotel banner  */}
              <div>
                <h3 className="text-lg font-semibold">Your Hotel Banner</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Click on the banner to change it.
                </p>

                <label
                  htmlFor="bannerInput"
                  className="relative cursor-pointer w-full h-48 bg-gray-200 rounded-lg overflow-hidden"
                >
                  {bannerImage ? (
                    <Img
                      src={bannerImage}
                      alt="Hotel Banner"
                      width={500}
                      height={500}
                      className="object-cover w-full h-48 rounded-2xl"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-48 bg-gray-100 rounded-2xl text-gray-500">
                      No banner set
                    </div>
                  )}
                </label>

                <input
                  type="file"
                  id="bannerInput"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="hidden"
                />

                {isBannerChanged && (
                  <div className="mt-2 flex justify-end">
                    <Button
                      disabled={isBannerUploading}
                      onClick={
                        isBannerUploading ? undefined : handleBannerUpload
                      }
                    >
                      {isBannerUploading ? "Uploading...." : "Update Banner"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-4">
                <label htmlFor="bio" className="text-lg font-semibold">
                  Bio
                </label>
                <div className="flex gap-2 w-full">
                  {isEditing.description ? (
                    <div className="grid gap-2 w-full">
                      <Textarea
                        id="bio"
                        placeholder="Enter your Bio"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSaveDescription}
                        disabled={isSaving.description || !description}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {isSaving.description ? (
                          <>
                            {/* <span className="animate-spin mr-2">⏳</span>/ */}
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center w-full">
                      <span className="text-gray-700">
                        {description ? description : "No Bio set"}
                      </span>
                      <Button
                        onClick={() => {
                          setIsEditing((prev) => ({
                            ...prev,
                            description: true,
                          }));
                          setDescription(description ? description : "");
                        }}
                        variant="ghost"
                        className="hover:bg-orange-100"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  This Bio will be used for your restaurant profile
                </p>
              </div>
              

              {/* <div className="space-y-2 pt-4">
                <label htmlFor="upiId" className="text-lg font-semibold">
                  UPI ID
                </label>
                <div className="flex gap-2">
                  {isEditing.upiId ? (
                    <>
                      <Input
                        id="upiId"
                        type="text"
                        placeholder="Enter your UPI ID"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSaveUpiId}
                        disabled={isSaving.upiId || !upiId}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {isSaving.upiId ? (
                          <>
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="flex justify-between items-center w-full">
                      <span className="text-gray-700">
                        {upiId ? upiId : "No UPI ID set"}
                      </span>
                      <Button
                        onClick={() => {
                          setIsEditing((prev) => ({ ...prev, upiId: true }));
                          setUpiId(upiId ? upiId : "");
                        }}
                        variant="ghost"
                        className="hover:bg-orange-100"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  This UPI ID will be used for receiving payments from customers
                </p>
              </div> */}

              <div className="space-y-2 pt-4">
                <label htmlFor="placeId" className="text-lg font-semibold">
                  Place ID
                </label>
                <div className="flex gap-2">
                  {isEditing.placeId ? (
                    <>
                      <Input
                        id="placeId"
                        type="text"
                        placeholder="Enter your Place ID"
                        value={placeId}
                        onChange={(e) => setPlaceId(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSavePlaceId}
                        disabled={isSaving.placeId || !placeId}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {isSaving.placeId ? <>Saving...</> : "Save"}
                      </Button>
                    </>
                  ) : (
                    <div className="flex justify-between items-center w-full">
                      <span className="text-gray-700">
                        {placeId ? placeId : "No Place ID set"}
                      </span>
                      <Button
                        onClick={() => {
                          setIsEditing((prev) => ({ ...prev, placeId: true }));
                          setPlaceId(placeId ? placeId : "");
                        }}
                        variant="ghost"
                        className="hover:bg-orange-100"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  This Place ID will be used for reviews. Get your place Id here{" "}
                  {"-->"}{" "}
                  <Link
                    className="underline text-orange-600"
                    target="_blank"
                    href={
                      "https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
                    }
                  >
                    Get Place Id
                  </Link>
                </p>
              </div>

              
            

              {/* Geo Location Section */}
              <div className="space-y-2 pt-4">
                <label htmlFor="location" className="text-lg font-semibold">
                  Location
                </label>
                <div className="flex gap-2">
                  {isEditing.geoLocation ? (
                    <div className="grid gap-4 w-full">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-600">Latitude</label>
                          <Input
                            type="text"
                            value={geoLocation.latitude}
                            onChange={(e) => setGeoLocation(prev => ({
                              ...prev,
                              latitude: e.target.value
                            }))}
                            placeholder="Enter latitude"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Longitude</label>
                          <Input
                            type="text"
                            value={geoLocation.longitude}
                            onChange={(e) => setGeoLocation(prev => ({
                              ...prev,
                              longitude: e.target.value
                            }))}
                            placeholder="Enter longitude"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleGetCurrentLocation}
                          variant="outline"
                          disabled={isLoading}
                        >
                          {isLoading ? "Getting Location..." : "Get Current Location"}
                        </Button>
                        <Button
                          onClick={handleSaveGeoLocation}
                          disabled={isSaving.geoLocation}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          {isSaving.geoLocation ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center w-full">
                      <span className="text-gray-700">
                        {geoLocation.latitude && geoLocation.longitude 
                          ? `Lat: ${parseFloat(geoLocation.latitude).toFixed(6)}, Long: ${parseFloat(geoLocation.longitude).toFixed(6)}`
                          : "No location set"}
                      </span>
                      <Button
                        onClick={() => {
                          console.log("Debug - Edit location clicked, current value:", geoLocation);
                          setIsEditing((prev) => ({ ...prev, geoLocation: true }));
                        }}
                        variant="ghost"
                        className="hover:bg-orange-100"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  This location will be used to show your restaurant on the map
                </p>
              </div>

              <div className="space-y-2 pt-4">
                <label htmlFor="deliveryRate" className="text-lg font-semibold">
                  Delivery Rate
                </label>
                <div className="flex gap-2">
                  {isEditing.deliveryRate ? (
                    <>
                      <Input
                        id="deliveryRate"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter delivery rate"
                        value={deliveryRate}
                        onChange={(e) => setDeliveryRate(parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSaveDeliveryRate}
                        disabled={isSaving.deliveryRate || isNaN(deliveryRate)}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {isSaving.deliveryRate ? "Saving..." : "Save"}
                      </Button>
                    </>
                  ) : (
                    <div className="flex justify-between items-center w-full">
                      <span className="text-gray-700">
                        {deliveryRate !== undefined && deliveryRate !== null
                          ? `${currency.value}${deliveryRate.toFixed(2)}`
                          : "No delivery rate set"}
                      </span>
                      <Button
                        onClick={() => {
                          console.log("Debug - Edit delivery rate clicked, current value:", deliveryRate);
                          setIsEditing((prev) => ({ ...prev, deliveryRate: true }));
                        }}
                        variant="ghost"
                        className="hover:bg-orange-100"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  This delivery rate will be used for calculating delivery charges for orders
                </p>
              </div>

              <div className="space-y-2 pt-4">
                <label htmlFor="whatsNum" className="text-lg font-semibold">
                  Whatsapp Number
                  {userFeatures?.multiwhatsapp.enabled ? "s" : ""}
                </label>

                {userFeatures?.multiwhatsapp.enabled ? (
                  // Multi-whatsapp UI
                  <div className="space-y-4">
                    {whatsappNumbers.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Area (e.g. North, South)"
                            value={item.area}
                            onChange={(e) => {
                              const newNumbers = [...whatsappNumbers];
                              newNumbers[index].area = e.target.value;
                              setWhatsappNumbers(newNumbers);
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="Whatsapp Number"
                            minLength={10}
                            maxLength={10}
                            value={item.number}
                            onChange={(e) => {
                              const newNumbers = [...whatsappNumbers];
                              newNumbers[index].number = e.target.value;
                              setWhatsappNumbers(newNumbers);
                            }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            const newNumbers = [...whatsappNumbers];
                            newNumbers.splice(index, 1);
                            setWhatsappNumbers(newNumbers);
                          }}
                          className="text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          setWhatsappNumbers([
                            ...whatsappNumbers,
                            { number: "", area: "" },
                          ])
                        }
                        variant="outline"
                      >
                        Add Another Number
                      </Button>
                      <Button
                        onClick={handleSaveWhatsappNumbers}
                        disabled={
                          isSaving.whatsappNumber || !whatsappNumbers.length
                        }
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {isSaving.whatsappNumber ? <>Saving...</> : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Single whatsapp number UI (original code)
                  <div className="flex gap-2">
                    {isEditing.whatsappNumber ? (
                      <>
                        <Input
                          id="whatsNum"
                          type="text"
                          placeholder="Enter your Whatsapp Number"
                          minLength={10}
                          maxLength={10}
                          value={whatsappNumber}
                          onChange={(e) => setWhatsappNumber(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleSaveWhatsappNumber}
                          disabled={isSaving.whatsappNumber || !whatsappNumber}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          {isSaving.whatsappNumber ? <>Saving...</> : "Save"}
                        </Button>
                      </>
                    ) : (
                      <div className="flex justify-between items-center w-full">
                        <span className="text-gray-700">
                          {whatsappNumber
                            ? whatsappNumber
                            : "No Whatsapp Number set"}
                        </span>
                        <Button
                          onClick={() => {
                            setIsEditing((prev) => ({
                              ...prev,
                              whatsappNumber: true,
                            }));
                            setWhatsappNumber(
                              whatsappNumber ? whatsappNumber : ""
                            );
                          }}
                          variant="ghost"
                          className="hover:bg-orange-100"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-sm text-gray-500">
                  {getFeatures(userData.feature_flags as string).multiwhatsapp
                    .access
                    ? "These Whatsapp Numbers will be used for receiving messages from customers in different areas"
                    : "This Whatsapp Number will be used for receiving messages from customers"}
                </p>
              </div>

              <div className="space-y-2 pt-4">
                <label htmlFor="instaLink" className="text-lg font-semibold">
                  Instagram Link
                </label>
                <div className="flex gap-2">
                  {isEditing.instaLink ? (
                    <>
                      <Input
                        id="instaLink"
                        type="text"
                        placeholder="Enter your Instagram Link"
                        value={instaLink}
                        onChange={(e) => setInstaLink(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSaveInstaLink}
                        disabled={isSaving.instaLink || !instaLink}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {isSaving.instaLink ? <>Saving...</> : "Save"}
                      </Button>
                    </>
                  ) : (
                    <div className="flex justify-between items-center w-full">
                      <span className="text-gray-700 text-xs text-wrap">
                        {instaLink ? instaLink : "No Instagram Link set"}
                      </span>
                      <Button
                        onClick={() => {
                          setIsEditing((prev) => ({
                            ...prev,
                            instaLink: true,
                          }));
                          setInstaLink(instaLink ? instaLink : "");
                        }}
                        variant="ghost"
                        className="hover:bg-orange-100"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  This Instagram Link will be used for your restaurant profile
                </p>
              </div>

              <div className="space-y-2 pt-4">
                <label htmlFor="footNote" className="text-lg font-semibold">
                  Footnote
                </label>
                <div className="flex gap-2">
                  {isEditing.footNote ? (
                    <>
                      <Input
                        id="footNote"
                        type="text"
                        placeholder="Enter your Footnote"
                        value={footNote}
                        onChange={(e) => setFootNote(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSaveFootNote}
                        disabled={isSaving.footNote}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {isSaving.footNote ? <>Saving...</> : "Save"}
                      </Button>
                    </>
                  ) : (
                    <div className="flex justify-between items-center w-full">
                      <span className="text-gray-700">
                        {footNote ? footNote : "No Footnote set"}
                      </span>
                      <Button
                        onClick={() => {
                          setIsEditing((prev) => ({
                            ...prev,
                            footNote: true,
                          }));
                          setFootNote(footNote ? footNote : "");
                        }}
                        variant="ghost"
                        className="hover:bg-orange-100"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  This Footnote will be used for your restaurant profile
                </p>
              </div>

              <div className="space-y-2 pt-4">
                <label htmlFor="gstNo" className="text-lg font-semibold">
                  GST Settings
                </label>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Enable GST Calculation</span>
                  <Switch
                    checked={gst.enabled}
                    onCheckedChange={(checked) => setGst(prev => ({...prev, enabled: checked}))}
                  />
                </div>
                {gst.enabled && (
                  <div className="grid gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="gstNo" className="text-sm text-gray-600">GST Number</label>
                        <Input
                          id="gstNo"
                          type="text"
                          placeholder="Enter GST Number"
                          value={gst.gst_no}
                          onChange={(e) => setGst(prev => ({...prev, gst_no: e.target.value}))}
                        />
                      </div>
                      <div>
                        <label htmlFor="gstPercent" className="text-sm text-gray-600">GST Percentage (%)</label>
                        <Input
                          id="gstPercent"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Enter GST Percentage"
                          value={gst.gst_percentage}
                          onChange={(e) => setGst(prev => ({...prev, gst_percentage: parseFloat(e.target.value) || 0}))}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSaveGst()}
                      disabled={isSaving.gst}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {isSaving.gst ? <>Saving...</> : "Save GST Settings"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-4">
                <div className="text-lg font-semibold mb-4">
                  QrCode Settings
                </div>
                <Link
                  href={"/admin/qr-management"}
                  className=" hover:underline bg-gray-100 px-3 py-2 rounded-lg w-full flex items-center justify-between"
                >
                  Manage QrCode
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>

              {getFeatures(userData.feature_flags as string)?.stockmanagement
                .enabled && (
                <div className="space-y-2 pt-4">
                  <div className="text-lg font-semibold mb-4">
                    Stock Management
                  </div>
                  <Link
                    href={"/admin/stock-management"}
                    className=" hover:underline bg-gray-100 px-3 py-2 rounded-lg w-full flex items-center justify-between"
                  >
                    Manage Stocks
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Danger Area */}
        {userData?.role === "user" && (
          <Card className="overflow-hidden hover:shadow-xl transition-shadow border-red-500">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-red-600">
                Danger Area
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-red-600">
                Warning: Deleting your account is irreversible. All your data,
                including claimed offers, will be permanently deleted.
              </p>

              {/* Confirmation Modal */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete My Account"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[90%] sm:max-w-lg rounded-xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Heads up! Your account is set to be deleted in 30 days. If
                      you&apos;d like to keep your account active, simply log in
                      before the deletion date (
                      {new Date(
                        new Date().setDate(new Date().getDate() + 30)
                      ).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                      ).
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-y-2">
                    <AlertDialogCancel className="bg-gray-500 hover:bg-gray-600 px-3 py-1 rounded text-white">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {error && <p className="text-red-600">{error}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
