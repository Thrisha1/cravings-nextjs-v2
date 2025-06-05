import { create } from "zustand";
import { fetchFromHasura } from "@/lib/hasuraClient";
import {
  getUserByIdQuery,
  partnerMutation,
  partnerQuery,
  userLoginMutation,
  userLoginQuery,
  partnerLoginQuery,
  superAdminLoginQuery,
  partnerIdQuery,
  superAdminIdQuery,
} from "@/api/auth";
import { encryptText, decryptText } from "@/lib/encrtption";
import {
  getAuthCookie,
  setAuthCookie,
  removeAuthCookie,
  removeLocationCookie,
} from "@/app/auth/actions";
import { sendRegistrationWhatsAppMsg } from "@/app/actions/sendWhatsappMsgs";
import { FeatureFlags, getFeatures } from "@/lib/getFeatures";
import { DeliveryRules } from "./orderStore";

// Interfaces remain the same
interface BaseUser {
  id: string;
  email: string;
  role: "user" | "partner" | "superadmin";
}
export interface GeoLocation {
  type: "Point"; // likely always "Point" in your case
  coordinates: [number, number]; // [longitude, latitude]
  crs?: {
    type: string;
    properties: {
      name: string;
    };
  };
}

export interface User extends BaseUser {
  role: "user";
  password: string;
  full_name: string;
  phone: string;
  crave_coins: number;
  location: string | null;
}

export interface Partner extends BaseUser {
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
    number : string;
    area : string;
  }[];
  phone: string;
  district: string;
  delivery_status: boolean;
  geo_location: GeoLocation ;
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
  country_code?: string;
  country?: string;
  state?: string;
}

export interface SuperAdmin extends BaseUser {
  role: "superadmin";
  password: string;
}

export type AuthUser = User | Partner | SuperAdmin;


interface AuthState {
  userData: AuthUser | null;
  features: FeatureFlags | null;
  loading: boolean;
  error: string | null;
  signOut: () => void;
  signUpWithEmailForPartner: (
    email: string,
    password: string,
    hotelName: string,
    area: string,
    phone: string,
    upiId: string,
    country: string,
    state: string
  ) => Promise<void>;
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
  signInWithPhone: (phone: string, partnerId?: string) => Promise<User | null>;
  signInPartnerWithEmail: (email: string, password: string) => Promise<void>;
  signInSuperAdminWithEmail: (email: string, password: string) => Promise<void>;
  fetchUser: () => Promise<void>;
  isLoggedIn: () => boolean;
  setState: (udpatedUser: Partial<User> | Partial<Partner>) => void;
}

// Cookie management functions
// const setAuthCookie = async (data: { id: string; role: string }) => {
//   const encrypted = encryptText(data);
//   (await cookies()).set('auth_token', encrypted, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     maxAge: 60 * 60 * 24 * 7, // 1 week
//     path: '/',
//     sameSite: 'lax',
//   });
// };

// const getAuthCookie = async () => {
//   const cookie = (await cookies()).get('auth_token')?.value;
//   console.log("Cookie value:", cookie);
//   return cookie ? decryptText(cookie) as { id: string; role: string } : null;
// };

// const removeAuthCookie = async () => {
//   (await cookies()).delete('auth_token');
// };

