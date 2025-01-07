"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, Tag } from "lucide-react";
import { useAuthStore } from "@/store/authStore"; // Import the auth store
import { useClaimedOffersStore } from "@/store/claimedOffersStore";

export default function ProfilePage() {
  // Fetch user data and loading state from the auth store
  const { userData, loading: authLoading } = useAuthStore();

  // Fetch claimed offers and loading state from the claimed offers store
  const { claimedOffers, isLoading: claimedOffersLoading } =
    useClaimedOffersStore();

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

  // Show a loading spinner while data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 p-8 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="w-12 h-12 text-orange-600 animate-spin"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077 1.41-.513m14.095-5.13 1.41-.513M5.106 17.785l1.15-.964m11.49-9.642 1.149-.964M7.501 19.795l.75-1.3m7.5-12.99.75-1.3m-6.063 16.658.26-1.477m2.605-14.772.26-1.477m0 17.726-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205 12 12m6.894 5.785-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495"
          />
        </svg>
        {/* Replace with your Spinner component */}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome Section */}
        <Card className="overflow-hidden hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">
              Welcome back, {profile.name}!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Badge className="bg-orange-100 text-orange-800 sm:text-lg text-md sm:p-4 p-2 hover:bg-orange-800 hover:text-orange-100 transition-colors">
                <Tag className="sm:size-4 size-8 mr-2" />
                {profile.offersClaimed} Offers Claimed
              </Badge>
              <Badge className="bg-orange-100 text-orange-800 sm:text-lg text-md sm:p-4 p-2 hover:bg-orange-800 hover:text-orange-100 transition-colors">
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
                    <h3 className="sm:text-xl text-lg font-semibold">
                      {offer.foodName}
                    </h3>
                    <p className="text-gray-600 flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4" />
                      {offer.restaurant}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 line-through">
                      ₹{offer.originalPrice.toFixed(0)}
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      ₹{offer.newPrice.toFixed(0)}
                    </p>
                    <p className="text-green-600 font-semibold">
                      Saved ₹{(offer.originalPrice - offer.newPrice).toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
