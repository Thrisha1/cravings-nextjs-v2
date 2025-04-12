import { create } from "zustand";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  or,
  and,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "./authStore";
import Fuse from "fuse.js";
import CATEGORIES from "@/data/CATEGORIES.json";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  hotelId: string;
  category: string;
  isTop?: boolean;
}

interface Dish {
  id: string;
  name: string;
  category: string;
  url: string;
}

interface DishCache {
  dishes: Dish[];
  lastFetched: number;
  expiryTime: number;
  category: string;
  name: string;
}

export const menuCatagories = CATEGORIES.map((category) => category.name);

const CACHE_EXPIRY_TIME = 60 * 60 * 1000;
const fetchAllDishes = async (category: string): Promise<Dish[]> => {
  const dishRef = collection(db, "dishes");
  const user = useAuthStore.getState().user;

  // Query 1: AI dishes
  const q1 = query(
    dishRef,
    where("category", "==", category),
    where("imageSource", "==", "ai"),
    orderBy("createdAt", "asc")
  );

  // Query 2: User-added non-AI dishes
  const q2 = query(
    dishRef,
    where("category", "==", category),
    where("addedBy", "==", user?.uid),
    where("imageSource", "!=", "ai"),
    orderBy("imageSource"), // required due to '!='
    orderBy("createdAt", "asc")
  );

  // Execute both queries
  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  // Map docs to Dish objects
  const dishes: Dish[] = [
    ...snap1.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Dish)),
    ...snap2.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Dish)),
  ];

  return dishes;
};

export const getMenuItemImage = async (category: string, name: string) => {
  const store = useMenuStore.getState();
  let dishes: Dish[] = [];

  if (
    store.dishCache &&
    Date.now() - store.dishCache.lastFetched < store.dishCache.expiryTime &&
    store.dishCache.category !== category
  ) {
    dishes = store.dishCache.dishes;
  } else {
    dishes = await fetchAllDishes(category);

    useMenuStore.setState({
      dishCache: {
        dishes,
        lastFetched: Date.now(),
        expiryTime: CACHE_EXPIRY_TIME,
        category,
        name,
      },
    });
  }

  const categoryDishes = dishes.filter((dish) => dish.category === category);

  const fuse = new Fuse(categoryDishes, {
    includeScore: false,
    threshold: 0.8,
    keys: ["name", "category"],
  });

  const results = fuse.search(name + "_" + category);
  return results.map((result) => result.item.url);
};

interface MenuState {
  items: MenuItem[];
  loading: boolean;
  error: string | null;
  dishCache: DishCache | null;
  hotelInfo: {
    hotelName: string;
    verified: boolean;
  } | null;
  selectedHotelId: string | null;
  setSelectedHotelId: (id: string | null) => void;
  fetchMenu: (hotelId?: string) => Promise<MenuItem[] | []>;
  addItem: (item: Omit<MenuItem, "id">) => Promise<void>;
  updateItem: (id: string, item: Partial<MenuItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  clearDishCache: () => void;
  fetchTopMenuItems: (hotelId?: string) => Promise<MenuItem[]>;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  dishCache: null,
  hotelInfo: null,
  selectedHotelId: null,

  setSelectedHotelId: (id) => set({ selectedHotelId: id }),

  clearDishCache: () => {
    set({ dishCache: null });
  },

  fetchMenu: async (hotelId?: string) => {
    const user = useAuthStore.getState().user;

    try {
      set({ loading: true, error: null });
      const targetId = hotelId || user?.uid;

      const q = query(
        collection(db, "menuItems"),
        where("hotelId", "==", targetId)
      );

      const querySnapshot = await getDocs(q);
      const items: MenuItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as MenuItem);
      });
      set({ items });
      return items;
    } catch (error) {
      set({ error: (error as Error).message });
      return [];
    }
  },

  fetchTopMenuItems: async (hotelId?: string) => {
    if (!hotelId) {
      return [];
    }

    try {
      const q = query(
        collection(db, "menuItems"),
        where("hotelId", "==", hotelId),
        where("isTop", "==", true)
      );

      const querySnapshot = await getDocs(q);

      const topItems: MenuItem[] = [];
      querySnapshot.forEach((doc) => {
        topItems.push({ id: doc.id, ...doc.data() } as MenuItem);
      });

      return topItems.slice(0, 3);
    } catch (error) {
      console.log(error);
      set({ error: (error as Error).message });
      return [];
    }
  },

  addItem: async (item) => {
    try {
      set({ error: null });
      const menuItemsRef = collection(db, "menuItems");
      const docRef = await addDoc(menuItemsRef, item);
      const newItem = { ...item, id: docRef.id };
      set({ items: [...get().items, newItem] });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateItem: async (id, updatedItem) => {
    try {
      set({ error: null });
      await updateDoc(doc(db, "menuItems", id), updatedItem);
      const items = get().items.map((item) =>
        item.id === id ? { ...item, ...updatedItem } : item
      );
      set({ items });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteItem: async (id) => {
    try {
      set({ error: null });
      await deleteDoc(doc(db, "menuItems", id));
      const items = get().items.filter((item) => item.id !== id);
      set({ items });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
}));
