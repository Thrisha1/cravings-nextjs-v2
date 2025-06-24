"use client";
import { HotelData, HotelDataMenus } from "@/app/hotels/[...id]/page";
import { Styles } from "@/screens/HotelMenuPage_v2";
import React, { useEffect, useState, useRef } from "react";
import Img from "../../../Img";
import ItemDetailsModal from "./ItemDetailsModal";
import DescriptionWithTextBreak from "../../../DescriptionWithTextBreak";
import useOrderStore, { OrderItem } from "@/store/orderStore";
import { getFeatures } from "@/lib/getFeatures";

const ItemCard = ({
  item,
  styles,
  className,
  feature_flags,
  currency,
  hotelData,
  tableNumber,
}: {
  item: HotelDataMenus;
  styles: Styles;
  currency: string;
  className?: string;
  feature_flags?: string;
  hotelData?: HotelData;
  tableNumber: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const { addItem, items, decreaseQuantity, removeItem } = useOrderStore();
  const hasOrderingFeature = getFeatures(feature_flags || "")?.ordering.enabled;
  const hasDeliveryFeature =
    getFeatures(feature_flags || "")?.delivery.enabled && tableNumber === 0;
  const [itemQuantity, setItemQuantity] = useState<number>(0);
  const [variantQuantities, setVariantQuantities] = useState<
    Record<string, number>
  >({});
  const variantsRef = useRef<HTMLDivElement>(null);
  const [variantsHeight, setVariantsHeight] = useState(0);

  useEffect(() => {
    if (showVariants && variantsRef.current) {
      setVariantsHeight(variantsRef.current.scrollHeight);
    } else {
      setVariantsHeight(0);
    }
  }, [showVariants]);

  useEffect(() => {
    if (item.variants?.length) {
      const variantItems =
        items?.filter((i) => i.id.startsWith(`${item.id}|`)) || [];
      const total = variantItems.reduce((sum, i) => sum + i.quantity, 0);
      setItemQuantity(total);

      const newVariantQuantities: Record<string, number> = {};
      variantItems.forEach((variantItem) => {
        const variantName = variantItem.id.split("|")[1];
        if (variantName) {
          newVariantQuantities[variantName] = variantItem.quantity;
        }
      });
      setVariantQuantities(newVariantQuantities);
    } else {
      const itemInCart = items?.find((i) => i.id === item.id);
      setItemQuantity(itemInCart?.quantity || 0);
    }
  }, [items, item.id, item.variants?.length]);

  useEffect(() => {
    const hasVariantsInCart = Object.values(variantQuantities).some(
      (quantity) => quantity > 0
    );
    setShowVariants(hasVariantsInCart);
  }, [variantQuantities]);

  const showStock = item.stocks?.[0]?.show_stock;
  const stockQuantity = item.stocks?.[0]?.stock_quantity ?? 9999;
  const isOutOfStock = (item.stocks?.[0]?.stock_quantity ?? 0) <= 0 || false;
  const hasStockFeature = getFeatures(feature_flags || "")?.stockmanagement
    ?.enabled;

  const hasVariants = (item.variants?.length ?? 0) > 0;

  const handleAddItem = () => {
    if (hasVariants) {
      setShowVariants(!showVariants);
    } else {
      addItem({
        ...item,
        variantSelections: [],
      });
    }
  };

  const handleVariantAdd = (variant: any) => {
    addItem({
      ...item,
      id: `${item.id}|${variant.name}`,
      name: `${item.name} (${variant.name})`,
      price: variant.price,
      variantSelections: [
        {
          name: variant.name,
          price: variant.price,
          quantity: 1,
        },
      ],
    });
  };

  const handleVariantRemove = (variant: any) => {
    const variantId = `${item.id}|${variant.name}`;
    decreaseQuantity(variantId);
  };

  const getVariantQuantity = (name: string) => {
    return variantQuantities[name] || 0;
  };

  return (
    <div className="h-full relative overflow-hidden">
      <div
        style={styles.border}
        key={item.id}
        className={`pt-5 pb-5 rounded-[35px] px-6 flex-1 relative bg-white text-black transition-all duration-300 ${className}`}
      >
        <div className="flex flex-col gap-y-2 justify-between items-start w-full">
          <div
            onClick={() => setIsOpen(true)}
            className={`flex justify-between w-full items-center`}
          >
            <div
              className={`flex flex-col justify-center ${
                item.image_url ? "w-1/2" : ""
              } ${!item.is_available ? "opacity-25" : ""}`}
            >
              <DescriptionWithTextBreak
                showMore={false}
                maxChars={35}
                spanClassName="opacity-100"
                className="capitalize text-xl font-bold"
              >
                {item.name}
              </DescriptionWithTextBreak>
              {currency !== "🚫" && (
                <div
                  style={{
                    color: !item.is_available ? styles.color : styles.accent,
                  }}
                  className={`font-black text-2xl`}
                >
                  {hasVariants ? (
                    <span className="">
                      <span className="text-sm font-bold">From </span>
                      <span>
                        {currency}{" "}
                        {hotelData?.id ===
                        "767da2a8-746d-42b6-9539-528b6b96ae09"
                          ? item.price.toFixed(3)
                          : item.price}
                      </span>
                    </span>
                  ) : (
                    <span>
                      {currency}{" "}
                      {hotelData?.id === "767da2a8-746d-42b6-9539-528b6b96ae09"
                        ? item.price.toFixed(3)
                        : item.price}
                    </span>
                  )}
                </div>
              )}

              {showStock && hasStockFeature && (
                <div className="text-xs mt-1">
                  {isOutOfStock ? (
                    <span className="text-red-500 font-semibold">
                      Out of Stock
                    </span>
                  ) : (
                    <span className="text-green-600">
                      In Stock: {stockQuantity}
                    </span>
                  )}
                </div>
              )}
            </div>

            {item.image_url.length > 0 && (
              <div className="w-[100px] h-[100px] relative rounded-3xl overflow-hidden">
                <Img
                  src={item.image_url.replace("+", "%2B")}
                  alt={item.name}
                  className={`object-cover w-full h-full ${
                    !item.is_available || (isOutOfStock && hasStockFeature)
                      ? "grayscale"
                      : ""
                  }`}
                />

                {(!item.is_available || (isOutOfStock && hasStockFeature)) && (
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 bg-red-500 text-white text-center text-sm font-semibold py-2 px-3 w-full">
                    {!item.is_available ? "Unavailable" : "Out of Stock"}
                  </div>
                )}
              </div>
            )}
          </div>

          <DescriptionWithTextBreak
            maxChars={100}
            className="text-sm opacity-50 mt-1"
          >
            {item.description}
          </DescriptionWithTextBreak>

          {/* Variants section with smooth height transition */}
          <div
            ref={variantsRef}
            className="overflow-hidden transition-all duration-500 w-full"
            style={{
              height: showVariants ? `${variantsHeight}px` : "0px",
              opacity: showVariants ? 1 : 0,
            }}
          >
            {hasVariants && (
              <div className="w-full mt-2 space-y-3 divide-y-2 divide-gray-100">
                {item.variants?.map((variant) => (
                  <div
                    key={variant.name}
                    className="p-2 rounded-lg flex justify-between items-center gap-5 w-full"
                  >
                    <div className="grid">
                      <span className="font-semibold ">{variant.name}</span>

                      {(hasOrderingFeature || hasDeliveryFeature) && (
                        <div
                          style={{
                            color: !item.is_available
                              ? styles.color
                              : styles.accent,
                          }}
                          className="text-2xl font-black text-nowrap"
                        >
                          {currency}{" "}
                          {hotelData?.id ===
                          "767da2a8-746d-42b6-9539-528b6b96ae09"
                            ? variant.price.toFixed(3)
                            : variant.price}
                        </div>
                      )}
                    </div>
                    {hasOrderingFeature || hasDeliveryFeature ? (
                      <div className="flex gap-2 items-center justify-end w-full mt-2">
                        {getVariantQuantity(variant.name) > 0 ? (
                          <div
                            style={{
                              backgroundColor: styles.accent,
                              ...styles.border,
                              color: "white",
                            }}
                            className="rounded-full transition-all duration-500 px-5 py-2 font-medium flex items-center gap-4"
                          >
                            <div
                              className="cursor-pointer active:scale-95"
                              onClick={() => {
                                handleVariantRemove(variant);
                              }}
                            >
                              -
                            </div>
                            <div>{getVariantQuantity(variant.name)}</div>
                            <div
                              className="cursor-pointer active:scale-95"
                              onClick={() => handleVariantAdd(variant)}
                            >
                              +
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleVariantAdd(variant)}
                            style={{
                              backgroundColor: styles.accent,
                              ...styles.border,
                              color: "white",
                            }}
                            className="rounded-full px-6 py-2 font-medium"
                          >
                            {"Add"}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          color: !item.is_available
                            ? styles.color
                            : styles.accent,
                        }}
                        className="text-2xl font-black text-nowrap"
                      >
                        {currency}{" "}
                        {hotelData?.id ===
                        "767da2a8-746d-42b6-9539-528b6b96ae09"
                          ? variant.price.toFixed(3)
                          : variant.price}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {!hasOrderingFeature && !hasDeliveryFeature && hasVariants && (
            <div className="flex transition-all duration-500 gap-2 items-center justify-end w-full mt-2">
              <div
                onClick={() => setShowVariants((prev) => !prev)}
                style={{
                  backgroundColor: !showVariants ? styles.accent : "white",
                  ...styles.border,
                  color: !showVariants ? "white" : "black",
                }}
                className="rounded-full px-6 py-2 font-medium"
              >
                {showVariants ? "Hide Options" : "Show Options"}
              </div>
            </div>
          )}

          {item.is_available &&
            (hasOrderingFeature || hasDeliveryFeature) &&
            (!hasStockFeature || !isOutOfStock) && (
              <>
                {hasVariants ? (
                  <div className="flex transition-all duration-500 gap-2 items-center justify-end w-full mt-2">
                    <div
                      onClick={() => setShowVariants((prev) => !prev)}
                      style={{
                        backgroundColor: !showVariants
                          ? styles.accent
                          : "white",
                        ...styles.border,
                        color: !showVariants ? "white" : "black",
                      }}
                      className="rounded-full px-6 py-2 font-medium"
                    >
                      {showVariants ? "Hide Options" : "Add"}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center justify-end w-full mt-2">
                    {itemQuantity > 0 ? (
                      <div
                        style={{
                          backgroundColor: styles.accent,
                          ...styles.border,
                          color: "white",
                        }}
                        className="rounded-full transition-all duration-500 px-5 py-2 font-medium flex items-center gap-4"
                      >
                        <div
                          className="cursor-pointer active:scale-95"
                          onClick={() => {
                            if (itemQuantity > 1) {
                              decreaseQuantity(item.id as string);
                            } else {
                              removeItem(item.id as string);
                            }
                          }}
                        >
                          -
                        </div>
                        <div>{itemQuantity}</div>
                        <div
                          className="cursor-pointer active:scale-95"
                          onClick={handleAddItem}
                        >
                          +
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={handleAddItem}
                        style={{
                          backgroundColor: styles.accent,
                          ...styles.border,
                          color: "white",
                        }}
                        className="rounded-full px-6 py-2 font-medium"
                      >
                        {"Add"}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
        </div>
      </div>

      <ItemDetailsModal
        styles={styles}
        open={isOpen}
        setOpen={setIsOpen}
        item={item}
        currency={currency}
        hotelData={hotelData as HotelData}
      />
    </div>
  );
};

export default ItemCard;
