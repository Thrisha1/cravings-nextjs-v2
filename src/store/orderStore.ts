import { HotelData, HotelDataMenus } from "@/app/hotels/[...id]/page";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore, Captain } from "./authStore";
import {
  createOrderItemsMutation,
  createOrderMutation,
  subscriptionQuery,
  userSubscriptionQuery,
} from "@/api/orders";
import { toast } from "sonner";
import { subscribeToHasura } from "@/lib/hasuraSubscription";
import { QrGroup } from "@/app/admin/qr-management/page";
import { revalidateTag } from "@/app/actions/revalidate";
import { usePOSStore } from "./posStore";
import { v4 as uuidv4 } from "uuid";
import {
  defaultStatusHistory,
  OrderStatusDisplay,
  OrderStatusHistoryTypes,
  OrderStatusStorage,
  setStatusHistory,
  toStatusDisplayFormat,
} from "@/lib/statusHistory";
import { sendOrderNotification } from "@/app/actions/sendOrderNotification";

export interface OrderItem extends HotelDataMenus {
  id: string;
  quantity: number;
}

export interface DeliveryRules {
  delivery_radius: number;
  first_km_range: {
    km: number;
    rate: number;
  };
  is_fixed_rate: boolean;
}

export interface DeliveryRules {
  delivery_radius: number;
  first_km_range: {
    km: number;
    rate: number;
  };
  is_fixed_rate: boolean;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalPrice: number;
  createdAt: string;
  notes?: string | null;
  tableNumber?: number | null;
  qrId?: string | null;
  status: "pending" | "completed" | "cancelled";
  partnerId: string;
  status_history?: OrderStatusStorage;
  partner?: {
    gst_percentage?: number;
    currency?: string;
    store_name?: string;
  };
  phone?: string | null;
  userId?: string;
  user?: {
    phone?: string;
    name?: string;
    email?: string;
  };
  type?: "table_order" | "delivery" | "pos";
  deliveryAddress?: string | null;
  gstIncluded?: number;
  orderedby?: string;
  delivery_charge?: number | null;
  delivery_location?: {
    type: string;
    coordinates: [number, number];
  };
  order_number?: string;
  captain_id?: string;
  captain?: {
    id: string;
    name: string;
    phone?: string;
    email: string;
  };
  extraCharges?:
    | {
        name: string;
        amount: number;
        charge_type?: string;
        id?: string;
      }[]
    | null;
}

export interface DeliveryInfo {
  distance: number;
  cost: number;
  ratePerKm: number;
  isOutOfRange: boolean;
}

export interface DeliveryInfo {
  distance: number;
  cost: number;
  ratePerKm: number;
  isOutOfRange: boolean;
}

interface HotelOrderState {
  items: OrderItem[];
  totalPrice: number;
  order: Order | null;
  orderId: string | null;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
}

interface OrderState {
  hotelId: string | null;
  hotelOrders: Record<string, HotelOrderState>;
  userAddress: string | null;
  open_auth_modal: boolean;
  open_drawer_bottom: boolean;
  order: Order | null;
  items: OrderItem[] | null;
  orderId: string | null;
  totalPrice: number | null;
  open_order_drawer: boolean;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  deliveryInfo: DeliveryInfo | null;
  deliveryCost: number | null;
  open_place_order_modal: boolean;
  setOpenPlaceOrderModal: (open: boolean) => void;

