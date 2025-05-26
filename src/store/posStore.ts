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
import { v4 as uuidv4 } from "uuid";

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
  tableNumber: null,
  tableNumbers: [],
  postCheckoutModalOpen: false,
  editOrderModalOpen: false,
  isCaptainOrder: false,
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
  setIsCaptainOrder: (isCaptain) => set({ isCaptainOrder: isCaptain }),
  getPartnerTables: async () => {
    try {
      const userData = useAuthStore.getState().userData;
      console.log("Getting partner tables with user data:", {
        userData,
        role: userData?.role,
        partnerId: userData?.role === "captain" ? (userData as Captain)?.partner_id : userData?.id
      });

      // Wait for user data to be loaded
      if (!userData) {
        console.log("User data not loaded yet, waiting...");
        return;
      }

      // For captains, we need their partner_id
      if (userData.role === "captain") {
        const captainData = userData as Captain;
        if (!captainData.partner_id) {
          console.error("Captain data missing partner_id:", captainData);
          return;
        }
        const partnerId = captainData.partner_id;
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
      } else {
        // For partners, use their own ID
        const partnerId = userData.id;
        console.log("Fetching tables for partner ID:", partnerId);

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

        if (!response.qr_codes || !Array.isArray(response.qr_codes)) {
          console.error("Invalid response format:", response);
          return;
        }

        const tableNumbers = response.qr_codes
          .filter((qr: any) => qr.table_number !== null && qr.table_number !== undefined)
          .map((qr: any) => Number(qr.table_number))
          .sort((a: number, b: number) => a - b);

        set({ tableNumbers });
      }
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

      const orderId = uuidv4();
      const createdAt = new Date().toISOString();

      console.log("Creating order with details:", {
        orderId,
        partnerId,
        userId,
        isCaptainOrder,
        createdAt,
        totalPrice: grandTotal,
        type: "pos",
        status: "completed" as "completed",
        tableNumber: get().tableNumber,
        extraCharges: extraCharges,
        gstIncluded: gstPercentage,
        captainId: isCaptainOrder ? userId : null
      });

      // Create order in database
      const orderResponse = await fetchFromHasura(createOrderMutation, {
        id: orderId,
        totalPrice: grandTotal,
        gst_included: gstPercentage,
        extra_charges: extraCharges.length > 0 ? extraCharges : null,
        createdAt,
        tableNumber: get().tableNumber || null,
        qrId: null,
        partnerId,
        userId: isCaptainOrder ? null : userId,
        type: "pos",
        status: "completed" as "completed",
        delivery_address: get().deliveryAddress || null,
        delivery_location: null,
        orderedby: isCaptainOrder ? "captain" : null,
        captain_id: isCaptainOrder ? userId : null
      });

      if (orderResponse.errors || !orderResponse?.insert_orders_one?.id) {
        console.error("Order creation failed:", {
          errors: orderResponse.errors,
          sentData: {
            id: orderId,
            totalPrice: grandTotal,
            partnerId,
            type: "pos",
            status: "completed" as "completed",
            tableNumber: get().tableNumber,
            extraCharges: extraCharges,
            gstIncluded: gstPercentage,
            captainId: isCaptainOrder ? userId : null
          }
        });
        throw new Error(orderResponse.errors?.[0]?.message || "Failed to create order");
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
          ...orderResponse.insert_orders_one,
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
