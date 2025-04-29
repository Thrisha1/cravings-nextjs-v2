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
}

interface OrderState {
  order: Order | null;
  items: OrderItem[];
  totalPrice: number;
  addItem: (item: HotelDataMenus) => void;
  removeItem: (itemId: string) => void;
  increaseQuantity: (itemId: string) => void;
  decreaseQuantity: (itemId: string) => void;
  clearCart: () => void;
  placeOrder: (
    hotelData: HotelData,
    tableNumber?: number,
    qrId?: string
  ) => Promise<Order | null>;
}

const useOrderStore = create(
  persist<OrderState>(
    (set, get) => ({
      order: null,
      items: [],
      totalPrice: 0,

      addItem: (item) => {
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

      clearCart: () => set({ items: [], totalPrice: 0, order: null }),
    }),
    {
      name: "order-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useOrderStore;