  setHotelId: (id: string) => void;
  addItem: (item: HotelDataMenus) => void;
  removeItem: (itemId: string) => void;
  increaseQuantity: (itemId: string) => void;
  decreaseQuantity: (itemId: string) => void;
  clearOrder: () => void;
  placeOrder: (
    hotelData: HotelData,
    tableNumber?: number,
    qrId?: string,
    gstIncluded?: number,
    extraCharges?:
      | {
          name: string;
          amount: number;
          charge_type?: string;
        }[]
      | null,
    deliveryCharge?: number
  ) => Promise<Order | null>;
  getCurrentOrder: () => HotelOrderState;
  fetchOrderOfPartner: (partnerId: string) => Promise<Order[] | null>;
  setOpenAuthModal: (open: boolean) => void;
  genOrderId: () => string;
  setUserAddress: (address: string) => void;
  setUserCoordinates: (coords: { lat: number; lng: number }) => void;
  subscribeOrders: (callback?: (orders: Order[]) => void) => () => void;
  partnerOrders: Order[];
  userOrders: Order[];
  subscribeUserOrders: (callback?: (orders: Order[]) => void) => () => void;
  deleteOrder: (orderId: string) => Promise<boolean>;
  setOpenOrderDrawer: (open: boolean) => void;
  setDeliveryInfo: (info: DeliveryInfo | null) => void;
  setDeliveryCost: (cost: number | null) => void;
  setOpenDrawerBottom: (open: boolean) => void;
  updateOrderStatus: (
    orders: Order[],
    orderId: string,
    newStatus: "completed" | "cancelled" | "pending",
    setOrders: (orders: Order[]) => void
  ) => Promise<void>;
  updateOrderStatusHistory: (
    orderId: string,
    status: OrderStatusHistoryTypes,
    orders: Order[]
  ) => Promise<void>;
}

