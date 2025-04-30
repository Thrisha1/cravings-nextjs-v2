"use client";
import { HotelData } from "@/app/hotels/[id]/page";
import { Styles } from "@/screens/HotelMenuPage_v2";
import HeadingWithAccent from "@/components/HeadingWithAccent";
import React, { useState } from "react";
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
import { Button } from "../ui/button";
import useOrderStore from "@/store/orderStore";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

const OrderDrawer = ({
  styles,
  hotelData,
  tableNumber,
  qrId,
}: {
  styles: Styles;
  hotelData: HotelData;
  tableNumber?: number;
  qrId?: string;
}) => {
  const {
    order,
    items,
    totalPrice,
    placeOrder,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearOrder,
  } = useOrderStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [tempAddress, setTempAddress] = useState("");

  React.useEffect(() => {
    const savedAddress = localStorage.getItem("userAddress");
    if (savedAddress) {
      console.log("Address found in local storage:", savedAddress);
      setAddress(savedAddress);
    }
  }, []);

  const handleAddressSubmit = () => {
    // Save the address if not empty
    if (tempAddress.trim()) {
      localStorage.setItem("userAddress", tempAddress);
      setAddress(tempAddress);
      toast.success("Your order is placing!");
      setShowAddressModal(false);
      // Proceed with order placement
      processOrder();
    } else {
      toast.error("Please enter a valid delivery address");
    }
  };

  const processOrder = async () => {
    setIsLoading(true);
    try {
      const result = await placeOrder(hotelData);
      if (result) {
        const savedAddress = localStorage.getItem("userAddress");
        console.log("Address found in local storage:", savedAddress);
        toast.success("Order placed successfully!");
  
        const whatsappMsg = `
        *🍽️ Order Details 🍽️*
  
        ${tableNumber ? `*Table:* ${tableNumber}` : 'Order Type : Delivery'}
        ${tableNumber ? "" : `*Delivery Address:* ${savedAddress}`}
        *Order ID:* ${result.id.slice(0, 8)}
        *Time:* ${new Date(result.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
  
        *📋 Order Items:*
        ${items
          .map(
            (item, index) =>
              `${index + 1}. ${item.name}
          ➤ Qty: ${item.quantity} × ${hotelData.currency}${item.price.toFixed(
                2
              )} = ${hotelData.currency}${(item.price * item.quantity).toFixed(
                2
              )}`
          )
          .join("\n\n")}
  
        *💰 Total Amount:* ${hotelData.currency}${result.totalPrice.toFixed(2)}
        `;
  
        const whatsappUrl = `https://api.whatsapp.com/send?phone=+918590115462&text=${encodeURIComponent(
          whatsappMsg
        )}`;
  
        clearOrder();
  
        // iOS-compatible way to open WhatsApp
        setTimeout(() => {
          const a = document.createElement("a");
          a.href = whatsappUrl;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }, 100);
  
      } else {
        toast.error("Failed to place order. Please try again.");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceOrder = () => {
    // If table number exists, we don't need an address
    if (tableNumber) {
      processOrder();
      return;
    }
    
    // Check if we have an address already
    if (!address) {
      // No address, show modal to collect
      setIsOpen(false)
      setTempAddress("");
      setShowAddressModal(true);
    } else {
      // Address exists, show modal to confirm or change
      setIsOpen(false)
      setTempAddress(address);
      setShowAddressModal(true);
    }
  };

  return (
    <>
      {/* Address Modal */}
      {showAddressModal && (
        <div
          className="fixed inset-0 z-[5000] flex items-center justify-center bg-black bg-opacity-50"
          style={{ backgroundColor: `${styles.backgroundColor}80` }}
        >
          <div
            className="w-full max-w-md p-6 rounded-lg shadow-lg"
            style={{
              backgroundColor: styles.backgroundColor,
              color: styles.color,
              border: `${styles.border.borderWidth} ${styles.border.borderStyle} ${styles.border.borderColor}`,
            }}
          >
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: styles.accent }}
            >
              {address ? "Confirm Delivery Address" : "Enter Delivery Address"}
            </h2>

            <div className="mb-6">
              <label
                htmlFor="deliveryAddress"
                className="block mb-2 text-sm font-medium"
              >
                {address 
                  ? "Please confirm or update your delivery address" 
                  : "Please enter your delivery address"}
              </label>
              <textarea
                id="deliveryAddress"
                value={tempAddress}
                onChange={(e) => setTempAddress(e.target.value)}
                className="w-full p-3 rounded-lg min-h-[100px]"
                style={{
                  backgroundColor: styles.backgroundColor,
                  color: styles.color,
                  border: `${styles.border.borderWidth} ${styles.border.borderStyle} ${styles.border.borderColor}`,
                  resize: "vertical", // Allows vertical resizing only
                }}
                placeholder="Enter your delivery address (House no, Building, Street, Area)"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowAddressModal(false)}
                className="w-1/2 py-3 px-4 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  color: styles.color,
                  border: `${styles.border.borderWidth} ${styles.border.borderStyle} ${styles.border.borderColor}`,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddressSubmit}
                className="w-1/2 py-3 px-4 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: styles.accent,
                  color: '#fff',
                }}
              >
                {address ? "Confirm & Place Order" : "Submit & Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        {/* Bottom bar */}
        <div
          style={{
            ...styles.border,
          }}
          className="fixed bottom-0 z-[40] bg-white text-black w-full px-[8%] py-6 rounded-t-[35px] bottom-bar-shadow flex items-center justify-between"
        >
          {order ? (
            <div className="flex items-center gap-4 w-full justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle
                  style={{ color: styles.accent }}
                  className="w-5 h-5"
                />
                <span className="font-medium">Order #{order.id.slice(0, 8)}</span>
              </div>
              <DrawerTrigger
                style={{
                  color: styles.accent,
                }}
                className="font-black"
              >
                View Order
              </DrawerTrigger>
            </div>
          ) : (
            <>
              <div>
                <div className="flex gap-2 items-center font-black text-xl">
                  <div>PRICE : </div>
                  <div style={{ color: styles.accent }}>
                    {hotelData.currency}
                    {totalPrice}
                  </div>
                </div>
                <div className="flex gap-2 items-center text-sm text-black/70">
                  <div>Items :</div>
                  <div>{items.length}</div>
                </div>
              </div>

              <DrawerTrigger
                style={{
                  color: styles.accent,
                }}
                className="font-black"
              >
                View Order
              </DrawerTrigger>
            </>
          )}
        </div>

        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>
              <HeadingWithAccent
                accent={styles.accent}
                className="font-black text-xl tracking-wide"
              >
                {order ? "Order Details" : "Your Order"}
              </HeadingWithAccent>
            </DrawerTitle>
            <DrawerDescription>
              {order
                ? `Order #${order.id.slice(0, 8)} - ${order.status}`
                : "Review your items before placing order"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 overflow-y-auto flex-1">
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
                {(order ? order.items : items).map((item) => (
                  <TableRow
                    key={`order-item-${item.id}`}
                    className="hover:bg-transparent border-b border-gray-100"
                  >
                    <TableCell className="font-medium py-3">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-right py-3">
                      {hotelData.currency}
                      {item.price}
                    </TableCell>
                    <TableCell className="text-center py-3">
                      {order ? (
                        item.quantity
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              if (item.quantity > 1) {
                                decreaseQuantity(item.id as string);
                              } else {
                                removeItem(item.id as string);
                              }
                            }}
                            className="w-6 h-6 rounded-full flex items-center justify-center border"
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => increaseQuantity(item.id as string)}
                            className="w-6 h-6 rounded-full flex items-center justify-center border"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-3">
                      {hotelData.currency}
                      {(item.price * item.quantity).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DrawerFooter className="border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold">Grand Total:</span>
              <span
                className="font-bold text-lg"
                style={{ color: styles.accent }}
              >
                {hotelData.currency}
                {(order ? order.totalPrice : totalPrice).toFixed(2)}
              </span>
            </div>

            {/* {!tableNumber && !order && (
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="font-medium">Delivery Address:</span>
                <span className="text-gray-600">
                  {address ? (
                    <span className="flex items-center">
                      <span className="truncate max-w-[200px]">{address}</span>
                      <button 
                        className="ml-2 text-xs underline"
                        style={{ color: styles.accent }}
                        onClick={() => {
                          setIsOpen(false);
                          setTempAddress(address);
                          setShowAddressModal(true);
                        }}
                      >
                        Change
                      </button>
                    </span>
                  ) : (
                    <span className="text-red-500">Not set</span>
                  )}
                </span>
              </div>
            )} */}

            {!order ? (
              <Button
                onClick={handlePlaceOrder}
                style={{ backgroundColor: styles.accent }}
                className="flex-1 active:brightness-75"
                disabled={items.length === 0 || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>
            ) : (
              <>
                <div className="w-full text-center text-sm text-gray-500">
                  Your order has been placed. Please wait for confirmation.
                </div>
              </>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default OrderDrawer;