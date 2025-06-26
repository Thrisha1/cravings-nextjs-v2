"use client";
import { HotelData, HotelDataMenus } from "@/app/hotels/[...id]/page";
import React, { useEffect, useState, useRef } from "react";
import { Styles } from "@/screens/HotelMenuPage_v2";
import { SearchIcon, X } from "lucide-react";
import Fuse from "fuse.js";
import useOrderStore from "@/store/orderStore";

const SearchMenu = ({
  hotelData,
  menu,
  currency,
  styles,
}: {
  menu: HotelDataMenus[];
  styles: Styles;
  currency: string;
  hotelData: HotelData;
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [items, setItems] = useState<HotelDataMenus[]>([]);
  const [query, setQuery] = useState<string>("");
  const [fuse, setFuse] = useState<Fuse<HotelDataMenus> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Effect to disable body scroll when search is open
  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    // Cleanup on component unmount
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isSearchOpen]);

  // Initialize Fuse.js
  useEffect(() => {
    if (menu.length > 0) {
      const options = {
        keys: ["name"],
        threshold: 0.3, // Not used in extended search, but keep for fallback
        useExtendedSearch: true,
      };
      setFuse(new Fuse(menu, options));
      setItems(menu);
    }
  }, [menu]);

  // Perform search
  useEffect(() => {
    if (query.trim() === "") {
      setItems(menu);
      return;
    }
    const words = query.trim().toLowerCase().split(/\s+/);
    const filtered = menu.filter(item => {
      const nameWords = item.name.toLowerCase().split(/\s+/);
      // Every search word must match the start of some word in the item name
      return words.every(word =>
        nameWords.some(nw => nw.startsWith(word))
      );
    });
    setItems(filtered);
  }, [query, menu]);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen) {
      inputRef.current?.focus();
    }
  }, [isSearchOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const { addItem } = useOrderStore();

  return (
    <>
      {/* Search Trigger */}
      <div
        onClick={() => setIsSearchOpen(true)}
        style={styles.border}
        className="bg-white w-full h-[55px] rounded-full flex items-center px-4 gap-3 text-black/30 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
      >
        <SearchIcon />
        <span>Search in {hotelData.name || 'Menu'}</span>
      </div>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-gray-50 z-[100] flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0 rounded-full px-4 py-2 bg-gray-100 border border-transparent focus-within:bg-white focus-within:border-gray-300 transition-all">
                <SearchIcon size={20} className="shrink-0 text-gray-400" />
                <input
                  ref={inputRef}
                  className="bg-transparent flex-1 min-w-0 outline-none text-base md:text-lg placeholder-gray-500"
                  placeholder={`Search...`}
                  value={query}
                  onChange={handleSearchChange}
                />
              </div>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-2.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close search"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Results Grid */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {items.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:gap-6 ">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-[260px] md:h-[300px]"
                  >
                    {/* Image */}
                    <div className="w-full h-[100px] md:h-[120px] bg-gray-100 relative overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-400">
                            {item.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Details */}
                    <div className="p-3 flex flex-col flex-1">
                      <h3 className="font-semibold text-gray-800 text-sm md:text-base mb-1 line-clamp-2">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <span className="text-sm md:text-base font-bold text-gray-900">
                          {currency}{item.price}
                        </span>
                        <button 
                          onClick={() => addItem(item)}
                          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs md:text-sm font-medium rounded-md transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <SearchIcon size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No items found
                </h3>
                <p className="text-gray-600 max-w-sm">
                  {query.trim() === ""
                    ? "Start typing to search..."
                    : `We couldn't find any items matching "${query}".`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SearchMenu;