"use client";
import React, { useState, useEffect } from "react";
import { useMenuStore, GroupedItems } from "@/store/menuStore_hasura";
import { usePOSStore } from "@/store/posStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Partner, useAuthStore } from "@/store/authStore";
import ShopClosedModalWarning from "../admin/ShopClosedModalWarning";

export const POSMenuItems = () => {
  const { items, groupedItems, fetchMenu } = useMenuStore();
  const { addToCart, cartItems, decreaseQuantity, removeFromCart } =
    usePOSStore();
  const { userData } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredGroupedItems, setFilteredGroupedItems] =
    useState<GroupedItems>({});

  useEffect(() => {
    if (userData?.id) {
      fetchMenu();
    }
  }, [userData]);

  // Set first category as default when groupedItems is loaded
  useEffect(() => {
    if (!userData?.id) return;

    if (groupedItems && Object.keys(groupedItems).length > 0) {
      const firstCategory = Object.keys(groupedItems)[0];
      setSelectedCategory(firstCategory);
    }
  }, [groupedItems, userData?.id]);

  useEffect(() => {
    if (!userData?.id || !groupedItems) return;

    if (searchQuery) {
      // When searching, show all categories with matching items
      const filtered: GroupedItems = {};
      Object.entries(groupedItems).forEach(([category, categoryItems]) => {
        const filteredItems = categoryItems.filter((item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filteredItems.length > 0) {
          filtered[category] = filteredItems;
        }
      });
      setFilteredGroupedItems(filtered);
    } else if (selectedCategory) {
      // When category is selected, show only that category's items
      const categoryItems = groupedItems[selectedCategory] || [];
      setFilteredGroupedItems({ [selectedCategory]: categoryItems });
    } else {
      // Show only categories without items initially
      const categories: GroupedItems = {};
      Object.keys(groupedItems).forEach((category) => {
        categories[category] = [];
      });
      setFilteredGroupedItems(categories);
    }
  }, [groupedItems, searchQuery, selectedCategory, userData?.id]);

  if (!userData?.id || !items || !groupedItems) {
    return <div>Loading...</div>;
  }

  if (items.length === 0) {
    return <div>No items found</div>;
  }

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery(""); // Clear search when selecting category
  };

  return (
    <div className="grid gap-6">
      <ShopClosedModalWarning
        hotelId={userData?.id}
        isShopOpen={(userData as Partner)?.is_shop_open}
      />
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedCategory(null); // Clear category selection when searching
          }}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      {!searchQuery && (
        <div className="flex gap-2 flex-wrap">
          {Object.keys(groupedItems).map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => handleCategoryClick(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      {/* Items */}
      {Object.entries(filteredGroupedItems).map(([category, items]) => (
        <div
          key={category}
          className={!searchQuery && !selectedCategory ? "hidden" : ""}
        >
          <h2 className="text-2xl font-bold mb-4">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const cartItem = cartItems.find(
                (cartItem) => cartItem.id === item.id
              );
              return (
                <Card
                  key={item.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => addToCart(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-lg font-bold mt-2">
                          {(userData as Partner)?.currency}
                          {item.price}
                        </p>
                      </div>
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {cartItem ? (
                          <>
                            <Button
                              size="icon"
                              variant="outline"
                              className="bg-gray-200"
                              onClick={() => {
                                if (cartItem.quantity > 1) {
                                  decreaseQuantity(item.id!);
                                } else {
                                  removeFromCart(item.id!);
                                }
                              }}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">
                              {cartItem.quantity}
                            </span>
                            <Button
                              size="icon"
                              onClick={() => addToCart(item)}
                              className="bg-black"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="icon"
                            onClick={() => addToCart(item)}
                            className="bg-black"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
