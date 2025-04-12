import { create } from "zustand";
import { auth } from "@/lib/firebase";
import { MenuItem } from "@/screens/HotelMenuPage";
import { revalidateTag } from "@/app/actions/revalidate";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { getUserByIdQuery, partnerMutation, partnerQuery, userLoginMutation, userLoginQuery, partnerLoginQuery } from "@/api/auth";
import { encryptText } from "@/lib/encrtption";

export interface Partner {
  id: string;
  name: string;
  email: string;
  password: string;
  store_name: string;
  location: string;
  status: string;
  upi_id: string;
  description: string | null;
  phone: string;
  district: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  full_name: string;
  phone: string;
  crave_coins: number;
  location: string | null;
}

interface AuthState {
  userData: User | null;
  partnerData: Partner | null;
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
  ) => Promise<User | void>;
  signInWithPhone: (phone: string) => Promise<void>;
  signInPartnerWithEmail: (email: string, password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userData: null,
  partnerData: null,
  loading: true,
  error: null,

  signOut: async () => {
    try {
      localStorage.clear();
      set({ userData: null, error: null });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    // try {
    //   await auth.sendPasswordResetEmail(email);
    // } catch (error) {
    //   set({ error: (error as Error).message });
    //   throw error;
    // }
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
      // First check if partner exists
      interface PartnerResponse {
        partners: Partner[];
      }

      const existingPartner = await fetchFromHasura(partnerQuery, {
        email: email
      }) as PartnerResponse;

      if (existingPartner?.partners?.length > 0) {
        throw new Error("A partner account with this email already exists");
      }

      // Create new partner in Hasura
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
      };

      interface PartnerMutationResponse {
        insert_partners_one: Partner;
      }

      const response = await fetchFromHasura(partnerMutation, {
        object: partnerData
      }) as PartnerMutationResponse;

      if (!response?.insert_partners_one) {
        throw new Error("Failed to create partner account");
      }

      // Set the partner data in state
      set({
        partnerData: response.insert_partners_one
      });
    } catch (error) {
      console.error("Partner registration failed:", error);
      throw error;
    }
  },

  signInPartnerWithEmail: async (email: string, password: string) => {
    try {
      interface PartnerLoginResponse {
        partners: Partner[];
      }
  
      const response = await fetchFromHasura(partnerLoginQuery, {
        email: email,
        password: password
      }) as PartnerLoginResponse;
  
      if (!response?.partners?.length) {
        throw new Error("Invalid email or password");
      }
  
      const partner = response.partners[0];
  
      if (partner.status !== "active") {
        throw new Error("Your account is not active. Please contact support.");
      }
  
      // Set the partner data in state
      set({
        partnerData: partner
      });
  
    } catch (error) {
      console.error("Partner login failed:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to sign in. Please try again");
    }
  },

  signInWithPhone: async (phone: string): Promise<void> => {
    try {
      // Create standardized email and password from phone
      const email = `${phone}@user.com`;

      let userData: User;

      // Define the response type
      interface HasuraUserResponseType {
        users: {
          id: string;
          email: string;
          full_name: string;
          phone: string;
          crave_coins: number;
          location: string;
        }[];
      }

      // check user already exist in hasura
      const hasuraUserResponse = await fetchFromHasura(userLoginQuery, {
        email: email
      }) as HasuraUserResponseType;

      // if user already exist in hasura then no need to create just login using email and password
      if (hasuraUserResponse?.users?.length > 0) {
        console.log("user already exist in hasura");
        const user = hasuraUserResponse.users[0];
        if (user) {
          // hash the userid and store it in local storage
          const userhashedId = encryptText(user.id);
          localStorage.setItem("hasuraUserId", userhashedId);

          set({
            userData: {
              id: user.id,
              email: user.email,
              full_name: user.full_name,
              phone: user.phone,
              crave_coins: user.crave_coins,
              location: user.location,
              password: "",
            }
          });
        }
        return;
      }
      else {
        const hasuraUser={
          email: email,
          password: phone,
          full_name: `User${phone.slice(0, 5)}`,
          phone: phone,
          crave_coins: 100,
          location: null,
        }
        try {
          await fetchFromHasura(userLoginMutation, {
            object: hasuraUser
          });

        } catch (error) {
          console.error("Failed to insert user into Hasura:", error);
          throw new Error("Failed to create user profile");
        }

      }

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  },
}));