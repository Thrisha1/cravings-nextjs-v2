"use client";
import React from "react";
import { Card } from "./ui/card";
import { Offer } from "@/store/offerStore";
import Image from "next/image";
import DiscountBadge from "./DiscountBadge";;

const OfferCardMin = ({
  offer,
  discount,
  onClick,
}: {
  offer: Offer;
  discount: number;
  isUpcoming?: boolean;
  onClick?: () => void;
}) => {
  return (
    <div
      className="cursor-pointer group-active:scale-95 h-full transition-all"
      onClick={onClick}
    >
      <Card
        key={offer.id}
        className="overflow-hidden hover:shadow-xl relative h-full "
      >
        {/* image container  */}
        <div className="relative">
          <Image
            src={offer.dishImage}
            alt={offer.dishName}
            width={300}
            height={300}
            priority={false}
            quality={60}
            className="w-full h-48 object-cover"
          />

          <div className="grid bg-gradient-to-t from-black to-transparentr p-3 absolute bottom-0 left-0 w-full">
            <span className="text-white/70 line-through text-sm">
              ₹{offer.originalPrice.toFixed(0)}
            </span>
            <span className="text-2xl font-bold text-white">
              ₹{offer.newPrice.toFixed(0)}
            </span>

            <div className="font-bold md:text-xl text-white">{offer.dishName}</div>
          </div>
        </div>

        <DiscountBadge discount={discount} />
      </Card>
    </div>
  );
};

export default OfferCardMin;
