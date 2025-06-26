"use client";

import { Offer } from "@/store/offerStore_hasura";
import { BadgePercent, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import OfferCard from "@/components/OfferCard";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import useOrderStore, { OrderItem } from "@/store/orderStore";
import { getFeatures } from "@/lib/getFeatures";
import { HotelData } from "@/app/hotels/[...id]/page";
import { Styles } from "@/screens/HotelMenuPage_v2";
import { Category } from "@/store/categoryStore_hasura";

// Helper component for the Add/Quantity button
const OfferAddButton = ({
  offer,
  styles,
  feature_flags,
  tableNumber,
  categories, // <-- 1. Added categories prop here
}: {
  offer: Offer;
  styles: Styles;
  feature_flags?: string;
  tableNumber: number;
  categories: Category[]; // <-- 1. Added categories prop here
}) => {
  const { addItem, items, decreaseQuantity, removeItem } = useOrderStore();
  const [quantity, setQuantity] = useState(0);

  const hasOrderingFeature = getFeatures(feature_flags || "")?.ordering.enabled;
  const hasDeliveryFeature =
    getFeatures(feature_flags || "")?.delivery.enabled && tableNumber === 0;

  useEffect(() => {
    const itemInCart = items?.find((i) => i.id === offer.menu.id);
    setQuantity(itemInCart?.quantity || 0);
  }, [items, offer.menu.id]);

  const handleAddItem = () => {

    console.log(offer);
    
    // 2. ---- START: Corrected object creation ----
    // Find the full category object from the list using the name from the offer
    const fullCategory = categories.find(
      (cat) => cat.name === offer?.menu?.category?.name
    );

    console.log(fullCategory);
    

    // If for some reason the category isn't found, log an error and exit.
    if (!fullCategory) {
      console.error(
        `Category "${offer.menu.category.name}" could not be found. Item not added.`
      );
      return;
    }

    // Explicitly construct the OrderItem to ensure type safety.
    // We cherry-pick from `offer.menu` and build the `category` object manually.
    const itemToAdd: OrderItem = {
      // Base properties from the menu item
      id: offer.menu.id,
      description: offer.menu.description,
      image_url: offer.menu.image_url,
     
      
      // Overrides and additions for the cart
      price: offer.offer_price, // Use the special offer price
      name: `${offer.menu.name} (Offer)`,
      quantity: 1,
      variantSelections: [],
      offers: [],
      is_available: true, // Assuming the item is available
      is_top :false,

      priority: 0, // Assuming a default priority
      
      // Correctly structured category information
      category_id: fullCategory?.id, // Use the full category ID
      category: {
        id: fullCategory?.id,
        name: fullCategory?.name,
        priority: 0,
        is_active: fullCategory?.is_active,
      },
    };
    // ---- END: Corrected object creation ----
    addItem(itemToAdd);
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      decreaseQuantity(offer.menu.id);
    } else {
      removeItem(offer.menu.id);
    }
  };

  if (!hasOrderingFeature && !hasDeliveryFeature) {
    return null;
  }

  return (
    <div className="flex justify-center w-full mt-2">
      {quantity > 0 ? (
        <div
          style={{
            backgroundColor: styles.accent,
            ...styles.border,
            color: "white",
          }}
          className="rounded-full transition-all duration-300 px-5 py-2 font-medium flex items-center gap-4 text-lg"
        >
          <div className="cursor-pointer active:scale-95" onClick={handleDecrease}>-</div>
          <div>{quantity}</div>
          <div className="cursor-pointer active:scale-95" onClick={handleAddItem}>+</div>
        </div>
      ) : (
        <div
          onClick={handleAddItem}
          style={{
            backgroundColor: styles.accent,
            ...styles.border,
            color: "white",
          }}
          className="rounded-full px-8 py-2 font-semibold cursor-pointer"
        >
          Add
        </div>
      )}
    </div>
  );
};

// Props interface remains the same
interface OffersListProps {
  offers: Offer[];
  hotelName: string;
  styles: Styles;
  tableNumber: number;
  feature_flags?: string;
  categories: Category[];
}

const OffersList = ({
  offers,
  hotelName,
  styles,
  tableNumber,
  feature_flags,
  categories,
}: OffersListProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div>
      {/* Offer button */}
      <div
        onClick={openModal}
        className="flex items-center gap-2 border-[1px] border-[#ffe660] p-2 rounded-md bg-[#fffae0] cursor-pointer hover:bg-[#fff6d4] transition-colors"
      >
        <BadgePercent size={15} className="text-[#ffda13]" />
        <span className="text-xs text-nowrap text-gray-500 font-medium">Get Offers</span>
      </div>

      {/* Full-Screen Offers Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background z-[60] flex flex-col animate-in fade-in-0">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Current offers in {hotelName}</h2>
            <Button variant="ghost" size="icon" onClick={closeModal}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close offers</span>
            </Button>
          </div>

          <ScrollArea className="flex-grow">
            {offers && offers.length > 0 ? (
              <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {offers.map((offer) => {
                  const discount = Math.round(
                    ((offer.menu.price - offer.offer_price) / offer.menu.price) * 100
                  );
                  const isUpcoming = new Date(offer.start_time) > new Date();

                  return (
                    <div key={offer.id} className="flex flex-col justify-between">
                      <OfferCard offer={offer} discount={discount} isUpcoming={isUpcoming} />
                      <OfferAddButton
                        offer={offer}
                        styles={styles}
                        tableNumber={tableNumber}
                        feature_flags={feature_flags}
                        categories={categories} // <-- Pass categories down
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full p-10">
                <p className="text-muted-foreground">No offers are available at the moment.</p>
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default OffersList;