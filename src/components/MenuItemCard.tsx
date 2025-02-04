import { MenuItem } from "@/screens/HotelMenuPage";
import React from "react";
import { Card } from "./ui/card";
import Image from "next/image";
import placeHolderImage from "../../public/image_placeholder.webp";

const MenuItemCard = ({ menuItem }: { menuItem: MenuItem }) => {

  return (
    <div>
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

            <div className="font-bold md:text-xl text-white">
              {menuItem.name}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MenuItemCard;
