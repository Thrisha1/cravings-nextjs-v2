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

interface OrderState {
  order: Order | null;
  userAddress: string | null;
  items: OrderItem[];
  orderId: string | null;
  totalPrice: number;
  open_auth_modal: boolean;
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
  fetchOrderOfPartner: (partnerId: string) => Promise<Order[] | null>;
  fetchOrderItems: (orderId: string) => Promise<OrderItem[] | null>;
  setOpenAuthModal: (open: boolean) => void;
  genOrderId: () => string;
  setUserAddress: (address: string) => void;
}

const useOrderStore = create(
  persist<OrderState>(
    (set, get) => ({
      order: null,
      items: [],
      userAddress: null,
      totalPrice: 0,
      orderId: null,
      open_auth_modal:false,

      setUserAddress: (address : string) => {
        set({ userAddress: address });
      },

      setOpenAuthModal: (open) => set({ open_auth_modal: open }),

      genOrderId: () => {
        if(get().orderId){
          return get().orderId!;
        }
        const orderId = crypto.randomUUID();
        set({ orderId });
        return orderId;
      },

      addItem: (item) => {
        const user = useAuthStore.getState().userData;
        if (!user) {
          console.error("User not authenticated");
          set({ open_auth_modal : true })
          // localStorage.setItem("redirectPath", window.location.pathname);
          // window.location.href = "/login";
          return;
        }



        if (get().order) return; // Prevent adding items if order exists
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);

          if (existingItem) {
            const updatedItems = state.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            );
            return {
              items: updatedItems,
              totalPrice: state.totalPrice + item.price,
            };
          } else {
            const newItem = { ...item, quantity: 1 };
            return {
              items: [...state.items, newItem],
              totalPrice: state.totalPrice + item.price,
            };
          }
        });
      },

      removeItem: (itemId) => {
        if (get().order) return; // Prevent removing items if order exists
        set((state) => {
          const itemToRemove = state.items.find((item) => item.id === itemId);
          if (!itemToRemove) return state;
          return {
            items: state.items.filter((item) => item.id !== itemId),
            totalPrice:
              state.totalPrice - itemToRemove.price * itemToRemove.quantity,
          };
        });
      },

      increaseQuantity: (itemId) => {
        if (get().order) return; // Prevent quantity changes if order exists
        set((state) => {
          const item = state.items.find((i) => i.id === itemId);
          if (!item) return state;

          const updatedItems = state.items.map((i) =>
            i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i
          );

          return {
            items: updatedItems,
            totalPrice: state.totalPrice + item.price,
          };
        });
      },

      decreaseQuantity: (itemId) => {
        if (get().order) return; // Prevent quantity changes if order exists
        set((state) => {
          const item = state.items.find((i) => i.id === itemId);
          if (!item || item.quantity <= 1) return state;

          const updatedItems = state.items.map((i) =>
            i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
          );

          return {
            items: updatedItems,
            totalPrice: state.totalPrice - item.price,
          };
        });
      },

      placeOrder: async (hoteldata, tableNumber, qrId) => {
        try {
          const state = get();
          if (state.order) return state.order;
          if (state.items.length === 0) {
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
            id : state.orderId,
            totalPrice: state.totalPrice,
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
          const orderItems = state.items.map((item) => ({
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
            items: state.items,
            totalPrice: state.totalPrice,
            createdAt,
            tableNumber: tableNumber || null,
            qrId: qrId || null,
            status: "pending" as const,
            partnerId: hoteldata.id,
            userId: userData.id,
          };

          set({
            order: newOrder,
            items: [],
            totalPrice: 0,
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
                orders(where: { partner_id: { _eq: $partnerId } } , order_by: { created_at: asc }) {
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

          console.log(response);
          

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

      clearOrder: () => set({ items: [], totalPrice: 0, order: null , orderId: null }),
    }),
    {
      name: "order-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useOrderStore;
