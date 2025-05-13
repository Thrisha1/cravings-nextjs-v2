import { HotelData, HotelDataMenus } from "@/app/hotels/[...id]/page";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./authStore";
import {
  createOrderItemsMutation,
  createOrderMutation,
  subscriptionQuery,
  userSubscriptionQuery,
} from "@/api/orders";
import { toast } from "sonner";
import { getGstAmount } from "@/components/hotelDetail/OrderDrawer";
import { subscribeToHasura } from "@/lib/hasuraSubscription";

export interface OrderItem extends HotelDataMenus {
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalPrice: number;
  createdAt: string;
  tableNumber?: number | null;
  qrId?: string | null;
  status: "pending" | "completed" | "cancelled";
  partnerId: string;
  partner?: {
    gst_percentage?: number;
    currency?: string;
    store_name?: string;
  }
  phone?: string | null;
  userId?: string;
  user?: {
    phone?: string;
  };
  type?: "table_order" | "delivery" | "pos";
  deliveryAddress?: string | null;
  gstIncluded?: number;
  extraCharges?:
    | {
        name: string;
        amount: number;
        id?: string;
      }[]
    | null;
}

interface HotelOrderState {
  items: OrderItem[];
  totalPrice: number;
  order: Order | null;
  orderId: string | null;
}