const useOrderStore = create(
  persist<OrderState>(
    (set, get) => ({
      hotelId: null,
      hotelOrders: {},
      userAddress: null,
      open_auth_modal: false,
      order: null,
      items: [],
      orderId: null,
      partnerOrders: [],
      totalPrice: 0,
      userOrders: [],
      open_order_drawer: false,
      deliveryInfo: null,
      deliveryCost: null,
      coordinates: null,
      open_drawer_bottom: false,
      open_place_order_modal: false,

      updateOrderStatusHistory: async (
        orderId: string,
        status: OrderStatusHistoryTypes,
        orders: Order[]
      ) => {
        try {
          const order = orders.find((o) => o.id === orderId);
          if (!order) {
            throw new Error("Order not found");
          }

          const currentStatusHistory =
            order.status_history || defaultStatusHistory;

          const updatedStatusHistory = setStatusHistory(
            currentStatusHistory,
            status,
            { isCompleted: true }
          );

          const defaultQuery = `mutation UpdateOrderStatusHistory($orderId: uuid!, $statusHistory: json!) {
              update_orders_by_pk(
                pk_columns: {id: $orderId},
                _set: {status_history: $statusHistory}
              ) {
                id
                status_history
              }
            }`;

          const updateStatusAndStatusHistoryQuery = `mutation UpdateOrderStatusHistory($orderId: uuid!, $statusHistory: json!) {
              update_orders_by_pk(
                pk_columns: {id: $orderId},
                _set: {status_history: $statusHistory , status: "completed"}
              ) {
                id
                status_history
                status
              }
            }`;

          const response = await fetchFromHasura(
            status === "completed"
              ? updateStatusAndStatusHistoryQuery
              : defaultQuery,
            {
              orderId,
              statusHistory: updatedStatusHistory,
            }
          );

          if (response.errors) {
            throw new Error(
              response.errors[0]?.message || "Failed to update status history"
            );
          }

          const updatedOrders = orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status_history: updatedStatusHistory,
                }
              : o
          );

          toast.success(`Order status updated`);
        } catch (error) {
          console.error(error);
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to update order status history"
          );
        }
      },

      updateOrderStatus: async (
        orders: Order[],
        orderId: string,
        newStatus: "completed" | "cancelled" | "pending",
        setOrders: (orders: Order[]) => void
      ) => {
        const userData = useAuthStore.getState().userData;

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
              revalidateTag(userData?.id as string);
            }
          }

          const updatedOrders = orders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          );

          setOrders(updatedOrders);
          toast.success(`Order marked as ${newStatus}`);
        } catch (error) {
          console.error(error);
          toast.error(`Failed to update order status`);
        }
      },

      setOpenPlaceOrderModal: (open) => set({ open_place_order_modal: open }),

      setOpenDrawerBottom: (open) => set({ open_drawer_bottom: open }),

      setUserCoordinates: (coords) => {
        set({ coordinates: coords });
      },

      subscribeUserOrders: (callback) => {
        const userId = useAuthStore.getState().userData?.id;

        const unsubscribe = subscribeToHasura({
          query: userSubscriptionQuery,
          variables: { user_id: userId },
          onNext: (data) => {
            const allOrders = data.data?.orders.map((order: any) => ({
              id: order.id,
              totalPrice: order.total_price,
              createdAt: order.created_at,
              tableNumber: order.table_number,
              qrId: order.qr_id,
              status: order.status,
              status_history: order.status_history,
              type: order.type,
              phone: order.phone,
              deliveryAddress: order.delivery_address,
              delivery_location: order.delivery_location,
              partnerId: order.partner_id,
              partner: order.partner,
              notes: order.notes || null,
              userId: order.user_id,
              gstIncluded: order.gst_included,
              extraCharges: order.extra_charges || [], // Handle null case
              delivery_charge: order.delivery_charge, // Include delivery_charge
              user: order.user,
              items: order.order_items.map((i: any) => ({
                id: i.item.id,
                quantity: i.quantity,
                name: i.item?.name || "Unknown",
                price: i.item?.offers?.[0]?.offer_price || i.item?.price || 0,
                category: i.menu?.category,
              })),
            }));


            if (allOrders) {
              set({ userOrders: allOrders });
              if (callback) callback(allOrders);
            }
          },
          onError: (error) => {
            console.error("Subscription error:", error);
          },
        });

        return unsubscribe;
      },

      subscribeOrders: (callback) => {
        const userData = useAuthStore.getState().userData;

        if (!userData?.id || !userData?.role) {
          console.log(
            "User data not available yet, will retry subscription setup"
          );
          const retryInterval = setInterval(() => {
            const retryUserData = useAuthStore.getState().userData;
            if (retryUserData?.id && retryUserData?.role) {
              clearInterval(retryInterval);
              const unsubscribe = useOrderStore
                .getState()
                .subscribeOrders(callback);
              return () => {
                clearInterval(retryInterval);
                unsubscribe();
              };
            }
          }, 1000);

          return () => {
            clearInterval(retryInterval);
          };
        }

        const partnerId =
          userData?.role === "captain"
            ? (userData as Captain).partner_id
            : userData?.id;

        if (!partnerId) {
          console.error("No partner ID available for subscription");
          return () => {};
        }

        let subscriptionActive = true;
        const unsubscribe = subscribeToHasura({
          query: subscriptionQuery,
          variables: {
            partner_id: partnerId,
          },
          onNext: (data) => {
            if (!subscriptionActive) {
              console.log("Subscription no longer active, ignoring data");
              return;
            }

            if (!data?.data?.orders) {
              console.log("No orders data in subscription response");
              if (callback) callback([]);
              return;
            }

            const allOrders = data.data.orders
              .map((order: any) => {
                // Ensure captain data is properly included
                const captainData = order.captainid ? {
                  id: order.captainid.id,
                  name: order.captainid.name,
                  email: order.captainid.email
                } : null;

                return {
                  id: order.id,
                  totalPrice: order.total_price,
                  createdAt: order.created_at,
                  tableNumber: order.table_number,
                  qrId: order.qr_id,
                  status: order.status,
                  type: order.type,
                  phone: order.phone,
                  deliveryAddress: order.delivery_address,
                  partnerId: order.partner_id,
                  gstIncluded: order.gst_included,
                  status_history: order.status_history,
                  extraCharges: order.extra_charges,
                  userId: order.user_id,
                  orderedby: order.orderedby,
                  captain_id: order.captain_id,
                  captain: captainData,  // Use the properly structured captain data
                  user: order.user,
                  items: order.order_items?.map((i: any) => ({
                    id: i.menu?.id,
                    quantity: i.quantity,
                    name: i.menu?.name || "Unknown",
                    price: i.menu?.offers?.[0]?.offer_price || i.menu?.price || 0,
                    category: i.menu?.category?.name,
                    description: i.menu?.description || "",
                    image_url: i.menu?.image_url || "",
                    is_top: i.menu?.is_top || false,
                    is_available: i.menu?.is_available || false,
                    priority: i.menu?.priority || 0,
                    offers: i.menu?.offers || [],
                  })) || [],
                };
              })
              .filter((order: any): order is NonNullable<typeof order> => order !== null);

            set({ partnerOrders: allOrders });
            if (callback) callback(allOrders);
          },
          onError: (error) => {
            console.error("Subscription error in order store:", {
              error,
              message: error instanceof Error ? error.message : String(error),
              timestamp: new Date().toISOString(),
              userData: {
                id: userData?.id,
                role: userData?.role,
                partnerId:
                  userData?.role === "captain"
                    ? (userData as Captain).partner_id
                    : userData?.id,
              },
            });

            // If we get a connection error, try to resubscribe after a delay
            if (
              error.message.includes("connection") ||
              error.message.includes("network")
            ) {
              console.log(
                "Connection error detected, will attempt to resubscribe"
              );
              setTimeout(() => {
                if (subscriptionActive) {
                  console.log("Attempting to resubscribe...");
                  const newUnsubscribe = useOrderStore
                    .getState()
                    .subscribeOrders(callback);
                  unsubscribe();
                  return newUnsubscribe;
                }
              }, 5000); // Wait 5 seconds before retrying
            }

            // Always call callback with empty array to prevent UI from breaking
            if (callback) callback([]);
          },
        });

        return () => {
          console.log("Cleaning up subscription", {
            partnerId,
            timestamp: new Date().toISOString(),
          });
          subscriptionActive = false;
          unsubscribe();
        };
      },

      setHotelId: (id: string) => {
        set((state) => {
          const hotelOrders = { ...state.hotelOrders };
          if (!hotelOrders[id]) {
            hotelOrders[id] = {
              items: [],
              totalPrice: 0,
              order: null,
              orderId: null,
              coordinates: null,
            };
          }
          return {
            hotelId: id,
            hotelOrders,
            order: hotelOrders[id].order,
            items: hotelOrders[id].items,
            orderId: hotelOrders[id].orderId,
            totalPrice: hotelOrders[id].totalPrice,
          };
        });
      },

      getCurrentOrder: () => {
        const state = get();
        if (!state.hotelId) {
          return {
            items: [],
            totalPrice: 0,
            order: null,
            orderId: null,
            coordinates: null,
          };
        }
        return (
          state.hotelOrders[state.hotelId] || {
            items: [],
            totalPrice: 0,
            order: null,
            orderId: null,
            coordinates: null,
          }
        );
      },

      setUserAddress: (address: string) => {
        set({ userAddress: address });
      },

      setOpenAuthModal: (open) => set({ open_auth_modal: open }),

      genOrderId: () => {
        const state = get();
        const orderId = uuidv4();

        if (state.hotelId) {
          set((state) => {
            const hotelOrders = { ...state.hotelOrders };
            hotelOrders[state.hotelId!] = {
              ...(hotelOrders[state.hotelId!] || {
                items: [],
                totalPrice: 0,
                order: null,
              }),
              orderId,
            };
            return { hotelOrders };
          });
        }
        return orderId;
      },

      addItem: (item) => {
        const state = get();
        if (!state.hotelId) return;

        set((state) => {
          const hotelOrders = { ...state.hotelOrders };
          const hotelOrder = hotelOrders[state.hotelId!] || {
            items: [],
            totalPrice: 0,
            order: null,
            orderId: null,
          };

          const existingItem = hotelOrder.items.find((i) => i.id === item.id);

          if (existingItem) {
            const updatedItems = hotelOrder.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            );
            hotelOrders[state.hotelId!] = {
              ...hotelOrder,
              items: updatedItems,
              totalPrice: hotelOrder.totalPrice + item.price,
            };
          } else {
            const newItem: OrderItem = {
              ...item,
              id: item.id || "",
              quantity: 1,
            };
            hotelOrders[state.hotelId!] = {
              ...hotelOrder,
              items: [...hotelOrder.items, newItem],
              totalPrice: hotelOrder.totalPrice + item.price,
            };
          }

          return {
            hotelOrders,
            items: hotelOrders[state.hotelId!].items,
            orderId: hotelOrders[state.hotelId!].orderId,
            totalPrice: hotelOrders[state.hotelId!].totalPrice,
          };
        });
      },

      removeItem: (itemId) => {
        const state = get();
        if (!state.hotelId) return;

        set((state) => {
          const hotelOrders = { ...state.hotelOrders };
          const hotelOrder = hotelOrders[state.hotelId!];
          if (!hotelOrder) return state;

          const itemToRemove = hotelOrder.items.find(
            (item) => item.id === itemId
          );
          if (!itemToRemove) return state;

          hotelOrders[state.hotelId!] = {
            ...hotelOrder,
            items: hotelOrder.items.filter((item) => item.id !== itemId),
            totalPrice:
              hotelOrder.totalPrice -
              itemToRemove.price * itemToRemove.quantity,
          };

          return {
            hotelOrders,
            items: hotelOrders[state.hotelId!].items,
            orderId: hotelOrders[state.hotelId!].orderId,
            totalPrice: hotelOrders[state.hotelId!].totalPrice,
          };
        });
      },

      deleteOrder: async (orderId: string) => {
        try {
          const deleteItemsResponse = await fetchFromHasura(
            `mutation DeleteOrderItems($orderId: uuid!) {
              delete_order_items(where: {order_id: {_eq: $orderId}}) {
                affected_rows
              }
            }`,
            { orderId }
          );

          if (deleteItemsResponse.errors) {
            throw new Error(
              deleteItemsResponse.errors[0]?.message ||
                "Failed to delete order items"
            );
          }

          const deleteOrderResponse = await fetchFromHasura(
            `mutation DeleteOrder($orderId: uuid!) {
              delete_orders_by_pk(id: $orderId) {
                id
              }
            }`,
            { orderId }
          );

          if (deleteOrderResponse.errors) {
            throw new Error(
              deleteOrderResponse.errors[0]?.message || "Failed to delete order"
            );
          }

          set((state) => {
            const partnerOrders = state.partnerOrders.filter(
              (order) => order.id !== orderId
            );
            const userOrders = state.userOrders.filter(
              (order) => order.id !== orderId
            );
            return { partnerOrders, userOrders };
          });

          toast.success("Order deleted successfully");
          return true;
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Failed to delete order"
          );
          return false;
        }
      },

      increaseQuantity: (itemId) => {
        const state = get();
        if (!state.hotelId) return;

        set((state) => {
          const hotelOrders = { ...state.hotelOrders };
          const hotelOrder = hotelOrders[state.hotelId!];
          if (!hotelOrder) return state;

          const item = hotelOrder.items.find((i) => i.id === itemId);
          if (!item) return state;

          const updatedItems = hotelOrder.items.map((i) =>
            i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i
          );

          hotelOrders[state.hotelId!] = {
            ...hotelOrder,
            items: updatedItems,
            totalPrice: hotelOrder.totalPrice + item.price,
          };

          return {
            hotelOrders,
            items: hotelOrders[state.hotelId!].items,
            orderId: hotelOrders[state.hotelId!].orderId,
            totalPrice: hotelOrders[state.hotelId!].totalPrice,
          };
        });
      },

      decreaseQuantity: (itemId) => {
        const state = get();
        if (!state.hotelId) return;

        set((state) => {
          const hotelOrders = { ...state.hotelOrders };
          const hotelOrder = hotelOrders[state.hotelId!];
          if (!hotelOrder) return state;

          const item = hotelOrder.items.find((i) => i.id === itemId);
          if (!item || item.quantity <= 1) return state;

          const updatedItems = hotelOrder.items.map((i) =>
            i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
          );

          hotelOrders[state.hotelId!] = {
            ...hotelOrder,
            items: updatedItems,
            totalPrice: hotelOrder.totalPrice - item.price,
          };

          return {
            hotelOrders,
            items: hotelOrders[state.hotelId!].items,
            orderId: hotelOrders[state.hotelId!].orderId,
            totalPrice: hotelOrders[state.hotelId!].totalPrice,
          };
        });
      },

      placeOrder: async (
        hotelData,
        tableNumber,
        qrId,
        gstIncluded,
        extraCharges?:
          | {
              name: string;
              amount: number;
              charge_type?: string;
            }[]
          | null,
        deliveryCharge?: number
      ) => {
        try {
          const state = get();

          // Validation checks
          if (!state.hotelId) {
            toast.error("No hotel selected");
            return null;
          }

          const currentOrder = state.hotelOrders[state.hotelId] || {
            items: [],
            totalPrice: 0,
            order: null,
            orderId: null,
          };

          if (currentOrder.items.length === 0) {
            toast.error("Cannot place empty order");
            return null;
          }

          const userData = useAuthStore.getState().userData;
          if (!userData?.id || userData?.role !== "user") {
            toast.error("Please login as user to place order");
            return null;
          }

          const isValidUUID = (str: string) => {
            const uuidRegex =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            return uuidRegex.test(str);
          };

          const validQrId = qrId && isValidUUID(qrId) ? qrId : null;
          const type = (tableNumber ?? 0) > 0 ? "table_order" : "delivery";
          const createdAt = new Date().toISOString();

          // Prepare extra charges
          const exCharges: {
            name: string;
            amount: number;
            charge_type?: string;
            id?: string;
          }[] = [];

          // Add any provided extra charges
          if (extraCharges && extraCharges.length > 0) {
            extraCharges.forEach((charge) => {
              exCharges.push({
                name: charge.name,
                amount: charge.amount,
                charge_type: charge.charge_type || "FLAT_FEE",
                id: uuidv4(),
              });
            });
          }

          // Add delivery charge if applicable
          if (type === "delivery" && deliveryCharge && deliveryCharge > 0) {
            exCharges.push({
              name: "Delivery Charge",
              amount: deliveryCharge,
              charge_type: "FLAT_FEE",
              id: uuidv4(),
            });
          }

          // Calculate totals
          const subtotal = currentOrder.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          const totalExtraCharges = exCharges.reduce(
            (sum, charge) => sum + charge.amount,
            0
          );

          const grandTotal = subtotal + (gstIncluded || 0) + totalExtraCharges;

          // Create order in database
          const orderResponse = await fetchFromHasura(createOrderMutation, {
            id: uuidv4(),
            totalPrice: grandTotal,
            gst_included: gstIncluded,
            extra_charges: exCharges.length > 0 ? exCharges : null,
            createdAt,
            tableNumber: tableNumber || null,
            qrId: validQrId,
            partnerId: hotelData.id,
            userId: userData.id,
            type,
            status: "pending",
            delivery_address: type === "delivery" ? state.userAddress : null,
            delivery_location:
              type === "delivery"
                ? {
                    type: "Point",
                    coordinates: [
                      state.coordinates?.lng || 0,
                      state.coordinates?.lat || 0,
                    ],
                  }
                : null,
          });

          if (orderResponse.errors || !orderResponse?.insert_orders_one?.id) {
            throw new Error(
              orderResponse.errors?.[0]?.message || "Failed to create order"
            );
          }

          const orderId = orderResponse.insert_orders_one.id;

          // Create order items
          const itemsResponse = await fetchFromHasura(
            createOrderItemsMutation,
            {
              orderItems: currentOrder.items.map((item) => ({
                order_id: orderId,
                menu_id: item.id,
                quantity: item.quantity,
                item: {
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  offers: item.offers,
                  category: item.category,
                },
              })),
            }
          );

          if (itemsResponse.errors) {
            throw new Error(
              itemsResponse.errors?.[0]?.message || "Failed to add order items"
            );
          }

          // Prepare new order object
          const newOrder: Order = {
            id: orderId,
            items: currentOrder.items,
            totalPrice: grandTotal,
            createdAt,
            tableNumber: tableNumber || null,
            qrId: validQrId,
            status: "pending",
            partnerId: hotelData.id,
            userId: userData.id,
            user: {
              phone: userData.phone || "N/A",
            },
            gstIncluded,
            extraCharges: exCharges,
          };

          // Update state
          set((state) => ({
            ...state,
            hotelOrders: {
              ...state.hotelOrders,
              [state.hotelId!]: {
                items: [],
                totalPrice: 0,
                order: newOrder,
                orderId: null,
                coordinates: null,
              },
            },
            order: newOrder,
            items: [],
            orderId: null,
            totalPrice: 0,
          }));

          toast.success("Order placed successfully!");
          await sendOrderNotification(orderId, hotelData.id);
          return newOrder;
        } catch (error) {
          console.error("Order placement error:", error);
          toast.error(
            error instanceof Error ? error.message : "Failed to place order"
          );
          return null;
        }
      },

      fetchOrderOfPartner: async (partnerId: string) => {
        try {
          // First fetch the orders with captain data included
          const ordersResponse = await fetchFromHasura(
            `query GetPartnerOrders($partnerId: uuid!) {
              orders(
                where: { partner_id: { _eq: $partnerId } }
                order_by: { created_at: desc }
              ) {
                id
                total_price
                created_at
                table_number
                qr_id
                type
                delivery_address
                delivery_location
                status
                status_history
                partner_id
                gst_included
                extra_charges
                phone
                user_id
                orderedby
                captain_id
                captainid {
                  id
                  name
                  email
                }
                user {
                  full_name
                  phone
                  email
                }
                order_items {
                  id
                  quantity
                  menu {
                    id
                    name
                    price
                    category {
                      id
                      name
                      priority
                    }
                    description
                    image_url
                    is_top
                    is_available
                    priority
                    stocks {
                      stock_quantity
                      id
                    }
                  }
                }
              }
            }`,
            { partnerId }
          );

          if (ordersResponse.errors) {
            throw new Error(
              ordersResponse.errors[0]?.message || "Failed to fetch orders"
            );
          }

          return ordersResponse.orders.map((order: any) => {
            // Ensure captain data is properly structured
            const captainData = order.captainid ? {
              id: order.captainid.id,
              name: order.captainid.name,
              email: order.captainid.email
            } : null;

            return {
              id: order.id,
              totalPrice: order.total_price,
              createdAt: order.created_at,
              tableNumber: order.table_number,
              qrId: order.qr_id,
              status: order.status,
              type: order.type,
              phone: order.phone,
              deliveryAddress: order.delivery_address,
              partnerId: order.partner_id,
              delivery_location: order.delivery_location,
              gstIncluded: order.gst_included,
              extraCharges: order.extra_charges || [],
              delivery_charge: order.delivery_charge,
              status_history: order.status_history,
              userId: order.user_id,
              user: order.user,
              orderedby: order.orderedby,
              captain_id: order.captain_id,
              captain: captainData,  // Use the properly structured captain data
              items: order.order_items.map((i: any) => ({
                id: i.menu?.id,
                quantity: i.quantity,
                name: i.menu?.name || "Unknown",
                price: i.menu?.offers?.[0]?.offer_price || i.menu?.price || 0,
                category: i.menu?.category,
                stocks: i.menu?.stocks,
              })),
            };
          });
        } catch (error) {
          console.error("Error fetching orders:", error);
          toast.error("Failed to load orders");
          return null;
        }
      },

      clearOrder: () => {
        const state = get();
        if (!state.hotelId) return;

        const newOrderId = uuidv4();

        set((state) => {
          const hotelOrders = { ...state.hotelOrders };
          if (state.hotelId) {
            hotelOrders[state.hotelId] = {
              ...hotelOrders[state.hotelId],
              items: [],
              totalPrice: 0,
              order: null,
              orderId: newOrderId,
            };
          }

          return {
            ...state,
            hotelOrders,
            items: [],
            orderId: newOrderId,
            totalPrice: 0,
            order: null,
          };
        });
      },

      setOpenOrderDrawer: (open: boolean) => set({ open_order_drawer: open }),

      setDeliveryInfo: (info: DeliveryInfo | null) =>
        set({ deliveryInfo: info }),

      setDeliveryCost: (cost: number | null) => set({ deliveryCost: cost }),
    }),
    {
      name: "order-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useOrderStore;
