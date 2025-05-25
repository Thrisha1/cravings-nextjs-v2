import { create } from "zustand";
import { MenuItem } from "./menuStore_hasura";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { Partner, Captain, useAuthStore } from "./authStore";
import {
  getExtraCharge,
  getGstAmount,
} from "@/components/hotelDetail/OrderDrawer";
import {
  createOrderItemsMutation,
  createOrderMutation,
  getOrdersOfPartnerQuery,
} from "@/api/orders";
import { deleteBillMutation } from "@/api/pos";
import { Order, OrderItem } from "./orderStore";

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
  totalAmount: number;
  userPhone: string | null;
  setUserPhone: (phone: string | null) => void;
  tableNumbers: number[];
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
  addExtraCharge: (charge: Omit<ExtraCharge, "id">) => void;
  removeExtraCharge: (chargeId: string) => void;
  calculateTotalWithCharges: () => number;
  isCaptainOrder: boolean;
  setIsCaptainOrder: (isCaptain: boolean) => void;
}

export const usePOSStore = create<POSState>((set, get) => ({
  loading: false,
  cartItems: [],
  extraCharges: [],
  totalAmount: 0,
  order: null,
  userPhone: null,
  tableNumber: 0,
  tableNumbers: [],
  postCheckoutModalOpen: false,
  editOrderModalOpen: false,
  isCaptainOrder: false,

  setPostCheckoutModalOpen: (open) => {
    set({ postCheckoutModalOpen: open });
    if (!open) {
      get().clearCart();
    }
  },
  setEditOrderModalOpen: (open) => set({ editOrderModalOpen: open }),
  setIsCaptainOrder: (isCaptain) => set({ isCaptainOrder: isCaptain }),
  getPartnerTables: async () => {
    try {
      const userData = useAuthStore.getState().userData;
      if (!userData || userData.role !== "captain") {
        console.error("User is not a captain:", userData);
        return;
      }

      const partnerId = (userData as Captain).partner_id;
      console.log("Fetching tables for partner ID:", partnerId, "from captain:", userData);

      const response = await fetchFromHasura(
        `
        query GetPartnerTables($partner_id: uuid!) {
          qr_codes(where: {partner_id: {_eq: $partner_id}}) {
            id
            qr_number
            table_number
            partner_id
            no_of_scans
          }
        }
      `,
        {
          partner_id: partnerId,
        }
      );

      console.log("All QR codes for partner:", response.qr_codes);
      
      if (!response.qr_codes || !Array.isArray(response.qr_codes)) {
        console.error("Invalid response format:", response);
        return;
      }

      // Get all table numbers, including 0
      const tableNumbers = response.qr_codes
        .filter((qr: any) => qr.table_number !== null && qr.table_number !== undefined)
        .map((qr: any) => Number(qr.table_number))
        .sort((a: number, b: number) => a - b); // Sort numerically

      console.log("Extracted table numbers:", tableNumbers);
      
      if (tableNumbers.length === 0) {
        console.warn("No table numbers found in qr_codes for partner:", partnerId);
        // Log all QR codes that might have null table numbers
        response.qr_codes.forEach((qr: any) => {
          if (qr.table_number === null || qr.table_number === undefined) {
            console.log("QR code with null/undefined table number:", qr);
          }
        });
      }

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
    set({ cartItems: [], totalAmount: 0, extraCharges: [] });
  },

  addExtraCharge: (charge: Omit<ExtraCharge, "id">) => {
    const newCharge = {
      ...charge,
      id: crypto.randomUUID(),
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
      const { cartItems, extraCharges, isCaptainOrder } = get();
      const userData = useAuthStore.getState().userData;
      console.log("User Data:", {
        id: userData?.id,
        role: userData?.role,
        partner_id: (userData as Captain)?.partner_id,
        raw: userData
      });
      
      const userId = userData?.id;
      
      // Get partner ID based on user type
      let partnerId: string;
      let gstPercentage: number;
      if (userData?.role === "captain") {
        const captainData = userData as Captain;
        partnerId = captainData.partner_id;
        console.log("Captain Data:", {
          id: captainData.id,
          partner_id: captainData.partner_id,
          role: captainData.role
        });
        gstPercentage = captainData.gst_percentage || 0;
      } else {
        const partnerData = userData as Partner;
        partnerId = partnerData.id;
        console.log("Partner Data:", {
          id: partnerData.id,
          role: partnerData.role
        });
        gstPercentage = partnerData.gst_percentage || 0;
      }
      
      console.log("Final partnerId being used:", partnerId);
      
      if (!userId || !partnerId) {
        throw new Error("User ID or Partner ID is not available");
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

      const orderId = crypto.randomUUID();
      
      // Ensure we're using the correct partner ID
      const finalPartnerId = userData?.role === "captain" 
        ? (userData as Captain).partner_id 
        : (userData as Partner).id;

      console.log("Order creation details:", {
        captainId: userData?.id,
        partnerId: finalPartnerId,
        role: userData?.role,
        isCaptainOrder
      });

      const newOrder = {
        id: orderId,
        totalPrice: grandTotal,
        createdAt: new Date().toISOString(),
        tableNumber: get().tableNumber,
        status: "completed" as "completed",
        partnerId: finalPartnerId, // Use the explicitly determined partner ID
        type: "table_order",
        phone: get().userPhone,
        extra_charges: extraCharges,
        gst_included: gstPercentage,
        orderedby: isCaptainOrder ? "captain" : "admin"
      };

      const orderResponse = await fetchFromHasura(
        createOrderMutation,
        newOrder
      );

      if (orderResponse.errors || !orderResponse?.insert_orders_one?.id) {
        console.error("Order creation failed:", {
          errors: orderResponse.errors,
          sentData: newOrder,
          userData: {
            id: userData?.id,
            role: userData?.role,
            partner_id: (userData as Captain)?.partner_id
          }
        });
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
