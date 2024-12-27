import { create } from 'zustand';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { MenuItem } from '@/screens/HotelMenuPage';

export interface UserData {
  email: string;
  role: 'user' | 'hotel' | 'superadmin';
  fullName?: string;
  hotelName?: string;
  area?: string;
  location?: string;
  category?: string;
  phone?: string;
  verified?: boolean;
  menu? : MenuItem[];
}

interface AuthState {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
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
}

const db = getFirestore();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userData: null,
  loading: true,
  error: null,

  fetchUserData: async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        fullName,
        phone,
        role: 'user',
        createdAt: new Date().toISOString(),
      });
      await get().fetchUserData(userCredential.user.uid);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  signUpAsPartner: async (email, password, hotelName, area, location, category, phone) => {
    try {
      set({ error: null });
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        hotelName,
        area,
        location,
        category,
        phone,
        role: 'hotel',
        verified: false,
        enquiry: 0,
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await get().fetchUserData(userCredential.user.uid);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      set({ user: null, userData: null, error: null });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateUserData: async (uid, updates) => {
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, updates);
      await get().fetchUserData(uid);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },
}));

// Set up auth state listener
onAuthStateChanged(auth, async (user) => {
  useAuthStore.setState({ user, loading: false });
  if (user) {
    await useAuthStore.getState().fetchUserData(user.uid);
  }
});
