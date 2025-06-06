import { HotelData } from "@/app/hotels/[...id]/page";
import { formatDate } from "@/lib/formatDate";
import { Partner, useAuthStore } from "@/store/authStore";
import useOrderStore, { Order, OrderItem } from "@/store/orderStore";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Edit, Printer, Trash2 } from "lucide-react";
import KOTTemplate from "./pos/KOTTemplate";
import BillTemplate from "./pos/BillTemplate";
import { useReactToPrint } from "react-to-print";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import StatusHistoryTimeline from "../StatusHistoryTimeline";
import {
  defaultStatusHistory,
  OrderStatusHistoryTypes,
  setStatusHistory,
  toStatusDisplayFormat,
} from "@/lib/statusHistory";
import AddNoteComponent from "./AddNoteComponent";
import { useRouter } from "next/navigation";
import Link from "next/link";

const OrderItemCard = ({
  order: initialOrder,
  gstPercentage,
  gstAmount,
  grantTotal,
  updateOrderStatus,
  setOrder,
  setEditOrderModalOpen,
  deleteOrder,
}: {
  order: Order;
  gstPercentage: number;
  gstAmount: number;
  grantTotal: number;
  updateOrderStatus: (status: "completed" | "cancelled" | "pending") => void;
  setOrder: (order: Order) => void;
  setEditOrderModalOpen: (open: boolean) => void;
  deleteOrder: (orderId: string) => Promise<boolean>;
}) => {
  const [localOrder, setLocalOrder] = useState<Order>(initialOrder);
  const { userData } = useAuthStore();
  const billRef = React.useRef<HTMLDivElement>(null);
  const kotRef = React.useRef<HTMLDivElement>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deliveryLocation, setDeliveryLocation] = React.useState<string | null>(
    null
  );
  const { updateOrderStatusHistory } = useOrderStore();
  const router = useRouter();

  // Sync localOrder with prop changes
  useEffect(() => {
    setLocalOrder(initialOrder);
  }, [initialOrder]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      toast.loading("Deleting order...");
      const success = await deleteOrder(localOrder.id);
      if (success) {
        toast.dismiss();
        toast.success("Order deleted successfully");
        setIsDeleteDialogOpen(false);
      } else {
        toast.dismiss();
        toast.error("Failed to delete order");
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error deleting order:", error);
      toast.error("An error occurred while deleting the order");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (localOrder.type === "delivery") {
      const location = localOrder.delivery_location;
      if (location) {
        setDeliveryLocation(
          `https://www.google.com/maps/place/${localOrder.delivery_location?.coordinates[1]},${localOrder.delivery_location?.coordinates[0]}`
        );
      } else {
        setDeliveryLocation(null);
      }
    } else {
      setDeliveryLocation(null);
    }
  }, [localOrder]);

  // Get the current status from status history
  const statusHistory = localOrder.status_history || defaultStatusHistory;
  const displayStatus = toStatusDisplayFormat(statusHistory);
  const isAccepted = displayStatus.accepted?.isCompleted;
  const isDispatched = displayStatus.dispatched?.isCompleted;

  // Optimistic update for status history
  const optimisticUpdateStatus = async (
    status: OrderStatusHistoryTypes,
    callback?: (orders: Order[]) => void
  ) => {
    // Create optimistic update
    const optimisticHistory = setStatusHistory(statusHistory, status, {
      isCompleted: true,
      completedAt: new Date().toISOString(),
    });

    const optimisticOrder = {
      ...localOrder,
      status_history: optimisticHistory,
    };

    setLocalOrder(optimisticOrder);
    if (callback) callback([optimisticOrder]);

    try {
      // Perform actual update
      await updateOrderStatusHistory(localOrder.id, status, [localOrder]);
    } catch (error) {
      console.error("Error updating status:", error);
      // Revert on error
      setLocalOrder(initialOrder);
      if (callback) callback([initialOrder]);
      toast.error("Failed to update order status");
    }
  };

  return (
    <div className="border rounded-lg p-4 relative shadow-sm">
      {localOrder.status === "pending" && (
        <span className="absolute -top-1 -left-1 h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              order and all its associated items from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div>
          <h3 className="font-medium">Order #{localOrder.id.slice(0, 8)}</h3>
          <p className="text-sm text-gray-500">
            {formatDate(localOrder.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded text-xs ${
              localOrder.status === "completed"
                ? "bg-green-100 text-green-800"
                : localOrder.status === "cancelled"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {localOrder.status}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {localOrder.type === "table_order" && (
            <p className="text-sm">Table: {localOrder.tableNumber || "N/A"}</p>
          )}
          <p className="text-sm">
            Customer:{" "}
            {localOrder.user?.phone || localOrder.phone
              ? `+91${localOrder.user?.phone || localOrder.phone}`
              : "Unknown"}
          </p>
          {localOrder.type === "delivery" && (
            <div className="flex flex-col gap-3 mt-2">
              <p className="text-sm">
                Delivery Address: {localOrder.deliveryAddress || "Unknown"}
              </p>
              {deliveryLocation && (
                <a
                  href={`${deliveryLocation}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline py-2 px-3 bg-orange-500 text-white rounded-md w-max"
                >
                  View Location
                </a>
              )}
              <AddNoteComponent setOrder={setLocalOrder} order={localOrder} />
              {localOrder.notes && (
                <p className="text-sm mt-2">
                  <span className="font-medium text-orange-500">Note: </span>
                  {localOrder.notes}
                </p>
              )}
            </div>
          )}
        </div>

        {localOrder?.type !== "pos" && (
          <div className="mt-2 md:mt-0">
            <StatusHistoryTimeline
              status_history={localOrder?.status_history || defaultStatusHistory}
            />
          </div>
        )}
      </div>

      <div className="mt-4 border-t pt-4">
        <h4 className="font-medium mb-2">Order Items</h4>
        <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
          {localOrder.items?.length > 0 ? (
            localOrder.items.map((item: OrderItem) => (
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
                  {(item.price * item.quantity || 0)?.toFixed(2)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No items found</p>
          )}
        </div>

        {/* Extra Charges Section */}
        {(localOrder?.extraCharges ?? []).length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Extra charges</h4>
            <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
              {localOrder?.extraCharges?.map((charge, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{charge.name}</span>
                  <span>
                    {" "}
                    {(userData as HotelData)?.currency}{" "}
                    {charge?.amount?.toFixed(2)}{" "}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="mt-4 space-y-1 text-sm bg-gray-50 p-3 rounded-lg">
          {gstPercentage > 0 && (
            <div className="flex justify-between">
              <span>GST ({gstPercentage}%):</span>
              <span>
                {(userData as HotelData)?.currency}
                {gstAmount?.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between font-bold mt-2">
            <span>Grand Total:</span>
            <span>
              {(userData as HotelData)?.currency}
              {grantTotal?.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <Link href={`/kot/${localOrder.id}`} target="_blank" passHref>
              <Button size="sm" variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print KOT
              </Button>
            </Link>
            <Link target="_blank" href={`/bill/${localOrder.id}`} passHref>
              <Button size="sm" variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print Bill
              </Button>
            </Link>

            {localOrder.status === "pending" && (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    setOrder(localOrder);
                    setEditOrderModalOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Order
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Order
                </Button>
              </>
            )}
          </div>

          {localOrder.status === "pending" && (
            <div className="flex gap-2 flex-wrap mt-3 sm:mt-0 w-full sm:w-auto">
              {!isAccepted && (
                <Button
                  size="sm"
                  className="bg-green-600 text-white flex-1 sm:flex-auto"
                  onClick={async () => {
                    await optimisticUpdateStatus("accepted", (orders) => {
                      setOrder(orders[0]);
                    });
                  }}
                >
                  Accept Order
                </Button>
              )}

              {isAccepted && !isDispatched && (
                <Button
                  size="sm"
                  className="bg-blue-600 text-white flex-1 sm:flex-auto"
                  onClick={async () => {
                    await optimisticUpdateStatus("dispatched", (orders) => {
                      setOrder(orders[0]);
                    });
                  }}
                >
                  Dispatch Order
                </Button>
              )}

              {isDispatched && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-auto"
                    onClick={async () => {
                      // Rollback to accepted status
                      const updatedHistory = setStatusHistory(
                        statusHistory,
                        "dispatched",
                        { isCompleted: false, completedAt: null }
                      );
                      const updatedOrder = {
                        ...localOrder,
                        status_history: updatedHistory,
                      };
                      setLocalOrder(updatedOrder);
                      setOrder(updatedOrder);

                      try {
                        await updateOrderStatusHistory(
                          localOrder.id,
                          "accepted",
                          [localOrder]
                        );
                      } catch (error) {
                        console.error("Error rolling back status:", error);
                        setLocalOrder(initialOrder);
                        setOrder(initialOrder);
                        toast.error("Failed to update order status");
                      }
                    }}
                  >
                    Cancel Dispatch
                  </Button>
                  <Button
                    size="sm"
                    className="bg-purple-600 text-white flex-1 sm:flex-auto"
                    onClick={async () => {
                      // First update status history to completed
                      await optimisticUpdateStatus("completed", (orders) => {
                        setOrder(orders[0]);
                      });
                    }}
                  >
                    Mark as Delivered
                  </Button>
                </>
              )}

              <Button
                size="sm"
                variant="destructive"
                className="flex-1 sm:flex-auto"
                onClick={() => updateOrderStatus("cancelled")}
              >
                Cancel Order
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Hidden elements for printing */}
      <div className="hidden">
        <KOTTemplate ref={kotRef} order={localOrder} />
        <BillTemplate
          key={`${localOrder.id}-bill-${new Date().getTime()}`}
          ref={billRef}
          order={localOrder}
          userData={userData as Partner}
          extraCharges={localOrder.extraCharges || []}
        />
      </div>
    </div>
  );
};

export default OrderItemCard;