export const useAuthStore = create<AuthState>((set, get) => ({
  userData: null,
  loading: true,
  error: null,
  features : null,

  isLoggedIn: () => {
    return !!getAuthCookie();
  },

  fetchUser: async () => {
    try {
      set({ loading: true });
      const authData = await getAuthCookie();

      if (!authData || !authData.id || !authData.role) {
        return;
      }

      const { id, role } = authData;

      if (role === "user") {
        const response = await fetchFromHasura(getUserByIdQuery, { id });
        const user = response?.users_by_pk;
        if (user) {
          set({
            userData: {
              id: user.id,
              email: user.email,
              full_name: user.full_name,
              phone: user.phone,
              crave_coins: user.crave_coins,
              location: user.location,
              password: "",
              role: "user",
              place_id: user.place_id,
              theme: user.theme,
            } as User,
          });
        }
      } else if (role === "partner") {
        const response = await fetchFromHasura(partnerIdQuery, { id });
        const partner = response?.partners_by_pk;

        if (partner) {
          set({
            userData: {
              ...partner,
              password: "",
              currency: partner.currency,
              whatsapp_numbers : partner.whatsapp_numbers,
              geo_location : {
                type : partner.geo_location?.type,
                coordinates : partner.geo_location?.coordinates,
              },
              role: "partner",
            } as Partner,
            features : getFeatures(partner.feature_flags)
          });
        }
      } else if (role === "superadmin") {
        const response = await fetchFromHasura(superAdminIdQuery, { id });
        const superAdmin = response?.super_admin_by_pk;
        if (superAdmin) {
          set({
            userData: {
              ...superAdmin,
              password: "",
              role: "superadmin",
            } as SuperAdmin,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      await removeAuthCookie();
      set({ userData: null });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async() => {
    await removeAuthCookie();
    await removeLocationCookie();
    localStorage.clear();
    window.location.href = "/";
    set({ userData: null, error: null });
  },

  signUpWithEmailForPartner: async (
    hotelName: string,
    phone: string,
    upiId: string,
    area: string,
    email: string,
    password: string,
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
          district: area,
          status: "inactive",
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

      const newPartner = response.insert_partners_one;
      setAuthCookie({ id: newPartner.id, role: "partner" , feature_flags: newPartner.feature_flags || "" , status : "inactive" });
      set({ userData: { ...newPartner, role: "partner" }, loading: false , features : getFeatures(newPartner?.feature_flags as string) });
    } catch (error) {
      console.error("Partner registration failed:", error);
      throw error;
    }
  },

  signInPartnerWithEmail: async (email: string, password: string) => {
    try {
      const response = (await fetchFromHasura(partnerLoginQuery, {
        email,
        password,
      })) as { partners: Partner[] };

      const partner = response?.partners?.[0];
      if (!partner) throw new Error("Invalid credentials");

      await setAuthCookie({ id: partner.id, role: "partner" , feature_flags: partner.feature_flags || "" , status: partner.status || "inactive" });
      set({ userData: { ...partner, role: "partner" } , features : getFeatures(partner?.feature_flags as string) });
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  },

  signInWithPhone: async (phone: string, partnerId?: string) => {
    try {
      const email = `${phone}@user.com`;
      const response = (await fetchFromHasura(userLoginQuery, { email })) as {
        users: User[];
      };

      let user: User;
      if (response?.users?.length > 0) {
        user = response.users[0];
      } else {
        const createResponse = (await fetchFromHasura(userLoginMutation, {
          object: {
            email,
            password: phone,
            full_name: `User${phone.slice(0, 5)}`,
            phone,
            crave_coins: 100,
            location: null,
            role: "user",
          },
        })) as { insert_users_one: User };

        if (!createResponse?.insert_users_one) {
          throw new Error("Failed to create user");
        }
        user = createResponse.insert_users_one;

        if (partnerId) {
          await sendRegistrationWhatsAppMsg(user.id, partnerId);
        } else {
          await sendRegistrationWhatsAppMsg(user.id);
        }
      }

      setAuthCookie({ id: user.id, role: "user" , feature_flags: "" , status : "active"});
      set({ userData: { ...user, role: "user" } });
      return {
        ...user,
        role: "user",
      };
    } catch (error) {
      console.error("Phone sign-in failed:", error);
      return null;
    }
  },

  signInSuperAdminWithEmail: async (email: string, password: string) => {
    try {
      const response = (await fetchFromHasura(superAdminLoginQuery, {
        email,
        password,
      })) as { super_admin: SuperAdmin[] };

      if (!response?.super_admin?.length) {
        throw new Error("Invalid email or password");
      }

      const superAdmin = response.super_admin[0];
      setAuthCookie({ id: superAdmin.id, role: "superadmin" , feature_flags: "" , status : "active" });
      set({ userData: { ...superAdmin, role: "superadmin" } });
    } catch (error) {
      console.error("Super admin login failed:", error);
      throw error;
    }
  },

  setState: (udpatedUser: Partial<User> | Partial<Partner>) => {
    set({
      userData: {
        ...get().userData,
        ...udpatedUser,
      } as AuthUser,
    });
  },

  createPartner: async (
    hotelName: string,
    phone: string,
    upiId: string,
    area: string,
    location: string,
    email: string,
    password: string
  ) => {
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
          status: "active",
          upi_id: upiId,
          phone,
          description: "",
          role: "partner",
        },
      })) as { insert_partners_one: Partner };

      if (!response?.insert_partners_one) {
        throw new Error("Failed to create partner account");
      }

      return response.insert_partners_one;
    } catch (error) {
      console.error("Partner creation failed:", error);
      throw error;
    }
  },
}));
