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

export interface UpiData {
  userId: string;
  upiId: string;
}

export interface UserData {
  id?: string;
  email: string;
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

interface AuthState {
  user: User | null;
  userData: UserData | null;
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
  signInWithGoogleForPartner: (
    hotelName: string,
    area: string,
    location: string,
    category: string,
    phone: string,
    upiId: string
  ) => Promise<User | void>;
  signUpWithEmailForPartner: (
    email: string,
    password: string,
    hotelName: string,
    area: string,
    location: string,
    category: string,
    phone: string,
    upiId: string
  ) => Promise<User | void>;
  signInWithPhone: (phone: string) => Promise<void>;
  signInPartnerWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGooglePartner: () => Promise<boolean>;
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
  loading: true,
  error: null,
  userVisit: null,
  upiData: null,
  showPartnerLoginModal: false,
  setShowPartnerLoginModal: (show: boolean) => set({ showPartnerLoginModal: show }),

  fetchUserData: async (uid: string, save = true) => {
    try {

      if(!uid) {
        return null;
      }

      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserData;
        if (save) {
          set({ userData: data });
        } else {
          return data as UserData;
        }
      }
      return null;
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
      await firebaseSignOut(auth);
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
    const { user, userData } = get();
    if (!user) return;

    const hotelDocRef = doc(db, "users", hotelId);
    const hotelDoc = await getDoc(hotelDocRef);
    const hotelData = hotelDoc.data() as UserData;
    const isFollowed = hotelData?.followers?.some(
      (follower) => follower.user === user.uid
    );

    if (isFollowed) return;

    await updateDoc(hotelDocRef, {
      followers: [
        ...(hotelData?.followers ?? []),
        {
          user: user.uid,
          phone: userData?.phone ?? "",
        },
      ],
    });

    await get().updateUserData(user.uid, {
      following: [
        ...(userData?.following ?? []),
        {
          user: hotelId,
          phone: hotelData?.phone ?? "",
        },
      ],
    });

    await revalidateTag(hotelId);
    await revalidateTag(user.uid);
  },

  handleUnfollow: async (hotelId: string) => {
    const { user, userData } = get();
    if (!user) return;

    const hotelDocRef = doc(db, "users", hotelId);
    const hotelDoc = await getDoc(hotelDocRef);
    const hotelData = hotelDoc.data() as UserData;
    await updateDoc(hotelDocRef, {
      followers: hotelData?.followers?.filter(
        (follower) => follower.user !== user.uid
      ),
    });

    await get().updateUserData(user.uid, {
      following: userData?.following?.filter(
        (following) => following.user !== hotelId
      ),
    });

    await revalidateTag(hotelId);
    await revalidateTag(user.uid);
  },

  resetPassword: async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  },

