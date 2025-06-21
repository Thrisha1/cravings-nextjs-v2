import { create } from "zustand";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { partnerMutation, partnerQuery } from "@/api/auth";
import { DeliveryRules } from "./orderStore";

export interface GeoLocation {
  type: "Point";
  coordinates: [number, number];
  crs?: {
    type: string;
    properties: {
      name: string;
    };
  };
}

export interface Partner {
  id: string;
  email: string;
  role: "partner";
  name: string;
  password: string;
  store_name: string;
  store_banner?: string;
  location: string;
  status: string;
  upi_id: string;
  description: string | null;
  whatsapp_numbers: {
    number: string;
    area: string;
  }[];
  phone: string;
  district: string;
  delivery_status: boolean;
  geo_location: GeoLocation;
  delivery_rate: number;
  delivery_rules: DeliveryRules;
  place_id?: string;
  theme?: string;
  currency: string;
  feature_flags?: string;
  footnote?: string;
  social_links?: string;
  gst_no?: string;
  gst_percentage?: number;
  business_type?: string;
  is_shop_open: boolean;
  country?: string;
  country_code?: string;
  distance_meters?: number;
}

interface SuperAdminPartnerState {
  loading: boolean;
  error: string | null;
  createPartner: (
    email: string,
    password: string,
    hotelName: string,
    area: string,
    location: string,
    phone: string,
    upiId: string,
    country: string,
    state: string
  ) => Promise<Partner>;
}

export const useSuperAdminPartnerStore = create<SuperAdminPartnerState>((set) => ({
  loading: false,
  error: null,

  createPartner: async (
    email: string,
    password: string,
    hotelName: string,
    area: string,
    location: string,
    phone: string,
    upiId: string,
    country: string,
    state: string
  ) => {
    set({ loading: true, error: null });
    try {
      const existingPartner = await fetchFromHasura(partnerQuery, { email });
      if (existingPartner?.partners?.length > 0) {
        throw new Error("A partner account with this email already exists");
      }

      const response = (await fetchFromHasura(partnerMutation, {
        object: {
          email,
          password,
          name: hotelName,
          store_name: hotelName,
          location,
          district: area,
          status: "active", // Always set to active for superadmin
          upi_id: upiId,
          country,
          state,
          phone,
          description: "",
          role: "partner",
        },
      })) as { insert_partners_one: Partner };

      if (!response?.insert_partners_one) {
        throw new Error("Failed to create partner account");
      }

      set({ loading: false });
      return response.insert_partners_one;
    } catch (error) {
      console.error("SuperAdmin partner creation failed:", error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : "Failed to create partner" 
      });
      throw error;
    }
  },
})); 