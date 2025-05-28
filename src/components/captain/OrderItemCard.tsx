import { Order } from "@/store/orderStore";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Clock, CheckCircle, XCircle, Printer, Edit } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
// import BillTemplate from "@/components/captain/pos/BillTemplate";
// import KOTTemplate from "@/components/captain/pos/KOTTemplate";
import { Captain, useAuthStore } from "@/store/authStore";

interface OrderItemCardProps {
  order: Order;
  updateOrderStatus: (orderId: string, status: "completed" | "cancelled") => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  setOrder: (order: Order | null) => void;
  setEditOrderModalOpen: (open: boolean) => void;
  grantTotal: number;
  gstAmount: number;
  gstPercentage: number;
}

const OrderItemCard = ({
  order,
  updateOrderStatus,
  deleteOrder,
  setOrder,
  setEditOrderModalOpen,
  grantTotal,
  gstAmount,
  gstPercentage,
}: OrderItemCardProps) => {
  const { userData } = useAuthStore();
  const captainData = userData as Captain | null;
//   const billRef = useRef<HTMLDivElement>(null);
//   const kotRef = useRef<HTMLDivElement>(null);

//   const handlePrintBill = useReactToPrint({
//     content: () => billRef.current,
//   });

//   const handlePrintKOT = useReactToPrint({
//     content: () => kotRef.current,
//   });

  // Add console logging for grantTotal
  console.log("OrderItemCard grantTotal details:", {
    orderId: order.id,
    grantTotal,
    orderTotalPrice: order.totalPrice,
    extraCharges: order.extraCharges,
    extraChargesTotal: (order.extraCharges || []).reduce((sum, c) => sum + (c.amount || 0), 0),
    foodSubtotal: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    gstAmount,
    gstPercentage
  });

  // Add console logging for captain orders
  if (order.orderedby === "captain") {
    console.log("Captain order details:", {
      orderCaptain: order.captain,
      userDataCaptain: captainData,
      orderId: order.id,
      captainId: order.captain_id
    });
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "completed":
        return "text-green-600 bg-green-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4">
          <div className="flex-1">
            <div className="font-medium text-base sm:text-lg">
              {order.orderedby === "captain" 
                ? `Order #${order.id.split('-')[0].toUpperCase()}`
                : order.type === "delivery" 
                  ? "Delivery Order" 
                  : order.type === "table_order" 
                    ? "Table Order" 
                    : "POS Order"}
            </div>
            {order.orderedby === "captain" && (
              <div className="text-sm text-gray-600 mt-1">
                Captain: {order.captain?.name || "Unknown Captain"}
              </div>
            )}
            <div className="text-xs sm:text-sm text-gray-500 mt-1">
              {(() => {
                try {
                  if (!order.createdAt) {
                    console.error("Order missing createdAt:", {
                      orderId: order.id,
                      order: order
                    });
                    return "Date not available";
                  }

                  // Parse the ISO date string
                  const date = new Date(order.createdAt);
                  
                  // Validate the date
                  if (isNaN(date.getTime())) {
                    console.error("Invalid date value:", {
                      orderId: order.id,
                      createdAt: order.createdAt,
                      parsedDate: date.toString()
                    });
                    return "Invalid date";
                  }

                  // Format the date using date-fns
                  // PPp format will show: Apr 29, 2024, 7:38 PM
                  return format(date, "PPp");
                } catch (error) {
                  console.error("Error formatting date:", {
                    error,
                    orderId: order.id,
                    createdAt: order.createdAt,
                    errorMessage: error instanceof Error ? error.message : String(error)
                  });
                  return "Error formatting date";
                }
              })()}
            </div>
            <div className="mt-2 space-y-1">
              {order.items.map((item, index) => (
                <div key={index} className="text-xs sm:text-sm">
                  {item.quantity}x {item.name}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between sm:flex-col sm:text-right items-center sm:items-end gap-2 sm:gap-1">
            <div className="font-medium text-base sm:text-lg">
              ₹{grantTotal.toFixed(2)}
              
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(
                  order.status
                )}`}
              >
                {getStatusIcon(order.status)}
                <span className="hidden sm:inline">
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <span className="sm:hidden">
                  {order.status.charAt(0).toUpperCase()}
                </span>
              </div>
              {order.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateOrderStatus(order.id, "completed")}
                  >
                    Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateOrderStatus(order.id, "cancelled")}
                  >
                    Cancel
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setOrder(order);
                  setEditOrderModalOpen(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              {/* <Button size="sm" variant="ghost" onClick={handlePrintBill}>
                <Printer className="h-4 w-4" />
              </Button> */}
            </div>
          </div>
        </div>
      </Card>

      {/* Hidden templates for printing */}
      <div style={{ display: "none" }}>
        {/* <div ref={billRef}> */}
          {/* <BillTemplate
            order={order}
            userData={userData}
            gstAmount={gstAmount}
            gstPercentage={gstPercentage}
            grantTotal={grantTotal}
          /> */}
        </div>
        {/* <div ref={kotRef}>
          <KOTTemplate order={order} />
        </div> */}
      {/* </div> */}
    </>
  );
};

export default OrderItemCard; 