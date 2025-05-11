"use client";
import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { HotelDataMenus } from "@/app/hotels/[...id]/page";
import HeadingWithAccent from "../HeadingWithAccent";
import { Styles } from "@/screens/HotelMenuPage_v2";
import { X } from "lucide-react";
import Img from "../Img";

const ItemDetailsModal = ({
  open,
  setOpen,
  item,
  styles,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  item: HotelDataMenus;
  styles: Styles;
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent style={styles.border} className="rounded-[35px] w-[90%]">
        <DialogTitle className="hidden">{item.name}</DialogTitle>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-end">
              <DialogClose>
                <X size={25} />
              </DialogClose>
            </div>
            <div className="flex justify-between items-start">
              <HeadingWithAccent
                accent={styles.accent}
                className="text-2xl font-black capitalize max-w-[230px]"
              >
                {item.name}
              </HeadingWithAccent>

              <div
                style={{
                  color: styles.accent,
                }}
                className="font-black text-3xl"
              >
                ₹{item.price}
              </div>
            </div>
            <div className="text-sm opacity-50 mt-1">{item.description}</div>
          </div>
          {item.image_url && (
            <Img
              src={item.image_url}
              alt={item.name}
              className="w-full h-auto rounded-3xl"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailsModal;
