"use client";
import { HotelDataMenus } from "@/app/hotels/[id]/page";
import { Styles } from "@/screens/HotelMenuPage_v2";
import React, { useState } from "react";
import Img from "../Img";
import ItemDetailsModal from "./ItemDetailsModal";
import DescriptionWithTextBreak from "../DescriptionWithTextBreak";

const ItemCard = ({
  item,
  styles,
  className,
  currency,
}: {
  item: HotelDataMenus;
  styles: Styles;
  currency: string;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        style={styles.border}
        key={item.id}
        className={`py-8 rounded-[35px] px-6 flex-1 relative bg-white text-black ${className}`}
      >
        <div className="flex flex-col gap-y-2 justify-between items-start w-full">
          <div className={`flex justify-between w-full`}>
            <div
              className={`flex flex-col justify-center ${
                item.image_url ? "w-1/2" : ""
              } ${!item.is_available ? "opacity-25" : ""}`}
            >
              <div className="capitalize text-xl font-bold">{item.name}</div>
              <div
                style={{
                  color: !item.is_available ? styles.color : styles.accent,
                }}
                className={`font-black text-2xl`}
              >
                {currency}{item.price}
              </div>
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
        </div>
      </div>

      <ItemDetailsModal styles={styles} open={isOpen} setOpen={setIsOpen} item={item} />
    </>
  );
};

export default ItemCard;
