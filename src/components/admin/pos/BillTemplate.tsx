import { Partner } from "@/store/authStore";
import { Order } from "@/store/orderStore";
import React from "react";

const BillTemplate = ({
  ref,
  userData,
  order,
}: {
  ref: React.RefObject<HTMLDivElement | null>;
  userData: Partner;
  order: Order;
}) => {
  if (!order) return null;

  const currency = (userData as Partner)?.currency || "$";
  const gstPercentage = (userData as Partner)?.gst_percentage || 0;

  const calculateGst = (amount: number) => {
    return (amount * gstPercentage) / 100;
  };

  const gstAmount = calculateGst(order.totalPrice);
  const grandTotal = order.totalPrice + gstAmount;

  return (
    <div ref={ref} className="p-4 bill-template">
      <h2 className="text-xl font-bold text-center">
        {(userData as Partner)?.store_name || "Restaurant"}
      </h2>
      <p className="text-center text-sm">
        {(userData as Partner)?.district || "Address not specified"}
      </p>
      <div className="border-b border-black my-2"></div>
      <div className="flex justify-between mb-2">
        <span className="font-medium">Order #:</span>
        <span>{order.id}</span>
      </div>
      {/* <div className="flex justify-between mb-2">
                <span className="font-medium">Table:</span>
                <span>{order.type || "Takeaway"}</span>
              </div> */}
      <div className="flex justify-between mb-4">
        <span className="font-medium">Date:</span>
        <span>{new Date(order.createdAt).toLocaleString()}</span>
      </div>
      <div className="border-b border-black my-2"></div>
      <h3 className="font-bold mb-2">Items:</h3>
      <ul className="space-y-2">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between">
            <span>
              {item.quantity}x {item.name}
            </span>
            <span>
              {currency}
              {(item.price * item.quantity).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
      <div className="border-b border-black my-2"></div>
      <div className="space-y-1 mt-4">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>
            {currency}
            {order.totalPrice.toFixed(2)}
          </span>
        </div>
        {gstPercentage > 0 && (
          <div className="flex justify-between">
            <span>GST ({gstPercentage}%):</span>
            <span>
              {currency}
              {gstAmount.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg mt-2">
          <span>Grand Total:</span>
          <span>
            {currency}
            {grandTotal.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="text-center text-sm mt-6">
        Thank you for dining with us!
      </div>
    </div>
  );
};

export default BillTemplate;
