import { create } from "zustand";
import {
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  AuthErrorCodes,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { MenuItem } from "@/screens/HotelMenuPage";
import { revalidateTag } from "@/app/actions/revalidate";
import { FirebaseError } from "firebase/app";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { getUserByIdQuery, partnerMutation, partnerQuery, userLoginMutation, userLoginQuery, partnerLoginQuery } from "@/api/auth";
import { decryptText, encryptText } from "@/lib/encrtption";


export interface UpiData {
  userId: string;
  upiId: string;
}

export interface UserData {
  id?: string;
  email: string;
  password?: string;
  role: "user" | "hotel" | "superadmin";
  fullName?: string;
  hotelName?: string;
  area?: string;
  location?: string;
  category?: string;
  followers?: {
    user: string;
    phone: string;
    visits: {
      numberOfVisits: number;
      lastVisit: string;
      amountsSpent: {
        amount: number;
        date: string;
        discount: number;
        paid: boolean;
      }[];
    };
  }[];
  following?: {
    user: string;
    phone: string;
  }[];
  phone?: string;
  verified?: boolean;
  accountStatus?: "active" | "inActive";
  deletionRequestedAt?: string;
  menu?: MenuItem[];
  offersClaimable?: number;
  offersClaimableUpdatedAt?: string;
}

export interface HasuraPartner {
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

export interface HasuraUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  phone: string;
  crave_coins: number;
  location: string | null;
}

interface AuthState {
  user: User | null;
  userData: HasuraUser | null;
  hasuraPartner: HasuraPartner | null;
  loading: boolean;
  error: string | null;
  userVisit: {
    numberOfVisits: number;
    lastVisit: string;
    lastDiscountedVisit: string;
    isRecentVisit: boolean;
  } | null;
  signInWithGoogle: () => Promise<{
    fullName: string;
    email: string;
    needsPhoneNumber: boolean;
  }>;
  signOut: () => Promise<void>;
  fetchUserData: (uid: string, save?: boolean) => Promise<UserData | null | undefined>;
  updateUserData: (uid: string, updates: Partial<UserData>) => Promise<void>;
  updateUserVisits: (
    uid: string,
    hid: string,
    amount: number,
    discount: number
  ) => Promise<void>;
  handleFollow: (hotelId: string) => Promise<void>;
  handleUnfollow: (hotelId: string) => Promise<void>;
  fetchUserVisit: (uid: string, hid: string) => Promise<{
    numberOfVisits: number;
    lastVisit: string;
    lastDiscountedVisit: string;
    isRecentVisit: boolean;
  } | undefined>;
  resetPassword: (email: string) => Promise<void>;
  updateUserPayment: (userId: string, hotelId: string) => Promise<void>;
  handlePartnerRedirectResult: () => Promise<void>;
  initiatePartnerSignup: () => Promise<void>;
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
  createUpiData: (userId: string, upiId: string) => Promise<void>;
  getUpiData: (userId: string) => Promise<UpiData | null>;
  upiData: UpiData | null;
  fetchAndCacheUpiData: (userId: string) => Promise<UpiData | null>;
  updateUpiData: (userId: string, upiId: string) => Promise<void>;
  showPartnerLoginModal: boolean;
  setShowPartnerLoginModal: (show: boolean) => void;
}

const db = getFirestore();

export const getDiscount = (
  numberOfVisits: number,
  lastDiscountedVisit: string | null
): number => {
  // Check if 6 hours have passed since last discounted visit
  const isEligibleForDiscount = lastDiscountedVisit
    ? new Date().getTime() - new Date(lastDiscountedVisit).getTime() >=
    6 * 60 * 60 * 1000
    : true; // First visit is always eligible for discount

  if (!isEligibleForDiscount) {
    return 0;
  }

  // Apply regular discount logic only if eligible
  if (numberOfVisits % 5 === 0) {
    return 10;
  }
  return Math.floor(Math.random() * 5) + 1; // Random number between 1-5
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userData: null,
  hasuraPartner: null,
  loading: true,
  error: null,
  userVisit: null,
  upiData: null,
  showPartnerLoginModal: false,
  setShowPartnerLoginModal: (show: boolean) => set({ showPartnerLoginModal: show }),

  fetchUserData: async (uid: string, save = true) => {
    try {

      if (!uid) {
        return null;
      }

      // Define the response type for user query
      interface UserByIdResponse {
        users_by_pk: {
          id: string;
          email: string;
          full_name: string;
          phone: string;
          crave_coins: number;
          location: string | null;
        };
      }

      // Get user data from Hasura
      const response = await fetchFromHasura(getUserByIdQuery, {
        id: uid
      }) as UserByIdResponse;

      if (response?.users_by_pk) {
        const user = response.users_by_pk;

        // Store encrypted user ID in localStorage
        const userhashedId = encryptText(user.id);
        localStorage.setItem("hasuraUserId", userhashedId);

        // Set user data in state
        set({
          userData: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            phone: user.phone,
            crave_coins: user.crave_coins,
            location: user.location,
            password: ""
          }
        });
      }
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  fetchUserVisit: async (uid: string, hid: string): Promise<{
    numberOfVisits: number;
    lastVisit: string;
    lastDiscountedVisit: string;
    isRecentVisit: boolean;
  } | undefined> => {
    try {
      const docRef = doc(db, "users", hid);
      const userDoc = await getDoc(docRef);
      if (userDoc.exists()) {
        const followers = userDoc.data().followers || [];
        const follower = followers.find(
          (follower: { user: string }) => follower.user === uid
        );

        if (follower) {
          const lastVisit = follower.visits?.lastVisit;
          const isRecentVisit =
            lastVisit &&
            new Date().getTime() - new Date(lastVisit).getTime() <
            6 * 60 * 60 * 1000;

          set({
            userVisit: {
              numberOfVisits: follower.visits?.numberOfVisits || 0,
              lastVisit: follower.visits?.lastVisit || null,
              lastDiscountedVisit:
                follower.visits?.lastDiscountedVisit ||
                null,
              isRecentVisit: isRecentVisit !== undefined ? isRecentVisit : false,
            },
          });

          return {
            numberOfVisits: follower.visits?.numberOfVisits || 0,
            lastVisit: follower.visits?.lastVisit || null,
            lastDiscountedVisit:
              follower.visits?.lastDiscountedVisit ||
              null,
            isRecentVisit: isRecentVisit !== undefined ? isRecentVisit : false,
          };
        }
      }
    } catch (error) {
      set({ error: (error as Error).message });
      return undefined
    }
  },

  updateUserPayment: async (userId: string, hotelId: string) => {
    try {
      const docRef = doc(db, "users", hotelId);
      const userDoc = await getDoc(docRef);

      if (userDoc.exists()) {
        const followers = userDoc.data().followers || [];
        const followerIndex = followers.findIndex(
          (follower: { user: string }) => follower.user === userId
        );

        if (followerIndex !== -1) {
          const updatedFollowers = [...followers];
          const amountsSpent =
            updatedFollowers[followerIndex].visits?.amountsSpent || [];

          if (amountsSpent.length > 0) {
            // Get the latest amount spent
            const latestAmountIndex = amountsSpent.length - 1;
            amountsSpent[latestAmountIndex] = {
              ...amountsSpent[latestAmountIndex],
              paid: true,
            };

            updatedFollowers[followerIndex] = {
              ...updatedFollowers[followerIndex],
              visits: {
                ...updatedFollowers[followerIndex].visits,
                amountsSpent,
              },
            };

            await updateDoc(docRef, {
              followers: updatedFollowers,
            });
            await revalidateTag(hotelId);
            await revalidateTag(userId);
            await get().fetchUserVisit(userId, hotelId);
          }
        }
      }
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    try {
      const googleProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user document exists
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      let needsPhoneNumber = false;
      let fullName = user.displayName || "";

      if (!docSnap.exists()) {
        // Create new user document if it doesn't exist
        await setDoc(docRef, {
          email: user.email,
          fullName: user.displayName,
          role: "user",
          offersClaimable: 100,
          accountStatus: "active",
          offersClaimableUpdatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
        needsPhoneNumber = true;
      } else {
        // User exists, check if phone number exists
        const userData = docSnap.data();
        needsPhoneNumber = !userData.phone;
        // Keep existing fullName if it exists
        fullName = userData.fullName || user.displayName || "";
      }

      // Set the user in state
      set({ user: result.user });
      await get().fetchUserData(user.uid);

      return {
        fullName,
        email: user.email || "",
        needsPhoneNumber,
      };
    } catch (error) {
      if (
        error instanceof FirebaseError &&
        error.code === "auth/popup-closed-by-user"
      ) {
        throw error;
      }
      console.error("Sign-in error:", error);
      throw new Error("Failed to sign in with Google. Please try again.");
    }
  },

  signOut: async () => {
    try {
      localStorage.clear();
      set({ user: null, userData: null, error: null });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateUserData: async (uid, updates) => {
    try {
      const docRef = doc(db, "users", uid);
      await updateDoc(docRef, updates);
      await get().fetchUserData(uid);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateUserVisits: async (
    uid: string,
    hid: string,
    amount: number,
    discount: number
  ) => {
    try {
      const docRef = doc(db, "users", hid);
      const userDoc = await getDoc(docRef);
      if (userDoc.exists()) {
        const followers = userDoc.data().followers || [];
        const followerIndex = followers.findIndex(
          (follower: { user: string }) => follower.user === uid
        );

        if (followerIndex !== -1) {
          const updatedFollowers = [...followers];
          const lastDiscountedVisit =
            updatedFollowers[followerIndex].visits?.lastDiscountedVisit;

          // Check if eligible for discount
          const isEligibleForDiscount = lastDiscountedVisit
            ? new Date().getTime() - new Date(lastDiscountedVisit).getTime() >=
            6 * 60 * 60 * 1000
            : true;

          // If not eligible for discount, set it to 0
          const appliedDiscount = isEligibleForDiscount ? discount : 0;

          const newNumberOfVisits =
            (updatedFollowers[followerIndex].visits?.numberOfVisits || 0) + 1;

          updatedFollowers[followerIndex] = {
            ...updatedFollowers[followerIndex],
            visits: {
              numberOfVisits: newNumberOfVisits,
              lastVisit: new Date().toISOString(), // Always update last visit
              // Only update lastDiscountedVisit if discount was applied
              lastDiscountedVisit: isEligibleForDiscount
                ? new Date().toISOString()
                : lastDiscountedVisit || new Date().toISOString(),
              amountsSpent: [
                ...(updatedFollowers[followerIndex].visits?.amountsSpent || []),
                {
                  amount: amount,
                  date: new Date().toISOString(),
                  discount: appliedDiscount,
                  paid: false,
                },
              ],
            },
          };

          set({
            userVisit: {
              numberOfVisits: newNumberOfVisits,
              lastVisit: new Date().toISOString(),
              lastDiscountedVisit:
                updatedFollowers[followerIndex].visits.lastDiscountedVisit,
              isRecentVisit: !isEligibleForDiscount,
            },
          });

          await updateDoc(docRef, {
            followers: updatedFollowers,
          });
        }
        revalidateTag(hid);
      }
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  handleFollow: async (hotelId: string) => {
    // const { user, userData } = get();
    // if (!user) return;

    // const hotelDocRef = doc(db, "users", hotelId);
    // const hotelDoc = await getDoc(hotelDocRef);
    // const hotelData = hotelDoc.data() as UserData;
    // const isFollowed = hotelData?.followers?.some(
    //   (follower) => follower.user === user.uid
    // );

    // if (isFollowed) return;

    // await updateDoc(hotelDocRef, {
    //   followers: [
    //     ...(hotelData?.followers ?? []),
    //     {
    //       user: user.uid,
    //       phone: userData?.phone ?? "",
    //     },
    //   ],
    // });

    // await get().updateUserData(user.uid, {
    //   following: [
    //     ...(userData?.following ?? []),
    //     {
    //       user: hotelId,
    //       phone: hotelData?.phone ?? "",
    //     },
    //   ],
    // });

    // await revalidateTag(hotelId);
    // await revalidateTag(user.uid);
  },

  handleUnfollow: async (hotelId: string) => {
    // const { user, userData } = get();
    // if (!user) return;

    // const hotelDocRef = doc(db, "users", hotelId);
    // const hotelDoc = await getDoc(hotelDocRef);
    // const hotelData = hotelDoc.data() as UserData;
    // await updateDoc(hotelDocRef, {
    //   followers: hotelData?.followers?.filter(
    //     (follower) => follower.user !== user.uid
    //   ),
    // });

    // await get().updateUserData(user.uid, {
    //   following: userData?.following?.filter(
    //     (following) => following.user !== hotelId
    //   ),
    // });

    // await revalidateTag(hotelId);
    // await revalidateTag(user.uid);
  },

  resetPassword: async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  },

  handlePartnerRedirectResult: async () => {
    try {
      const result = await getRedirectResult(auth);
      if (!result) return;

      const savedFormData = localStorage.getItem("partnerFormData");
      if (!savedFormData) return;

      const formData = JSON.parse(savedFormData);

      // Create the user document
      const docRef = doc(db, "users", result.user.uid);
      await setDoc(docRef, {
        email: result.user.email,
        ...formData,
        role: "hotel",
        accountStatus: "active",
        createdAt: new Date().toISOString(),
      });

      // Clear stored data
      localStorage.removeItem("partnerFormData");

      // Update state and redirect
      set({ user: result.user });
      await get().fetchUserData(result.user.uid);
      window.location.href = "/admin";
    } catch (error) {
      console.error("Redirect result error:", error);
      throw error;
    }
  },

  initiatePartnerSignup: async () => {
    try {
      const googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({
        prompt: "select_account",
      });
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error("Sign-in redirect error:", error);
      throw error;
    }
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
        partners: HasuraPartner[];
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
        insert_partners_one: HasuraPartner;
      }

      const response = await fetchFromHasura(partnerMutation, {
        object: partnerData
      }) as PartnerMutationResponse;

      if (!response?.insert_partners_one) {
        throw new Error("Failed to create partner account");
      }

      // Set the partner data in state
      set({
        hasuraPartner: response.insert_partners_one
      });
    } catch (error) {
      console.error("Partner registration failed:", error);
      throw error;
    }
  },

  signInPartnerWithEmail: async (email: string, password: string) => {
    try {
      interface PartnerLoginResponse {
        partners: HasuraPartner[];
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
        hasuraPartner: partner
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

      let userData: HasuraUser;

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

      // Update store state
      // set({
      //   user,
      //   userData: { ...userData, id: user.uid },
      // });
      // } 
      // else {
      //   // EXISTING USER: Sign in
      //   const userCredential = await signInWithEmailAndPassword(
      //     auth,
      //     email,
      //     password
      //   );
      //   const user = userCredential.user;

      //   // Get existing user data
      //   userData = {
      //     id: userSnapshot.docs[0].id,
      //     ...userSnapshot.docs[0].data(),
      //   } as UserData;

      //   // Update store state
      //   set({
      //     user,
      //     userData,
      //   });
      // }

    } catch (error) {
      // STEP 4: Error handling
      // if (error instanceof FirebaseError) {
      //   switch (error.code) {
      //     case "auth/email-already-in-use":
      //       // Try signing in if email exists
      //       try {
      //         const email = `${phone}@user.com`;
      //         const userCredential = await signInWithEmailAndPassword(
      //           auth,
      //           email,
      //           phone
      //         );
      //         const userData = await get().fetchUserData(userCredential.user.uid);
      //         if (!userData) {
      //           throw new Error("Failed to fetch user data");
      //         }
      //         set({
      //           user: userCredential.user,
      //           userData,
      //         });
      //         return;
      //       } catch (error) {
      //         throw new Error("Failed to sign in. Please try again" + error);
      //       }
      //     default:
      //       throw new Error("Failed to sign in. Please try again");
      //   }
      // }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  },

  createUpiData: async (userId: string, upiId: string) => {
    try {
      const docRef = doc(db, "upi_ids", userId);
      await setDoc(docRef, {
        userId,
        upiId,
      });
    } catch (error) {
      console.error("Error creating UPI data:", error);
      throw error;
    }
  },

  getUpiData: async (userId: string) => {
    try {
      const docRef = doc(db, "upi_ids", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UpiData;
      }
      return null;
    } catch (error) {
      console.error("Error getting UPI data:", error);
      throw error;
    }
  },

  fetchAndCacheUpiData: async (userId: string) => {
    try {
      // Import the server action dynamically to avoid SSR issues
      const { getCachedUpiData } = await import('@/app/actions/getUpiData');
      const upiData = await getCachedUpiData(userId);
      set({ upiData });
      return upiData;
    } catch (error) {
      console.error("Error fetching UPI data:", error);
      throw error;
    }
  },

  updateUpiData: async (userId: string, upiId: string) => {
    try {
      // First update the Firestore document
      const docRef = doc(db, "upi_ids", userId);
      await setDoc(docRef, {
        userId,
        upiId,
      });

      // Update local state
      set({ upiData: { userId, upiId } });

      // Revalidate cache
      try {
        // Try to revalidate using server action
        const { revalidateTag } = await import('@/app/actions/revalidate');
        await revalidateTag(`user-${userId}`);
      } catch (error) {
        console.warn('Cache revalidation failed:', error);
        // Continue execution even if revalidation fails
      }

      // Fetch fresh data to ensure UI is updated
      const { getCachedUpiData } = await import('@/app/actions/getUpiData');
      const freshData = await getCachedUpiData(userId);
      if (freshData) {
        set({ upiData: freshData });
      }

      return;
    } catch (error) {
      console.error("Error updating UPI data:", error);
      throw new Error("Failed to update UPI ID. Please try again.");
    }
  },
}));

// Update the auth state change handler
onAuthStateChanged(auth, async (user) => {
  useAuthStore.setState({ user, loading: false });
  if (user) {
    // Check for redirect result immediately when user signs in
    const result = await getRedirectResult(auth);
    if (result) {
      console.log("Google Sign In Redirect Result:", result);
      const savedFormData = localStorage.getItem("partnerFormData");
      console.log("Saved Form Data:", savedFormData);
    }

    // Normal user data fetch
    await useAuthStore.getState().fetchUserData(user.uid);
  }
});
