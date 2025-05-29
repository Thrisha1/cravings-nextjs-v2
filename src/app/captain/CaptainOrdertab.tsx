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
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [sortedOrders, setSortedOrders] = useState<Order[]>([]);
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
          // First get the orders
          const ordersResponse = await fetchFromHasura(
            `query GetOrders($partner_id: uuid!) {
              orders(where: {
                partner_id: {_eq: $partner_id}, 
                orderedby: {_eq: "captain"},
                captain_id: {_is_null: false},
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
              partner_id: captainData.partner_id
            }
          );

          console.log("Raw orders response:", ordersResponse);

          if (!ordersResponse.orders) {
            console.log("No orders found in response");
            setOrders([]);
            setLoading(false);
            return;
          }

          // Get unique captain IDs
          const captainIds = [...new Set(ordersResponse.orders
            .map((order: any) => order.captain_id)
            .filter((id: string | null) => id !== null))];

          console.log("Found captain IDs:", captainIds);

          // Then get the captains
          const captainsResponse = await fetchFromHasura(
            `query GetCaptains($captain_ids: [uuid!]!) {
              captain(where: {id: {_in: $captain_ids}}) {
                id
                name
                email
              }
            }`,
            {
              captain_ids: captainIds
            }
          );

          console.log("Captains response:", captainsResponse);

          // Create a map of captain data
          const captainMap = new Map(
            captainsResponse.captain.map((captain: any) => [captain.id, captain])
          );

          // Map the orders with captain data
          const processedOrders = ordersResponse.orders.map((order: any) => {
            // If this is the current captain's order, use their data
            const currentCaptain = captainData as Captain;
            const isCurrentCaptainOrder = order.captain_id === currentCaptain.id;
            const orderCaptain = isCurrentCaptainOrder ? {
              id: currentCaptain.id,
              name: currentCaptain.name,
              email: currentCaptain.email
            } : order.captain_id ? captainMap.get(order.captain_id) : null;

            const processedOrder = {
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
              captain_id: order.captain_id,
              totalPrice: parseFloat(order.total_price) || 0
            };

            console.log("Processed order:", {
              id: processedOrder.id,
              totalPrice: processedOrder.totalPrice,
              items: processedOrder.items.map((item: OrderItem) => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity
              }))
            });

            return processedOrder;
          });

          console.log("Final processed orders:", processedOrders.map((order: Order) => ({
            id: order.id,
            totalPrice: order.totalPrice,
            itemsCount: order.items.length,
            items: order.items.map((item: OrderItem) => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity
            }))
          })));

          setOrders(processedOrders);
        } catch (error) {
          console.error("Error fetching orders:", error);
          toast.error("Failed to load orders");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchInitialOrders();
  }, [captainData?.partner_id]);

  // Sort orders
  useEffect(() => {
    const sortedOrders = [...orders].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    setSortedOrders(sortedOrders);
  }, [orders, sortOrder]);

  // Subscribe to new orders
  useEffect(() => {
    if (!captainData?.partner_id) return;

    console.log("Setting up subscription for partner:", captainData.partner_id);

    const unsubscribe = subscribeOrders((allOrders: any[]) => {
      // Filter out POS orders and only keep completed captain orders
      const captainOrders = allOrders.filter(order => 
        order.orderedby === "captain" && 
        order.captain_id !== null &&
        order.status === "completed"
      );

      if (!Array.isArray(captainOrders)) {
        console.error("Received invalid orders data:", captainOrders);
        setOrders([]);
        return;
      }

      // Keep existing orders and only add new ones
      const processNewOrders = async () => {
        const currentOrders = orders; // Get current orders
        const existingOrderIds = new Set(currentOrders.map(o => o.id));
        const newOrders = captainOrders.filter(order => !existingOrderIds.has(order.id));

        if (newOrders.length === 0) {
          console.log("No new orders in subscription update");
          return;
        }

        console.log("Processing new orders from subscription:", newOrders.map(o => o.id));

        // Fetch complete order details for new orders
        const processedNewOrders = await Promise.all(newOrders.map(async (order) => {
          try {
            // Fetch complete order details including order_items
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
              { orderId: order.id }
            );

            const orderData = orderDetails.orders_by_pk;
            if (!orderData) {
              console.error("No order details found for order:", order.id);
              return null;
            }

            const currentCaptain = captainData as Captain;
            const isCurrentCaptainOrder = orderData.captain_id === currentCaptain.id;
            
            const orderCaptain = isCurrentCaptainOrder ? {
              id: currentCaptain.id,
              name: currentCaptain.name,
              email: currentCaptain.email
            } : undefined;

            const processedOrder: Order = {
              id: orderData.id,
              status: orderData.status as "pending" | "completed" | "cancelled",
              createdAt: orderData.created_at,
              totalPrice: parseFloat(orderData.total_price) || 0,
              partnerId: orderData.partner_id,
              orderedby: orderData.orderedby,
              extraCharges: orderData.extra_charges || [],
              items: orderData.order_items.map((item: any) => ({
                id: item.menu.id,
                name: item.menu.name,
                price: parseFloat(item.menu.price) || 0,
                quantity: parseInt(item.quantity) || 0,
                category: item.menu.category.name
              })),
              captain: orderCaptain,
              captain_id: orderData.captain_id
            };

            console.log("Processed subscription order:", {
              id: processedOrder.id,
              totalPrice: processedOrder.totalPrice,
              items: processedOrder.items.map((item: OrderItem) => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity
              })),
              extraCharges: processedOrder.extraCharges
            });

            return processedOrder;
          } catch (error) {
            console.error("Error processing subscription order:", order.id, error);
            return null;
          }
        }));

        // Filter out any null orders (failed to process)
        const validNewOrders = processedNewOrders.filter((order): order is Order => order !== null);

        console.log("Adding new processed orders:", validNewOrders.map((o: Order) => ({
          id: o.id,
          totalPrice: o.totalPrice,
          itemsCount: o.items.length,
          extraChargesCount: (o.extraCharges || []).length
        })));

        setOrders([...orders, ...validNewOrders]);
      };

      processNewOrders();
    });

    return () => {
      console.log("Cleaning up subscription");
      unsubscribe();
    };
  }, [captainData?.partner_id, orders]);

  // Add logging to the orders state effect
  useEffect(() => {
    console.log("Orders state changed:", {
      ordersLength: orders.length,
      orders: orders.map(o => ({
        id: o.id,
        partnerId: o.partnerId,
        orderedby: o.orderedby
      }))
    });
  }, [orders]);

  // Add logging to the sorted orders effect
  useEffect(() => {
    console.log("Sorting orders:", {
      inputOrdersLength: orders.length,
      sortOrder
    });
    const sortedOrders = [...orders].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    console.log("Sorted orders result:", {
      outputOrdersLength: sortedOrders.length,
      orders: sortedOrders.map(o => ({
        id: o.id,
        createdAt: o.createdAt
      }))
    });

    setSortedOrders(sortedOrders);
  }, [orders, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "newest" ? "oldest" : "newest");
  };

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

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to update order status`);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-[calc(100vh-200px)]">
      
      {/* Fixed Header */}
      <div className="flex-none p-4 border-b">
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={toggleSortOrder}>
            {sortOrder === "newest" ? "Show Oldest First" : "Show Newest First"}
          </Button>
        </div>
      </div>

      {/* Scrollable Orders Section */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin h-8 w-8" />
          </div>
        ) : (
          <div className="space-y-4">
            {sortedOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No orders found
              </p>
            ) : (
              sortedOrders.map((order, index) => {
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
            )}
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