"use client";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Tag, UtensilsCrossed } from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useAuthStore } from "@/store/authStore";
import { OfferTicket } from "@/components/OfferTicket";
import Share from "@/components/Share";
import { Offer, useOfferStore } from "@/store/offerStore";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useClaimedOffersStore } from "@/store/claimedOffersStore";
import DiscountBadge from "@/components/DiscountBadge";

export default function OfferDetail({ offer }: { offer: Offer }) {
  const { id: offerId } = useParams();
  const navigate = useRouter();
  const { user } = useAuthStore();
  const [showTicket, setShowTicket] = useState(false);
  const [isCalimed, setClaimed] = useState(false);
  const { isOfferClaimed, getClaimedOffer } = useClaimedOffersStore();
  const { incrementEnquiry } = useOfferStore();

  const handleClaimOffer = () => {
    if (!user) {
      navigate.push("/login");
      return;
    }

    if (offer) {
      setShowTicket(true);
      setClaimed(true);
      if (!isOfferClaimed(offer.id)) {
        incrementEnquiry(offer.id, offer.hotelId);
      }
    }
  };

  useEffect(() => {
    const isCalimed = isOfferClaimed(offer.id);
    setClaimed(isCalimed);
  }, [offer.id, isOfferClaimed]);

  const isUpcoming = new Date(offer.fromTime) > new Date();
  const discount = Math.round(
    ((offer.originalPrice - offer.newPrice) / offer.originalPrice) * 100
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden hover:shadow-xl transition-shadow relative">
          <div className="relative">
            <Image
              src={offer.dishImage}
              alt={offer.dishName}
              width={500}
              height={500}
              priority={false}
              quality={60}
              className="w-full h-64 object-cover"
            />

            <div className="grid bg-gradient-to-t from-black to-transparentr p-3 absolute bottom-0 left-0 w-full">
              <span className="text-white/70 line-through text-xl">
                ₹{offer.originalPrice.toFixed(0)}
              </span>
              <span className="text-4xl font-bold text-white">
                ₹{offer.newPrice.toFixed(0)}
              </span>
            </div>
          </div>
          <DiscountBadge discount={discount} />
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <CardTitle className="text-3xl font-bold">
                  {offer.dishName}
                </CardTitle>
                {offer.description && (
                  <CardDescription>{offer.description}</CardDescription>
                )}
                <p className="text-lg text-gray-700 flex items-center gap-2">
                  <UtensilsCrossed />
                  <span>{offer.hotelName}</span>
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-3">
                {!isUpcoming && (
                  <div className="flex items-center text-lg text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    <CountdownTimer endTime={offer.toTime} upcomming={false} />
                  </div>
                )}
                <div className="flex items-center text-lg text-gray-500">
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
                  onClick={
                    isUpcoming
                      ? undefined
                      : isCalimed
                      ? () => setShowTicket(true)
                      : handleClaimOffer
                  }
                  className={`w-full py-3 text-lg font-semibold transition-all ${
                    isUpcoming
                      ? "bg-gray-100 text-[#E63946] shadow-xl border border-gray-200"
                      : isCalimed
                      ? "bg-green-600 hover:bg-green-700"
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
                  ) : isCalimed ? (
                    "View Ticket"
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
            claimedOffer={getClaimedOffer(offer.id)}
          />
        )}
      </div>
    </div>
  );
}
