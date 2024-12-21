import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Offer } from "@/store/offerStore";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Clock, MapPin, Tag } from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";
import Share from "./Share";
import { Button } from "./ui/button";

const OfferCard = ({
  offer,
  discount,
  isUpcoming,
  claimed,
  handleOfferClick,
}: {
  offer: Offer;
  discount: number;
  isUpcoming: boolean;
  claimed: boolean;
  handleOfferClick: (offer: Offer) => void;
}) => {


  return (
    <Card
      key={offer.id}
      className="overflow-hidden hover:shadow-xl transition-shadow"
    >
      <Link href={`/offers/${offer.id}`}>
        <Image
          src={offer.dishImage}
          alt={offer.dishName}
          width={300}
          height={300}
          className="w-full h-48 object-cover"
        />
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <CardTitle className="text-xl font-bold">
                {offer.dishName}
              </CardTitle>
              {offer.description && (
                <p className="text-sm text-gray-600 leading-snug">
                  {offer.description}
                </p>
              )}
              <p className="text-base font-medium text-gray-700">
                {offer.hotelName}
              </p>
            </div>
            <Badge variant="destructive" className="bg-orange-600">
              {discount}% OFF
            </Badge>
          </div>
        </CardHeader>
      </Link>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 line-through">
              ₹{offer.originalPrice.toFixed(2)}
            </span>
            <span className="text-2xl font-bold text-orange-600">
              ₹{offer.newPrice.toFixed(2)}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <div className="flex flex-col gap-3">
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
              </div>
              <Share offerId={offer.id} />
            </div>
            <div className="flex gap-3">
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
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {/* Claim Button */}
            <Button
              disabled={isUpcoming}
              onClick={isUpcoming ? undefined : () => handleOfferClick(offer)}
              className={`w-full ${
                isUpcoming
                  ? "bg-gray-100 disabled:opacity-100 text-[#E63946] font-bold shadow-xl border border-gray-200"
                  : "bg-orange-600 hover:bg-orange-700"
              }`}
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
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfferCard;
