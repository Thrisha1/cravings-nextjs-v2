import { create } from "zustand";
import { MenuItem } from "./menuStore_hasura";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { Partner, useAuthStore } from "./authStore";
import {
  getGstAmount,
} from "@/components/hotelDetail/OrderDrawer";
import {
  createOrderItemsMutation,
  createOrderMutation,
  getOrdersOfPartnerQuery,
} from "@/api/orders";
import { deleteBillMutation } from "@/api/pos";
import { Order, OrderItem } from "./orderStore";
import { v4 as uuidv4 } from "uuid";
import { getExtraCharge } from "@/lib/getExtraCharge";

interface CartItem extends MenuItem {
  quantity: number;
  offers?: {
    offer_price: number;
  }[];
}

export interface ExtraCharge {
  name: string;
  amount: number;
  id: string;
}

interface POSState {
  loading: boolean;
  cartItems: CartItem[];
  extraCharges: ExtraCharge[];
  totalAmount: number ;
  userPhone: string | null;
  deliveryAddress?: string;
  setDeliveryAddress: (address: string) => void;
  setUserPhone: (phone: string | null) => void;
  tableNumbers: number[];
  tableNumber: number | null;
  setTableNumber: (tableNumber: number | null) => void;
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
  addExtraCharge: (charge: Omit<ExtraCharge, "id">) => void;
  removeExtraCharge: (chargeId: string) => void;
  calculateTotalWithCharges: () => number;
}

export const usePOSStore = create<POSState>((set, get) => ({
  loading: false,
  cartItems: [],
  extraCharges: [],
  totalAmount: 0,
  order: null,
  userPhone: null,
  tableNumber: null,
  tableNumbers: [],
  postCheckoutModalOpen: false,
  editOrderModalOpen: false,
  deliveryAddress: "",

  setDeliveryAddress: (address: string) => {
    set({ deliveryAddress: address });
    const order = get().order;
    if (order) {
      set({
        order: {
          ...order,
          deliveryAddress: address,
        },
      });
    }
    
  },

  setPostCheckoutModalOpen: (open) => {
    set({ postCheckoutModalOpen: open });
    if (!open) {
      get().clearCart();
    }
  },
  setEditOrderModalOpen: (open) => set({ editOrderModalOpen: open }),
  getPartnerTables: async () => {
    try {
      const response = await fetchFromHasura(
        `
        query MyQuery($partner_id: uuid!) {
          qr_codes(where: {partner_id: {_eq: $partner_id}}, order_by: {table_number: asc}) {
            table_number
          }
        }
      `,
        {
          partner_id: useAuthStore.getState().userData?.id,
        }
      );

      const tableNumbers = response.qr_codes.map(
        (table: { table_number: number }) => table.table_number
      );
      set({ tableNumbers });
    } catch (error) {
      console.error("Error fetching partner tables:", error);
      throw error;
    }
  },

  setTableNumber: (tableNumber: number | null) => {
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
    set({ cartItems: [], totalAmount: 0, extraCharges: [] });
  },

  addExtraCharge: (charge: Omit<ExtraCharge, "id">) => {
    const newCharge = {
      ...charge,
      id: uuidv4(),
    };
    set((state) => ({
      extraCharges: [...state.extraCharges, newCharge],
    }));
  },

  removeExtraCharge: (chargeId: string) => {
    set((state) => ({
      extraCharges: state.extraCharges.filter(
        (charge) => charge.id !== chargeId
      ),
    }));
  },

  calculateTotalWithCharges: () => {
    const { cartItems, extraCharges } = get();
    const hotelData = useAuthStore.getState().userData as Partner;
    const gstPercentage = hotelData?.gst_percentage || 0;

    // Calculate food subtotal
    const foodSubtotal = cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Calculate charges subtotal
    const chargesSubtotal = extraCharges.reduce(
      (total, charge) => total + charge.amount,
      0
    );

    // Calculate GST on both food and all extra charges
    const gstAmount = getGstAmount(
      foodSubtotal + chargesSubtotal,
      gstPercentage
    );

    // Return grand total
    return foodSubtotal + chargesSubtotal + gstAmount;
  },

  checkout: async () => {
    try {
      set({ loading: true });
      const { cartItems, extraCharges } = get();
      const userId = useAuthStore.getState().userData?.id;
      const hotelData = useAuthStore.getState().userData as Partner;
      const gstPercentage = hotelData?.gst_percentage || 0;

      if (!userId) {
        throw new Error("User ID is not available");
      }

      // Calculate amounts
      const foodSubtotal = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const grandTotal =
        foodSubtotal +
        getExtraCharge(
          cartItems as OrderItem[],
          extraCharges[0]?.amount || 0,
          "FLAT_FEE"
        ) +
        getGstAmount(foodSubtotal, gstPercentage);

      const orderId = uuidv4(); 
      const newOrder = {
        id: orderId,
        totalPrice: grandTotal,
        createdAt: new Date().toISOString(),
        tableNumber: get().tableNumber,
        status: "completed" as "completed",
        partnerId: userId,
        type: "pos",
        phone: get().userPhone,
        extra_charges: extraCharges,
        gst_included: gstPercentage,
        delivery_address: get().deliveryAddress || "",
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
          item: {
            id: item.id,
            name: item.name,
            price: item.price,
            offers: item.offers,
          },
        })),
      });

      if (itemsResponse.errors) {
        throw new Error(
          itemsResponse.errors?.[0]?.message || "Failed to add order items"
        );
      }

      set({
        loading: false,
        order: {
          ...newOrder,
          items: cartItems,
          extraCharges: extraCharges,
          deliveryAddress: get().deliveryAddress || "", 
        } as unknown as Order,
      });
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

      const currentBills = get().pastBills;
      set({ pastBills: currentBills.filter((bill) => bill.id !== billId) });
    } catch (error) {
      console.error("Error deleting bill:", error);
      throw error;
    }
  },
}));
