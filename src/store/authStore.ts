import { create } from "zustand";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { getUserByIdQuery, partnerMutation, partnerQuery, userLoginMutation, userLoginQuery, partnerLoginQuery, superAdminLoginQuery, partnerIdQuery, superAdminIdQuery } from "@/api/auth";
import { encryptText, decryptText } from "@/lib/encrtption";

// Base interface with common properties
interface BaseUser {
  id: string;
  email: string;
  role: 'user' | 'partner' | 'superadmin';
}

export interface User extends BaseUser {
  role: 'user';
  password: string;
  full_name: string;
  phone: string;
  crave_coins: number;
  location: string | null;
}

export interface Partner extends BaseUser {
  role: 'partner';
  name: string;
  password: string;
  store_name: string;
  location: string;
  status: string;
  upi_id: string;
  description: string | null;
  phone: string;
  district: string;
}

export interface SuperAdmin extends BaseUser {
  role: 'superadmin';
  password: string;
}

// Union type for all possible user types
export type AuthUser = User | Partner | SuperAdmin;

interface AuthState {
  userData: AuthUser | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signUpWithEmailForPartner: (
    email: string,
    password: string,
    hotelName: string,
    area: string,
    location: string,
    phone: string,
    upiId: string
  ) => Promise<void>;
  signInWithPhone: (phone: string) => Promise<void>;
  signInPartnerWithEmail: (email: string, password: string) => Promise<void>;
  signInSuperAdminWithEmail: (email: string, password: string) => Promise<void>;
  fetchUser: () => Promise<void>;
  isLoggedIn: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userData: null,
  loading: true,
  error: null,

  isLoggedIn : async () => {
    const sysbio = localStorage.getItem("sysbio");
    if (!sysbio) {
      return false;
    }else{
      return true;
    }
  },

  fetchUser: async () => {
    try {
      set({ loading: true });
      const stored = localStorage.getItem("sysbio");
      if (!stored) return;
  
      const decrypted = decryptText(stored) as { id: string; role: AuthUser['role'] };
  
      if (!decrypted || !decrypted.id || !decrypted.role) {
        throw new Error("Invalid session data");
      }
  
      const { id, role } = decrypted;

      let result;
  
      if (role === "user") {
        const response = await fetchFromHasura(getUserByIdQuery, { id });
        const user = await response?.users_by_pk
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
              role: "user"
            } as User
          });
        }
      } else if (role === "partner") {
        const response = await fetchFromHasura(partnerIdQuery, { id });
        const partner = response?.partners_by_pk
        if (partner) {
          set({ 
            userData: {
              ...partner,
              password: "",
              role: "partner"
            }  as Partner
          });
        }
      } else if (role === "superadmin") {
        const response = await fetchFromHasura(superAdminIdQuery, { id });
        const superAdmin = response?.super_admins_by_pk
        if (superAdmin) {
          set({ 
            userData: {
              ...superAdmin,
              password: "",
              role: "superadmin"
            } as SuperAdmin
          });
        }
      }
      
      set({ loading: false });
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  },

  signOut: async () => {
    try {
      localStorage.removeItem('sysbio');
      set({ userData: null, error: null });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    // Implementation remains the same
  },

  signUpWithEmailForPartner: async (
    hotelName: string,
    phone: string,
    upiId: string,
    area: string,
    location: string,
    email: string,
    password: string,
  ) => {
    try {
      const existingPartner = await fetchFromHasura(partnerQuery, {
        email: email
      }) as { partners: Partner[] };

      if (existingPartner?.partners?.length > 0) {
        throw new Error("A partner account with this email already exists");
      }

      const partnerData = {
        email: email,
        password: password,
        name: hotelName,
        store_name: hotelName,
        location: location,
        district: area,
        status: "inactive",
        upi_id: upiId,
        phone: phone,
        description: "",
        role: "partner",
      };

      const response = await fetchFromHasura(partnerMutation, {
        object: partnerData
      }) as { insert_partners_one: Partner };

      if (!response?.insert_partners_one) {
        throw new Error("Failed to create partner account");
      }

      const newPartner = response.insert_partners_one;
      set({
        userData: {
          ...newPartner,
          role: "partner"
        }
      });

      const Data = {
        id: newPartner.id,
        role: "partner",
      }

      const partnerHashedId = encryptText(Data);
      localStorage.setItem("sysbio", partnerHashedId);

    } catch (error) {
      console.error("Partner registration failed:", error);
      throw error;
    }
  },

  signInPartnerWithEmail: async (email: string, password: string) => {
    try {
      const response = await fetchFromHasura(partnerLoginQuery, {
        email: email,
        password: password
      }) as { partners: Partner[] };
  
      if (!response?.partners?.length) {
        throw new Error("Invalid email or password");
      }
  
      const partner = response.partners[0];      
  
      if (partner.status !== "active") {
        throw new Error("Your account is not active. Please contact support.");
      }
      
      const Data = {
        id: partner.id,
        role: "partner",
      }

      const partnerHashedId = encryptText(Data);
      localStorage.setItem("sysbio", partnerHashedId);

      set({
        userData: {
          ...partner,
          role: "partner"
        }
      });
  
    } catch (error) {
      console.error("Partner login failed:", error);
      throw error instanceof Error ? error : new Error("Failed to sign in. Please try again");
    }
  },

  signInWithPhone: async (phone: string): Promise<void> => {
    try {
      const email = `${phone}@user.com`;

      const hasuraUserResponse = await fetchFromHasura(userLoginQuery, {
        email: email
      }) as { users: User[] };

      if (hasuraUserResponse?.users?.length > 0) {
        const user = hasuraUserResponse.users[0];
        
        const Data = {
          id: user.id,
          role: "user",
        }
        
        const userhashedId = encryptText(Data);
        localStorage.setItem("sysbio", userhashedId);

        set({
          userData: {
            ...user,
            role: "user"
          }
        });
        return;
      }
      
      // Create new user
      const hasuraUser = {
        email: email,
        password: phone,
        full_name: `User${phone.slice(0, 5)}`,
        phone: phone,
        crave_coins: 100,
        location: null,
        role: "user"
      }
      
      const response = await fetchFromHasura(userLoginMutation, {
        object: hasuraUser
      }) as { insert_users_one: User };

      if (!response?.insert_users_one) {
        throw new Error("Failed to create user"); 
      }

      const user = response.insert_users_one;

      const Data = {
        id: user.id,
        role: "user",
      }

      const userhashedId = encryptText(Data);
      localStorage.setItem("sysbio", userhashedId);

      set({
        userData: {
          ...user,
          role: "user"
        }  
      });

    } catch (error) {
      console.error("Phone sign-in failed:", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred");
    }
  },
  
  signInSuperAdminWithEmail: async (email: string, password: string) => {
    try {
      const response = await fetchFromHasura(superAdminLoginQuery, {
        email: email,
        password: password
      }) as { super_admins: SuperAdmin[] };

      if (!response?.super_admins?.length) {
        throw new Error("Invalid email or password");
      }

      const superAdmin = response.super_admins[0];

      const Data = {
        id: superAdmin.id,
        role: "superadmin",
      }

      const superAdminHashedId = encryptText(Data);
      localStorage.setItem("sysbio", superAdminHashedId);

      set({
        userData: {
          ...superAdmin,
          role: "superadmin"
        }
      });

    } catch (error) {
      console.error("Super admin login failed:", error);
      throw error instanceof Error ? error : new Error("Failed to sign in. Please try again");
    }
  },
}));