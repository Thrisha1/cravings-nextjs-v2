import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Order } from "./orderStore";

interface OrderSubscriptionState {
  orders: Order[];
  loading: boolean;
  setOrders: (orders: Order[]) => void;
  removeOrder: (orderId: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useOrderSubscriptionStore = create<OrderSubscriptionState>()(
  persist(
    (set , get) => ({
      orders: [],
      loading: true,
      setOrders: (orders) => set({ orders }),
      removeOrder: (orderId) =>
        set((state) => ({
          orders: state.orders.filter((order) => order.id !== orderId),
        })),
      setLoading: (loading) => {
        const stateLoading = get().loading;
        if (!stateLoading) return;
        set({ loading });
      },
    }),
    {
      name: "order-subscription-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
