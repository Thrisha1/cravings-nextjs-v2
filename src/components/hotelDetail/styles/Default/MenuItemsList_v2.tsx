"use client";

import React, { useEffect, useState } from "react";
import { HotelData, HotelDataMenus } from "@/app/hotels/[...id]/page";
import { Styles } from "@/screens/HotelMenuPage_v2";
import { Category, formatDisplayName } from "@/store/categoryStore_hasura";
import ItemCard from "./ItemCard";
import { useSearchParams } from "next/navigation";

const MenuItemsList = ({
  styles,
  items,
  categories,
  hotelData,
  setSelectedCategory,
  currency,
  tableNumber,
}: {
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
  const isOfferCategory = selectedCat === "Offer";
  

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
        {items
          ?.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
          ?.map((item) => {
            let offerPrice = item.price;
            let oldPrice = item.price;
            let discountPercent = 0;
            let hasMultipleVariantsOnOffer = false;
            let isOfferItem = false;
            
            // Always check for offers for this item, regardless of category
            const itemOffers = hotelData.offers?.filter((o) => o.menu && o.menu.id === item.id) || [];
            
            if (itemOffers.length > 0) {
              isOfferItem = true;
              
              if (itemOffers.length > 1) {
                // Multiple variants on offer - show "See Options" button
                hasMultipleVariantsOnOffer = true;
                // Use the lowest offer price for display
                const lowestOfferPrice = Math.min(...itemOffers.map(o => o.offer_price || 0));
                offerPrice = lowestOfferPrice;
                
                // For multiple variants, we don't need oldPrice since we're showing "From" price
                oldPrice = item.price; // This won't be used for display
                
                // Calculate discount based on the lowest offer price vs the lowest original price
                const lowestOriginalPrice = Math.min(...itemOffers.map(o => 
                  o.variant ? o.variant.price : (o.menu?.price || 0)
                ));
                if (lowestOriginalPrice > lowestOfferPrice) {
                  discountPercent = Math.round(((lowestOriginalPrice - lowestOfferPrice) / lowestOriginalPrice) * 100);
                }
              } else if (itemOffers.length === 1) {
                // Single variant on offer
                const offer = itemOffers[0];
                offerPrice = typeof offer?.offer_price === 'number' ? offer.offer_price : item.price;
                
                if (offer?.variant) {
                  oldPrice = offer.variant.price;
                } else {
                  oldPrice = typeof offer?.menu?.price === 'number' ? offer.menu.price : item.price;
                }
                
                if (typeof offer?.offer_price === 'number' && oldPrice > offer.offer_price) {
                  discountPercent = Math.round(((oldPrice - offer.offer_price) / oldPrice) * 100);
                }
              }
            }
            
            // Don't show variant name in display name for items with multiple variants on offer
            const displayName = hasMultipleVariantsOnOffer ? item.name : item.name;
            
            return (
              <ItemCard
                hotelData={hotelData}
                feature_flags={hotelData?.feature_flags}
                currency={currency}
                key={item.id}
                item={item}
                styles={styles}
                tableNumber={tableNumber}
                isOfferItem={isOfferItem}
                offerPrice={offerPrice}
                oldPrice={oldPrice}
                discountPercent={discountPercent}
                displayName={displayName}
                hasMultipleVariantsOnOffer={hasMultipleVariantsOnOffer}
                currentCategory={selectedCat}
                isOfferCategory={isOfferCategory}
              />
            );
          })}
      </div>
    </div>
  );
};

export default MenuItemsList;
