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
import { Plus, Minus, ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Partner, useAuthStore } from "@/store/authStore";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const POSCart = () => {
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
    setDeliveryAddress,
  } = usePOSStore();
  const { userData } = useAuthStore();
  const { getPartnerTables } = usePOSStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isExtraChargesModalOpen, setIsExtraChargesModalOpen] = useState(false);
  const [isDeliveryAddressModalOpen, setIsDeliveryAddressModalOpen] =
    useState(false);
  const [extraCharges, setExtraCharges] = useState<ExtraCharge>({
    name: "",
    amount: 0,
    id: "",
  });
  const [phoneInput, setPhoneInput] = useState("");
  const [deliveryAddress, setDeliveryAddressInput] = useState("");

  const getGstAmount = (price: number, gstPercentage: number) => {
    return (price * gstPercentage) / 100;
  };

  const gstPercentage = (userData as Partner)?.gst_percentage || 0;
  const gstAmount = getGstAmount(totalAmount, gstPercentage);
  const grandTotal = totalAmount + gstAmount;

  useEffect(() => {
    if (userData?.id) {
      getPartnerTables();
    }
  }, [userData]);

  const handleCheckoutFlow = async () => {
    setIsTableModalOpen(true);
  };

  const handleTableSelect = (table: number) => {
    setTableNumber(table);
    setIsTableModalOpen(false);
    setIsPhoneModalOpen(true);
  };

  const handleDeliverySelect = () => {
    setIsTableModalOpen(false);
    setIsDeliveryAddressModalOpen(true);
  };

  const handleDeliveryAddressSubmit = () => {
    console.log("Delivery Address:", deliveryAddress);
    setDeliveryAddress(deliveryAddress);
    setIsDeliveryAddressModalOpen(false);
    setIsPhoneModalOpen(true);
  };

  const handleSkipDeliveryAddress = () => {
    setDeliveryAddressInput("");
    setIsDeliveryAddressModalOpen(false);
    setIsPhoneModalOpen(true);
  };

  const handleSkipTable = () => {
    setTableNumber(null);
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
      setDeliveryAddressInput("");
      setExtraCharges({ name: "", amount: 0, id: "" });
    } catch (error) {
      console.error("Checkout failed:", error);
      toast.error("Checkout failed");
    }
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        {/* order details */}
        <div
          className={`fixed bottom-0 left-1/2 -translate-x-1/2 flex items-center justify-between gap-auto w-full sm:w-fit sm:gap-60 lg:gap-80 bg-white border-2 border-black/10 rounded-t-[35px] px-7 py-5 sm:py-7 shadow-2xl duration-500 transition-all ${
            totalAmount > 0 ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex flex-col gap-1">
            {/* price */}
            <div className="flex gap-2 text-nowrap font-extrabold text-xl lg:text-2xl">
              <div>PRICE :</div>
              <div>
                {(userData as Partner)?.currency}
                {grandTotal.toFixed(2)}
              </div>
            </div>

            {/* total Items */}
            <div className="inline-flex flex-nowrap text-nowrap gap-2 font-medium text-black/50 te text-sm">
              <div>Total Items :</div>
              <div>
                {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
              </div>
            </div>
          </div>

          <DrawerTrigger className="text-black font-black text-base lg:text-lg flex gap-2 text-nowrap flex-nowrap">
            <ShoppingCart className="w-7 h-7" /> View Order
          </DrawerTrigger>
        </div>

        <DrawerContent className="max-h-[80vh] sm:h-[80vh] w-[100vw] sm:w-[80vw] lg:w-[50vw] mx-auto sm:px-5">
          <DrawerHeader>
            <DrawerTitle>Your Cart</DrawerTitle>
            <DrawerDescription>
              {cartItems.length > 0
                ? "Review your items before checkout"
                : "Your cart is empty"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 overflow-y-auto flex-1">
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
                        {(userData as Partner)?.currency}
                        {item.price.toFixed(2)}
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
                          <span>{item.quantity}</span>
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
                        {(userData as Partner)?.currency}
                        {(item.price * item.quantity).toFixed(2)}
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
            <DrawerFooter className="border-t">
              {gstPercentage > 0 ? (
                <>
                  <div className="flex justify-between items-center mb-2 text-sm">
                    <span>Subtotal:</span>
                    <span>
                      {(userData as Partner)?.currency}
                      {totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2 text-sm">
                    <span>{`GST (${gstPercentage}%):`}</span>
                    <span>
                      {(userData as Partner)?.currency}
                      {gstAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-4 font-bold">
                    <span>Grand Total:</span>
                    <span className="text-lg">
                      {(userData as Partner)?.currency}
                      {grandTotal.toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center mb-4 font-bold">
                  <span>Grand Total:</span>
                  <span className="text-lg">
                    {(userData as Partner)?.currency}
                    {totalAmount.toFixed(2)}
                  </span>
                </div>
              )}

              <Button
                onClick={handleCheckoutFlow}
                disabled={loading}
                className="w-full"
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
      <Dialog open={isTableModalOpen} onOpenChange={setIsTableModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Table Number</DialogTitle>
            <DialogDescription>
              Please choose the table for this order
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            {tableNumbers
              .filter((table) => table !== 0)
              .map((table) => (
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
          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={handleDeliverySelect}>
              Delivery
            </Button>
            <Button variant="default" onClick={handleSkipTable}>
              Takeaway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Address Modal */}
      <Dialog
        open={isDeliveryAddressModalOpen}
        onOpenChange={setIsDeliveryAddressModalOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delivery Address</DialogTitle>
            <DialogDescription>
              Please enter the delivery address
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter full delivery address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddressInput(e.target.value)}
              className="w-full min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleSkipDeliveryAddress}
              variant="secondary"
            >
              Skip
            </Button>
            <Button
              onClick={handleDeliveryAddressSubmit}
              disabled={!deliveryAddress}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phone Number Modal */}
      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Customer Phone Number</DialogTitle>
            <DialogDescription>
              Enter customer phone number (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="tel"
              placeholder="Phone number"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="secondary" onClick={handleSkipPhone}>
              Skip
            </Button>
            <Button onClick={handlePhoneSubmit}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extra Charges Modal */}
      <Dialog
        open={isExtraChargesModalOpen}
        onOpenChange={setIsExtraChargesModalOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Extra Charges</DialogTitle>
            <DialogDescription>
              Add any extra charges (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className=" w-full">
              <Input
                id="charge-name"
                placeholder="Charge name"
                className="w-full"
                value={extraCharges.name}
                onChange={(e) =>
                  setExtraCharges({ ...extraCharges, name: e.target.value })
                }
              />
            </div>
            <div className="w-full">
              <Input
                id="charge-amount"
                type="number"
                placeholder="Amount"
                className="w-full"
                value={extraCharges.amount || ""}
                onChange={(e) =>
                  setExtraCharges({
                    ...extraCharges,
                    amount: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="secondary" onClick={handleSkipExtraCharges}>
              Skip
            </Button>
            <Button onClick={handleExtraChargesSubmit}>Complete Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
