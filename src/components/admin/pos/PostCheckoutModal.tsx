"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePOSStore } from "@/store/posStore";
import { Printer, Edit, Loader2 } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import { Partner, useAuthStore } from "@/store/authStore";
import KOTTemplate from "./KOTTemplate";
import BillTemplate from "./BillTemplate";
import { useRouter } from "next/navigation";

export const PostCheckoutModal = () => {
  const {
    order,
    clearCart,
    extraCharges,
    setPostCheckoutModalOpen,
    postCheckoutModalOpen,
    setEditOrderModalOpen,
  } = usePOSStore();
  const { userData } = useAuthStore();
  const router = useRouter();
  const billRef = useRef<HTMLDivElement>(null);
  const kotRef = useRef<HTMLDivElement>(null);

  const handleEditOrder = () => {
    setPostCheckoutModalOpen(false);
    setEditOrderModalOpen(true);
  };

  const handleClose = () => {
    setPostCheckoutModalOpen(false);
    clearCart();
  };

  if (!order) return null;

  const currency = (userData as Partner)?.currency || "$";
  const gstPercentage = (userData as Partner)?.gst_percentage || 0;

  const calculateGst = (amount: number) => {
    return (amount * gstPercentage) / 100;
  };

  // Calculate totals
  const foodSubtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const extraChargesTotal = extraCharges.reduce(
    (sum, charge) => sum + charge.amount,
    0
  );
  const subtotal = foodSubtotal + extraChargesTotal;
  const gstAmount = calculateGst(foodSubtotal);
  const grandTotal = subtotal + gstAmount;

  return (
    <>
      <Dialog
        open={postCheckoutModalOpen}
        onOpenChange={setPostCheckoutModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order #{order.id}</DialogTitle>
            <DialogDescription>
              {order.tableNumber
                ? `Table ${order.tableNumber}`
                : "No table assigned"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <span className="font-medium">{order.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Items:</span>
              <span className="font-medium">
                {order.items.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            </div>
            {/* Show extra charges if they exist */}
            {extraCharges.length > 0 && (
              <div className="flex items-center justify-between">
                <span>Extra Charges:</span>
                <span className="font-medium">
                  {currency}
                  {extraChargesTotal.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span>Grand Total:</span>
              <span className="font-medium">
                {currency}
                {grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                router.push("/bill/" + order.id);
              }}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print KOT
            </Button>
            <Button
              onClick={() => {
                router.push("/kot/" + order.id);
              }}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Bill
            </Button>
            <Button
              variant="outline"
              onClick={handleEditOrder}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
