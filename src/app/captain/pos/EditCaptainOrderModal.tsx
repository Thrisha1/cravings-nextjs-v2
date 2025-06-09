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

interface ExtraCharge {
  id?: string;
  name: string;
  amount: number;
}

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
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showExtraItems, setShowExtraItems] = useState(false);
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);
  const [newExtraCharge, setNewExtraCharge] = useState<ExtraCharge>({ name: "", amount: 0 });

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
    setNewItemId(null);
    setSearchQuery("");
    setShowExtraItems(false);
    setExtraCharges([]);
    setNewExtraCharge({ name: "", amount: 0 });
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
        
        // Load extra charges if they exist
        if (foundOrder.extraCharges) {
          setExtraCharges(foundOrder.extraCharges);
        }
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
    const subtotal = items.reduce(
      (sum, item) => sum + item.menu.price * item.quantity,
      0
    );
    const extraChargesTotal = extraCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const gstAmount = gstPercentage > 0 ? (subtotal * gstPercentage) / 100 : 0;
    return subtotal + extraChargesTotal + gstAmount;
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
          priority: menuItem.priority,
        },
      };
      const updatedItems = [...items, newItem];
      setItems(updatedItems);
      setTotalPrice(calculateTotal(updatedItems));
    }

    setNewItemId(null);
  };

  const handleAddExtraCharge = () => {
    if (!newExtraCharge.name || newExtraCharge.amount <= 0) {
      toast.error("Please enter a valid charge name and amount");
      return;
    }

    const charge: ExtraCharge = {
      id: Date.now().toString(),
      name: newExtraCharge.name,
      amount: newExtraCharge.amount,
    };

    setExtraCharges([...extraCharges, charge]);
    setNewExtraCharge({ name: "", amount: 0 });
    setTotalPrice(calculateTotal(items));
  };

  const handleRemoveExtraCharge = (index: number) => {
    const updatedCharges = [...extraCharges];
    updatedCharges.splice(index, 1);
    setExtraCharges(updatedCharges);
    setTotalPrice(calculateTotal(items));
  };

  const handleUpdateOrder = async () => {
    try {
      // Prevent updating if there are no items
      if (!items || items.length === 0) {
        toast.error("Cannot save order with no items");
        return;
      }

      setUpdating(true);

      // Calculate total with GST if applicable
      const subtotal = items.reduce(
        (sum, item) => sum + item.menu.price * item.quantity,
        0
      );
      const extraChargesTotal = extraCharges.reduce((sum, charge) => sum + charge.amount, 0);
      const gstAmount = gstPercentage > 0 ? (subtotal * gstPercentage) / 100 : 0;
      const finalTotal = subtotal + extraChargesTotal + gstAmount;

      // Update order
      await fetchFromHasura(updateOrderMutation, {
        id: order?.id,
        totalPrice: finalTotal,
        phone: phone || "",
        extraCharges: extraCharges.length > 0 ? extraCharges : null,
      });

      // Update order items
      await fetchFromHasura(updateOrderItemsMutation, {
        orderId: order?.id,
        items: items.map((item) => ({
          order_id: order?.id,
          menu_id: item.id,
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
          extraCharges: extraCharges,
          items: items.map((item) => ({
            id: item.id,
            name: item.menu.name,
            price: item.menu.price,
            quantity: item.quantity,
            category: item.menu.category || {
              name: "",
              id: "",
              priority: 0,
            },
            image_url: item.menu.image_url || "",
            description: item.menu.description || "",
            is_top: item.menu.is_top || false,
            is_available: item.menu.is_available || true,
            created_at: new Date().toISOString(),
            priority: item.menu.priority || 0,
            offers: [],
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Order #{order?.id?.split("-")[0]}</DialogTitle>
          <DialogDescription>
            {tableNumber ? `Table ${tableNumber}` : ""}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div className="space-y-2">
                <label className="block text-sm font-medium">Total</label>
                <div className="flex items-center h-10 px-3 py-2 rounded-md border bg-background text-sm">
                  {currency}
                  {totalPrice.toFixed(2)}
                  {gstPercentage > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (incl. {gstPercentage}% GST: {currency}
                      {((items.reduce((sum, item) => sum + item.menu.price * item.quantity, 0) * gstPercentage) / 100).toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Extra Charges */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">Extra Charges</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Charge name"
                    value={newExtraCharge.name}
                    onChange={(e) => setNewExtraCharge({ ...newExtraCharge, name: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={newExtraCharge.amount || ""}
                    onChange={(e) => setNewExtraCharge({ ...newExtraCharge, amount: Number(e.target.value) })}
                  />
                  <Button onClick={handleAddExtraCharge} className="whitespace-nowrap">
                    Add Charge
                  </Button>
                </div>

                {extraCharges.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="divide-y">
                      {extraCharges.map((charge, index) => (
                        <div
                          key={charge.id || index}
                          className="p-3 flex justify-between items-center"
                        >
                          <div>
                            <div className="font-medium">{charge.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {currency}{charge.amount.toFixed(2)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleRemoveExtraCharge(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateOrder} 
            disabled={updating || loading || !items || items.length === 0}
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
      </DialogContent>
    </Dialog>
  );
};