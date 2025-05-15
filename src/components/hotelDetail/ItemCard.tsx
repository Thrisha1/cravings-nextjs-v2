"use client";
import { HotelData, HotelDataMenus } from "@/app/hotels/[...id]/page";
import { Styles } from "@/screens/HotelMenuPage_v2";
import React, { useEffect, useState } from "react";
import Img from "../Img";
import ItemDetailsModal from "./ItemDetailsModal";
import DescriptionWithTextBreak from "../DescriptionWithTextBreak";
import useOrderStore, { OrderItem } from "@/store/orderStore";
import { getFeatures } from "@/lib/getFeatures";

const ItemCard = ({
  item,
  styles,
  className,
  feature_flags,
  currency,
  hotelData
}: {
  item: HotelDataMenus;
  styles: Styles;
  currency: string;
  className?: string;
  feature_flags?: string;
  hotelData?: HotelData;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { addItem, items, decreaseQuantity , removeItem } = useOrderStore();
  const hasOrderingFeature = getFeatures(feature_flags || "")?.ordering.enabled;
  const [itemQuantity, setItemQuantity] = useState<number | 0>(0);

  useEffect(() => {
    const itemInCart = items?.find((i: OrderItem) => i.id === item.id);
    if (itemInCart) {
      setItemQuantity(itemInCart.quantity);
    } else {
      setItemQuantity(0);
    }
  },[items]);

  return (
    <div className="h-full relative">
      {/* add Item to cart  */}
      {/* {(item.is_available && hasOrderingFeature) && (
        <button
          onClick={() => {
            addItem(item);
          }}
          style={{
            backgroundColor: styles.accent,
            ...styles.border,
            color: "white",
          }}
          className="active:brightness-[120%] active:scale-90 transition-all duration-75 font-medium text-xl absolute top-0 right-0 translate-x-3 -translate-y-2 rounded-full cursor-pointer z-10 grid place-items-center w-12 aspect-square"
        >
          +
        </button>
      )} */}

      <div
        style={styles.border}
        key={item.id}
        className={`pt-8 pb-5 rounded-[35px] px-6 flex-1 relative bg-white text-black ${className}`}
      >
        <div className="flex flex-col gap-y-2 justify-between items-start w-full">
          <div onClick={()=>setIsOpen(true)} className={`flex justify-between w-full`}>
            <div
              className={`flex flex-col justify-center ${
                item.image_url ? "w-1/2" : ""
              } ${!item.is_available ? "opacity-25" : ""}`}
            >
              <div className="capitalize text-xl font-bold">{item.name}</div> 
              {currency !== "🚫" && (
                <div
                  style={{
                    color: !item.is_available ? styles.color : styles.accent,
                  }}
                  className={`font-black text-2xl`}
                >
                  {currency}{" "}
                  {hotelData?.id === "767da2a8-746d-42b6-9539-528b6b96ae09" ? item.price.toFixed(3) : item.price}
                </div>
              )}
              <DescriptionWithTextBreak
                maxLines={2}
                className="text-sm opacity-50 mt-1"
              >
                {item.description}
              </DescriptionWithTextBreak>
            </div>
            {item.image_url.length > 0 && (
              <div className="w-[100px] h-[100px] relative rounded-3xl overflow-hidden">
                <Img
                  src={item.image_url}
                  alt={item.name}
                  className={`object-cover w-full h-full ${
                    !item.is_available ? "grayscale" : ""
                  }`}
                />
                {!item.is_available && (
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 bg-red-500 text-white text-sm font-semibold py-2 px-3 w-full">
                    Unavailabe
                  </div>
                )}
              </div>
            )}
          </div>

          {/* add Item to cart  */}
          {item.is_available && hasOrderingFeature && (
            <div className="flex gap-2 items-center justify-end w-full mt-2">
             
             <button
                onClick={() => {
                  if(itemQuantity > 1) {
                    decreaseQuantity(item.id as string);
                  }
                  else {
                    removeItem(item.id as string);
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

              <div className="bg-[#e2e2e2] rounded aspect-square h-8 grid place-items-center font-bold text-black/70">{itemQuantity}</div>

              <button
                onClick={() => {
                  addItem(item);
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
      </div>

      <ItemDetailsModal
        styles={styles}
        open={isOpen}
        setOpen={setIsOpen}
        item={item}
        currency={currency}
        hotelData={hotelData as HotelData}
      />
    </div>
  );
};

export default ItemCard;
