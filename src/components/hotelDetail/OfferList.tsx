"use client";
import { FeatureFlags, Styles } from "@/screens/HotelMenuPage_v2";
import { Offer } from "@/store/offerStore_hasura";
import React from "react";
import OfferCardMin from "../OfferCardMin";
import HeadingWithAccent from "../HeadingWithAccent";
import Link from "next/link";
import { HotelDataMenus } from "@/app/hotels/[...id]/page";
import useOrderStore from "@/store/orderStore";
import { useAuthStore } from "@/store/authStore";

const OfferList = ({
  offers,
  styles,
  menus,
  features
}: {
  offers: Offer[];
  styles: Styles;
  menus: HotelDataMenus[];
  features: FeatureFlags;
}) => {
  const { addItem, items, decreaseQuantity, removeItem } = useOrderStore();

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

          const item = menus.find((item) => item.id === offer.menu.id);

          const itemInCart = (items || []).find((i) => i.id === item?.id);
          const itemQuantity = itemInCart ? itemInCart.quantity : 0;

          if (!item) return null;

          return (

            <div key={`offer-${offer.id}`} className="flex flex-col bg-white rounded-3xl">
              <Link  href={`/offers/${offer.id}`}>
                <OfferCardMin
                  discount={Number(discount.toFixed(0))}
                  offer={offer}
                  isUpcoming={isUpcoming}
                  onClick={() => {}}
                />
              </Link>
              {item?.is_available && features?.ordering?.enabled && (
                <div className="flex gap-2 items-center justify-center w-full p-3">
                  <button
                    onClick={() => {
                      if (itemQuantity > 1) {
                        decreaseQuantity(item?.id as string);
                      } else {
                        removeItem(item?.id as string);
                      }
                    }}
                    style={{
                      backgroundColor: styles.accent,
                      ...styles.border,
                      color: "white",
                    }}
                    className="active:brightness-[120%] active:scale-90 transition-all duration-75 font-medium text-xl rounded-full cursor-pointer z-10 grid place-items-center w-9 aspect-square"
                  >
                    -
                  </button>

                  <div className="bg-[#e2e2e2] rounded aspect-square h-8 grid place-items-center font-bold text-black/70">
                    {itemQuantity}
                  </div>

                  <button
                    onClick={() => {
                      addItem(item as HotelDataMenus);
                    }}
                    style={{
                      backgroundColor: styles.accent,
                      ...styles.border,
                      color: "white",
                    }}
                    className="active:brightness-[120%] active:scale-90 transition-all duration-75 font-medium text-xl rounded-full cursor-pointer z-10 grid place-items-center w-9 aspect-square"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OfferList;
