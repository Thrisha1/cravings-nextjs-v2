"use client";
import { Styles } from "@/screens/HotelMenuPage_v2";
import { Offer } from "@/store/offerStore_hasura";
import React from "react";
import OfferCardMin from "../OfferCardMin";
import HeadingWithAccent from "../HeadingWithAccent";
import Link from "next/link";

const OfferList = ({ offers, styles }: { offers: Offer[]; styles: Styles }) => {
  return (
    <div className="flex flex-col gap-6 my-5">
      <HeadingWithAccent
        className="text-3xl font-black text-center"
        accent={styles.accent}
      >
        Offers
      </HeadingWithAccent>

      <div className="grid grid-cols-2 gap-4 my-5">
        {offers.map((offer) => {
          const discount =
            ((offer.menu.price - offer.offer_price) / offer.menu.price) * 100;
          const isUpcoming = new Date(offer.start_time) > new Date();

          return (
            <Link key={`offer-${offer.id}`} href={`/offers/${offer.id}`}>
              <OfferCardMin
                discount={Number(discount.toFixed(0))}
                offer={offer}
                isUpcoming={isUpcoming}
                onClick={() => {}}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default OfferList;
