"use client";
import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Tag, Loader2 } from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useAuthStore } from "@/store/authStore";
import { OfferTicket } from "@/components/OfferTicket";
import Share from "@/components/Share";
import { rtdb } from "@/lib/firebase";
import { Offer } from "@/store/offerStore";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

export default function OfferDetail({ offer } : { offer: Offer }) {
  const { id: offerId } = useParams();
  const navigate = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTicket, setShowTicket] = useState(false);

  const handleClaimOffer = () => {
    if (!user) {
      navigate.push("/login");
      return;
    }

    if (offer) {
      // Increment enquiries or handle offer claiming logic
      setShowTicket(true);
    }
  };

  if (loading) {
    return (
      <div className="min-w-full bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="flex items-center gap-2 overflow-hidden">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          <span className="text-lg text-gray-600">
            Loading offer details...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg max-w-md text-center">
          <p>Error loading offer details: {error}</p>
        </div>
      </div>
    );
  }

  if (!offer) {
    return null;
  }

  const isUpcoming = new Date(offer.fromTime) > new Date();
  const discount = Math.round(
    ((offer.originalPrice - offer.newPrice) / offer.originalPrice) * 100
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 p-8">
{/*       
      <title>
        {offer.dishName} - {offer.hotelName}
      </title>
      <meta name="description" content={offer.description} />
      <meta property="og:title" content="Cravings" />
      <meta
        property="og:description"
        content={`Get ${discount}% off on ${offer.dishName} at Cravings`}
      />
      <meta property="og:image" content={offer.dishImage} /> */}

      <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden hover:shadow-xl transition-shadow">
          <Image
            src={offer.dishImage}
            alt={offer.dishName}
            width={500}
            height={500}
            className="w-full h-64 object-cover"
          />
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <CardTitle className="text-4xl font-bold">
                  {offer.dishName}
                </CardTitle>
                <p className="text-lg text-gray-700">{offer.hotelName}</p>
                {offer.description && (
                  <p className="text-gray-600 leading-relaxed">
                    {offer.description}
                  </p>
                )}
              </div>
              <Badge variant="destructive" className="bg-orange-600 text-white">
                {discount}% OFF
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 line-through">
                  ₹{offer.originalPrice.toFixed(2)}
                </span>
                <span className="text-3xl font-bold text-orange-600">
                  ₹{offer.newPrice.toFixed(2)}
                </span>
              </div>

              <div className="space-y-3">
                {!isUpcoming && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    <CountdownTimer endTime={offer.toTime} upcomming={false} />
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="w-4 h-4 mr-2" />
                  {offer.area}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge
                    variant="secondary"
                    className="bg-orange-100 text-orange-800"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {offer.itemsAvailable} items{" "}
                    {isUpcoming ? "left" : "available"}
                  </Badge>
                  {offer.enquiries > 0 && (
                    <Badge
                      variant="secondary"
                      className={
                        offer.enquiries > offer.itemsAvailable
                          ? "bg-red-600 text-white"
                          : "bg-orange-500 text-white"
                      }
                    >
                      {offer.enquiries > offer.itemsAvailable
                        ? "High Demand"
                        : "In Demand"}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-[1fr,100px] w-[100%] gap-2">
                <Button
                  disabled={isUpcoming}
                  onClick={isUpcoming ? undefined : handleClaimOffer}
                  className={`w-full py-3 text-lg font-semibold transition-all ${
                    isUpcoming
                      ? "bg-gray-100 text-[#E63946] shadow-xl border border-gray-200"
                      : "bg-orange-600 hover:bg-orange-700"
                  }`}
                >
                  {isUpcoming ? (
                    <>
                      Offer Activates in:{" "}
                      <CountdownTimer
                        endTime={offer.fromTime}
                        upcomming={true}
                      />
                    </>
                  ) : (
                    "Claim Offer"
                  )}
                </Button>
                <Share offerId={offerId || ""} className={"w-[100px]"} />
              </div>
            </div>
          </CardContent>
        </Card>

        {showTicket && (
          <OfferTicket
            isOpen={showTicket}
            onClose={() => setShowTicket(false)}
            offer={offer}
          />
        )}
      </div>
    </div>
  );
}
