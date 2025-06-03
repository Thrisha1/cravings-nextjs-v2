"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePOSStore } from "@/store/posStore";
import { Loader2, Plus, Minus, X } from "lucide-react";
import { fetchFromHasura } from "@/lib/hasuraClient";
import {
  getOrderByIdQuery,
  updateOrderMutation,
  updateOrderItemsMutation,
} from "@/api/orders";
import { MenuItem, useMenuStore } from "@/store/menuStore_hasura";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Captain, Partner, useAuthStore } from "@/store/authStore";
import { Order } from "@/store/orderStore";
import useOrderStore from "@/store/orderStore";

export const EditCaptainOrderModal = () => {
  const {
    order,
    setOrder,
    editOrderModalOpen: isOpen,
    setEditOrderModalOpen,
  } = usePOSStore();
  const { fetchMenu, items: menuItems } = useMenuStore();
  const { userData } = useAuthStore();
  const captainData = userData as Captain;
  const [partnerData, setPartnerData] = useState<Partner | null>(null);
  const { partnerOrders } = useOrderStore();

  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [items, setItems] = useState<
    Array<{
      id: string;
      quantity: number;
      menu: {
        name: string;
        price: number;
        category?: {
          id: string;
          name: string;
          priority: number;
        };
        description?: string;
        image_url?: string;
        is_top?: boolean;
        is_available?: boolean;
        priority?: number;
      };
    }>
  >([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [newItemId, setNewItemId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const currency = partnerData?.currency || "$";
  const gstPercentage = partnerData?.gst_percentage || 0;

  const filteredMenuItems = menuItems
    .filter((item): item is MenuItem & { id: string } => {
      const hasId = item.id !== undefined;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const isAvailable = item.is_available !== false;
      // console.log("Filtering menu item:", {
      //   id: item.id,
      //   name: item.name,
      //   hasId,
      //   matchesSearch,
      //   isAvailable,
      //   searchQuery
      // });
      return hasId && isAvailable && (searchQuery === "" || matchesSearch);
    });

  const onClose = () => {
    setEditOrderModalOpen(false);
    setOrder(null);
    setItems([]);
    setTotalPrice(0);
    setTableNumber(null);
    setPhone(null);
    setNewItemId("");
    setSearchQuery("");
  };

  useEffect(() => {
    if (isOpen && order?.id) {
      const foundOrder = partnerOrders.find((o: Order) => o.id === order.id);
      if (foundOrder) {
        setItems(
          foundOrder.items.map((item: Order["items"][number]) => ({
            id: item.id,
            quantity: item.quantity,
            menu: {
              name: item.name,
              price: item.price,
              category: item.category,
              description: item.description,
              image_url: item.image_url,
              is_top: item.is_top,
              is_available: item.is_available,
              priority: item.priority,
              offers: item.offers || [],
            },
          }))
        );
        setTotalPrice(foundOrder.totalPrice);
        setTableNumber(foundOrder.tableNumber || null);
        setPhone(foundOrder.phone || null);
      }
    }
  }, [isOpen, order?.id, partnerOrders]);

  // useEffect(() => {
  //   console.log("=== EditCaptainOrderModal State ===", {
  //     isOpen,
  //     orderId: order?.id,
  //     partnerId: order?.partnerId,
  //     captainData: {
  //       id: captainData?.id,
  //       partner_id: captainData?.partner_id,
  //       role: captainData?.role
  //     },
  //     menuItemsCount: menuItems.length,
  //     menuItems: menuItems.slice(0, 3).map(item => ({
  //       id: item.id,
  //       name: item.name,
  //       price: item.price,
  //       is_available: item.is_available
  //     }))
  //   });
  // }, [isOpen, order, menuItems, captainData]);

  const partnerId = order?.partnerId || captainData?.partner_id;
  useEffect(() => {
    if (isOpen && partnerId) {
      // console.log('Fetching menu for partner:', partnerId);
      fetchMenu(partnerId, true);
    }
  }, [isOpen, partnerId, fetchMenu]);

  // useEffect(() => {
  //   console.log("4. Filtered menu items:", {
  //     searchQuery,
  //     totalItems: menuItems.length,
  //     filteredCount: filteredMenuItems.length,
  //     filteredItems: filteredMenuItems.slice(0, 3).map(item => ({
  //       id: item.id,
  //       name: item.name,
  //       price: item.price,
  //       is_available: item.is_available
  //     }))
  //   });
  // }, [searchQuery, filteredMenuItems, menuItems.length]);

  useEffect(() => {
    const fetchPartnerData = async () => {
      if (captainData?.partner_id) {
        try {
          const response = await fetchFromHasura(
            `
            query GetPartnerById($partner_id: uuid!) {
              partners_by_pk(id: $partner_id) {
                id
                currency
                gst_percentage
                store_name
              }
            }
            `,
            {
              partner_id: captainData.partner_id
            }
          );
          if (response.partners_by_pk) {
            setPartnerData(response.partners_by_pk);
          }
        } catch (error) {
          console.error("Error fetching partner data:", error);
          toast.error("Failed to load partner data");
        }
      }
    };

    fetchPartnerData();
  }, [captainData?.partner_id]);

  const calculateTotal = (
    items: Array<{
      id: string;
      quantity: number;
      menu: {
        name: string;
        price: number;
      };
    }>
  ) => {
    return items.reduce(
      (sum, item) => sum + item.menu.price * item.quantity,
      0
    );
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedItems = [...items];
    updatedItems[index].quantity = newQuantity;
    setItems(updatedItems);
    setTotalPrice(calculateTotal(updatedItems));
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
    setTotalPrice(calculateTotal(updatedItems));
  };

  const handleAddItem = () => {
    if (!newItemId) return;

    const menuItem = menuItems.find((item) => item.id === newItemId);
    if (!menuItem) return;

    const existingItemIndex = items.findIndex(
      (item) => item.id === newItemId
    );

    if (existingItemIndex >= 0) {
      handleQuantityChange(
        existingItemIndex,
        items[existingItemIndex].quantity + 1
      );
    } else {
      const newItem = {
        id: newItemId,
        quantity: 1,
        menu: {
          name: menuItem.name,
          price: menuItem.price,
          category: menuItem.category,
          description: menuItem.description,
          image_url: menuItem.image_url,
          is_top: menuItem.is_top,
          is_available: menuItem.is_available,
          priority: menuItem.priority
        },
      };
      const updatedItems = [...items, newItem];
      setItems(updatedItems);
      setTotalPrice(calculateTotal(updatedItems));
    }

    setNewItemId("");
  };

  const handleUpdateOrder = async () => {
    try {
      setUpdating(true);

      if (!captainData?.partner_id || !order?.id) {
        throw new Error("Partner ID or Order ID not available");
      }

      // Calculate total with GST if applicable
      const subtotal = calculateTotal(items);
      const finalTotal =
        gstPercentage > 0
          ? subtotal + (subtotal * gstPercentage) / 100
          : subtotal;

      // Update order
      await fetchFromHasura(updateOrderMutation, {
        id: order.id,
        totalPrice: finalTotal,
        phone: phone || "",
        tableNumber: tableNumber || null
      });

      // Update order items
      await fetchFromHasura(updateOrderItemsMutation, {
        orderId: order.id,
        items: items.map((item) => ({
          order_id: order.id,
          menu_id: item.id,
          quantity: item.quantity,
        })),
      });

      // Update local state with complete menu data
      const updatedOrder = {
        ...order,
        totalPrice: finalTotal,
        tableNumber: tableNumber || 0,
        phone: phone || "",
        partnerId: captainData.partner_id,
        items: items.map((item) => ({
          id: item.id,
          name: item.menu.name,
          price: item.menu.price,
          quantity: item.quantity,
          category: {
            name: item.menu.category?.name || "Uncategorized",
            id: item.menu.category?.id || crypto.randomUUID(),
            priority: item.menu.category?.priority || 0
          },
          image_url: item.menu.image_url || "",
          description: item.menu.description || "",
          is_top: item.menu.is_top || false,
          is_available: item.menu.is_available || false,
          created_at: new Date().toISOString(),
          priority: item.menu.priority || 0,
          offers: [{
            offer_price: item.menu.price,
            created_at: new Date().toISOString(),
            end_time: new Date(Date.now() + 86400000).toISOString(),
            start_time: new Date().toISOString(),
            enquiries: 0,
            items_available: 0,
            id: crypto.randomUUID(),
            menu: {
              id: item.id,
              name: item.menu.name,
              price: item.menu.price,
              category: {
                name: item.menu.category?.name || "Uncategorized",
                id: item.menu.category?.id || crypto.randomUUID(),
                priority: item.menu.category?.priority || 0
              },
              description: item.menu.description || "",
              image_url: item.menu.image_url || "",
            }
          }]
        }))
      } as Order;
      setOrder(updatedOrder);

      toast.success("Order updated successfully");
      onClose();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    } finally {
      setUpdating(false);
    }
  };

  // Add a loading state for menu items
  const [menuLoading, setMenuLoading] = useState(false);

  // Update the menu loading state
  useEffect(() => {
    if (isOpen && order?.partnerId) {
      setMenuLoading(true);
      fetchMenu(order.partnerId, true)
        .finally(() => setMenuLoading(false));
    }
  }, [isOpen, order?.partnerId, fetchMenu]);

  // Always fetch menu when modal opens and order?.partnerId is available
  useEffect(() => {
    if (isOpen && order?.partnerId) {
      fetchMenu(order.partnerId, true);
    }
  }, [isOpen, order?.partnerId, fetchMenu]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="fixed inset-0 w-full h-full max-w-none max-h-none p-0 m-0 flex flex-col bg-white z-[9999] rounded-none border-none overflow-hidden"
        style={{ 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          transform: 'none',
          height: '100vh',
          width: '100vw'
        }}
      >
        <DialogHeader className="flex-shrink-0 p-4 border-b bg-white">
          <DialogTitle className="text-lg font-semibold">
            Edit Order #{order?.id?.split("-")[0] || ""}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {tableNumber ? `Table ${tableNumber}` : ""}
            {partnerData?.store_name && (
              <span className="ml-2">
                - {partnerData.store_name}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
              {/* Order Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {userData?.role !== "user" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium">
                        Table Number
                      </label>
                      <Input
                        type="number"
                        value={tableNumber || ""}
                        onChange={(e) =>
                          setTableNumber(Number(e.target.value) || null)
                        }
                        placeholder="Table number"
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium">Phone</label>
                      <Input
                        type="tel"
                        value={phone || ""}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Customer phone"
                        className="h-9"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Total</label>
                  <div className="flex items-center h-9 px-3 rounded-md border bg-background text-sm">
                    {currency}
                    {totalPrice.toFixed(2)}
                    {gstPercentage > 0 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (incl. {gstPercentage}% GST: {currency}
                        {((totalPrice * gstPercentage) / 100).toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Add New Item */}
              <div>
                <h3 className="font-medium mb-2">Add New Item</h3>
                <div className="space-y-3">
                  <Input
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9"
                  />

                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {menuLoading ? (
                      <div className="p-3 text-center">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                        <div className="text-muted-foreground">Loading menu items...</div>
                      </div>
                    ) : menuItems.length === 0 ? (
                      <div className="p-3 text-center text-muted-foreground">
                        No menu items available
                      </div>
                    ) : filteredMenuItems.length === 0 ? (
                      <div className="p-3 text-center text-muted-foreground">
                        {searchQuery ? "No items found" : "No menu items available"}
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredMenuItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-2.5 flex justify-between items-center hover:bg-accent cursor-pointer"
                            onClick={() => {
                              console.log("Selected menu item:", {
                                id: item.id,
                                name: item.name,
                                price: item.price
                              });
                              setNewItemId(item.id!);
                              setSearchQuery("");
                            }}
                          >
                            <div>
                              <div className="font-medium text-sm">{item.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {currency}
                                {item.price.toFixed(2)}
                              </div>
                            </div>
                            <Plus className="h-4 w-4" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {newItemId && (
                    <div className="flex gap-2">
                      <div className="flex-1 border rounded-lg p-2.5 text-sm">
                        {menuItems.find((item) => item.id === newItemId)?.name} -{" "}
                        {currency}
                        {menuItems
                          .find((item) => item.id === newItemId)
                          ?.price.toFixed(2)}
                      </div>
                      <Button onClick={handleAddItem} size="sm">Add</Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Items */}
              <div>
                <h3 className="font-medium mb-2">Current Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  {items.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No items in this order
                    </div>
                  ) : (
                    <div className="divide-y">
                      {items.map((item, index) => (
                        <div
                          key={index}
                          className="p-2.5 flex justify-between items-center"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{item.menu.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {currency}
                              {item.menu.price.toFixed(2)} each
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 ml-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                handleQuantityChange(index, item.quantity - 1)
                              }
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>

                            <span className="w-6 text-center text-sm">
                              {item.quantity}
                            </span>

                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                handleQuantityChange(index, item.quantity + 1)
                              }
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fixed Bottom Buttons */}
            <div className="flex-shrink-0 bg-white border-t p-4 flex gap-3 safe-area-inset-bottom">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateOrder} 
                disabled={updating || loading}
                className="flex-1"
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Order"
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};