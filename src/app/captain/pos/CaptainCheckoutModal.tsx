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
import { useAuthStore, Captain } from "@/store/authStore";
import KOTTemplate from "@/components/admin/pos/KOTTemplate";
import BillTemplate from "@/components/admin/pos/BillTemplate";

export const CaptainCheckoutModal = () => {
  const {
    order,
    clearCart,
    extraCharges,
    setPostCheckoutModalOpen,
    postCheckoutModalOpen,
    setEditOrderModalOpen,
  } = usePOSStore();
    const { userData } = useAuthStore();
    const captainData = userData as Captain;

  const billRef = useRef<HTMLDivElement>(null);
  const kotRef = useRef<HTMLDivElement>(null);

//   const handlePrintBill = useReactToPrint({
//     contentRef: billRef,
//     onAfterPrint: () => console.log("Bill printed successfully"),
//   });

//   const handlePrintKOT = useReactToPrint({
//     contentRef: kotRef,
//     onAfterPrint: () => console.log("KOT printed successfully"),
//   });

  const handleEditOrder = () => {
    setPostCheckoutModalOpen(false);
    setEditOrderModalOpen(true);
  };

  const handleClose = () => {
    setPostCheckoutModalOpen(false);
    clearCart();
  };

  if (!order) return null;

  const currency = captainData?.currency || "$";
  const gstPercentage = captainData?.gst_percentage || 0;

  const calculateGst = (amount: number) => {
    return (amount * gstPercentage) / 100;
  };

  // Calculate totals
  const foodSubtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const extraChargesTotal = extraCharges.reduce((sum, charge) => sum + charge.amount, 0);
  const subtotal = foodSubtotal + extraChargesTotal;
  const gstAmount = calculateGst(foodSubtotal);
  const grandTotal = subtotal + gstAmount;

  return (
    <>
      <Dialog
        open={postCheckoutModalOpen}
        onOpenChange={setPostCheckoutModalOpen}
      >
        <DialogContent className="max-w-none w-screen h-screen p-0 sm:p-0">
          <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl sm:text-2xl">Order #{order.id}</DialogTitle>
              <DialogDescription className="text-base mt-1">
                {order.tableNumber && (
                  <span className="text-green-600 font-medium">Table {order.tableNumber}</span>
                )}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setPostCheckoutModalOpen(false)}
              className="px-4 py-2 text-base font-semibold border-2 hover:bg-gray-100"
            >
              Back
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Order Status */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <div className="h-2 w-2 rounded-full bg-green-600"></div>
                  <span className="font-semibold">Status: Complete</span>
                </div>
              </div>

              {/* Order Details */}
              <div className="bg-white border rounded-lg divide-y">
                {/* Order Info */}
                <div className="p-4 border-b">
                  <div className="flex justify-end">
                    <div className="space-y-1 text-right">
                      <div className="text-sm text-gray-500">Order Time</div>
                      <div className="font-medium">
                        {new Date().toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                          hour12: true
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{item.quantity}x</span>
                          <span>{item.name}</span>
                        </div>
                        <span className="font-medium">
                          {currency}{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Extra Charges */}
                {extraCharges.length > 0 && (
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-3">Extra Charges</h3>
                    <div className="space-y-2">
                      {extraCharges.map((charge, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span>{charge.name}</span>
                          <span className="font-medium">{currency}{charge.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Subtotal:</span>
                    <span>{currency}{foodSubtotal.toFixed(2)}</span>
                  </div>
                  {gstPercentage > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span>{`GST (${gstPercentage}%):`}</span>
                      <span>{currency}{gstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t font-semibold text-lg">
                    <span>Grand Total:</span>
                    <span>{currency}{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleEditOrder}
                  className="flex-1 py-3 text-base font-semibold border-2 hover:bg-gray-100"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Order
                </Button>
                {/* <Button onClick={handlePrintKOT} className="flex-1 gap-2">
                  <Printer className="h-4 w-4" />
                  Print KOT
                </Button>
                <Button onClick={handlePrintBill} className="flex-1 gap-2">
                  <Printer className="h-4 w-4" />
                  Print Bill
                </Button> */}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden elements for printing */}
      <div className="hidden">
        {/* KOT Template */}
        <KOTTemplate ref={kotRef} order={order} key={`kot-${order.id}`} />

        {/* Bill Template */}
        <BillTemplate 
          ref={billRef} 
          order={order} 
          userData={captainData as any}
          extraCharges={extraCharges}
        />
      </div>
    </>
  );
};