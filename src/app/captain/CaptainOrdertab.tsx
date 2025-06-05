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
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
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
        tableNumber: order.table_number,
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
          // First, get total count of orders
          const countResponse = await fetchFromHasura(
            `query GetOrdersCount($partner_id: uuid!, $captain_id: uuid!) {
              orders_aggregate(where: {
                partner_id: {_eq: $partner_id}, 
                orderedby: {_eq: "captain"},
                captain_id: {_eq: $captain_id},
                status: {_eq: "completed"}
              }) {
                aggregate {
                  count
                }
              }
            }`,
            {
              partner_id: captainData.partner_id,
              captain_id: captainData.id
            }
          );

          const totalCount = countResponse.orders_aggregate.aggregate.count;
          setTotalOrders(totalCount);

          // Then fetch first page of orders
          const ordersResponse = await fetchFromHasura(
            `query GetOrders($partner_id: uuid!, $captain_id: uuid!, $limit: Int!, $offset: Int!) {
              orders(where: {
                partner_id: {_eq: $partner_id}, 
                orderedby: {_eq: "captain"},
                captain_id: {_eq: $captain_id},
                status: {_eq: "completed"}
              }, order_by: {created_at: desc}, limit: $limit, offset: $offset) {
                id
                status
                created_at
                total_price
                partner_id
                orderedby
                captain_id
                table_number
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
              captain_id: captainData.id,
              limit: ordersPerPage,
              offset: 0
            }
          );

          if (!ordersResponse.orders) {
            setOrders([]);
            setLoading(false);
            return;
          }

          const processedOrders = processOrders(ordersResponse.orders);
          setOrders(processedOrders);
          setHasMoreOrders(processedOrders.length === ordersPerPage);
        } catch (error) {
          toast.error("Failed to load orders");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchInitialOrders();
  }, [captainData?.partner_id, captainData?.id]);

  const fetchNextPage = async () => {
    if (!captainData?.partner_id || !hasMoreOrders) return;

    try {
      setLoading(true);
      const offset = currentPage * ordersPerPage;
      
      const ordersResponse = await fetchFromHasura(
        `query GetOrders($partner_id: uuid!, $captain_id: uuid!, $limit: Int!, $offset: Int!) {
          orders(where: {
            partner_id: {_eq: $partner_id}, 
            orderedby: {_eq: "captain"},
            captain_id: {_eq: $captain_id},
            status: {_eq: "completed"}
          }, order_by: {created_at: desc}, limit: $limit, offset: $offset) {
            id
            status
            created_at
            total_price
            partner_id
            orderedby
            captain_id
            table_number
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
          captain_id: captainData.id,
          limit: ordersPerPage,
          offset: offset
        }
      );

      if (!ordersResponse.orders) return;

      const processedOrders = processOrders(ordersResponse.orders);
      setOrders(prevOrders => [...prevOrders, ...processedOrders]);
      setHasMoreOrders(processedOrders.length === ordersPerPage);
      setCurrentPage(prev => prev + 1);
    } catch (error) {
      toast.error("Failed to load more orders");
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (hasMoreOrders) {
      fetchNextPage();
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      // Calculate the start index for the previous page
      const startIndex = (currentPage - 2) * ordersPerPage;
      // Show the previous page's orders
      setOrders(prevOrders => prevOrders.slice(startIndex, startIndex + ordersPerPage));
    }
  };

  // Calculate total pages based on total orders count
  const totalPages = Math.ceil(totalOrders / ordersPerPage);

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

                // console.log("Order display details:", {
                //   id: order.id,
                //   orderTotalPrice: order.totalPrice,
                //   calculatedTotal,
                //   foodSubtotal,
                //   gstAmount,
                //   extraChargesTotal,
                //   extraCharges: order.extraCharges,
                //   grantTotal,
                //   usingOrderTotal: order.totalPrice === calculatedTotal
                // });

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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex-none p-4 border-t flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={!hasMoreOrders}
          >
            Next
          </Button>
        </div>
      )}

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