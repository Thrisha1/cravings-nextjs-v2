"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Image from "next/image";
import { Clock, MapPin, Route, UtensilsCrossed } from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";
import DiscountBadge from "./DiscountBadge";
import { useRouter } from "next/navigation";
import { Offer } from "@/store/offerStore_hasura";

const OfferCard = ({
  offer,
  discount,
  isUpcoming,
  onClick,
}: {
  offer: Offer;
  discount: number;
  isUpcoming: boolean;
  onClick?: () => void;
}) => {
  const router = useRouter();
  return (
    <div
      className="cursor-pointer group-active:scale-95 h-full transition-all"
      onClick={onClick ? onClick : () => router.push(`/offers/${offer.id}`)}
    >
      <Card
        key={offer.id}
        className="overflow-hidden hover:shadow-xl relative h-full pb-1 group-active:bg-orange-200 transition-all"
      >
        {/* image container  */}
        <div className="relative">
          <Image
            src={offer.menu.image_url || "/image_placeholder.webp"}
            alt={offer.menu.name}
            width={200}
            height={200}
            priority={false}
            loading="lazy"
            quality={60}
            className="w-full h-32 object-cover"
          />

          <div className="absolute bottom-0  p-3  left-0 flex items-end bg-gradient-to-t from-black to-transparent w-full">
            <div className="grid w-full">
              <span className="text-white/70 line-through text-sm">
                ₹{offer.menu.price.toFixed(0)}
              </span>
              <span className="text-2xl font-bold text-white">
                ₹{offer.offer_price.toFixed(0)}
              </span>
            </div>

            <div className="text-sm font-bold text-orange-500 flex items-center gap-1">
              <span>★</span>
              {/* <span>{offer.rating?.toFixed(1) || "0"}</span> */}
            </div>
          </div>
        </div>

        <CardHeader className="p-3 md:p-5 space-y-0">
          <CardTitle className="font-bold md:text-xl text-balance">
            {offer.menu.name}
          </CardTitle>
        </CardHeader>

        <DiscountBadge discount={discount} />
        <CardContent className="p-3 md:p-5 md:pt-0 pt-0">
          <div className="">
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="flex flex-col gap-2">
                  {!isUpcoming && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-2" />
                      <CountdownTimer
                        endTime={new Date(offer.end_time)}
                        // upcomming={false}
                      />
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-2" />
                    {offer.partner?.location}
                  </div>
                  {/* {(offer.distance ?? 0) > 0 && (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Route className="w-4 h-4" />
                      <span>
                        {((offer.distance ?? 0) / 1000).toFixed(2)} km
                      </span>
                    </p>
                  )} */}
                  <p className="text-sm text-gray-800 flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4" />
                    <span>{offer.partner?.store_name}</span>
                  </p>
                </div>
              </div>

              {/* badges  */}

              {/* <div className="flex gap-3">
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge
                    variant="secondary"
                    className="bg-orange-100 text-orange-800"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {offer.itemsAvailable} items{" "}
                    {isUpcoming ? "left" : "available"}
                  </Badge>
                </div>
                {claimed && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge
                      variant="secondary"
                      className="bg-green-600 text-white"
                    >
                      Claimed
                    </Badge>
                  </div>
                )}
                {offer.enquiries > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
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
                  </div>
                )}
              </div> */}
            </div>

            {/* Claim Button */}
            {/* <Button
              disabled={isUpcoming}
              onClick={isUpcoming ? undefined : () => handleOfferClick(offer)}
              className={cn(
                `w-full mt-3 ${
                  isUpcoming
                    ? "bg-gray-100 disabled:opacity-100 text-[#E63946] font-bold shadow-xl border border-gray-200"
                    : claimed ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"
                }`
              )}
            >
              {claimed ? (
                "View Ticket"
              ) : isUpcoming ? (
                <div className="">
                  Offer Activates in :{" "}
                  <CountdownTimer endTime={offer.fromTime} upcomming={true} />
                </div>
              ) : (
                "Claim Offer"
              )}
            </Button> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfferCard;
