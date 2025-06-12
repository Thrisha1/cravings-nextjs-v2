import { create } from "zustand";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { Order } from "./orderStore";
import { toast } from "sonner";

interface CaptainOrder {
  id: string;
  status: string;
  created_at: string;
  total_price: number;
  table_number: number;
  phone: string;
  order_items: Array<{
    id: string;
    quantity: number;
    menu: {
      id: string;
      name: string;
      price: number;
      category: { name: string };
    };
  }>;
}

interface UserState {
  userOrders: Order[];
  captainOrders: CaptainOrder[];
  fetchOrderOfPartner: (partnerId: string) => Promise<Order[] | null>;
  fetchCaptainOrders: (partner_id: string) => Promise<CaptainOrder[] | null>;
  setUserOrders: (orders: Order[]) => void;
  setCaptainOrders: (orders: CaptainOrder[]) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  userOrders: [],
  captainOrders: [],

  fetchOrderOfPartner: async (partnerId: string) => {
    try {
      // First fetch the orders with captain data included
      const ordersResponse = await fetchFromHasura(
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
            delivery_location
            status
            status_history
            partner_id
            gst_included
            extra_charges
            phone
            user_id
            orderedby
            captain_id
            captainid {
              id
              name
              email
            }
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
                  id
                  name
                  priority
                }
                description
                image_url
                is_top
                is_available
                priority
                stocks {
                  stock_quantity
                  id
                }
              }
            }
          }
        }`,
        { partnerId }
      );

      if (ordersResponse.errors) {
        throw new Error(
          ordersResponse.errors[0]?.message || "Failed to fetch orders"
        );
      }

      const orders = ordersResponse.orders.map((order: any) => {
        // Ensure captain data is properly structured
        const captainData = order.captainid ? {
          id: order.captainid.id,
          name: order.captainid.name,
          email: order.captainid.email
        } : null;

        return {
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
          delivery_location: order.delivery_location,
          gstIncluded: order.gst_included,
          extraCharges: order.extra_charges || [],
          delivery_charge: order.delivery_charge,
          status_history: order.status_history,
          userId: order.user_id,
          user: order.user,
          orderedby: order.orderedby,
          captain_id: order.captain_id,
          captain: captainData,  // Use the properly structured captain data
          items: order.order_items.map((i: any) => ({
            id: i.menu?.id,
            quantity: i.quantity,
            name: i.menu?.name || "Unknown",
            price: i.menu?.offers?.[0]?.offer_price || i.menu?.price || 0,
            category: i.menu?.category,
            stocks: i.menu?.stocks,
          })),
        };
      });

      set({ userOrders: orders });
      return orders;
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
      return null;
    }
  },

  fetchCaptainOrders: async (partner_id: string) => {
    try {
      const response = await fetchFromHasura(
        `
        query GetCaptainOrders($partner_id: uuid!) {
          orders(where: {partner_id: {_eq: $partner_id}, orderedby: {_eq: "captain"}}, order_by: {created_at: desc}) {
            id
            status
            created_at
            total_price
            table_number
            phone
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
        }
      `,
        { partner_id }
      );
      if (response.orders) {
        set({ captainOrders: response.orders });
        return response.orders;
      }
      return null;
    } catch (error) {
      toast.error("Failed to load captain orders");
      return null;
    }
  },

  setUserOrders: (orders: Order[]) => {
    set({ userOrders: orders });
  },
  setCaptainOrders: (orders: CaptainOrder[]) => {
    set({ captainOrders: orders });
  },
})); 