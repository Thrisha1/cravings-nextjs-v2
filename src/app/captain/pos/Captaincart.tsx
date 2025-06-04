"use client";
import React, { useEffect, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExtraCharge, usePOSStore } from "@/store/posStore";
import { Plus, Minus, ShoppingCart, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Captain, useAuthStore } from "@/store/authStore";
import { Input } from "@/components/ui/input";
import { fetchFromHasura } from "@/lib/hasuraClient";

export const Captaincart = () => {
  const {
    cartItems,
    totalAmount,
    increaseQuantity,
    decreaseQuantity,
    checkout,
    setUserPhone,
    addExtraCharge,
    setTableNumber,
    tableNumbers,
    tableNumber,
    loading,
    order,
    removeFromCart,
    setLoading
  } = usePOSStore();
  
  const { userData } = useAuthStore();
  const captainData = userData as Captain;
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { getPartnerTables } = usePOSStore();
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isExtraChargesModalOpen, setIsExtraChargesModalOpen] = useState(false);
  const [extraCharges, setExtraCharges] = useState<ExtraCharge>({ name: "", amount: 0, id: "" });
  const [phoneInput, setPhoneInput] = useState("");

  const getGstAmount = (price: number, gstPercentage: number) => {
    return (price * gstPercentage) / 100;
  };

  const gstAmount = getGstAmount(totalAmount, captainData?.gst_percentage || 0);
  const grandTotal = totalAmount + gstAmount;

  useEffect(() => {
    const fetchTableNumbers = async () => {
      if (!captainData?.partner_id) return;

      /* console.log("Fetching table numbers for partner:", captainData.partner_id); */
      try {
        await getPartnerTables();
        /* console.log("Table numbers fetched:", tableNumbers); */
      } catch (error) {
        /* console.error("Error fetching table numbers:", error); */
      }
    };

    fetchTableNumbers();
  }, [captainData?.partner_id, getPartnerTables]);

  const handleCheckoutFlow = async () => {
    console.log("Starting checkout flow. Available table numbers:", tableNumbers);
    setIsTableModalOpen(true);
  };

  const handleTableSelect = (table: number) => {
    setTableNumber(table);
    setIsTableModalOpen(false);
    setIsPhoneModalOpen(true);
  };

  const handleSkipTable = () => {
    setTableNumber(0);
    setIsTableModalOpen(false);
    setIsPhoneModalOpen(true);
  };

  const handlePhoneSubmit = () => {
    setUserPhone(phoneInput || null);
    setIsPhoneModalOpen(false);
    setIsExtraChargesModalOpen(true);
  };

  const handleSkipPhone = () => {
    setUserPhone(null);
    setIsPhoneModalOpen(false);
    setIsExtraChargesModalOpen(true);
  };

  const handleExtraChargesSubmit = () => {
    setIsExtraChargesModalOpen(false);
    if (extraCharges.name && extraCharges.amount) {
      addExtraCharge(extraCharges);
    }
    performCheckout();
  };

  const handleSkipExtraCharges = () => {
    setIsExtraChargesModalOpen(false);
    performCheckout();
  };

  const performCheckout = async () => {
    try {
      await checkout();
      toast.success("Checkout successful");
      setIsOpen(false);
      setPhoneInput("");
      setExtraCharges({ name: "", amount: 0, id: "" });
    } catch (error) {
      console.error("Checkout failed:", error);
      toast.error("Checkout failed");
    }
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        {/* Cart Summary Bar - Only show when there are items */}
        <div className={`fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg transition-transform duration-300 ${cartItems.length > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                {/* price */}
                <div className="flex gap-2 text-nowrap font-extrabold text-lg sm:text-xl lg:text-2xl">
                  <div>PRICE :</div>
                  <div>
                    {captainData?.currency || "$"}
                    {grandTotal.toFixed(2)}
                  </div>
                </div>

                {/* total Items */}
                <div className="inline-flex flex-nowrap text-nowrap gap-2 font-medium text-black/50 text-sm">
                  <div>Total Items :</div>
                  <div>{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</div>
                </div>
              </div>

              <Button 
                onClick={() => setIsOpen(true)}
                className="bg-black hover:bg-black/90 text-white font-semibold text-sm sm:text-base flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg min-w-[140px] justify-center"
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" /> 
                <span>View Order</span>
              </Button>
            </div>
          </div>
        </div>

        <DrawerContent className="max-h-[85vh] sm:max-h-[80vh]">
          <DrawerHeader className="border-b px-4 py-3 sm:py-4">
            <DrawerTitle className="text-lg sm:text-xl">Your Cart</DrawerTitle>
            <DrawerDescription>
              {cartItems.length > 0
                ? "Review your items before checkout"
                : "Your cart is empty"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 py-3 sm:py-4">
            {cartItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[50%] font-semibold text-sm text-gray-500">
                      ITEM
                    </TableHead>
                    <TableHead className="text-right font-semibold text-sm text-gray-500">
                      PRICE
                    </TableHead>
                    <TableHead className="text-center font-semibold text-sm text-gray-500">
                      QTY
                    </TableHead>
                    <TableHead className="text-right font-semibold text-sm text-gray-500">
                      TOTAL
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow
                      key={`cart-item-${item.id}`}
                      className="hover:bg-transparent border-b border-gray-100"
                    >
                      <TableCell className="font-medium py-3">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-right py-3">
                        {captainData?.currency || "$"}{item.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => decreaseQuantity(item.id!)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => increaseQuantity(item.id!)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        {captainData?.currency || "$"}{(item.price * item.quantity).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No items in your cart
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <DrawerFooter className="border-t px-4 py-3 sm:py-4">
              {(captainData?.gst_percentage || 0) > 0 ? (
                <>
                  <div className="flex justify-between items-center mb-2 text-sm">
                    <span>Subtotal:</span>
                    <span>{captainData?.currency || "$"}{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2 text-sm">
                    <span>{`GST (${captainData?.gst_percentage || 0}%):`}</span>
                    <span>{captainData?.currency || "$"}{gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4 font-bold">
                    <span>Grand Total:</span>
                    <span className="text-lg">
                      {captainData?.currency || "$"}{grandTotal.toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center mb-4 font-bold">
                  <span>Grand Total:</span>
                  <span className="text-lg">
                    {captainData?.currency || "$"}{totalAmount.toFixed(2)}
                  </span>
                </div>
              )}

              <Button
                className="w-full h-12 text-lg font-semibold"
                onClick={handleCheckoutFlow}
                disabled={loading}
                // className="w-full bg-black hover:bg-black/90 text-white py-3 text-base font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Checkout"
                )}
              </Button>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>

      {/* Table Selection Modal */}
      <Dialog open={isTableModalOpen} onOpenChange={(open) => {
        if (!open) return; // Prevent closing on outside click or Escape
        setIsTableModalOpen(open); // Only allow opening
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Select Table Number</DialogTitle>
              <DialogDescription>
                {tableNumbers.length === 0 ? (
                  "No tables available. Please contact the restaurant admin."
                ) : (
                  "Please choose the table for this order"
                )}
              </DialogDescription>
            </DialogHeader>

            {tableNumbers.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No tables configured for this restaurant
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 py-4">
                {tableNumbers.map((table) => (
                  <Button
                    key={table}
                    variant={tableNumber === table ? "default" : "outline"}
                    onClick={() => handleTableSelect(table)}
                    className="h-12"
                  >
                    Table {table}
                  </Button>
                ))}
              </div>
            )}

            <div className="pt-4">
              <Button variant="secondary" onClick={handleSkipTable} className="w-full">
                Skip (No Table)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Phone Number Modal - Fixed for keyboard accessibility */}
      <Dialog open={isPhoneModalOpen} onOpenChange={(open) => {
        if (!open) return; // Prevent closing when clicking outside
        setIsPhoneModalOpen(open);
      }}>
        <DialogContent className="sm:max-w-[425px] w-[95vw] sm:w-auto h-auto max-h-[95vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Customer Phone Number</DialogTitle>
            <DialogDescription>
              Enter customer phone number (optional)
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="py-4">
              <Input
                type="tel"
                placeholder="Phone number"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0 pt-4">
            <Button variant="secondary" onClick={handleSkipPhone} className="flex-1">
              Skip
            </Button>
            <Button onClick={handlePhoneSubmit} className="flex-1">
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Extra Charges Modal - Fixed for keyboard accessibility */}
      <Dialog open={isExtraChargesModalOpen} onOpenChange={(open) => {
        if (!open) return; // Prevent closing when clicking outside
        setIsExtraChargesModalOpen(open);
      }}>
        <DialogContent className="sm:max-w-[425px] w-[95vw] sm:w-auto h-auto max-h-[95vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Extra Charges</DialogTitle>
            <DialogDescription>
              Add any extra charges (optional)
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="grid gap-4 py-4">
              <div className="w-full">
                <Input
                  id="charge-name"
                  placeholder="Charge name"
                  className="w-full"
                  value={extraCharges.name}
                  onChange={(e) => setExtraCharges({...extraCharges, name: e.target.value})}
                />
              </div>
              <div className="w-full">
                <Input
                  id="charge-amount"
                  type="number"
                  placeholder="Amount"
                  className="w-full"
                  value={extraCharges.amount || ""}
                  onChange={(e) => setExtraCharges({...extraCharges, amount: Number(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0 pt-4">
            <Button variant="secondary" onClick={handleSkipExtraCharges} className="flex-1">
              Skip
            </Button>
            <Button onClick={handleExtraChargesSubmit} className="flex-1">
              Complete Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};