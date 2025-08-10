"use client";
import { HotelData, HotelDataMenus } from "@/app/hotels/[...id]/page";
import React from "react";
import HeadingWithAccent from "../../../HeadingWithAccent";
import { Styles } from "@/screens/HotelMenuPage_v2";
import { Carousel, CarouselContent, CarouselItem } from "../../../ui/carousel";
import ItemCard from "./ItemCard";
import Autoplay from "embla-carousel-autoplay";

const PopularItemsList = ({
  items,
  currency,
  hotelData,
  styles,
  tableNumber,
}: {
  items: HotelDataMenus[];
  styles: Styles;
  hotelData: HotelData;
  currency: string;
  tableNumber: number;
}) => {
  return (
    <div className="flex flex-col gap-6 my-5">
      <HeadingWithAccent
        className="text-3xl font-black text-center"
        accent={styles.accent}
      >
        Must Try
      </HeadingWithAccent>

      <Carousel
        className="h-full"
        plugins={[
          Autoplay({
            delay: 2000,
          }),
        ]}
      >
        <CarouselContent className="pl-[8%] mr-[8%] h-full pt-4">
          {items
            .sort((a, b) => {
              // First, sort by priority
              const priorityDiff = (a.priority ?? 0) - (b.priority ?? 0);
              if (priorityDiff !== 0) return priorityDiff;
              
              // Prioritize upcoming offers first, then sort by start time
              const aOffers = hotelData.offers?.filter((o) => o.menu && o.menu.id === a.id) || [];
              const bOffers = hotelData.offers?.filter((o) => o.menu && o.menu.id === b.id) || [];
              
              const now = new Date();
              const aHasUpcoming = aOffers.some(offer => new Date(offer.start_time) > now);
              const bHasUpcoming = bOffers.some(offer => new Date(offer.start_time) > now);
              
              // Put upcoming offers first (highest priority)
              if (aHasUpcoming && !bHasUpcoming) {
                return -1; // a comes first
              }
              if (!aHasUpcoming && bHasUpcoming) {
                return 1; // b comes first
              }
              
              // If both are upcoming or both are active, sort by start time (newer on top)
              if (aOffers.length > 0 && bOffers.length > 0) {
                const aEarliestStart = Math.min(...aOffers.map(o => new Date(o.start_time).getTime()));
                const bEarliestStart = Math.min(...bOffers.map(o => new Date(o.start_time).getTime()));
                return bEarliestStart - aEarliestStart;
              } else if (aOffers.length > 0) {
                return -1; // a has offers, b doesn't - a comes first
              } else if (bOffers.length > 0) {
                return 1; // b has offers, a doesn't - b comes first
              }
              
              return 0;
            })
            .map((item, index) => {
            let offerPrice = item.price;
            let oldPrice = item.price;
            let discountPercent = 0;
            let hasMultipleVariantsOnOffer = false;
            let isOfferItem = false;
            let isUpcomingOffer = false;
            let activeOffers: any[] = [];
            let upcomingOffers: any[] = [];
            
            // Always check for offers for this item, regardless of category
            const itemOffers = hotelData.offers?.filter((o) => o.menu && o.menu.id === item.id) || [];
            
            if (itemOffers.length > 0) {
              isOfferItem = true;
              
              // Check for upcoming offers (start_time > current time)
              const now = new Date();
              upcomingOffers = itemOffers.filter(offer => new Date(offer.start_time) > now);
              activeOffers = itemOffers.filter(offer => new Date(offer.start_time) <= now);
              
              // If there are upcoming offers, mark as upcoming
              if (upcomingOffers.length > 0) {
                isUpcomingOffer = true;
              }
              
              if (isUpcomingOffer) {
                // For upcoming offers, show original price as main, offer price as strikethrough
                if (upcomingOffers.length > 1) {
                  // Multiple variants on upcoming offer
                  hasMultipleVariantsOnOffer = true;
                  const lowestOfferPrice = Math.min(...upcomingOffers.map(o => o.offer_price || 0));
                  const lowestOriginalPrice = Math.min(...upcomingOffers.map(o => 
                    o.variant ? o.variant.price : (o.menu?.price || 0)
                  ));
                  
                  // For upcoming offers: show original price as main, offer price as strikethrough
                  offerPrice = lowestOriginalPrice; // Main displayed price (original)
                  oldPrice = lowestOfferPrice; // Strikethrough price (future offer price)
                  
                  if (lowestOriginalPrice > lowestOfferPrice) {
                    discountPercent = Math.round(((lowestOriginalPrice - lowestOfferPrice) / lowestOriginalPrice) * 100);
                  }
                } else if (upcomingOffers.length === 1) {
                  // Single variant on upcoming offer
                  const offer = upcomingOffers[0];
                  const originalPrice = offer?.variant ? offer.variant.price : (offer?.menu?.price || item.price);
                  const futureOfferPrice = typeof offer?.offer_price === 'number' ? offer.offer_price : item.price;
                  
                  // For upcoming offers: show original price as main, offer price as strikethrough
                  offerPrice = originalPrice; // Main displayed price (original)
                  oldPrice = futureOfferPrice; // Strikethrough price (future offer price)
                  
                  if (originalPrice > futureOfferPrice) {
                    discountPercent = Math.round(((originalPrice - futureOfferPrice) / originalPrice) * 100);
                  }
                }
              } else {
                // For active offers, use the existing logic
                const offersToUse = activeOffers;
                
                if (offersToUse.length > 1) {
                  // Multiple variants on offer - show "See Options" button
                  hasMultipleVariantsOnOffer = true;
                  // Use the lowest offer price for display
                  const lowestOfferPrice = Math.min(...offersToUse.map(o => o.offer_price || 0));
                  offerPrice = lowestOfferPrice;
                  
                  // For multiple variants, we don't need oldPrice since we're showing "From" price
                  oldPrice = item.price; // This won't be used for display
                  
                  // Calculate discount based on the lowest offer price vs the lowest original price
                  const lowestOriginalPrice = Math.min(...offersToUse.map(o => 
                    o.variant ? o.variant.price : (o.menu?.price || 0)
                  ));
                  if (lowestOriginalPrice > lowestOfferPrice) {
                    discountPercent = Math.round(((lowestOriginalPrice - lowestOfferPrice) / lowestOriginalPrice) * 100);
                  }
                } else if (offersToUse.length === 1) {
                  // Single variant on offer
                  const offer = offersToUse[0];
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
            }
            
            return (
            <CarouselItem key={`popular-${item.name + index}`}>
                <ItemCard 
                  hotelData={hotelData} 
                  tableNumber={tableNumber} 
                  feature_flags={hotelData?.feature_flags} 
                  currency={currency} 
                  item={item} 
                  styles={styles} 
                  className="h-full"
                  isOfferItem={isOfferItem}
                  offerPrice={offerPrice}
                  oldPrice={oldPrice}
                  discountPercent={discountPercent}
                  hasMultipleVariantsOnOffer={hasMultipleVariantsOnOffer}
                  currentCategory="all"
                  isOfferCategory={false}
                  isUpcomingOffer={isUpcomingOffer}
                  activeOffers={isUpcomingOffer ? upcomingOffers : activeOffers}
                />
            </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default PopularItemsList;
