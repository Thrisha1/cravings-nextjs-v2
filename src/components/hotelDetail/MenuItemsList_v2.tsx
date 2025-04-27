"use client";

import React, { useEffect, useState } from "react";
import { HotelDataMenus } from "@/app/hotels/[id]/page";
import { Styles } from "@/screens/HotelMenuPage_v2";
import { Category } from "@/store/categoryStore_hasura";
import ItemCard from "./ItemCard";

const MenuItemsList = ({
  menu,
  styles,
  items,
  categories,
  selectedCategory,
}: {
  menu: HotelDataMenus[];
  styles: Styles;
  items: HotelDataMenus[];
  categories: Category[];
  selectedCategory: string;
}) => {
  const [selectedCat, setSelectedCat] = useState(selectedCategory );
  const [menus, setMenus] = useState<HotelDataMenus[]>(items);

  useEffect(() => {
    if (selectedCat) {
      const filteredItems = menu.filter(
        (item) => item.category.name === selectedCat
      );
      const sortedItems = [...filteredItems].sort((a, b) => {
        if (a.image_url.length && !b.image_url.length) return -1;
        if (!a.image_url.length && b.image_url.length) return 1;
        return 0;
      });
      setMenus(sortedItems);
    }
  }, [selectedCat]);

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
        className="flex gap-x-2 overflow-x-scroll scrollbar-hidden "
      >
        {categories.map((category, index) => (
          <button
            onClick={() => setSelectedCat(category.name)}
            style={{
              ...styles.border,
              color:
                selectedCat === category.name ? "white" : "black",
              backgroundColor:
                selectedCat === category.name ? styles.accent : "white",
            }}
            className="font-semibold capitalize text-nowrap rounded-full px-5 py-[10px] snap-start flex-shrink-0"
            key={category.id + index + category.name}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* items  */}
      <div className="px-[8%] grid h-fit gap-3 rounded-3xl overflow-hidden">
        {menus.map((item) => (
          <ItemCard key={item.id} item={item} styles={styles} />
        ))}
      </div>
    </div>
  );
};

export default MenuItemsList;
