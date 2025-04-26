import { HotelDataMenus } from "@/app/hotels/[id]/page";
import { Styles } from "@/screens/HotelMenuPage_v2";
import React from "react";
import Img from "../Img";

const ItemCard = ({
  item,
  styles,
}: {
  item: HotelDataMenus;
  styles: Styles;
}) => {
  return (
    <div
      style={styles.border}
      key={item.id}
      className="py-6 rounded-[35px] px-6 flex-1 relative bg-white"
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
              className={`font-bold text-xl`}
            >
              ₹{item.price}
            </div>
            <div className="text-sm opacity-50">{item.description}</div>
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
  );
};

export default ItemCard;
