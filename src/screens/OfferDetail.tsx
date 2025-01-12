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
import { ArrowLeft, Clock, MapPin, Tag, UtensilsCrossed } from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useAuthStore } from "@/store/authStore";
import { OfferTicket } from "@/components/OfferTicket";
import Share from "@/components/Share";
import { Offer, useOfferStore } from "@/store/offerStore";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useClaimedOffersStore } from "@/store/claimedOffersStore";
import DiscountBadge from "@/components/DiscountBadge";
import ClaimOfferButton from "@/components/ClaimOfferButton";

export default function OfferDetail({ offer }: { offer: Offer }) {
  const { id: offerId } = useParams();
  const navigate = useRouter();
  const { user, userData } = useAuthStore();
  const [showTicket, setShowTicket] = useState(false);
  const [token, setToken] = useState<string>(""); // Add token state
  const {
    isOfferClaimed,
    syncClaimedOffersWithFirestore,
    addClaimedOffer,
    updateUserOffersClaimable,
    offersClaimable,
  } = useClaimedOffersStore();
  const { incrementEnquiry } = useOfferStore();

  const isClaimed = isOfferClaimed(offer.id);
  // Fetch claimed offers from Firestore when the component mounts
  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = syncClaimedOffersWithFirestore(user.uid);
      return () => unsubscribe(); // Clean up the listener on unmount
    }
  }, [user, syncClaimedOffersWithFirestore]);

  const handleClaimOffer = async () => {
    if (!user) {
      navigate.push("/login");
      return;
    }

    if (offer) {
      try {
        // Claim the offer and get the token
        const newToken = await addClaimedOffer(offer, user.uid);
        setToken(newToken); // Set the token in state
        setShowTicket(true); // Show the ticket dialog

        // Increment the enquiry count if the offer is not already claimed
        if (!isClaimed) {
          incrementEnquiry(offer.id, offer.hotelId);
        }

        await updateUserOffersClaimable(user.uid, false);
      } catch (error) {
        console.error("Failed to claim offer:", error);
      }
    }
  };

  const isUpcoming = new Date(offer.fromTime) > new Date();
  const discount = Math.round(
    ((offer.originalPrice - offer.newPrice) / offer.originalPrice) * 100
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden hover:shadow-xl transition-shadow relative">
          <div
            onClick={() => navigate.back()}
            className="absolute top-3 left-3 text-white z-[50] bg-orange-600 rounded-full p-2"
          >
            <ArrowLeft width={30} height={30} />
          </div>

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

              {userData && (
                <div
                  className={`h-[36px] w-[100%] grid-cols-[1fr,100px] grid gap-2`}
                >
                  <ClaimOfferButton
                    handleClaimOffer={handleClaimOffer}
                    isClaimed={isClaimed}
                    offer={offer}
                    offersClaimable={offersClaimable}
                    setShowTicket={setShowTicket}
                  />
                  <Share
                    offerId={offerId || ""}
                    className={"w-full flex justify-center"}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {showTicket && (
          <OfferTicket
            isOpen={showTicket}
            onClose={() => setShowTicket(false)}
            offer={offer}
            token={token} // Pass the token directly
          />
        )}
      </div>
    </div>
  );
}
