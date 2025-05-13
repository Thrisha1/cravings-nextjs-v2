import { HotelData } from "@/app/hotels/[...id]/page";
import { formatDate } from "@/lib/formatDate";
import { Partner, useAuthStore } from "@/store/authStore";
import { Order, OrderItem } from "@/store/orderStore";
import React from "react";
import { Button } from "../ui/button";
import { Edit, Printer } from "lucide-react";
import KOTTemplate from "./pos/KOTTemplate";
import BillTemplate from "./pos/BillTemplate";
import { useReactToPrint } from "react-to-print";

const OrderItemCard = ({
  order,
  gstPercentage,
  gstAmount,
  grantTotal,
  updateOrderStatus,
  setOrder,
  setEditOrderModalOpen,
}: {
  order: Order;
  gstPercentage: number;
  gstAmount: number;
  grantTotal: number;
  updateOrderStatus: (orderId: string, newStatus: "completed" | "cancelled") => Promise<void>;
  setOrder: (order: Order) => void;
  setEditOrderModalOpen: (open: boolean) => void;
}) => {
  
  const { userData } = useAuthStore();
  const billRef = React.useRef<HTMLDivElement>(null);
  const kotRef = React.useRef<HTMLDivElement>(null);

  const handlePrintBill = useReactToPrint({
    contentRef: billRef,
  });

  const handlePrintKOT = useReactToPrint({
    contentRef: kotRef,
  });

  return (
    <div className="border rounded-lg p-4 relative">
      {order.status === "pending" && (
        <span className="absolute -top-1 -left-1 h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">Order #{order.id.slice(0, 8)}</h3>
          <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded text-xs ${
              order.status === "completed"
                ? "bg-green-100 text-green-800"
                : order.status === "cancelled"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {order.status}
          </span>
        </div>
      </div>

      <div className="mt-2 flex justify-between">
        <div>
          {order.type === "table_order" && (
            <p className="text-sm">Table: {order.tableNumber || "N/A"}</p>
          )}
          <p className="text-sm">
            Customer:{" "}
            {order.user?.phone || order.phone
              ? `+91${order.user?.phone || order.phone}`
              : "Unknown"}
          </p>
          {order.type === "delivery" && (
            <p className="text-sm mt-3">
              Delivery Address: {order.deliveryAddress || "Unknown"}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 border-t pt-4">
        <h4 className="font-medium mb-2">Order Items</h4>
        <div className="space-y-2">
          {order.items?.length > 0 ? (
            order.items.map((item: OrderItem) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-gray-500 ml-2">x{item.quantity}</span>
                  {item.category && (
                    <span className="text-gray-400 text-xs ml-2 capitalize">
                      ({item.category.name.trim()})
                    </span>
                  )}
                </div>
                <span>
                  {(userData as HotelData)?.currency}
                  {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No items found</p>
          )}
        </div>

        {/* Extra Charges Section */}
        {(order?.extraCharges ?? []).length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Extra charges</h4>
            <div className="space-y-2">
              {order?.extraCharges?.map((charge, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{charge.name}</span>
                  <span>
                    {(userData as HotelData)?.currency}
                    {charge?.amount?.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="mt-4 space-y-1 text-sm">
          {gstPercentage > 0 && (
            <div className="flex justify-between">
              <span>GST ({gstPercentage}%):</span>
              <span>
                {(userData as HotelData)?.currency}
                {gstAmount.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between font-bold mt-2">
            <span>Grand Total:</span>
            <span>
              {(userData as HotelData)?.currency}
              {grantTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handlePrintKOT}>
            <Printer className="h-4 w-4 mr-2" />
            Print KOT
          </Button>
          <Button size="sm" variant="outline" onClick={handlePrintBill}>
            <Printer className="h-4 w-4 mr-2" />
            Print Bill
          </Button>

          {order.status === "pending" && (
            <>
              <Button
                size="sm"
                onClick={() => {
                  setOrder(order);
                  setEditOrderModalOpen(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Order
              </Button>
              <Button
                size="sm"
                onClick={() => updateOrderStatus(order.id, "completed")}
              >
                Mark Completed
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => updateOrderStatus(order.id, "cancelled")}
              >
                Cancel Order
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Hidden elements for printing */}
      <div className="hidden">
        {/* KOT Template */}
        <KOTTemplate ref={kotRef} order={order} />

        {/* Bill Template */}
        <BillTemplate
          ref={billRef}
          order={order}
          userData={userData as Partner}
          extraCharges={order.extraCharges || []}
        />
      </div>
    </div>
  );
};

export default OrderItemCard;
