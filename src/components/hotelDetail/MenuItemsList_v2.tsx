import React, { useEffect, useState } from "react";
import { Accordion, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { AccordionContent } from "@radix-ui/react-accordion";
import Image from "next/image";
import { HotelData, HotelDataMenus } from "@/app/hotels/[id]/page";
import Img from "../Img";
import { MenuItem, Styles } from "@/screens/HotelMenuPage_v2";
import { Category } from "@/store/categoryStore_hasura";
import ItemCard from "./ItemCard";

const MenuItemsList = ({
  menu,
  styles,
}: {
  menu: HotelDataMenus[];
  styles: Styles;
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [items, setItems] = useState<HotelDataMenus[]>([]);

  useEffect(() => {
    const processCategories = (menu: HotelDataMenus[]) => {
      const uniqueCategoriesMap = new Map<string, Category>();

      menu.forEach((item) => {
        if (!uniqueCategoriesMap.has(item.category.name)) {
          uniqueCategoriesMap.set(item.category.name, item.category);
        }
      });

      const uniqueCategories = Array.from(uniqueCategoriesMap.values()).sort(
        (a, b) => (a.priority || 0) - (b.priority || 0)
      );

      setCategories(uniqueCategories);
      setSelectedCategory(uniqueCategories[0]?.name || "");
    };

    processCategories(menu);
  }, [menu]);

  useEffect(() => {
    if (selectedCategory) {
      const filteredItems = menu.filter(
        (item) => item.category.name === selectedCategory
      );
      const sortedItems = [...filteredItems].sort((a, b) => {
        if (a.image_url.length && !b.image_url.length) return -1;
        if (!a.image_url.length && b.image_url.length) return 1;
        return 0;
      });
      setItems(sortedItems);
    }
  }, [selectedCategory]);

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
            onClick={() => setSelectedCategory(category.name)}
            style={{
              ...styles.border,
              color:
                selectedCategory === category.name ? "white" : styles.color,
              backgroundColor:
                selectedCategory === category.name ? styles.accent : "white",
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
        {items.map((item) => (
          <ItemCard key={item.id} item={item} styles={styles} />
        ))}
      </div>
    </div>
  );
};

export default MenuItemsList;
