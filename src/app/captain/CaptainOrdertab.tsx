"use client";
import { Captain, Partner, useAuthStore } from "@/store/authStore";
import useOrderStore, { Order, OrderItem } from "@/store/orderStore";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { Howl } from "howler";
import { useRouter } from "next/navigation";
import { usePOSStore } from "@/store/posStore";
import {  getGstAmount } from "@/components/hotelDetail/OrderDrawer";
import { QrGroup } from "@/app/admin/qr-management/page";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { revalidateTag } from "@/app/actions/revalidate";
import OrderItemCard from "@/components/captain/OrderItemCard";
import { EditCaptainOrderModal } from "./pos/EditCaptainOrderModal";

const CaptainOrdersTab = () => {
  const router = useRouter();
  const { userData, features } = useAuthStore();
  const captainData = userData as Captain;
  const prevOrdersRef = useRef<Order[]>([]);
  const { subscribeOrders, partnerOrders, deleteOrder, fetchOrderOfPartner } = useOrderStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerData, setPartnerData] = useState<Partner | null>(null);
  const [newOrderAlert, setNewOrderAlert] = useState({
    show: false,
    count: 0,
  });
  const soundRef = useRef<Howl | null>(null);
  const {
    order,
    setOrder,
    editOrderModalOpen: isOpen,
    setEditOrderModalOpen,
  } = usePOSStore();

  // Helper function to sort orders
  const sortOrders = (ordersToSort: Order[]) => {
    return [...ordersToSort].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Always newest first
    });
  };

  // Helper function to process orders
  const processOrders = (rawOrders: any[]) => {
    return rawOrders.map((order: any) => {
      // Always use current captain data for captain orders
      const orderCaptain = {
        id: captainData.id,
        name: captainData.name,
        email: captainData.email
      };

      return {
        ...order,
        createdAt: order.created_at,
        extraCharges: order.extra_charges || [],
        items: order.order_items.map((item: any) => ({
          id: item.menu.id,
          name: item.menu.name,
          price: parseFloat(item.menu.price) || 0,
          quantity: parseInt(item.quantity) || 0,
          category: item.menu.category.name
        })),
        captain: orderCaptain,
        captain_id: captainData.id,
        totalPrice: parseFloat(order.total_price) || 0
      };
    });
  };

  // Fetch partner data
  useEffect(() => {
    const fetchPartnerData = async () => {
      if (captainData?.partner_id) {
        try {
          const response = await fetchFromHasura(
            `query GetPartnerById($partner_id: uuid!) {
              partners_by_pk(id: $partner_id) {
                id
                gst_percentage
                currency
                store_name
              }
            }`,
            {
              partner_id: captainData.partner_id
            }
          );
          if (response.partners_by_pk) {
            setPartnerData(response.partners_by_pk);
          }
        } catch (error) {
          console.error("Error fetching partner data:", error);
          toast.error("Failed to load partner data");
        }
      }
    };

    fetchPartnerData();
  }, [captainData?.partner_id]);

  // Initial fetch of orders
  useEffect(() => {
    const fetchInitialOrders = async () => {
      if (captainData?.partner_id) {
        try {
          const ordersResponse = await fetchFromHasura(
            `query GetOrders($partner_id: uuid!, $captain_id: uuid!) {
              orders(where: {
                partner_id: {_eq: $partner_id}, 
                orderedby: {_eq: "captain"},
                captain_id: {_eq: $captain_id},
                status: {_eq: "completed"}
              }) {
                id
                status
                created_at
                total_price
                partner_id
                orderedby
                captain_id
                extra_charges
                order_items {
                  id
                  quantity
                  menu {
                    id
                    name
                    price
                    category {
                      name
                    }
                  }
                }
              }
            }`,
            {
              partner_id: captainData.partner_id,
              captain_id: captainData.id
            }
          );

          if (!ordersResponse.orders) {
            setOrders([]);
            setLoading(false);
            return;
          }

          const processedOrders = processOrders(ordersResponse.orders);
          setOrders(sortOrders(processedOrders));
        } catch (error) {
          toast.error("Failed to load orders");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchInitialOrders();
  }, [captainData?.partner_id, captainData?.id]);

  // Subscribe to new orders
  useEffect(() => {
    if (!captainData?.partner_id || !captainData?.id) return;

    const unsubscribe = subscribeOrders((allOrders: any[]) => {
      // Only process orders for the current captain
      const captainOrders = allOrders.filter(order => 
        order.orderedby === "captain" && 
        order.captain_id === captainData.id &&
        order.status === "completed"
      );

      if (!Array.isArray(captainOrders)) {
        setOrders([]);
        return;
      }

      const processNewOrders = async () => {
        const currentOrders = orders;
        const existingOrderIds = new Set(currentOrders.map(o => o.id));
        const newOrders = captainOrders.filter(order => !existingOrderIds.has(order.id));

        if (newOrders.length === 0) return;

        const processedNewOrders = await Promise.all(newOrders.map(async (order) => {
          try {
            const orderDetails = await fetchFromHasura(
              `query GetOrderDetails($orderId: uuid!) {
                orders_by_pk(id: $orderId) {
                  id
                  status
                  created_at
                  total_price
                  partner_id
                  orderedby
                  captain_id
                  extra_charges
                  order_items {
                    id
                    quantity
                    menu {
                      id
                      name
                      price
                      category {
                        name
                      }
                    }
                  }
                }
              }`,
              { 
                orderId: order.id
              }
            );

            const orderData = orderDetails.orders_by_pk;
            if (!orderData || orderData.captain_id !== captainData.id) return null;

            return processOrders([orderData])[0];
          } catch (error) {
            return null;
          }
        }));

        const validNewOrders = processedNewOrders.filter((order): order is Order => order !== null);
        if (validNewOrders.length > 0) {
          setOrders(prevOrders => {
            // Create a map of existing orders by ID to prevent duplicates
            const orderMap = new Map(prevOrders.map(order => [order.id, order]));
            // Add new orders to the map
            validNewOrders.forEach(order => orderMap.set(order.id, order));
            // Convert map back to array and sort
            return sortOrders(Array.from(orderMap.values()));
          });
        }
      };

      processNewOrders();
    });

    return () => unsubscribe();
  }, [captainData?.partner_id, captainData?.id]);

  const updateOrderStatus = async (
    orderId: string,
    newStatus: "completed" | "cancelled"
  ) => {
    try {
      const response = await fetchFromHasura(
        `mutation UpdateOrderStatus($orderId: uuid!, $status: String!) {
          update_orders_by_pk(pk_columns: {id: $orderId}, _set: {status: $status}) {
            id
            status
          }
        }`,
        { orderId, status: newStatus }
      );

      if (response.errors) throw new Error(response.errors[0].message);

      if (newStatus === "completed") {
        const order = orders.find((o) => o.id === orderId);
        if (order) {
          for (const item of order.items) {
            if (item.stocks?.[0]?.id) {
              await fetchFromHasura(
                `mutation DecreaseStockQuantity($stockId: uuid!, $quantity: numeric!) {
                  update_stocks_by_pk(
                    pk_columns: {id: $stockId},
                    _inc: {stock_quantity: $quantity}
                  ) {
                    id
                    stock_quantity
                  }
                }`,
                {
                  stockId: item.stocks?.[0]?.id,
                  quantity: -item.quantity,
                }
              );
            }
          }
          revalidateTag(captainData.partner_id);
        }
      }

      setOrders(prevOrders => 
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      toast.error(`Failed to update order status`);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-[calc(100vh-200px)]">
      
      {/* Fixed Header */}
      <div className="flex-none p-4 border-b">
      </div>

      {/* Scrollable Orders Section */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin h-8 w-8" />
          </div>
        ) : (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No orders found
              </p>
            ) :
              orders.map((order, index) => {
                const gstPercentage = partnerData?.gst_percentage || 0;
                const foodSubtotal = order.items.reduce((sum, item) => {
                  return sum + item.price * item.quantity;
                }, 0);

                const gstAmount = getGstAmount(foodSubtotal, gstPercentage);
                const totalPriceWithGst = foodSubtotal + gstAmount;

                // Calculate extra charges total
                const extraChargesTotal = (order.extraCharges || []).reduce(
                  (acc, charge) => acc + (charge.amount || 0),
                  0
                );

                // Use the order's totalPrice if it exists and matches our calculation
                // Otherwise use our calculated total
                const calculatedTotal = totalPriceWithGst + extraChargesTotal;
                const grantTotal = order.totalPrice === calculatedTotal ? 
                  order.totalPrice : 
                  calculatedTotal;

                console.log("Order display details:", {
                  id: order.id,
                  orderTotalPrice: order.totalPrice,
                  calculatedTotal,
                  foodSubtotal,
                  gstAmount,
                  extraChargesTotal,
                  extraCharges: order.extraCharges,
                  grantTotal,
                  usingOrderTotal: order.totalPrice === calculatedTotal
                });

                return (
                  <OrderItemCard
                    key={order.id + "-" + index}
                    deleteOrder={async (id) => { await deleteOrder(id); }}
                    grantTotal={grantTotal}
                    gstAmount={gstAmount}
                    gstPercentage={gstPercentage}
                    order={order}
                    setEditOrderModalOpen={setEditOrderModalOpen}
                    setOrder={setOrder}
                    updateOrderStatus={updateOrderStatus}
                  />
                );
              })
            }
          </div>
        )}
      </div>

      {/* New Order Alert Dialog */}
      <AlertDialog
        open={newOrderAlert.show}
        onOpenChange={(open) =>
          setNewOrderAlert((prev) => ({ ...prev, show: open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>New Orders Received!</AlertDialogTitle>
            <AlertDialogDescription>
              You have {newOrderAlert.count} new pending order(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setNewOrderAlert({
                  show: false,
                  count: 0,
                });
              }}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Order Modal */}
      <EditCaptainOrderModal />
    </div>
  );
};

export default CaptainOrdersTab;