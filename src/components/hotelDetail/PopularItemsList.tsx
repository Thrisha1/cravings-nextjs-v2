"use client";
import { HotelData, HotelDataMenus } from "@/app/hotels/[...id]/page";
import React from "react";
import HeadingWithAccent from "../HeadingWithAccent";
import { Styles } from "@/screens/HotelMenuPage_v2";
import { Carousel, CarouselContent, CarouselItem } from "../ui/carousel";
import ItemCard from "./ItemCard";
import Autoplay from "embla-carousel-autoplay";

const PopularItemsList = ({
  items,
  currency,
  hotelData,
  styles,
}: {
  items: HotelDataMenus[];
  styles: Styles;
  hotelData: HotelData;
  currency: string;
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
          {items.map((item, index) => (
            <CarouselItem key={`popular-${item.name + index}`}>
              <ItemCard hotelData={hotelData} feature_flags={hotelData?.feature_flags} currency={currency} item={item} styles={styles} className="h-full" />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default PopularItemsList;
