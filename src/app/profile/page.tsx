"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, Tag, LogOutIcon, Pencil, Trash2 } from "lucide-react";
import { Partner, useAuthStore } from "@/store/authStore";
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
import {
  FeatureFlags,
  revertFeatureToString,
} from "@/screens/HotelMenuPage_v2";
import { HotelData, SocialLinks } from "../hotels/[id]/page";
import { getSocialLinks } from "@/lib/getSocialLinks";
import { getFeatures } from "@/lib/getFeatures";
import { updateAuthCookie } from "../auth/actions";

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
  const { claimedOffers } = useClaimedOffersStore();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [upiId, setUpiId] = useState("");
  const [isSaving, setIsSaving] = useState({
    upiId: false,
    placeId: false,
    description: false,
    currency: false,
    whatsappNumber: false,
    footNote: false,
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
    instaLink: false,
    gst: false,
  });
  const [placeId, setPlaceId] = useState("");
  const [gst, setGst] = useState({
    gst_no: "",
    gst_percentage: 0,
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
      setBannerImage(userData.store_banner || null);
      setUpiId(userData.upi_id || "");
      setPlaceId(userData.place_id || "");
      setDescription(userData.description || "");
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
      });
    }
  }, [userData]);

  useEffect(() => {
    if (userData?.role === "partner") {
      console.log("User Data:", userData?.role, userData?.feature_flags);

      const feature = getFeatures(userData?.feature_flags as string);

      setUserFeatures(feature);
      console.log(feature);
    }
  }, [userData]);

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
      updateAuthCookie({ feature_flags : stringedFeature});
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

  const handleSaveGst = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (gst.gst_percentage <= 0) {
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
          gst_percentage: gst.gst_percentage,
        },
      });
      revalidateTag(userData?.id as string);
      setState({ gst_no: gst.gst_no, gst_percentage: gst.gst_percentage });
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

  if (isLoading) {
    return <OfferLoadinPage message="Loading Profile...." />;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 p-8">
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
              <Badge className="text-sm bg-orange-100 text-orange-800 sm:text-lg  sm:p-4 p-2 hover:bg-orange-800 hover:text-orange-100 transition-colors">
                <Tag className="sm:size-4 size-8 mr-2" />
                {profile.offersClaimed} Offers Claimed
              </Badge>
              <Badge className="text-sm bg-orange-100 text-orange-800 sm:text-lg  sm:p-4 p-2 hover:bg-orange-800 hover:text-orange-100 transition-colors">
                <UtensilsCrossed className="sm:size-4 size-8 mr-2" />
                {profile.restaurantsSubscribed} Restaurants Subscribed
              </Badge>
              {userData?.role === "partner" && (
                <Link
                  href={`/hotels/${userData?.id}`}
                  className="flex items-center font-semibold rounded-lg text-sm bg-orange-100 text-orange-800 sm:text-lg  sm:p-4 p-2 hover:bg-orange-800 hover:text-orange-100 transition-colors"
                >
                  <Tag className="sm:size-4 size-8 mr-2" />
                  View My Restaurant
                </Link>
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
                <div className="text-lg font-semibold">Price Settings</div>

                {/* show pricing  */}
                <div className="flex gap-2">
                  <label htmlFor="show-pricing">Show Pricing : </label>
                  <Switch
                    checked={showPricing}
                    onCheckedChange={handleShowPricingChange}
                  />
                </div>

                {/* currency  */}
                {userData.currency !== "🚫" && (
                  <div className="flex gap-2 items-center">
                    <label htmlFor="currency">Currency : </label>
                    <div className="flex gap-2 flex-1">
                      {isEditing.currency ? (
                        <>
                          <Select
                            value={currency.label} // Use label as the value for selection
                            onValueChange={(selectedLabel) => {
                              const selectedCurrency = Currencies.find(
                                (curr) => curr.label === selectedLabel
                              );
                              if (selectedCurrency) {
                                setCurrency(selectedCurrency);
                              }
                            }}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              {Currencies.map((curr) => (
                                <SelectItem key={curr.label} value={curr.label}>
                                  {curr.value} - {curr.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={handleSaveCurrency}
                            disabled={isSaving.currency || !currency}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            {isSaving.currency ? <>Saving...</> : "Save"}
                          </Button>
                        </>
                      ) : (
                        <div className="flex justify-between items-center w-full">
                          <span className="text-gray-700">
                            {currency ? (
                              <>
                                {currency.value} - {currency.label}
                              </>
                            ) : (
                              "No currency selected"
                            )}
                          </span>
                          <Button
                            onClick={() => {
                              setIsEditing((prev) => ({
                                ...prev,
                                currency: true,
                              }));
                              setCurrency(currency || Currencies[0]);
                            }}
                            variant="ghost"
                            className="hover:bg-orange-100"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-4">
                {features && (
                  <>
                    <div className="text-lg font-semibold">
                      Feature Settings
                    </div>

                    {features.ordering.access && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">Ordering</div>
                          <div className="text-sm text-gray-500">
                            {features.ordering.enabled ? "Enabled" : "Disabled"}
                          </div>
                        </div>
                        <Switch
                          checked={features.ordering.enabled}
                          onCheckedChange={(enabled) => {
                            const updates = {
                              ...features,
                              ordering: {
                                ...features.ordering,
                                enabled: enabled,
                              },
                            };

                            setFeatures(updates);
                            setUserFeatures(updates);
                            handleFeatureEnabledChange(updates);
                          }}
                        />
                      </div>
                    )}

                    {features.delivery.access && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">Delivery</div>
                          <div className="text-sm text-gray-500">
                            {features.delivery.enabled ? "Enabled" : "Disabled"}
                          </div>
                        </div>
                        <Switch
                          checked={features.delivery.enabled}
                          onCheckedChange={(enabled) => {
                            const updates = {
                              ...features,
                              delivery: {
                                ...features.delivery,
                                enabled: enabled,
                              },
                            };

                            setFeatures(updates);
                            setUserFeatures(updates);
                            handleFeatureEnabledChange(updates);
                          }}
                        />
                      </div>
                    )}

                    {features.multiwhatsapp.access && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">
                            Multiple Whatsapp Numbers
                          </div>
                          <div className="text-sm text-gray-500">
                            {features.multiwhatsapp.enabled
                              ? "Enabled"
                              : "Disabled"}
                          </div>
                        </div>
                        <Switch
                          checked={features.multiwhatsapp.enabled}
                          onCheckedChange={(enabled) => {
                            const updates = {
                              ...features,
                              multiwhatsapp: {
                                ...features.multiwhatsapp,
                                enabled: enabled,
                              },
                            };

                            setFeatures(updates);
                            setUserFeatures(updates);
                            handleFeatureEnabledChange(updates);
                          }}
                        />
                      </div>
                    )}

                    {features.pos.access && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">
                            POS
                          </div>
                          <div className="text-sm text-gray-500">
                            {features.pos.enabled
                              ? "Enabled"
                              : "Disabled"}
                          </div>
                        </div>
                        <Switch
                          checked={features.pos.enabled}
                          onCheckedChange={(enabled) => {
                            const updates = {
                              ...features,
                              pos: {
                                ...features.pos,
                                enabled: enabled,
                              },
                            };

                            setFeatures(updates);
                            setUserFeatures(updates);
                            handleFeatureEnabledChange(updates);
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-2 pt-4">
                <h1 className="text-lg font-semibold">Gst Settings</h1>
                <div className="flex gap-2">
                  {isEditing.gst ? (
                    <form onSubmit={handleSaveGst} className="space-y-2">
                      <div>
                        <label htmlFor="gst_no" className=" font-semibold">
                          Gst No.
                        </label>
                        <Input
                          id="gst_no"
                          type="text"
                          placeholder="Enter your Gst number"
                          pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
                          value={gst.gst_no}
                          onChange={(e) =>
                            setGst((prev) => {
                              return { ...prev, gst_no: e.target.value };
                            })
                          }
                          className="flex-1"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="gst_percentage"
                          className=" font-semibold"
                        >
                          Gst Percentage
                        </label>
                        <Input
                          id="gst_percentage"
                          type="number"
                          placeholder="Enter your Gst percentage"
                          value={gst.gst_percentage}
                          onChange={(e) =>
                            setGst((prev) => {
                              return {
                                ...prev,
                                gst_percentage: Number(e.target.value),
                              };
                            })
                          }
                          className="flex-1"
                        />
                      </div>

                      <Button
                        disabled={isSaving.gst}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {isSaving.gst ? <>Saving...</> : "Save"}
                      </Button>
                    </form>
                  ) : (
                    <div className="flex justify-between items-center w-full">
                      <div className="flex flex-col gap-2">
                        <div className="text-gray-700">
                          {gst.gst_no
                            ? `GST no: ${gst.gst_no}`
                            : "No Gst no. set"}
                        </div>
                        <div className="text-gray-700">
                          {gst.gst_percentage
                            ? `GST percentage: ${gst.gst_percentage}%`
                            : "No Gst percentage set"}
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setIsEditing((prev) => ({
                            ...prev,
                            gst: true,
                          }));
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
                  This Gst will be used for your restaurant profile and billing
                </p>
              </div>
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
