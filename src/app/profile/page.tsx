"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, Tag, LogOutIcon } from "lucide-react";
import { useAuthStore } from "@/store/authStore"; // Import the auth store
import { useClaimedOffersStore } from "@/store/claimedOffersStore";
import { Button } from "@/components/ui/button"; // Import Button component
import { deleteUser as deleteFirebaseUser } from "firebase/auth"; // Import Firebase Auth delete function
import { db } from "@/lib/firebase"; // Import Firebase Auth and Firestore instances
import { doc, deleteDoc } from "firebase/firestore"; // Import Firestore delete function
import { useRouter } from "next/navigation"; // Import useRouter for navigation
import { useState } from "react"; // Import useState for loading and error states
import OfferLoadinPage from "@/components/OfferLoadinPage";

export default function ProfilePage() {
  // Fetch user data and loading state from the auth store
  const { user, userData, loading: authLoading , signOut   } = useAuthStore();

  // Fetch claimed offers and loading state from the claimed offers store
  const { claimedOffers, isLoading: claimedOffersLoading } =
    useClaimedOffersStore();

  // Router for navigation after account deletion
  const router = useRouter();

  // State for loading and error during account deletion
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Combined loading state
  const isLoading = authLoading || claimedOffersLoading;

  // Default values if data is not available
  const profile = {
    name: userData?.fullName || "Guest", // Default name if not available
    offersClaimed: claimedOffers.length || 0, // Number of claimed offers
    restaurantsSubscribed: 0, // Default value for restaurants subscribed (not available in stores)
    claimedOffers: claimedOffers.map((offer) => ({
      id: offer.offerId,
      foodName: offer.offerDetails.dishName,
      restaurant: offer.offerDetails.hotelName,
      originalPrice: offer.offerDetails.originalPrice,
      newPrice: offer.offerDetails.newPrice,
    })),
  };

  // Function to delete the user's account
  const handleDeleteAccount = async () => {
    if (!user) {
      setError("No user is currently logged in.");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      // Delete the user's Firestore data
      const userDocRef = doc(db, "users", user.uid);
      await deleteDoc(userDocRef);

      // Delete the user's Firebase Auth account
      await deleteFirebaseUser(user);

      // Redirect to the home page after deletion
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
              <div onClick={()=>{
                signOut();
                router.push("/offers");
              }} className="cursor-pointer hover:text-red-500 transition-all rounded-full flex flex-col items-center justify-center gap-1 text-gray-500">
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
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete My Account"}
            </Button>
            {error && <p className="text-red-600">{error}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
