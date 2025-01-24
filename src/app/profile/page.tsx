"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, Tag, LogOutIcon } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useClaimedOffersStore } from "@/store/claimedOffersStore";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

export default function ProfilePage() {
  const {
    user,
    userData,
    loading: authLoading,
    signOut,
    updateUserData,
  } = useAuthStore();
  const { claimedOffers, isLoading: claimedOffersLoading } =
    useClaimedOffersStore();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoading = authLoading || claimedOffersLoading;

  const profile = {
    name: userData?.fullName || "Guest",
    offersClaimed: claimedOffers.length || 0,
    restaurantsSubscribed: 0,
    claimedOffers: claimedOffers.map((offer) => ({
      id: offer.offerId,
      foodName: offer.offerDetails.dishName,
      restaurant: offer.offerDetails.hotelName,
      originalPrice: offer.offerDetails.originalPrice,
      newPrice: offer.offerDetails.newPrice,
    })),
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      setError("No user is currently logged in.");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await updateUserData(user.uid, {
        accountStatus: "pendingDeletion",
        deletionRequestedAt: new Date().toISOString(),
      });
      signOut();
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      setError("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
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
            <div className="flex gap-4">
              <Badge className="text-sm bg-orange-100 text-orange-800 sm:text-lg  sm:p-4 p-2 hover:bg-orange-800 hover:text-orange-100 transition-colors">
                <Tag className="sm:size-4 size-8 mr-2" />
                {profile.offersClaimed} Offers Claimed
              </Badge>
              <Badge className="text-sm bg-orange-100 text-orange-800 sm:text-lg  sm:p-4 p-2 hover:bg-orange-800 hover:text-orange-100 transition-colors">
                <UtensilsCrossed className="sm:size-4 size-8 mr-2" />
                {profile.restaurantsSubscribed} Restaurants Subscribed
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Claimed Offers Section */}
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
                      ₹{offer.originalPrice.toFixed(0)}
                    </p>
                    <p className="text-xl font-bold text-orange-600">
                      ₹{offer.newPrice.toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Danger Area */}
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
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
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
      </div>
    </div>
  );
}
