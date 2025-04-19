"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, Tag, LogOutIcon, Pencil } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
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
import Image from "next/image";
import { deleteFileFromS3, uploadFileToS3 } from "../actions/aws-s3";
import { deleteUserMutation } from "@/api/auth";
import { updateUpiIdMutation, updateStoreBannerMutation } from "@/api/partners";
import { fetchFromHasura } from "@/lib/hasuraClient";
import Link from "next/link";
import { useClaimedOffersStore } from "@/store/claimedOfferStore_hasura";
import { revalidateTag } from "../actions/revalidate";
import { processImage } from "@/lib/processImage";

export default function ProfilePage() {
  const { userData, loading: authLoading, signOut, setState } = useAuthStore();
  const { claimedOffers } = useClaimedOffersStore();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upiId, setUpiId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [bannerImage, setBannerImage] = useState<string | null>(
    userData?.role === "partner" ? userData.store_banner || null : null
  );
  const [isBannerUploading, setBannerUploading] = useState(false);
  const [isBannerChanged, setIsBannerChanged] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<boolean>(false);

  const isLoading = authLoading;

  useEffect(() => {
    if (userData?.role === "partner") {
      setBannerImage(userData.store_banner || null);
      setUpiId(userData.upi_id || "");
      setDeliveryStatus(userData.delivery_status);
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

  // useEffect(() => {
  //   if (userData && userData?.role === "partner") {
  //     fetchAndCacheUpiData(user.uid)
  //       .then((data) => {
  //         if (data) {
  //           setUpiId(data.upiId);
  //         }
  //       })
  //       .catch(console.error);
  //   }
  // }, [user, userData?.role]);

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

    setIsSaving(true);
    try {
      await fetchFromHasura(updateUpiIdMutation, {
        id: userData?.id,
        upi_id: upiId,
      });
      revalidateTag(userData?.id as string);
      setState({ upi_id: upiId });
      toast.success("UPI ID updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating UPI ID:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update UPI ID"
      );
    } finally {
      setIsSaving(false);
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

      let prevImgUrl =
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
      await fetchFromHasura(updateStoreBannerMutation, {
        userId: userData?.id,
        storeBanner: imgUrl,
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
                    <Image
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
                <label htmlFor="upiId" className="text-lg font-semibold">
                  UPI ID
                </label>
                <div className="flex gap-2">
                  {isEditing ? (
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
                        disabled={isSaving || !upiId}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {isSaving ? (
                          <>
                            {/* <span className="animate-spin mr-2">⏳</span>/ */}
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
                          setIsEditing(true);
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