  signUpAsPartnerWithGoogle: async (
    hotelName: string,
    area: string,
    location: string,
    category: string,
    phone: string,
    upiId: string
  ): Promise<User | null> => {
    try {
      const googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({
        prompt: "select_account",
      });

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        // Store partner data before redirect
        sessionStorage.setItem(
          "partnerData",
          JSON.stringify({
            hotelName,
            area,
            location,
            category,
            phone,
            upiId,
          })
        );
        await signInWithRedirect(auth, googleProvider);
        return null;
      } else {
        // Popup flow
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Create hotel document
        const docRef = doc(db, "users", user.uid);

        // Check if user already exists as a hotel
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data() as UserData;
          if (userData.role === "hotel") {
            throw new Error(
              "This Google account is already registered as a hotel partner"
            );
          }
        }

        await setDoc(docRef, {
          email: user.email,
          hotelName,
          area,
          location,
          category,
          phone,
          upiId,
          role: "hotel",
          accountStatus: "active",
          createdAt: new Date().toISOString(),
        });

        set({ user });
        await get().fetchUserData(user.uid);
        window.location.href = "/admin";
        return user;
      }
    } catch (error) {
      if (
        error instanceof FirebaseError &&
        (error.code === "auth/popup-closed-by-user" ||
          error.code === "auth/popup-blocked")
      ) {
        throw error;
      }
      console.error("Sign-in error:", error);
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

  signInWithGoogleForPartner: async (
    hotelName,
    area,
    location,
    category,
    phone,
    upiId
  ) => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email) throw new Error("Email is required");

      // Create the user document in users collection
      const docRef = doc(db, "users", user.uid);
      const partnerData: UserData = {
        email: user.email,
        role: "hotel",
        hotelName,
        area,
        location,
        category,
        phone,
        accountStatus: "active",
        followers: [],
        following: [],
        menu: [],
        offersClaimable: 100,
        offersClaimableUpdatedAt: new Date().toISOString(),
        verified: false,
      };

      await setDoc(docRef, partnerData);
      
      // Create UPI data in separate collection
      await get().createUpiData(user.uid, upiId);
      
      set({ user, userData: partnerData });

      return user;
    } catch (error) {
      console.error("Partner registration failed:", error);
      throw error;
    }
  },

  signUpWithEmailForPartner: async (
    email,
    password,
    hotelName,
    area,
    location,
    category,
    phone,
    upiId
  ) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      const docRef = doc(db, "users", user.uid);
      const partnerData: UserData = {
        email: user.email as string,
        role: "hotel",
        hotelName,
        area,
        location,
        category,
        phone,
        accountStatus: "active",
        followers: [],
        following: [],
        menu: [],
        offersClaimable: 100,
        offersClaimableUpdatedAt: new Date().toISOString(),
        verified: false,
      };

      await setDoc(docRef, partnerData);
      
      // Create UPI data in separate collection
      await get().createUpiData(user.uid, upiId);
      
      set({ user, userData: partnerData });

      return user;
    } catch (error) {
      console.log("error", error);
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case AuthErrorCodes.EMAIL_EXISTS:
            throw new Error("Email already in use");
          case AuthErrorCodes.WEAK_PASSWORD:
            throw new Error("Password should be at least 6 characters");
          default:
            throw new Error("Failed to sign up. Please try again");
        }
      }
      throw error;
    }
  },

  signInWithPhone: async (phone: string): Promise<void> => {
    try {
      // STEP 1: Check if phone exists as a partner/non-user account
      const allUsersRef = collection(db, "users");
      const nonUserQuery = query(
        allUsersRef,
        where("phone", "==", `${phone}`),
        where("role", "!=", "user")
      );
      const nonUserSnapshot = await getDocs(nonUserQuery);

      if (!nonUserSnapshot.empty) {
        // If found as partner, show partner login modal instead of error
        set({ showPartnerLoginModal: true });
        return;
      }

      // STEP 2: Check if phone exists as a regular user
      const userQuery = query(
        allUsersRef,
        where("phone", "==", `${phone}`),
        where("role", "==", "user")
      );
      const userSnapshot = await getDocs(userQuery);

      // Create standardized email and password from phone
      const email = `${phone}@user.com`;
      const password = phone;

      let userData: UserData;

      // STEP 3: Handle user creation or sign in
      if (userSnapshot.empty) {
        // NEW USER: Create account
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        // Create new user document
        userData = {
          email,
          role: "user",
          phone: `${phone}`,
          fullName: `User${phone.slice(0, 5)}`,
          accountStatus: "active",
          offersClaimable: 100,
          offersClaimableUpdatedAt: new Date().toISOString(),
          following: [],
        };

        await setDoc(doc(db, "users", user.uid), userData);

        // Update store state
        set({
          user,
          userData: { ...userData, id: user.uid },
        });
      } else {
        // EXISTING USER: Sign in
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        // Get existing user data
        userData = {
          id: userSnapshot.docs[0].id,
          ...userSnapshot.docs[0].data(),
        } as UserData;

        // Update store state
        set({
          user,
          userData,
        });
      }

    } catch (error) {
      // STEP 4: Error handling
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/email-already-in-use":
            // Try signing in if email exists
            try {
              const email = `${phone}@user.com`;
              const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                phone
              );
              const userData = await get().fetchUserData(userCredential.user.uid);
              if (!userData) {
                throw new Error("Failed to fetch user data");
              }
              set({
                user: userCredential.user,
                userData,
              });
              return;
            } catch (error) {
              throw new Error("Failed to sign in. Please try again" + error);
            }
          default:
            throw new Error("Failed to sign in. Please try again");
        }
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  },

  signInPartnerWithEmail: async (email: string, password: string) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) throw new Error("User not found");
      const userData = querySnapshot.docs[0].data() as UserData;

      if (
        userData &&
        (userData.role === "hotel" || userData.role === "superadmin")
      ) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        set({ user: result.user });
      } else {
        throw new Error("This account is not registered as a partner");
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case AuthErrorCodes.INVALID_PASSWORD:
          case AuthErrorCodes.USER_DELETED:
            throw new Error("Invalid email or password");
          default:
            throw new Error("Failed to sign in. Please try again");
        }
      }
      throw error;
    }
  },

  signInWithGooglePartner: async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Use signInWithPopup and ignore the window.close() error
      const result = await signInWithPopup(auth, provider).catch(error => {
        // Check if it's the window.close() error
        if (error.message?.includes('Cross-Origin-Opener-Policy')) {
          // Ignore this specific error as sign in still succeeds
          return error.customData?._tokenResponse;
        }
        throw error; // Re-throw other errors
      });

      if (!result) throw new Error("Sign in failed");

      // Get user email from result
      const email = result.email || result.user?.email;
      if (!email) throw new Error("Email is required");

      // Check if a hotel account exists with this email
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("email", "==", email),
        where("role", "!=", "user")
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // No hotel account found
        await firebaseSignOut(auth); // Sign out the user
        throw new Error(
          "No partner account found for this Google account. Please register first."
        );
      }

      // Get the hotel data
      const hotelData = {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data(),
      } as UserData;

      // Update store
      set({
        user: auth.currentUser,
        userData: hotelData,
      });

      return true; // Indicate successful sign in
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/popup-closed-by-user":
            throw new Error("Sign in cancelled");
          default:
            throw new Error("Failed to sign in. Please try again");
        }
      }
      throw error;
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
