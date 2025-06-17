"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "../ui/dialog";
import { HotelData, HotelDataMenus } from "@/app/hotels/[...id]/page";
import HeadingWithAccent from "../HeadingWithAccent";
import { Styles } from "@/screens/HotelMenuPage_v2";
import { X } from "lucide-react";
import Img from "../Img";

const ItemDetailsModal = ({
  open,
  setOpen,
  item,
  styles,
  currency,
  hotelData
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  item: HotelDataMenus;
  styles: Styles;
  currency: string;
  hotelData: HotelData  ;
}) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        style={styles.border} 
        className="rounded-[35px] w-[95%] max-w-md mx-auto p-0 overflow-hidden bg-white !top-[50%] !translate-y-[-50%] !h-auto !max-h-[90vh]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="hidden">{item.name}</DialogTitle>

        <div className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex justify-between items-start p-6 pb-4 flex-shrink-0">
            <div className="flex-1 pr-4">
              <HeadingWithAccent
                accent={styles.accent}
                className="text-xl sm:text-2xl font-black capitalize leading-tight"
              >
                {item.name}
              </HeadingWithAccent>
              
              {currency !== "🚫" && (
                <div
                  style={{
                    color: !item.is_available ? styles.color : styles.accent,
                  }}
                  className="font-black text-xl sm:text-2xl mt-2"
                >
                  {currency}{" "}
                  {hotelData?.id === "767da2a8-746d-42b6-9539-528b6b96ae09" ? item.price.toFixed(3) : item.price}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setOpen(false)}
              className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Image */}
          {item.image_url && (
            <div className="px-6 pb-4 flex-shrink-0">
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden">
                <Img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="px-6 pb-6 flex-1 min-h-0">
            <div className="text-sm sm:text-base text-gray-600 leading-relaxed">
              {item.description}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailsModal;
