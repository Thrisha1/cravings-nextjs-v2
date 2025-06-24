import { HotelData, HotelDataMenus } from "@/app/hotels/[...id]/page";
import React, { useEffect, useState } from "react";
import { DefaultHotelPageProps } from "../Default/Default";
import { getFeatures } from "@/lib/getFeatures";
import useOrderStore from "@/store/orderStore";

const ItemCard = ({
  item,
  styles,
  hoteldata,
  feature_flags,
  tableNumber,
}: {
  item: HotelDataMenus;
  styles: DefaultHotelPageProps["styles"];
  hoteldata: HotelData;
  feature_flags: HotelData["feature_flags"];
  tableNumber: number;
}) => {
  const [showVariants, setShowVariants] = useState(false);
  const { addItem, items, decreaseQuantity, removeItem } = useOrderStore();
  const hasOrderingFeature = getFeatures(feature_flags || "")?.ordering.enabled;
  const hasDeliveryFeature =
    getFeatures(feature_flags || "")?.delivery.enabled && tableNumber === 0;
  const [itemQuantity, setItemQuantity] = useState<number>(0);
  const [variantQuantities, setVariantQuantities] = useState<
    Record<string, number>
  >({});

  const showStock = item.stocks?.[0]?.show_stock;
  const stockQuantity = item.stocks?.[0]?.stock_quantity ?? 9999;
  const isOutOfStock = (item.stocks?.[0]?.stock_quantity ?? 0) <= 0 || false;
  const hasStockFeature = getFeatures(feature_flags || "")?.stockmanagement
    ?.enabled;
  const hasVariants = (item.variants?.length ?? 0) > 0;

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
    <>
      <div className="p-4 flex justify-between relative">
        <div>
          <h3 className="capitalize text-lg font-semibold">{item.name}</h3>
          <p className="text-sm opacity-50">{item.description}</p>
          <p
            style={{
              color: styles?.accent || "#000",
            }}
            className="text-lg font-bold"
          >
            {hoteldata?.currency || "₹"}
            {item.price}
          </p>

          {showStock && hasStockFeature && (
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
          {item.image_url && (
            <div className="relative">
              <div className="overflow-hidden aspect-square h-28 rounded-3xl">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className={`w-full h-full object-cover ${
                    !item.is_available || (isOutOfStock && hasStockFeature)
                      ? "grayscale"
                      : ""
                  }`}
                />
              </div>
              {(!item.is_available || (isOutOfStock && hasStockFeature)) && (
                <div className="absolute top-1/2 left-0 -translate-y-1/2 bg-red-500 text-white text-center text-xs font-semibold py-1 px-2 w-full">
                  {!item.is_available ? "Unavailable" : "Out of Stock"}
                </div>
              )}

              {/* Add button positioned at bottom center of image */}
              {item.is_available &&
                (hasOrderingFeature || hasDeliveryFeature) &&
                (!hasStockFeature || !isOutOfStock) && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                    {hasVariants ? (
                      <div
                        onClick={() => setShowVariants(!showVariants)}
                        style={{
                          backgroundColor: styles.accent,
                          color: "white",
                        }}
                        className="rounded-full px-4 py-1 font-medium text-sm whitespace-nowrap h-fit"
                      >
                        {showVariants ? "Hide Options" : "Add"}
                      </div>
                    ) : itemQuantity > 0 ? (
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
                    ) : (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddItem();
                        }}
                        style={{
                          backgroundColor: styles.accent,
                          color: "white",
                        }}
                        className="rounded-full px-4 py-1 font-medium text-sm h-fit"
                      >
                        Add
                      </div>
                    )}
                  </div>
                )}
            </div>
          )}

          {/* Add button for items without image */}
         <div>
         {!item.image_url &&
            item.is_available &&
            (hasOrderingFeature || hasDeliveryFeature) &&
            (!hasStockFeature || !isOutOfStock) && (
              <div className="mt-2 flex justify-end h-28 aspect-square">
                {hasVariants ? (
                  <div
                    onClick={() => setShowVariants(!showVariants)}
                    style={{
                      backgroundColor: styles.accent,
                      color: "white",
                    }}
                    className="rounded-full px-4 py-1 font-medium text-sm h-fit"
                  >
                    {showVariants ? "Hide Options" : "Add"}
                  </div>
                ) : itemQuantity > 0 ? (
                  <div
                    style={{
                      backgroundColor: styles.accent,
                      color: "white",
                    }}
                    className="rounded-full px-3 py-1 font-medium flex items-center gap-3 text-sm h-fit"
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
                      color: "white",
                    }}
                    className="rounded-full px-4 py-1 font-medium text-sm h-fit"
                  >
                    Add
                  </div>
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
              className="p-2 rounded-lg flex justify-between items-center gap-5 w-full"
            >
              <div className="grid">
                <span className="font-semibold">{variant.name}</span>
                <div
                  style={{
                    color: styles?.accent || "#000",
                  }}
                  className="text-lg font-bold"
                >
                  {hoteldata?.currency || "₹"}
                  {variant.price}
                </div>
              </div>
              {hasOrderingFeature || hasDeliveryFeature ? (
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
                      className="rounded-full px-4 py-1 font-medium h-fit"
                    >
                      Add
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default ItemCard;
