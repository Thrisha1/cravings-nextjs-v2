import { create } from "zustand";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getFirestore,
} from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { MenuItem } from "@/screens/HotelMenuPage";

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
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone: string
  ) => Promise<string>;
  signUpAsPartner: (
    email: string,
    password: string,
    hotelName: string,
    area: string,
    location: string,
    category: string,
    phone: string
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUserData: (uid: string) => Promise<void>;
  updateUserData: (uid: string, updates: Partial<UserData>) => Promise<void>;
  updateUserVisits: (uid: string, hid: string) => Promise<void>;
  handleFollow: (hotelId: string) => Promise<void>;
  handleUnfollow: (hotelId: string) => Promise<void>;
}

const db = getFirestore();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userData: null,
  loading: true,
  error: null,

  fetchUserData: async (uid: string) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        set({ userData: docSnap.data() as UserData });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  signUp: async (email, password, fullName, phone) => {
    try {
      set({ error: null });
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        fullName,
        phone,
        role: "user",
        offersClaimable: 100,
        accountStatus: "active",
        offersClaimableUpdatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
      await get().fetchUserData(userCredential.user.uid);
      return userCredential.user.uid;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  signUpAsPartner: async (
    email,
    password,
    hotelName,
    area,
    location,
    category,
    phone
  ) => {
    try {
      set({ error: null });
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        hotelName,
        area,
        location,
        category,
        phone,
        role: "hotel",
        verified: false,
        enquiry: 0,
        accountStatus: "active",
        offersClaimable: 2,
        createdAt: new Date().toISOString(),
      });
      await get().fetchUserData(userCredential.user.uid);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  signIn: async (email, password) => {
    try {
      set({ error: null });
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      await get().fetchUserData(userCredential.user.uid);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
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

  updateUserVisits: async (uid: string, hid: string) => {
    try {
      console.log("updateUserVisits", uid, hid);
      const docRef = doc(db, "users", hid);
      const userDoc = await getDoc(docRef);
      if (userDoc.exists()) {
        const followers = userDoc.data().followers || [];
        const followerIndex = followers.findIndex(
          (follower: { user: string }) => follower.user === uid
        );

        if (followerIndex !== -1) {
          const updatedFollowers = [...followers];

          updatedFollowers[followerIndex] = {
            ...updatedFollowers[followerIndex],
            visits: {
              numberOfVisits:
                (updatedFollowers[followerIndex].visits?.numberOfVisits ||
                  0) + 1,
              lastVisit: new Date().toISOString(),
            },
          };
          console.log("updatedFollowers", updatedFollowers);
          await updateDoc(docRef, {
            followers: updatedFollowers,
          });
        }
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
  },
}));

// Set up auth state listener
onAuthStateChanged(auth, async (user) => {
  useAuthStore.setState({ user, loading: false });
  if (user) {
    await useAuthStore.getState().fetchUserData(user.uid);
  }
});
