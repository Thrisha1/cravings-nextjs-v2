import { create } from "zustand";
import { MenuItem } from "./menuStore_hasura";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { createPOSOrder, createPOSItems, getPastBills, deleteBillMutation } from "@/api/pos";
import { useAuthStore } from "./authStore";

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
  }
}

interface POSBill {
  id: string;
  total_amt: number;
  phone: number | null;
  created_at: Date;
  pos_show_id: string;
  pos_items: POSItem[];  // Updated field name
}

interface POSState {
  loading: boolean;
  cartItems: CartItem[];
  totalAmount: number;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  increaseQuantity: (itemId: string) => void;
  decreaseQuantity: (itemId: string) => void;
  clearCart: () => void;
  checkout: (phone?: number) => Promise<void>;
  pastBills: POSBill[];
  loadingBills: boolean;
  fetchPastBills: () => Promise<void>;
  deleteBill: (billId: string) => Promise<void>;
}

export const usePOSStore = create<POSState>((set, get) => ({
  loading: false,
  cartItems: [],
  totalAmount: 0,

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
      totalAmount: state.totalAmount - (item.price * item.quantity),
    }));
  },

  increaseQuantity: (itemId: string) => {
    set((state) => ({
      cartItems: state.cartItems.map((item) =>
        item.id === itemId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ),
      totalAmount: state.totalAmount + (state.cartItems.find((item) => item.id === itemId)?.price || 0),
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
        item.id === itemId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ),
      totalAmount: state.totalAmount - item.price,
    }));
  },

  clearCart: () => {
    set({ cartItems: [], totalAmount: 0 });
  },

  checkout: async (phone?: number) => {
    try {
      set({ loading: true });
      const { cartItems, totalAmount } = get();

      // Generate a 5 character POS ID combining numbers and uppercase letters
      const generatePosId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 5; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      const pos_id = generatePosId();

      // Create POS order
      const orderResponse = await fetchFromHasura(createPOSOrder, {
        total_amt: Math.round(totalAmount),
        phone: phone || null,
        pos_id: pos_id
      });

      const posId = orderResponse.insert_pos_one.id;

      // Create POS items
      const posItems = cartItems.map(item => ({
        menu_id: item.id,
        pos_id: posId,
        quantity: item.quantity
      }));

      await fetchFromHasura(createPOSItems, {
        items: posItems
      });

      // Clear cart after successful checkout
      get().clearCart();

      set({ loading: false }); // Reset loading after successful checkout

    } catch (error) {
      console.error('Error during checkout:', error);
      throw error;
    }
  },  // <-- Added missing comma here

  pastBills: [],
  loadingBills: false,

  fetchPastBills: async () => {
    try {
      set({ loadingBills: true });
      const response = await fetchFromHasura(getPastBills, {
        user_id: useAuthStore.getState().userData?.id
      });
      console.log(response.pos); // Log the fetched data to the console for inspection
      set({ pastBills: response.pos, loadingBills: false });
    } catch (error) {
      console.error('Error fetching past bills:', error);
      set({ loadingBills: false });
      throw error;
    }
  },
  deleteBill: async (billId: string) => {
    try {
      await fetchFromHasura(deleteBillMutation, {
        id: billId
      });
      
      // Update local state after successful deletion
      const currentBills = get().pastBills;
      set({ pastBills: currentBills.filter(bill => bill.id !== billId) });
      
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  }
}));