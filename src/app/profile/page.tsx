"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, Tag, Clock } from "lucide-react";

export default function page() {
  const dummyProfileData = {
    name: "John Doe",
    offersClaimed: 5,
    restaurantsSubscribed: 3,
    claimedOffers: [
      {
        id: 1,
        foodName: "Paneer Tikka",
        restaurant: "Spice Garden",
        originalPrice: 1200,
        newPrice: 800,
      },
      {
        id: 2,
        foodName: "Butter Chicken",
        restaurant: "Royal Dine",
        originalPrice: 1500,
        newPrice: 1000,
      },
      {
        id: 3,
        foodName: "Biryani",
        restaurant: "Hyderabad House",
        originalPrice: 900,
        newPrice: 600,
      },
    ],
  };

  const profile = dummyProfileData;

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
              <Badge className="bg-orange-100 text-orange-800 text-lg p-4 hover:bg-orange-800 hover:text-orange-100 transition-colors">
                <Tag className="w-4 h-4 mr-2" />
                {profile.offersClaimed} Offers Claimed
              </Badge>
              <Badge className="bg-orange-100 text-orange-800 text-lg p-4 hover:bg-orange-800 hover:text-orange-100 transition-colors">
                <UtensilsCrossed className="w-4 h-4 mr-2" />
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
                className="p-4 border border-orange-100 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold">{offer.foodName}</h3>
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
