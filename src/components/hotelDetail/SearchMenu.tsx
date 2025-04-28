"use client";
import { HotelDataMenus } from "@/app/hotels/[id]/page";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Styles } from "@/screens/HotelMenuPage_v2";
import { SearchIcon, X } from "lucide-react";
import Fuse from "fuse.js";
import ItemCard from "./ItemCard";

const SearchMenu = ({
  menu,
  currency,
  styles,
}: {
  menu: HotelDataMenus[];
  styles: Styles;
  currency: string;
}) => {
  const [items, setItems] = useState<HotelDataMenus[]>([]);
  const [query, setQuery] = useState<string>("");
  const [fuse, setFuse] = useState<Fuse<HotelDataMenus> | null>(null);

  // Initialize Fuse.js when component mounts or menu changes
  useEffect(() => {
    if (menu.length > 0) {
      const options = {
        keys: [
          "name",
          "category.name",
          "description",
          {
            name: "price",
            getFn: (item: HotelDataMenus) => item.price.toString(),
          },
        ],
        includeScore: true,
        threshold: 0.2,
        minMatchCharLength: 2,
      };
      setFuse(new Fuse(menu, options));
      setItems(menu); // Initialize with all items
    }
  }, [menu]);

  // Perform search when query changes
  useEffect(() => {
    if (query.trim() === "") {
      setItems(menu);
      return;
    }

    if (fuse) {
      const results = fuse.search(query);
      setItems(results.map((result) => result.item));
    }
  }, [query, fuse, menu]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <Dialog>
      <DialogTrigger
        style={styles.border}
        className="bg-white w-full h-[55px] rounded-full flex items-center px-4 gap-3 text-black/30"
      >
        <SearchIcon />
        <span>Search</span>
      </DialogTrigger>
      <DialogContent className="w-full h-full flex flex-col">
        {/* header  */}
        <div className="flex gap-3 justify-between items-center px-[3%] py-4">
          <DialogTitle className="hidden">Search Menu</DialogTitle>

          {/* search bar  */}
          <div
            className="flex items-center gap-3 flex-1 min-w-0 rounded-full px-4 py-2"
            style={styles.border}
          >
            <SearchIcon size={25} className="shrink-0 opacity-30" />
            <input
              className="bg-transparent flex-1 min-w-0 outline-none py-2"
              placeholder="Search"
              value={query}
              onChange={handleSearchChange}
            />
          </div>

          {/* close button  */}
          <DialogClose>
            <X size={25} />
          </DialogClose>
        </div>

        {/* menu list  */}
        <div className="grid gap-5 overflow-y-scroll scrollbar-hidden">
          {items.length > 0 ? (
            items.map((item) => (
              <ItemCard
                currency={currency}
                key={item.id}
                item={item}
                styles={styles}
              />
            ))
          ) : (
            <div className="py-4 px-[3%] text-center font-medium">
              No items found
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchMenu;
