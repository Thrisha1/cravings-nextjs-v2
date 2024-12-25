"use client";
import OfferCard from "@/components/OfferCard";
import React, { useState } from "react";
import NoOffersFound from "@/components/NoOffersFound";
import SearchBox from "@/components/SearchBox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Offer } from "@/store/offerStore";
import { UserData } from "@/store/authStore";


const HotelMenuPage = ({
  offers,
  hoteldata,
}: {
  offers: Offer[];
  hoteldata: UserData;
}) => {
  const [items, setItems] = useState<Offer[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  const addItems = (item: Offer) => {
    setItems((prev) => {
      const existingItemIndex = prev.findIndex((i) => i.id === item.id); // Assuming each item has a unique `id`.

      if (existingItemIndex !== -1) {
        // If the item already exists, update its qty
        const updatedItems = [...prev];
        const existingItem = updatedItems[existingItemIndex];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          qty: (existingItem.qty || 0) + 1, // Increment qty, default to 0 if undefined
        };
        return updatedItems;
      }

      // If the item does not exist, add it with qty = 1
      return [...prev, { ...item, qty: 1 }];
    });

    setTotalPrice((prev) => prev + item.newPrice); // Update total price as normal

    // Use updated state in localStorage
    setItems((prevItems) => {
      return prevItems;
    });
  };

  return (
    <main className="bg-gradient-to-b from-orange-50 to-orange-100">
      {/* offers listing  */}
      <div className="max-w-7xl mx-auto px-3 pb-[80px]">
        {/* available offer  */}
        <section>
          <h1 className="text-xl md:text-3xl font-semibold py-5 text-center md:py-10 capitalize">
            Select Offers In {hoteldata.hotelName}
          </h1>

          <SearchBox />

          <section className="mt-5 md:mt-10">
            {offers.length > 0 ? (
              <>
                {/* offer list  */}
                <div className="grid gap-2 gap-y-5 grid-cols-2 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
                  {offers.map((offer: Offer) => {
                    const discount = Math.round(
                      ((offer.originalPrice - offer.newPrice) /
                        offer.originalPrice) *
                        100
                    );
                    const isUpcoming = new Date(offer.fromTime) > new Date();

                    return (
                      <div key={offer.id} className="group">
                        <OfferCard
                          discount={discount}
                          isUpcoming={isUpcoming}
                          offer={offer}
                          onClick={() => addItems(offer)}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <NoOffersFound />
            )}
          </section>
        </section>
      </div>

      {/* bottom tab  */}
      <div className="bg-white w-full min-h-[70px] fixed bottom-0 left-0 shadow-md shadow-black flex items-center justify-between gap-2 px-5 py-4 z-[50]">
        {items.length > 0 ? (
          <>
            {/* items and total price  */}
            <div className="grid">
              <p className="font-medium text-sm text-black/70">
                Items selected : {items.length}
              </p>
              <p className="font-semibold">Total Price : ₹{totalPrice}</p>
            </div>

            {/* drawer  */}
            <Drawer>
              <DrawerTrigger className="bg-orange-600 text-white font-medium px-3 py-2 rounded">
                View
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Selected Items</DrawerTitle>
                  <DrawerDescription className="grid">
                    View all the items you have selected
                  </DrawerDescription>
                </DrawerHeader>
                <main className="px-5 py-10 grid gap-3 max-h-[60vh] overflow-scroll">
                  {items.map((item: Offer) => (
                    <div
                      key={`${item.id}_checkout_item`}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="w-[80px] h-[80px] rounded-xl overflow-hidden relative bg-gray-200 ">
                        <Image
                          src={item.dishImage}
                          alt={item.dishName}
                          fill
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="font-medium text-sm flex-1 text-pretty">
                        {item.dishName}
                      </p>
                      <div className="text-center">
                        <p className="font-semibold">
                          ₹{item.newPrice * (item.qty ?? 1)}
                        </p>
                        <p className="text-[12px] text-gray-400">
                          QTY : {item.qty}
                        </p>
                      </div>
                    </div>
                  ))}
                </main>
                <DrawerFooter>
                  <DrawerClose>
                    <Button
                      onClick={() => {
                        setItems([]);
                        setTotalPrice(0);
                      }}
                      className="w-full font-medium"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </DrawerClose>
                  <Button className="font-semibold bg-orange-600 hover:bg-orange-500">
                    Checkout
                  </Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </>
        ) : (
          <p className="font-medium text-black/70 text-center w-full">Please select the items</p>
        )}
      </div>
    </main>
  );
};

export default HotelMenuPage;
