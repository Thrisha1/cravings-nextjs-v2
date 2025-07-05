import { HotelData, HotelDataMenus } from "@/app/hotels/[...id]/page";
import React, { useEffect, useState } from "react";
import { DefaultHotelPageProps } from "../Default/Default";
import { getFeatures } from "@/lib/getFeatures";
import useOrderStore from "@/store/orderStore";
import { Offer } from "@/store/offerStore_hasura";

const ItemCard = ({
  item,
  styles,
  hoteldata,
  offerData,
  feature_flags,
  tableNumber,
}: {
  item: HotelDataMenus;
  styles: DefaultHotelPageProps["styles"];
  hoteldata: HotelData;
  offerData?: Offer;
  feature_flags: HotelData["feature_flags"];
  tableNumber: number;
}) => {
  const [showVariants, setShowVariants] = useState(false);
  const { addItem, items, decreaseQuantity, removeItem } = useOrderStore();

  // --- Feature Flags & Stock Logic ---
  const hasOrderingFeature = getFeatures(feature_flags || "")?.ordering.enabled;
  const hasDeliveryFeature =
    getFeatures(feature_flags || "")?.delivery.enabled && tableNumber === 0;
  const hasStockFeature = getFeatures(feature_flags || "")?.stockmanagement
    ?.enabled;

  const isOutOfStock =
    hasStockFeature &&
    (item.stocks?.length ?? 0) > 0 &&
    (item.stocks?.[0]?.stock_quantity ?? 1) <= 0;

  const showStock = hasStockFeature && (item.stocks?.[0]?.show_stock ?? false);
  const stockQuantity = item.stocks?.[0]?.stock_quantity;

  const hasVariants = (item.variants?.length ?? 0) > 0;
  const [itemQuantity, setItemQuantity] = useState<number>(0);
  const [variantQuantities, setVariantQuantities] = useState<
    Record<string, number>
  >({});

  // Calculate discount percentage if offer exists
  const discountPercentage = offerData
    ? Math.round(
        ((offerData.menu.price - offerData.offer_price) /
          offerData.menu.price) *
          100
      )
    : 0;

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

  const handleAddItem = () => {
    if (hasVariants) {
      setShowVariants(!showVariants);
    } else {
      addItem({
        ...item,
        variantSelections: [],
        price: offerData?.offer_price || item.price, // Use offer price if available
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

  const isOrderable = item.is_available && !isOutOfStock;
  const showAddButton =
    isOrderable &&
    (hasOrderingFeature || hasDeliveryFeature) &&
    !item.is_price_as_per_size;

  return (
    <>
      <div className="p-4 flex justify-between relative">
        <div>
          <h3 className="capitalize text-lg font-semibold">{item.name}</h3>
          <p className="text-sm opacity-50">{item.description}</p>
          <div
            style={{
              color: styles?.accent || "#000",
            }}
            className="text-lg font-bold"
          >
            {item.is_price_as_per_size !== true ? (
              <>
                {offerData ? (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">
                        {hoteldata?.currency || "₹"}
                        {offerData.offer_price}
                      </span>
                      <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">
                        {discountPercentage}% OFF
                      </span>
                    </div>
                    <span className="text-sm line-through opacity-70">
                      {hoteldata?.currency || "₹"}
                      {offerData.menu.price}
                    </span>
                  </div>
                ) : (
                  <>
                    {hoteldata?.currency || "₹"}
                    {item.variants?.sort((a, b) => a.price - b.price)[0].price || item.price}
                  </>
                )}
              </>
            ) : (
              <div className="text-base font-normal">{`(Price as per size)`}</div>
            )}
          </div>

          {showStock && (
            <div className="text-xs mt-1">
              {isOutOfStock ? (
                <span className="text-red-500 font-semibold">Out of Stock</span>
              ) : (
                <span className="text-green-600">
                  In Stock: {stockQuantity}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <div className="relative">
            <div className="overflow-hidden aspect-square h-28 rounded-3xl">
              <img
                src={item.image_url || "/image_placeholder.png"}
                alt={item.name}
                className={`w-full h-full object-cover ${
                  !item.image_url ? "invert opacity-50" : ""
                } ${!item.is_available || isOutOfStock ? "grayscale" : ""}`}
              />
            </div>
            {(!item.is_available || isOutOfStock) && (
              <div className="absolute top-1/2 left-0 -translate-y-1/2 bg-red-500 text-white text-center text-xs font-semibold py-1 px-2 w-full">
                {!item.is_available ? "Unavailable" : "Out of Stock"}
              </div>
            )}

            {/* Add button positioned at bottom center of image */}
            {isOrderable && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                {hasVariants ? (
                  <div
                    onClick={() => setShowVariants(!showVariants)}
                    style={{
                      backgroundColor: styles.accent,
                      color: "white",
                    }}
                    className="rounded-full px-4 py-1 font-medium text-sm whitespace-nowrap h-fit cursor-pointer"
                  >
                    {showVariants ? "Hide Options" : "Show Options"}
                  </div>
                ) : showAddButton && itemQuantity > 0 ? (
                  <div
                    style={{
                      backgroundColor: styles.accent,
                      color: "white",
                    }}
                    className="rounded-full px-3 py-1 font-medium flex items-center gap-3 text-sm"
                  >
                    <div
                      className="cursor-pointer active:scale-95"
                      onClick={(e) => {
                        e.stopPropagation();
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddItem();
                      }}
                    >
                      +
                    </div>
                  </div>
                ) : showAddButton ? (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddItem();
                    }}
                    style={{
                      backgroundColor: styles.accent,
                      color: "white",
                    }}
                    className="rounded-full px-4 py-1 font-medium text-sm h-fit cursor-pointer"
                  >
                    Add
                  </div>
                ) : (
                  <></>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Variants section */}
      {showVariants && hasVariants && (
        <div className="w-full mt-2 space-y-3">
          {item.variants?.map((variant) => (
            <div
              key={variant.name}
              className="py-2 px-4 rounded-lg flex justify-between items-center gap-5 w-full"
            >
              <div className="grid">
                <span className="font-semibold">{variant.name}</span>
                {!item.is_price_as_per_size && showAddButton && (
                  <div
                    style={{
                      color: styles?.accent || "#000",
                    }}
                    className="text-lg font-bold"
                  >
                    {hoteldata?.currency || "₹"}
                    {variant.price}
                  </div>
                )}
              </div>
              {showAddButton ? (
                <div className="flex gap-2 items-center justify-end">
                  {getVariantQuantity(variant.name) > 0 ? (
                    <div
                      style={{
                        backgroundColor: styles.accent,
                        color: "white",
                      }}
                      className="rounded-full px-3 py-1 font-medium flex items-center gap-3"
                    >
                      <div
                        className="cursor-pointer active:scale-95"
                        onClick={() => handleVariantRemove(variant)}
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
                        color: "white",
                      }}
                      className="rounded-full px-4 py-1 font-medium h-fit cursor-pointer"
                    >
                      Add
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    color: styles?.accent || "#000",
                  }}
                  className={`${
                    item.is_price_as_per_size ? "text-sm" : "text-lg"
                  } font-bold `}
                >
                  {item.is_price_as_per_size
                    ? "(Price as per size)"
                    : `${hoteldata?.currency || "₹"}${variant.price}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default ItemCard;
