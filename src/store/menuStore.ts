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

interface MenuState {
  items: MenuItem[];
  loading: boolean;
  error: string | null;
  fetchMenu: () => Promise<void>;
  addItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateItem: (id: string, item: Partial<MenuItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  
  fetchMenu: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      set({ loading: true, error: null });
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        set({ items: data.menu || [] });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (item) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      set({ error: null });
      const newItem = { ...item, id: crypto.randomUUID() };
      const items = [...get().items, newItem];
      
      await updateDoc(doc(db, 'users', user.uid), {
        menu: items
      });
      
      set({ items });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateItem: async (id, updatedItem) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      set({ error: null });
      const items = get().items.map((item) =>
        item.id === id ? { ...item, ...updatedItem } : item
      );
      
      await updateDoc(doc(db, 'users', user.uid), {
        menu: items
      });
      
      set({ items });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteItem: async (id) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      set({ error: null });
      const items = get().items.filter((item) => item.id !== id);
      
      await updateDoc(doc(db, 'users', user.uid), {
        menu: items
      });
      
      set({ items });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
}));