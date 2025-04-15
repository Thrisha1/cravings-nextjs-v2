"use client";
import { MenuItem } from "@/screens/HotelMenuPage";
import React, { useEffect, useState } from "react";
import { Card } from "./ui/card";
import Image from "next/image";
import placeHolderImage from "../../public/image_placeholder.webp";
import Link from "next/link";
// import { useReviewsStore } from "@/store/reviewsStore";


const MenuItemCard = ({ menuItem, hotelId }: { menuItem: MenuItem, hotelId: string }) => {
  // const { getAverageReviewByMenuId } = useReviewsStore();
  const [averageRating, setAverageRating] = useState<number | null>(null);

  // useEffect(() => {
  //   getAverageReviewByMenuId(menuItem.id).then((rating) => {
  //     setAverageRating(rating);
  //   });
  // }, [menuItem.id]);
  return (
    <Link href={`/hotels/${hotelId}/menu/${menuItem.id}`}>
      <Card
        key={menuItem.id}
        className="overflow-hidden hover:shadow-xl relative h-full"
      >
        {/* image container */}
        <div className="relative">
          <Image
            src={((menuItem.image !== "") && !(menuItem.image.includes("pollinations"))) ? menuItem.image : placeHolderImage.src}
            alt={menuItem.name}
            width={300}
            height={300}
            priority={false}
            quality={60}
            className="w-full h-48 object-cover"
          
          />

          <div className="grid bg-gradient-to-t from-black to-transparent p-3 absolute bottom-0 left-0 w-full">
            <span className="text-2xl font-bold text-white">
              ₹{typeof menuItem.price === 'number' ? menuItem.price.toFixed(2) : menuItem.price}
            </span>

            <div className="font-bold md:text-xl text-white text-pretty">
              {menuItem.name}
            </div>
            
            {/* <div className="text-base font-bold text-orange-500 flex items-center gap-1">
              <span>★</span>
              <span>{averageRating?.toFixed(1) || 'No ratings'}</span>
            </div> */}
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default MenuItemCard;
