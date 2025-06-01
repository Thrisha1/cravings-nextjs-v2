"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Partner, useAuthStore } from "@/store/authStore";

export const EditOrderModal = () => {
  const {
    order,
    setOrder,
    editOrderModalOpen: isOpen,
    setEditOrderModalOpen,
  } = usePOSStore();
  const { fetchMenu, items: menuItems } = useMenuStore();
  const { userData } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [items, setItems] = useState<
    Array<{
      id?: string;
      menu_id: string;
      quantity: number;
      menu: {
        name: string;
        price: number;
      };
    }>
  >([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [newItemId, setNewItemId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const currency = (userData as Partner)?.currency || "$";
  const gstPercentage = (userData as Partner)?.gst_percentage || 0;

  const onClose = () => {
    setEditOrderModalOpen(false);
    setItems([]);
    setTotalPrice(0);
    setTableNumber(null);
    setPhone(null);
    setNewItemId("");
    setSearchQuery("");
  };

  useEffect(() => {
    if (isOpen && order?.id) {
      fetchOrderDetails();
    }
  }, [isOpen, order?.id]);

  useEffect(() => {
    if (isOpen) {
      fetchMenu(order?.partnerId);
    }
  }, [isOpen]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetchFromHasura(getOrderByIdQuery, {
        orderId: order?.id,
      });

      const orderData = response.orders_by_pk;
      if (orderData) {
        setItems(
          orderData.order_items.map((item: any) => ({
            id: item.id,
            menu_id: item.menu.id,
            quantity: item.quantity,
            menu: {
              name: item.menu.name,
              price: item.menu.price,
            },
          }))
        );
        setTotalPrice(orderData.total_price);
        setTableNumber(orderData.table_number);
        setPhone(orderData.phone);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (
    items: Array<{
      id?: string;
      menu_id: string;
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
      (item) => item.menu_id === newItemId
    );

    if (existingItemIndex >= 0) {
      handleQuantityChange(
        existingItemIndex,
        items[existingItemIndex].quantity + 1
      );
    } else {
      const newItem = {
        menu_id: newItemId,
        quantity: 1,
        menu: {
          name: menuItem.name,
          price: menuItem.price,
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

      // Calculate total with GST if applicable
      const subtotal = calculateTotal(items);
      const finalTotal =
        gstPercentage > 0
          ? subtotal + (subtotal * gstPercentage) / 100
          : subtotal;

      // Update order
      await fetchFromHasura(updateOrderMutation, {
        id: order?.id,
        totalPrice: finalTotal,
        phone: phone || "",
      });

      // Update order items
      await fetchFromHasura(updateOrderItemsMutation, {
        orderId: order?.id,
        items: items.map((item) => ({
          order_id: order?.id,
          menu_id: item.menu_id,
          quantity: item.quantity,
        })),
      });

      // Update local state
      if (order) {
        setOrder({
          ...order,
          totalPrice: finalTotal,
          tableNumber: tableNumber || 0,
          phone: phone || "",
          items: items.map((item) => ({
            id: item.menu_id,
            name: item.menu.name,
            price: item.menu.price,
            quantity: item.quantity,
            category: {
              name: "",
              id: "",
              priority: 0,
            },
            image_url: "",
            description: "",
            is_top: false,
            is_available: true,
            created_at: new Date().toISOString(),
            priority: 0,
            offers: [{
              offer_price: item.menu.price,
              created_at: new Date().toISOString(),
              end_time: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
              start_time: new Date().toISOString(),
              enquiries: 0,
              items_available: 0,
              id: "",
              menu: {
                id: item.menu_id,
                name: item.menu.name,
                price: item.menu.price,
                category: {
                  name: "",
                  id: "",
                  priority: 0,
                },
                description: "",
                image_url: "",
              }
            }]
          })),
        });
      }

      toast.success("Order updated successfully");
      onClose();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    } finally {
      setUpdating(false);
    }
  };

  const filteredMenuItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Order #{order?.id?.split("-")[0]}</DialogTitle>
          <DialogDescription>
            {tableNumber ? `Table ${tableNumber}` : ""}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="space-y-6">
              {/* Order Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {userData?.role !== "user" && (
                  <>
                    <div className="space-y-2">
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
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Phone</label>
                      <Input
                        type="tel"
                        value={phone || ""}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Customer phone"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium">Total</label>
                  <div className="flex items-center h-10 px-3 py-2 rounded-md border bg-background text-sm">
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
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Add New Item</h3>
                <div className="space-y-3">
                  <Input
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  {searchQuery && (
                    <div className="border rounded-lg max-h-52 overflow-y-auto">
                      {filteredMenuItems.length === 0 ? (
                        <div className="p-3 text-center text-muted-foreground">
                          No items found
                        </div>
                      ) : (
                        <div className="divide-y">
                          {filteredMenuItems.map((item) => (
                            <div
                              key={item.id}
                              className="p-3 flex justify-between items-center hover:bg-accent cursor-pointer"
                              onClick={() => {
                                setNewItemId(item.id!);
                                setSearchQuery("");
                              }}
                            >
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-muted-foreground">
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
                  )}

                  {newItemId && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 border rounded-lg p-3">
                        {menuItems.find((item) => item.id === newItemId)?.name} -{" "}
                        {currency}
                        {menuItems
                          .find((item) => item.id === newItemId)
                          ?.price.toFixed(2)}
                      </div>
                      <Button onClick={handleAddItem} className="sm:w-auto w-full">Add to Order</Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Items */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Current Items</h3>
                <div className="rounded-lg overflow-hidden border">
                  {items.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No items in this order
                    </div>
                  ) : (
                    <div className="divide-y">
                      {items.map((item, index) => (
                        <div
                          key={index}
                          className="p-3 flex flex-col sm:flex-row justify-between gap-2"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{item.menu.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {currency}
                              {item.menu.price.toFixed(2)} each
                            </div>
                          </div>

                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleQuantityChange(index, item.quantity - 1)
                              }
                            >
                              <Minus className="h-4 w-4" />
                            </Button>

                            <span className="w-8 text-center">
                              {item.quantity}
                            </span>

                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleQuantityChange(index, item.quantity + 1)
                              }
                            >
                              <Plus className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpdateOrder} disabled={updating || loading}>
            {updating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Order"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
