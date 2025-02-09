"use client";
import { Suspense, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Star,
  Tag,
  UtensilsCrossed,
} from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useAuthStore, UserData } from "@/store/authStore";
import { OfferTicket } from "@/components/OfferTicket";
import Share from "@/components/Share";
import { Offer, useOfferStore } from "@/store/offerStore";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useClaimedOffersStore } from "@/store/claimedOffersStore";
import DiscountBadge from "@/components/DiscountBadge";
import ClaimOfferButton from "@/components/ClaimOfferButton";
import Link from "next/link";
import { toast } from "sonner";
import { useReviewsStore } from "@/store/reviewsStore";

export default function OfferDetail({
  offer,
  hotelData,
}: {
  offer: Offer;
  hotelData: UserData;
}) {
  const { id: offerId } = useParams();
  const navigate = useRouter();
  const { user, userData } = useAuthStore();
  const [showTicket, setShowTicket] = useState(false);
  const [token, setToken] = useState<string>(""); // Add token state
  const [isClaimed, setClaimed] = useState(false);
  const { getAverageReviewByHotelId } = useReviewsStore();
  const {
    isOfferClaimed,
    syncClaimedOffersWithFirestore,
    addClaimedOffer,
    updateUserOffersClaimable,
    offersClaimable,
    claimedOffers,
  } = useClaimedOffersStore();
  const { incrementEnquiry } = useOfferStore();

  // Fetch claimed offers from Firestore when the component mounts
  useEffect(() => {
    if (user?.uid) {
      const claimed = isOfferClaimed(offer.id);
      setClaimed(claimed);
      const claimedOffer = claimedOffers.find((o) => o.offerId === offer.id);
      setToken(claimed ? claimedOffer?.token ?? "" : "");
      const unsubscribe = syncClaimedOffersWithFirestore(user.uid);

      if (offersClaimable < offer.originalPrice - offer.newPrice && !claimed) {
        toast.error("You don't have enough cravings cash to claim this offer");
        return;
      }
      return () => unsubscribe(); // Clean up the listener on unmount
    }
  }, [user, syncClaimedOffersWithFirestore]);

  const handleClaimOffer = async () => {
    if (!user) {
      navigate.push("/login");
      return;
    }

    if (offersClaimable < offer.originalPrice - offer.newPrice) {
      toast.error("You don't have enough cravings cash to claim this offer");
      return;
    }

    const offerDiscount = offer.originalPrice - offer.newPrice;

    if (offer) {
      try {
        // Claim the offer and get the token
        const newToken = await addClaimedOffer(offer, user.uid);
        setToken(newToken); // Set the token in state
        setShowTicket(true); // Show the ticket dialog

        // Increment the enquiry count if the offer is not already claimed
        if (!isClaimed) {
          incrementEnquiry(offer.id, offer.hotelId);
          setClaimed(true);
        }

        await updateUserOffersClaimable(user.uid, -1 * offerDiscount);
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
    <div className="min-h-screen w-full md:bg-gradient-to-b from-orange-50 to-orange-100 md:pt-10">
      <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden shadow-none border-none transition-shadow relative rounded-none md:rounded-xl">
          <div
            onClick={() => navigate.back()}
            className="absolute cursor-pointer top-3 left-3 text-white z-[50] bg-orange-600 rounded-full p-2"
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

            <div className="grid bg-gradient-to-t from-black to-transparentr p-5 sm:p-3 absolute bottom-0 left-0 w-full">
              <Share
                offerId={offerId || ""}
                className={"absolute bottom-6 right-2"}
              />

              <span className="text-white/70 line-through text-xl">
                ₹{offer.originalPrice.toFixed(0)}
              </span>
              <span className="text-4xl font-bold text-white">
                ₹{offer.newPrice.toFixed(0)}
              </span>
              <div className="text-base font-bold text-orange-600 flex items-center gap-1">
                <span>★</span>
                <span>{offer.rating?.toFixed(1) || "0"}</span>
              </div>
            </div>
          </div>
          <DiscountBadge discount={discount} />
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <CardTitle className="text-3xl font-bold text-pretty">
                  {offer.dishName}
                </CardTitle>
                {offer.description && (
                  <CardDescription>{offer.description}</CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link
              href={`/hotels/${hotelData.id}`}
              className="text-lg text-gray-700 grid grid-cols-2  gap-2 bg-gray-50 p-3 rounded-xl w-full"
            >
              <div className="grid">
                <UtensilsCrossed />
                <span>{offer.hotelName}</span>
                <Suspense>
                  <div className="flex items-center mt-1  gap-2 text-black/60 text-sm w-fit">
                    <Star
                      className="text-orange-600 fill-orange-600"
                      size={20}
                    />
                    {getAverageReviewByHotelId(hotelData?.id as string) ?? 0}
                  </div>
                </Suspense>
                <span className="text-sm mt-1">
                  Followers : {hotelData?.followers?.length ?? 0}
                </span>
              </div>

              <div className="flex justify-end items-center">
                <div className="text-base bg-orange-600 text-white rounded-xl px-3 py-2">
                  {hotelData?.followers?.some((f) => f.user == user?.uid)
                    ? "Unfollow"
                    : "Follow"}
                </div>
              </div>
            </Link>
            <div className="space-y-6 mt-5">
              <div className="space-y-3">
                {!isUpcoming && (
                  <div className="flex items-center text-lg text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    <CountdownTimer endTime={offer.toTime} />
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

              <div className={`h-[36px] w-full`}>
                {userData ? (
                  <ClaimOfferButton
                    handleClaimOffer={handleClaimOffer}
                    isClaimed={isClaimed}
                    offer={offer}
                    offersClaimable={offersClaimable}
                    setShowTicket={setShowTicket}
                  />
                ) : (
                  <Link
                    className={`w-full flex justify-center py-2 px-3 text-[15px] font-semibold transition-all text-white bg-orange-600 hover:bg-orange-700 rounded-sm `}
                    href={"/login"}
                  >
                    Claim Offer
                  </Link>
                )}
              </div>
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
