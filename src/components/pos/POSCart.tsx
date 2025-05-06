"use client";
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { usePOSStore } from "@/store/posStore";
import { Plus, Minus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const POSCart = () => {
  const { cartItems, totalAmount, increaseQuantity, decreaseQuantity, removeFromCart, checkout ,loading } = usePOSStore();

  const handleCheckout = async () => {
    try {
      await checkout();
      toast.success('Checkout successful');
      // You might want to show a success message or redirect
    } catch (error) {
      // Handle error (show error message)
      console.error('Checkout failed:', error);
      toast.error('Checkout failed');
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="fixed bottom-4 right-4 h-16 w-16 rounded-full">
          <ShoppingCart className="h-6 w-6" />
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm">
              {cartItems.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Cart Items</SheetTitle>
        </SheetHeader>
        <div className="mt-8">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-4 border-b">
              <div className="flex-1">
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-gray-500">${item.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => decreaseQuantity(item.id!)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => increaseQuantity(item.id!)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeFromCart(item.id!)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {cartItems.length === 0 && (
            <div className="text-center text-gray-500">No items in cart</div>
          )}
          {cartItems.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between text-lg font-medium">
                <span>Total</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              <Button 
                className="w-full mt-4"
                onClick={handleCheckout}
              >
                {loading ? 'Processing...' : 'Checkout'}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};