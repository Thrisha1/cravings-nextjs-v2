"use client";
import React, { useState, useEffect } from "react";
import { useMenuStore, GroupedItems } from "@/store/menuStore_hasura";
import { usePOSStore } from "@/store/posStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuthStore, Captain, Partner } from "@/store/authStore";
import { fetchFromHasura } from "@/lib/hasuraClient";

export const CaptainPOS = () => {
    const { items, groupedItems, fetchMenu } = useMenuStore();
    const { addToCart, cartItems, decreaseQuantity, removeFromCart, setIsCaptainOrder } = usePOSStore();
    const { userData, loading: authLoading } = useAuthStore();
    const captainData = userData as Captain;
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [filteredGroupedItems, setFilteredGroupedItems] = useState<GroupedItems>({});
    const [isLoading, setIsLoading] = useState(true);
    const [partnerData, setPartnerData] = useState<Partner | null>(null);

    // Set isCaptainOrder to true when component mounts
    useEffect(() => {
        setIsCaptainOrder(true);
        return () => setIsCaptainOrder(false); // Cleanup when component unmounts
    }, [setIsCaptainOrder]);

    // Fetch partner data
    useEffect(() => {
        const fetchPartnerData = async () => {
            if (captainData?.partner_id) {
                try {
                    const response = await fetchFromHasura(
                        `query GetPartnerById($partner_id: uuid!) {
                            partners_by_pk(id: $partner_id) {
                                id
                                currency
                                gst_percentage
                                store_name
                            }
                        }`,
                        {
                            partner_id: captainData.partner_id
                        }
                    );
                    if (response.partners_by_pk) {
                        setPartnerData(response.partners_by_pk);
                    }
                } catch (error) {
                    console.error("Error fetching partner data:", error);
                }
            }
        };

        fetchPartnerData();
    }, [captainData?.partner_id]);

    // Fetch menu when captain data is available
    useEffect(() => {
        const initializeData = async () => {
            if (authLoading || !captainData?.partner_id) {
                console.log("Waiting for auth data:", { authLoading, partnerId: captainData?.partner_id });
                setIsLoading(true);
                return;
            }

            try {
                /* console.log("Fetching menu for partner:", captainData.partner_id); */
                const menuItems = await fetchMenu(captainData.partner_id);
                // console.log("Fetched menu items:", {
                //     totalItems: menuItems.length,
                //     categories: Object.keys(groupedItems),
                //     groupedItems
                // });
            } catch (error) {
                console.error("Error fetching menu:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, [captainData?.partner_id, fetchMenu, authLoading, groupedItems]);

    // Set first category as default when groupedItems is loaded
    useEffect(() => {
        if (!captainData?.partner_id || !groupedItems) {
            console.log("Cannot set default category:", { 
                hasPartnerId: !!captainData?.partner_id, 
                hasGroupedItems: !!groupedItems,
                groupedItemsKeys: Object.keys(groupedItems)
            });
            return;
        }

        if (Object.keys(groupedItems).length > 0) {
            const firstCategory = Object.keys(groupedItems)[0];
            console.log("Setting default category:", firstCategory);
            setSelectedCategory(firstCategory);
        } else {
            /* console.log("No categories found in groupedItems"); */
            return;
        }
    }, [groupedItems, captainData?.partner_id]);

    // Filter items based on search query and selected category
    useEffect(() => {
        if (!groupedItems) {
            console.log("No groupedItems available for filtering");
            return;
        }

        // console.log("Filtering items:", {
        //     searchQuery,
        //     selectedCategory,
        //     totalCategories: Object.keys(groupedItems).length,
        //     categories: Object.keys(groupedItems)
        // });

        // If there's a search query, filter across all categories
        if (searchQuery) {
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
            return;
        }

        // If a category is selected, only show items from that category
        if (selectedCategory) {
            const categoryItems = groupedItems[selectedCategory] || [];
            setFilteredGroupedItems({
                [selectedCategory]: categoryItems
            });
            return;
        }

        // If no search query and no selected category, show all items
        setFilteredGroupedItems(groupedItems);
    }, [searchQuery, groupedItems, selectedCategory]);

    if (authLoading || isLoading || !captainData?.partner_id) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (items.length === 0) {
        return <div>No items found</div>;
    }

    const handleCategoryClick = (category: string) => {
        setSelectedCategory(category);
        setSearchQuery(""); // Clear search when selecting category
    };

    return (
        <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Search Bar */}
            <div className="p-6 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search menu items..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setSelectedCategory(null); // Clear category selection when searching
                        }}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Categories */}
            {!searchQuery && (
                <div className="flex gap-4 flex-wrap px-6">
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

            {/* Menu Items */}
            {Object.entries(filteredGroupedItems).map(([category, items]) => (
                <div key={category} className="space-y-4">
                    <h2 className="text-lg font-semibold">{category}</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {items.map((item) => {
                            const cartItem = cartItems.find(
                                (cartItem) => cartItem.id === item.id
                            );
                            return (
                                <Card
                                    key={item.id}
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => addToCart(item)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-medium">{item.name}</h3>
                                                <p className="text-lg font-bold mt-2">
                                                    {partnerData?.currency || "$"}
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
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => decreaseQuantity(item.id!)}
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <span className="w-8 text-center">
                                                            {cartItem.quantity}
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => addToCart(item)}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => addToCart(item)}
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

export default CaptainPOS;
