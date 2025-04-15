"use client";
import React from "react";
import { Card } from "./ui/card";
import Image from "next/image";
import DiscountBadge from "./DiscountBadge";import { Offer } from "@/store/offerStore_hasura";
;

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
            src={offer.menu.image_url !== "" ? offer.menu.image_url : "/image_placeholder.webp"}
            alt={offer.menu.name}
            width={300}
            height={300}
            priority={false}
            quality={60}
            className="w-full h-48 object-cover"
          />

          <div className="grid bg-gradient-to-t from-black to-transparentr p-3 absolute bottom-0 left-0 w-full">
            <span className="text-white/70 line-through text-sm">
              ₹{offer.menu.price.toFixed(0)}
            </span>
            <span className="text-2xl font-bold text-white">
              ₹{offer.offer_price.toFixed(0)}
            </span>

            <div className="font-bold md:text-xl text-white">{offer.menu.name}</div>
          </div>
        </div>

        <DiscountBadge discount={discount} />
      </Card>
    </div>
  );
};

export default OfferCardMin;
