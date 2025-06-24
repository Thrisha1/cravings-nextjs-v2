"use client";

import React, { useEffect, useState } from "react";
import { HotelData, HotelDataMenus } from "@/app/hotels/[...id]/page";
import { Styles } from "@/screens/HotelMenuPage_v2";
import { Category, formatDisplayName } from "@/store/categoryStore_hasura";
import ItemCard from "./ItemCard";
import { useSearchParams } from "next/navigation";

const MenuItemsList = ({
  menu,
  styles,
  items,
  categories,
  hotelData,
  setSelectedCategory,
  currency,
  tableNumber,
}: {
  menu: HotelDataMenus[];
  styles: Styles;
  items: HotelDataMenus[];
  categories: Category[];
  hotelData: HotelData;
  setSelectedCategory: (category: string) => void;
  currency: string;
  tableNumber: number;
}) => {
  const serachParaams = useSearchParams();
  const selectedCat = serachParaams.get("cat") || "all";

  return (
    <div className="flex flex-col gap-6">
      {/* categories  */}
      <div
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollBehavior: "smooth",
          paddingLeft: "8%",
          scrollPaddingLeft: "8%",
          paddingRight: "8%",
          scrollPaddingRight: "8%",
        }}
        // className="flex gap-x-2 overflow-x-scroll scrollbar-hidden "
        className="flex gap-2 flex-wrap justify-start"
      >
        <button
          onClick={() => {
            setSelectedCategory("all");
            window.scrollTo({
              top: document.getElementById("menu-items")?.offsetTop,
              behavior: "smooth",
            });
          }}
          style={{
            ...styles.border,
            color: selectedCat === "all" ? "white" : "black",
            backgroundColor: selectedCat === "all" ? styles.accent : "white",
          }}
          // className="font-semibold capitalize text-nowrap rounded-full px-5 py-[10px] snap-start flex-shrink-0"
          className="font-semibold capitalize text-xs text-nowrap rounded-full px-5 py-[10px] snap-start flex-shrink-0"
          key={"all"}
        >
          All
        </button>

        {categories.map((category, index) => (
          <button
            onClick={() => {
              setSelectedCategory(category.name);
              window.scrollTo({
                top: document.getElementById("menu-items")?.offsetTop,
                behavior: "smooth",
              });
            }}
            style={{
              ...styles.border,
              color: selectedCat === category.name ? "white" : "black",
              backgroundColor:
                selectedCat === category.name ? styles.accent : "white",
            }}
            // className="font-semibold capitalize text-nowrap rounded-full px-5 py-[10px] snap-start flex-shrink-0"
            className="font-semibold capitalize text-xs text-nowrap rounded-full px-5 py-[10px] snap-start flex-shrink-0"
            key={category.id + index + category.name}
          >
            {formatDisplayName(category.name)}
          </button>
        ))}
      </div>

      {/* items  */}
      <div id="menu-items" className="px-[8%] grid h-fit gap-3 rounded-3xl ">
        {hotelData?.fillteredMenus
          ?.sort((a, b) => a.priority - b.priority)
          ?.map((item) => (
            <ItemCard
              hotelData={hotelData}
              feature_flags={hotelData?.feature_flags}
              currency={currency}
              key={item.id}
              item={item}
              styles={styles}
              tableNumber={tableNumber}
            />
          ))}
      </div>
    </div>
  );
};

export default MenuItemsList;
