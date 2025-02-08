import { create } from 'zustand';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from './authStore';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
}

export interface HotelData {
  hotelName: string;
  verified: boolean;
  menu: MenuItem[];
}

interface MenuState {
  items: MenuItem[];
  loading: boolean;
  error: string | null;
  hotelInfo: {
    hotelName: string;
    verified: boolean;
  } | null;
  selectedHotelId: string | null;
  setSelectedHotelId: (id: string | null) => void;
  fetchMenu: (hotelId?: string) => Promise<void>;
  addItem: (item: Omit<MenuItem, 'id'>, hotelId?: string) => Promise<void>;
  updateItem: (id: string, item: Partial<MenuItem>, hotelId?: string) => Promise<void>;
  deleteItem: (id: string, hotelId?: string) => Promise<void>;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  hotelInfo: null,
  selectedHotelId: null,

  setSelectedHotelId: (id) => set({ selectedHotelId: id }),

  fetchMenu: async (hotelId?: string) => {
    const user = useAuthStore.getState().user;
    const userData = useAuthStore.getState().userData;
  
    if (!user) return;
  
    try {
      set({ loading: true, error: null });
  
      // If superadmin and hotelId provided, fetch that hotel's menu
      // Otherwise, fetch current user's menu
      const targetId = userData?.role === 'superadmin' && hotelId ? hotelId : user.uid;
  
      const docRef = doc(db, "users", targetId);
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        const data = docSnap.data() as HotelData;
        set({
          items: data.menu || [],
          hotelInfo: {
            hotelName: data.hotelName,
            verified: data.verified,
          },
        });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  

  addItem: async (item, hotelId?: string) => {
    const user = useAuthStore.getState().user;
    const userData = useAuthStore.getState().userData;
    if (!user) return;

    try {
      set({ error: null });
      const newItem = { ...item, id: crypto.randomUUID() };
      const items = [...get().items, newItem];

      // If superadmin and hotelId provided, add to that hotel's menu
      // Otherwise, add to current user's menu
      const targetId = userData?.role === 'superadmin' && hotelId ? hotelId : user.uid;

      await updateDoc(doc(db, 'users', targetId), {
        menu: items,
      });

      set({ items });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateItem: async (id, updatedItem, hotelId?: string) => {
    const user = useAuthStore.getState().user;
    const userData = useAuthStore.getState().userData;
    if (!user) return;

    try {
      set({ error: null });
      const items = get().items.map((item) =>
        item.id === id ? { ...item, ...updatedItem } : item
      );

      // If superadmin and hotelId provided, update that hotel's menu
      // Otherwise, update current user's menu
      const targetId = userData?.role === 'superadmin' && hotelId ? hotelId : user.uid;

      await updateDoc(doc(db, 'users', targetId), {
        menu: items,
      });

      set({ items });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteItem: async (id, hotelId?: string) => {
    const user = useAuthStore.getState().user;
    const userData = useAuthStore.getState().userData;
    if (!user) return;

    try {
      set({ error: null });
      const items = get().items.filter((item) => item.id !== id);

      // If superadmin and hotelId provided, delete from that hotel's menu
      // Otherwise, delete from current user's menu
      const targetId = userData?.role === 'superadmin' && hotelId ? hotelId : user.uid;

      await updateDoc(doc(db, 'users', targetId), {
        menu: items,
      });

      set({ items });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
}));
