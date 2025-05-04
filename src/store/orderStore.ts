import { HotelData, HotelDataMenus } from "@/app/hotels/[id]/page";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./authStore";
import { createOrderItemsMutation, createOrderMutation } from "@/api/orders";

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
  userId: string;
  user?: {
    full_name: string;
  };
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

  // Order state
  order : Order | null;
  items : OrderItem[] | null;
  orderId : string | null;
  totalPrice : number | null;
  
  // Hotel management
  setHotelId: (id: string) => void;
  
  // Order actions
  addItem: (item: HotelDataMenus) => void;
  removeItem: (itemId: string) => void;
  increaseQuantity: (itemId: string) => void;
  decreaseQuantity: (itemId: string) => void;
  clearOrder: () => void;
  placeOrder: (
    hotelData: HotelData,
    tableNumber?: number,
    qrId?: string
  ) => Promise<Order | null>;
  
  // Getters for current hotel
  getCurrentOrder: () => HotelOrderState;
  
  // Other methods
  fetchOrderOfPartner: (partnerId: string) => Promise<Order[] | null>;
  fetchOrderItems: (orderId: string) => Promise<OrderItem[] | null>;
  setOpenAuthModal: (open: boolean) => void;
  genOrderId: () => string;
  setUserAddress: (address: string) => void;
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
      totalPrice: 0,

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
          return { hotelId: id, hotelOrders , order: hotelOrders[id].order , items: hotelOrders[id].items, orderId: hotelOrders[id].orderId, totalPrice: hotelOrders[id].totalPrice };
        });
      },

      getCurrentOrder: () => {
        const state = get();
        if (!state.hotelId) {
          return { items: [], totalPrice: 0, order: null, orderId: null };
        }
        return state.hotelOrders[state.hotelId] || { 
          items: [], 
          totalPrice: 0, 
          order: null, 
          orderId: null 
        };
      },

      setUserAddress: (address: string) => {
        set({ userAddress: address });
      },

      setOpenAuthModal: (open) => set({ open_auth_modal: open }),

      genOrderId: () => {
        const state = get();
        if (!state.hotelId) {
          const orderId = crypto.randomUUID();
          return orderId;
        }

        const currentOrder = state.hotelOrders[state.hotelId];
        if (currentOrder?.orderId) {
          return currentOrder.orderId;
        }

        const orderId = crypto.randomUUID();
        set((state) => {
          const hotelOrders = { ...state.hotelOrders };
          if (state.hotelId) {
            hotelOrders[state.hotelId] = {
              ...(hotelOrders[state.hotelId] || { 
                items: [], 
                totalPrice: 0, 
                order: null 
              }),
              orderId,
            };
          }
          return { hotelOrders };
        });
        return orderId;
      },

      addItem: (item) => {
        const user = useAuthStore.getState().userData;
        if (!user) {
          console.error("User not authenticated");
          set({ open_auth_modal: true });
          return;
        }

        const state = get();
        if (!state.hotelId) return;

        const currentOrder = state.hotelOrders[state.hotelId] || {
          items: [],
          totalPrice: 0,
          order: null,
          orderId: null,
        };

        if (currentOrder.order) return; 

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

          return { hotelOrders , items: hotelOrders[state.hotelId!].items, orderId: hotelOrders[state.hotelId!].orderId, totalPrice: hotelOrders[state.hotelId!].totalPrice };
        });
      },

      removeItem: (itemId) => {
        const state = get();
        if (!state.hotelId) return;

        const currentOrder = state.hotelOrders[state.hotelId];
        if (!currentOrder || currentOrder.order) return;

        set((state) => {
          const hotelOrders = { ...state.hotelOrders };
          const hotelOrder = hotelOrders[state.hotelId!];
          if (!hotelOrder) return state;

          const itemToRemove = hotelOrder.items.find((item) => item.id === itemId);
          if (!itemToRemove) return state;

          hotelOrders[state.hotelId!] = {
            ...hotelOrder,
            items: hotelOrder.items.filter((item) => item.id !== itemId),
            totalPrice:
              hotelOrder.totalPrice - itemToRemove.price * itemToRemove.quantity,
          };

          return { hotelOrders , items: hotelOrders[state.hotelId!].items, orderId: hotelOrders[state.hotelId!].orderId, totalPrice: hotelOrders[state.hotelId!].totalPrice };
        });
      },

      increaseQuantity: (itemId) => {
        const state = get();
        if (!state.hotelId) return;

        const currentOrder = state.hotelOrders[state.hotelId];
        if (!currentOrder || currentOrder.order) return;

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

          return { hotelOrders , items: hotelOrders[state.hotelId!].items, orderId: hotelOrders[state.hotelId!].orderId, totalPrice: hotelOrders[state.hotelId!].totalPrice };
        });
      },

      decreaseQuantity: (itemId) => {
        const state = get();
        if (!state.hotelId) return;

        const currentOrder = state.hotelOrders[state.hotelId];
        if (!currentOrder || currentOrder.order) return;

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

          return { hotelOrders, items: hotelOrders[state.hotelId!].items, orderId: hotelOrders[state.hotelId!].orderId, totalPrice: hotelOrders[state.hotelId!].totalPrice };
        });
      },

      placeOrder: async (hoteldata, tableNumber, qrId) => {
        try {
          const state = get();
          if (!state.hotelId) return null;

          const currentOrder = state.hotelOrders[state.hotelId] || {
            items: [],
            totalPrice: 0,
            order: null,
            orderId: null,
          };

          if (currentOrder.order) return currentOrder.order;
          if (currentOrder.items.length === 0) {
            console.error("Cannot place empty order");
            return null;
          }

          const userData = useAuthStore.getState().userData;
          if (!userData?.id) {
            console.error("User not authenticated");
            return null;
          }

          const createdAt = new Date().toISOString();
          const orderVariables = {
            id: currentOrder.orderId,
            totalPrice: currentOrder.totalPrice,
            createdAt,
            tableNumber: tableNumber || null,
            qrId: qrId || null,
            partnerId: hoteldata.id,
            userId: userData.id,
          };

          const orderResponse = await fetchFromHasura(
            createOrderMutation,
            orderVariables
          );

          if (orderResponse.errors || !orderResponse?.insert_orders_one?.id) {
            console.error("Error creating order:", orderResponse.errors);
            return null;
          }

          const orderId = orderResponse.insert_orders_one.id;
          const orderItems = currentOrder.items.map((item) => ({
            order_id: orderId,
            menu_id: item.id,
            quantity: item.quantity,
          }));

          const itemsResponse = await fetchFromHasura(
            createOrderItemsMutation,
            { orderItems }
          );

          if (itemsResponse.errors) {
            console.error("Error creating order items:", itemsResponse.errors);
            return null;
          }

          const newOrder = {
            id: orderId,
            items: currentOrder.items,
            totalPrice: currentOrder.totalPrice,
            createdAt,
            tableNumber: tableNumber || null,
            qrId: qrId || null,
            status: "pending" as const,
            partnerId: hoteldata.id,
            userId: userData.id,
          };

          set((state) => {
            const hotelOrders = { ...state.hotelOrders };
            hotelOrders[state.hotelId!] = {
              items: [],
              totalPrice: 0,
              order: newOrder,
              orderId: null,
            };
            return { hotelOrders , order: newOrder, items: [], orderId: null, totalPrice: 0 };
          });

          return newOrder;
        } catch (error) {
          console.error("Error placing order:", error);
          return null;
        }
      },

      fetchOrderOfPartner: async (partnerId: string) => {
        try {
          console.log("Fetching orders for partner:", partnerId);
          
          const response = await fetchFromHasura(
            `query FetchOrder($partnerId: uuid!) {
                orders(where: { partner_id: { _eq: $partnerId } } , order_by: { created_at: desc }) {
                    created_at
                    id
                    status
                    total_price
                    table_number
                  }
                  users {
                    full_name
                  }
                }
              `,
            { partnerId }
          );

          if (response.errors) {
            console.error("Error fetching order:", response.errors);
            return null;
          }

          console.log("Fetched orders:", response.orders);
          
          return response.orders;
        } catch (error) {
          console.error("Error fetching order:", error);
          return null;
        }
      },

      fetchOrderItems: async (orderId: string) => {
        try {
          const response = await fetchFromHasura(
            `query FetchOrderItems($orderId: uuid!) {
              order_items(where: {order_id: {_eq: $orderId}}) {
              quantity
              id
              menu {
                name
                price
              }
            }
            }`,
            { orderId }
          );

          if (response.errors) {
            console.error("Error fetching order items:", response.errors);
            return null;
          }

          return response?.order_items.map((item: any) => ({
            ...item,
            name: item.menu?.name || "Unknown",
            price: item.menu?.price || 0,
          }));
        } catch (error) {
          console.error("Error fetching order items:", error);
          return null;
        }
      },

      clearOrder: () => {
        const state = get();
        if (!state.hotelId) return;

        set((state) => {
          const hotelOrders = { ...state.hotelOrders };
          if (state.hotelId) {
            hotelOrders[state.hotelId] = {
              items: [],
              totalPrice: 0,
              order: null,
              orderId: null,
            };
          }
          return { hotelOrders , items: [], orderId: null, totalPrice: 0 , order: null };
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