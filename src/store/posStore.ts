import { create } from "zustand";
import { MenuItem } from "./menuStore_hasura";
import { fetchFromHasura } from "@/lib/hasuraClient";
import {
  createPOSOrder,
  createPOSItems,
  getPastBills,
  deleteBillMutation,
} from "@/api/pos";
import { Partner, useAuthStore } from "./authStore";
import useOrderStore, { Order } from "./orderStore";
import { getGstAmount } from "@/components/hotelDetail/OrderDrawer";
import { createOrderItemsMutation, createOrderMutation, getOrdersOfPartnerQuery } from "@/api/orders";

interface CartItem extends MenuItem {
  quantity: number;
}

interface POSItem {
  id: string;
  menu_id: string;
  quantity: number;
  menu: {
    name: string;
    price: number;
  };
}

interface POSBill {
  id: string;
  total_amt: number;
  phone: number | null;
  created_at: Date;
  pos_show_id: string;
  pos_items: POSItem[]; // Updated field name
}

interface POSState {
  loading: boolean;
  cartItems: CartItem[];
  totalAmount: number;
  userPhone : string | null;
  setUserPhone: (phone: string | null) => void;
  tableNumbers : number[];
  tableNumber: number;
  setTableNumber: (tableNumber: number) => void;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  increaseQuantity: (itemId: string) => void;
  decreaseQuantity: (itemId: string) => void;
  clearCart: () => void;
  checkout: () => Promise<void>;
  pastBills: Order[];
  loadingBills: boolean;
  fetchPastBills: () => Promise<void>;
  deleteBill: (billId: string) => Promise<void>;
  order: Order | null;
  setOrder: (order: Order | null) => void;
  getPartnerTables: () => Promise<void>;
  postCheckoutModalOpen: boolean;
  editOrderModalOpen: boolean;
  setPostCheckoutModalOpen: (open: boolean) => void;
  setEditOrderModalOpen: (open: boolean) => void;
}

export const usePOSStore = create<POSState>((set, get) => ({
  loading: false,
  cartItems: [],
  totalAmount: 0,
  order: null,
  userPhone: null,
  tableNumber: 0,
  tableNumbers: [],
  postCheckoutModalOpen: false,
  editOrderModalOpen: false,

  setPostCheckoutModalOpen: (open) => set({ postCheckoutModalOpen: open }),
  setEditOrderModalOpen: (open) => set({ editOrderModalOpen: open }),

  getPartnerTables: async () => {
    try {
      const response = await fetchFromHasura(`
        query MyQuery($partner_id: uuid!) {
          qr_codes(where: {partner_id: {_eq: $partner_id}}, order_by: {table_number: asc}) {
            table_number
          }
      }
    `, {
        partner_id: useAuthStore.getState().userData?.id,
      });

      const tableNumbers = response.qr_codes.map((table: { table_number: number }) => table.table_number);

      set({ tableNumbers });

    } catch (error) {
      console.error("Error fetching partner tables:", error);
      throw error;
    }
  },

  setTableNumber: (tableNumber: number) => {
    set({ tableNumber });
  },

  setUserPhone: (phone: string | null) => {
    set({ userPhone: phone });
  },

  setOrder: (order: Order | null) => {
    set({ order });
  },

  addToCart: (item: MenuItem) => {
    const { cartItems } = get();
    const existingItem = cartItems.find((cartItem) => cartItem.id === item.id);

    if (existingItem) {
      get().increaseQuantity(item.id!);
      return;
    }

    set((state) => ({
      cartItems: [...state.cartItems, { ...item, quantity: 1 }],
      totalAmount: state.totalAmount + item.price,
    }));
  },

  removeFromCart: (itemId: string) => {
    const { cartItems } = get();
    const item = cartItems.find((item) => item.id === itemId);

    if (!item) return;

    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.id !== itemId),
      totalAmount: state.totalAmount - item.price * item.quantity,
    }));
  },

  increaseQuantity: (itemId: string) => {
    set((state) => ({
      cartItems: state.cartItems.map((item) =>
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      ),
      totalAmount:
        state.totalAmount +
        (state.cartItems.find((item) => item.id === itemId)?.price || 0),
    }));
  },

  decreaseQuantity: (itemId: string) => {
    const { cartItems } = get();
    const item = cartItems.find((item) => item.id === itemId);

    if (!item) return;

    if (item.quantity === 1) {
      get().removeFromCart(itemId);
      return;
    }

    set((state) => ({
      cartItems: state.cartItems.map((item) =>
        item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
      ),
      totalAmount: state.totalAmount - item.price,
    }));
  },

  clearCart: () => {
    set({ cartItems: [], totalAmount: 0 });
  },

  checkout: async () => {
    try {
      set({ loading: true });
      const { cartItems, totalAmount } = get();
      const userId = useAuthStore.getState().userData?.id;
      const hotelData = useAuthStore.getState().userData as Partner;

      if (!userId) {
        throw new Error("User ID is not available");
      }

      const orderId = crypto.randomUUID();

      const newOrder = {
        id: orderId,
        totalPrice: hotelData?.gst_percentage
          ? totalAmount + getGstAmount(totalAmount, hotelData.gst_percentage)
          : totalAmount,
        createdAt: new Date().toISOString(),
        tableNumber: get().tableNumber,
        status: "completed" as "completed",
        partnerId: userId,
        type: "table_order" as "table_order",
        phone: get().userPhone,
      };

      const orderResponse = await fetchFromHasura(
        createOrderMutation,
        newOrder
      );
      


      if (orderResponse.errors || !orderResponse?.insert_orders_one?.id) {
        throw new Error(
          orderResponse.errors?.[0]?.message || "Failed to create order"
        );
      }

      const itemsResponse = await fetchFromHasura(createOrderItemsMutation, {
        orderItems: cartItems.map((item) => ({
          order_id: orderId,
          menu_id: item.id,
          quantity: item.quantity,
        })),
      });

      if (itemsResponse.errors) {
        throw new Error(
          itemsResponse.errors?.[0]?.message || "Failed to add order items"
        );
      }
      

      get().clearCart();
      set({ loading: false , order : {
        ...newOrder,
        items: cartItems,
      } });
      set({ postCheckoutModalOpen: true });
    } catch (error) {
      console.error("Error during checkout:", error);
      throw error;
    }
  },

  pastBills: [],
  loadingBills: false,

  fetchPastBills: async () => {
    try {
      set({ loadingBills: true });
      const response = await fetchFromHasura(getOrdersOfPartnerQuery, {
        partner_id: useAuthStore.getState().userData?.id,
      });
      console.log(response); // Log the fetched data to the console for inspection
      set({ pastBills: response.orders, loadingBills: false });
    } catch (error) {
      console.error("Error fetching past bills:", error);
      set({ loadingBills: false });
      throw error;
    }
  },
  deleteBill: async (billId: string) => {
    try {
      await fetchFromHasura(deleteBillMutation, {
        id: billId,
      });

      // Update local state after successful deletion
      const currentBills = get().pastBills;
      set({ pastBills: currentBills.filter((bill) => bill.id !== billId) });
    } catch (error) {
      console.error("Error deleting bill:", error);
      throw error;
    }
  },
}));
