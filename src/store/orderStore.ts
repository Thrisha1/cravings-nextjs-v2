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
import {
  getExtraCharge,
  getGstAmount,
} from "@/components/hotelDetail/OrderDrawer";
import { subscribeToHasura } from "@/lib/hasuraSubscription";
import { QrGroup } from "@/app/admin/qr-management/page";

export interface OrderItem extends HotelDataMenus {
  quantity: number;
}

export interface DeliveryRules {
  delivery_radius: number;
  first_km_free: number;
  is_fixed_rate: boolean;
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
  };
  phone?: string | null;
  userId?: string;
  user?: {
    phone?: string;
  };
  type?: "table_order" | "delivery" | "pos";
  deliveryAddress?: string | null;
  gstIncluded?: number;
  delivery_charge?: number | null; // Added this field
  extraCharges?:
    | {
        name: string;
        amount: number;
        charge_type?: string;
        id?: string;
      }[]
    | null;
}

export interface DeliveryInfo {
  distance: number;
  cost: number;
  ratePerKm: number;
  isOutOfRange: boolean;
}

interface HotelOrderState {
  items: OrderItem[];
  totalPrice: number;
  order: Order | null;
  orderId: string | null;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
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
  open_order_drawer: boolean;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  deliveryInfo: DeliveryInfo | null;
  deliveryCost: number | null;

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
    extraCharges?:
      | {
          name: string;
          amount: number;
          charge_type?: string;
        }[]
      | null,
    deliveryCharge?: number
  ) => Promise<Order | null>;
  getCurrentOrder: () => HotelOrderState;
  fetchOrderOfPartner: (partnerId: string) => Promise<Order[] | null>;
  setOpenAuthModal: (open: boolean) => void;
  genOrderId: () => string;
  setUserAddress: (address: string) => void;
  setUserCoordinates: (coords: { lat: number; lng: number }) => void;
  subscribeOrders: (callback?: (orders: Order[]) => void) => () => void;
  partnerOrders: Order[];
  userOrders: Order[];
  subscribeUserOrders: (callback?: (orders: Order[]) => void) => () => void;
  deleteOrder: (orderId: string) => Promise<boolean>;
  setOpenOrderDrawer: (open: boolean) => void;
  setDeliveryInfo: (info: DeliveryInfo | null) => void;
  setDeliveryCost: (cost: number | null) => void;
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
      open_order_drawer: false,
      deliveryInfo: null,
      deliveryCost: null,
      coordinates: null,

      setUserCoordinates: (coords) => {
        set({ coordinates: coords });
      },

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
              partner: order.partner,
              userId: order.user_id,
              gstIncluded: order.gst_included,
              extraCharges: order.extra_charges || [], // Handle null case
              delivery_charge: order.delivery_charge, // Include delivery_charge
              user: order.user,
              items: order.order_items.map((i: any) => ({
                id: i.item.id,
                quantity: i.quantity,
                name: i.item?.name || "Unknown",
                price: i.item?.offers?.[0]?.offer_price || i.item?.price || 0,
                category: i.menu?.category,
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
            console.log(data);

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
              extraCharges: order.extra_charges || [], // Handle null case
              delivery_charge: order.delivery_charge, // Include delivery_charge
              userId: order.user_id,
              user: order.user,
              items: order.order_items.map((i: any) => ({
                id: i.item.id,
                quantity: i.quantity,
                name: i.item.name || "Unknown",
                price: i.item?.offers?.[0]?.offer_price || i.item?.price || 0,
                category: i.menu?.category,
                stocks: i.menu?.stocks,
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
              coordinates: null,
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
          return {
            items: [],
            totalPrice: 0,
            order: null,
            orderId: null,
            coordinates: null,
          };
        }
        return (
          state.hotelOrders[state.hotelId] || {
            items: [],
            totalPrice: 0,
            order: null,
            orderId: null,
            coordinates: null,
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
        // const user = useAuthStore.getState().userData;
        // if (!user) {
        //   set({ open_auth_modal: true });
        //   return;
        // }

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

      deleteOrder: async (orderId: string) => {
        try {
          // First delete the order items
          const deleteItemsResponse = await fetchFromHasura(
            `mutation DeleteOrderItems($orderId: uuid!) {
              delete_order_items(where: {order_id: {_eq: $orderId}}) {
                affected_rows
              }
            }`,
            { orderId }
          );

          if (deleteItemsResponse.errors) {
            throw new Error(
              deleteItemsResponse.errors[0]?.message ||
                "Failed to delete order items"
            );
          }

          // Then delete the order itself
          const deleteOrderResponse = await fetchFromHasura(
            `mutation DeleteOrder($orderId: uuid!) {
              delete_orders_by_pk(id: $orderId) {
                id
              }
            }`,
            { orderId }
          );

          if (deleteOrderResponse.errors) {
            throw new Error(
              deleteOrderResponse.errors[0]?.message || "Failed to delete order"
            );
          }

          // Update the local state if needed
          set((state) => {
            // Remove from partnerOrders if present
            const partnerOrders = state.partnerOrders.filter(
              (order) => order.id !== orderId
            );

            // Remove from userOrders if present
            const userOrders = state.userOrders.filter(
              (order) => order.id !== orderId
            );

            return { partnerOrders, userOrders };
          });

          toast.success("Order deleted successfully");
          return true;
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Failed to delete order"
          );
          return false;
        }
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
        extraCharges?:
          | {
              name: string;
              amount: number;
              charge_type?: string;
            }[]
          | null,
        deliveryCharge?: number
      ) => {
        try {
          const state = get();
          if (!state.hotelId) {
            toast.error("No hotel selected");
            return null;
          }

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
          if (!userData?.id || userData?.role !== "user") {
            toast.error("Please login as user to place order");
            return null;
          }

          const type = (tableNumber ?? 0) > 0 ? "table_order" : "delivery";

          // Prepare extra charges array
          const exCharges: {
            name: string;
            amount: number;
            charge_type?: string;
            id?: string;
          }[] = [];

          // Add any provided extra charges
          if (extraCharges && extraCharges.length > 0) {
            extraCharges.forEach((charge) => {
              exCharges.push({
                name: charge.name,
                amount: charge.amount,
                charge_type: charge.charge_type || "FLAT_FEE",
                id: crypto.randomUUID(),
              });
            });
          }

          // Add delivery charge if applicable
          if (type === "delivery" && deliveryCharge && deliveryCharge > 0) {
            exCharges.push({
              name: "Delivery Charge",
              amount: deliveryCharge,
              charge_type: "FLAT_FEE",
              id: crypto.randomUUID(),
            });
          }

          // Calculate subtotal from items
          const subtotal = currentOrder.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          // Calculate total extra charges
          const totalExtraCharges = exCharges.reduce(
            (sum, charge) => sum + charge.amount,
            0
          );

          // Calculate grand total
          const grandTotal = subtotal + (gstIncluded || 0) + totalExtraCharges;

          const createdAt = new Date().toISOString();

          // Create order in database
          const orderResponse = await fetchFromHasura(createOrderMutation, {
            id: crypto.randomUUID(), // Generate new ID for each order
            totalPrice: grandTotal,
            gst_included: gstIncluded,
            extra_charges: exCharges.length > 0 ? exCharges : null,
            createdAt,
            tableNumber: tableNumber || null,
            qrId: qrId || null,
            partnerId: hotelData.id,
            userId: userData.id,
            type,
            status: "pending",
            delivery_address: type === "delivery" ? state.userAddress : null,
            delivery_location:
              type === "delivery"
                ? {
                    type: "Point",
                    coordinates: [
                      state.coordinates?.lng || 0,
                      state.coordinates?.lat || 0,
                    ],
                  }
                : null,
          });

          if (orderResponse.errors || !orderResponse?.insert_orders_one?.id) {
            throw new Error(
              orderResponse.errors?.[0]?.message || "Failed to create order"
            );
          }

          const orderId = orderResponse.insert_orders_one.id;

          // Create order items
          const itemsResponse = await fetchFromHasura(
            createOrderItemsMutation,
            {
              orderItems: currentOrder.items.map((item) => ({
                order_id: orderId,
                menu_id: item.id,
                quantity: item.quantity,
                item: {
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  offers: item.offers,
                  category: item.category,
                },
              })),
            }
          );

          if (itemsResponse.errors) {
            throw new Error(
              itemsResponse.errors?.[0]?.message || "Failed to add order items"
            );
          }

          // Prepare new order object
          const newOrder: Order = {
            id: orderId,
            items: currentOrder.items,
            totalPrice: grandTotal,
            createdAt,
            tableNumber: tableNumber || null,
            qrId: qrId || null,
            status: "pending",
            partnerId: hotelData.id,
            userId: userData.id,
            user: {
              phone: userData.phone || "N/A",
            },
            gstIncluded,
            extraCharges: exCharges,
          };

          // Update state
          set((state) => ({
            ...state,
            hotelOrders: {
              ...state.hotelOrders,
              [state.hotelId!]: {
                items: [],
                totalPrice: 0,
                order: newOrder,
                orderId: null,
                coordinates: null,
              },
            },
            order: newOrder,
            items: [],
            orderId: null,
            totalPrice: 0,
          }));

          toast.success("Order placed successfully!");
          return newOrder;
        } catch (error) {
          console.error("Order placement error:", error);
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
                gst_included
                extra_charges
                delivery_charge
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
            gstIncluded: order.gst_included,
            extraCharges: order.extra_charges || [],
            delivery_charge: order.delivery_charge,
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
              coordinates: null,
            };
          }

          return {
            hotelOrders,
            items: [],
            orderId: newOrderId,
            totalPrice: 0,
            order: null,
            coordinates: null,
          };
        });
      },

      setOpenOrderDrawer: (open: boolean) => set({ open_order_drawer: open }),

      setDeliveryInfo: (info: DeliveryInfo | null) =>
        set({ deliveryInfo: info }),

      setDeliveryCost: (cost: number | null) => set({ deliveryCost: cost }),
    }),
    {
      name: "order-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useOrderStore;