interface OrderState {
  hotelId: string | null;
  hotelOrders: Record<string, HotelOrderState>;
  userAddress: string | null;
  open_auth_modal: boolean;
  order: Order | null;
  items: OrderItem[] | null;
  orderId: string | null;
  totalPrice: number | null;

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
    extraCharges?: {
      name: string | undefined;
      amount: number | undefined;
    }
  ) => Promise<Order | null>;
  getCurrentOrder: () => HotelOrderState;
  fetchOrderOfPartner: (partnerId: string) => Promise<Order[] | null>;
  setOpenAuthModal: (open: boolean) => void;
  genOrderId: () => string;
  setUserAddress: (address: string) => void;
  subscribeOrders: (callback?: (orders: Order[]) => void) => () => void;
  partnerOrders: Order[];
  userOrders: Order[];
  subscribeUserOrders: (callback?: (orders: Order[]) => void) => () => void;
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
              type: order.type,
              phone: order.phone,
              deliveryAddress: order.delivery_address,
              partnerId: order.partner_id,
              userId: order.user_id,
              gstIncluded: order.gst_included,
              extraCharges: order.extra_charges,
              partner : order.partner,
              user: order.user,
              items: order.order_items.map((item: any) => ({
                id: item.id,
                quantity: item.quantity,
                name: item.menu?.name || "Unknown",
                price: item.menu?.price || 0,
                category: item.menu?.category,
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
        const partnerId = useAuthStore.getState().userData?.id;

        const unsubscribe = subscribeToHasura({
          query: subscriptionQuery,
          variables: { partner_id: partnerId },
          onNext: (data) => {
            const allOrders = data.data?.orders.map((order: any) => ({
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
              extraCharges: order.extra_charges,
              userId: order.user_id,
              user: order.user,
              items: order.order_items.map((item: any) => ({
                id: item.id,
                quantity: item.quantity,
                name: item.menu?.name || "Unknown",
                price: item.menu?.price || 0,
                category: item.menu?.category,
              })),
            }));

            if (allOrders) {
              set({ partnerOrders: allOrders });
              if (callback) callback(allOrders);
            }
          },
          onError: (error) => {
            console.error("Subscription error:", error);
          },
        });

        return unsubscribe;
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
          return { items: [], totalPrice: 0, order: null, orderId: null };
        }
        return (
          state.hotelOrders[state.hotelId] || {
            items: [],
            totalPrice: 0,
            order: null,
            orderId: null,
          }
        );
      },

      setUserAddress: (address: string) => {
        set({ userAddress: address });
      },

      setOpenAuthModal: (open) => set({ open_auth_modal: open }),

      genOrderId: () => {
        const state = get();
        const orderId = crypto.randomUUID();

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
        const user = useAuthStore.getState().userData;
        if (!user) {
          set({ open_auth_modal: true });
          return;
        }

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
            const newItem = { ...item, quantity: 1 };
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
        extraCharges
      ) => {
        try {
          const state = get();
          if (!state.hotelId) return null;

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
          if (!userData?.id && userData?.role !== "user") {
            toast.error("Please login as user to place order");
            return null;
          }

          const type = (tableNumber ?? 0) > 0 ? "table_order" : "delivery";

          const exCharges = [];

          if(extraCharges?.name && extraCharges?.amount) {
            exCharges.push({
              ...extraCharges,
              id : crypto.randomUUID()
            });
          }

          const createdAt = new Date().toISOString();
          const orderResponse = await fetchFromHasura(createOrderMutation, {
            id: currentOrder.orderId,
            totalPrice: currentOrder.totalPrice,
            gst_included: gstIncluded,
            extra_charges: exCharges || null,
            createdAt,
            tableNumber: tableNumber || null,
            qrId: qrId || null,
            partnerId: hotelData.id,
            userId: userData.id,
            type,
            status: "pending",
            delivery_address: tableNumber ? null : get().userAddress,
          });

          if (orderResponse.errors || !orderResponse?.insert_orders_one?.id) {
            throw new Error(
              orderResponse.errors?.[0]?.message || "Failed to create order"
            );
          }

          const orderId = orderResponse.insert_orders_one.id;
          const itemsResponse = await fetchFromHasura(
            createOrderItemsMutation,
            {
              orderItems: currentOrder.items.map((item) => ({
                order_id: orderId,
                menu_id: item.id,
                quantity: item.quantity,
              })),
            }
          );

          if (itemsResponse.errors) {
            throw new Error(
              itemsResponse.errors?.[0]?.message || "Failed to add order items"
            );
          }

          const newOrder: Order = {
            id: orderId,
            items: currentOrder.items,
            totalPrice: currentOrder.totalPrice,
            createdAt,
            tableNumber: tableNumber || null,
            qrId: qrId || null,
            status: "pending",
            partnerId: hotelData.id,
            userId: userData.id,
            user: {
              phone: userData?.role === "user" ? userData.phone : "N/A",
            },
          };

          set((state) => {
            const hotelOrders = { ...state.hotelOrders };
            hotelOrders[state.hotelId!] = {
              items: [],
              totalPrice: 0,
              order: newOrder,
              orderId: null,
            };
            return {
              hotelOrders,
              order: newOrder,
              items: [],
              orderId: null,
              totalPrice: 0,
            };
          });

          toast.success("Order placed successfully!");
          return newOrder;
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Failed to place order"
          );
          return null;
        }
      },

      fetchOrderOfPartner: async (partnerId: string) => {
        try {
          const response = await fetchFromHasura(
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
                status
                partner_id
                user_id
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
                      name
                    }
                  }
                }
              }
            }`,
            { partnerId }
          );

          if (response.errors) {
            throw new Error(
              response.errors[0]?.message || "Failed to fetch orders"
            );
          }

          return response.orders.map((order: any) => ({
            id: order.id,
            totalPrice: order.total_price,
            createdAt: order.created_at,
            tableNumber: order.table_number,
            qrId: order.qr_id,
            status: order.status,
            type: order.type,
            deliveryAddress: order.delivery_address,
            partnerId: order.partner_id,
            userId: order.user_id,
            user: order.user,
            items: order.order_items.map((item: any) => ({
              id: item.id,
              quantity: item.quantity,
              name: item.menu?.name || "Unknown",
              price: item.menu?.price || 0,
              category: item.menu?.category,
            })),
          }));
        } catch (error) {
          console.error("Error fetching orders:", error);
          toast.error("Failed to load orders");
          return null;
        }
      },

      clearOrder: () => {
        const state = get();
        if (!state.hotelId) return;

        const newOrderId = crypto.randomUUID();

        set((state) => {
          const hotelOrders = { ...state.hotelOrders };
          if (state.hotelId) {
            hotelOrders[state.hotelId] = {
              items: [],
              totalPrice: 0,
              order: null,
              orderId: newOrderId,
            };
          }

          return {
            hotelOrders,
            items: [],
            orderId: newOrderId,
            totalPrice: 0,
            order: null,
          };
        });
      },
    }),
    {
      name: "order-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useOrderStore;
