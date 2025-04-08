import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { create } from "zustand";

interface CategoryState {
  categories: string[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<string[]>;
  addCategory: (cat: string) => Promise<void>;
  deleteCategory: (cat: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  prevCategories: [],
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    try {
      set({ loading: true, error: null });

      if (get().categories.length > 0) {
        set({ loading: false });
        return get().categories as string[];
      }

      const categories = (await getDocs(collection(db, "categories"))).docs.map(
        (doc) => doc.data().name
      );

      set({ categories, loading: false });
      return categories as string[];
    } catch (error) {
      set({ loading: false, error: "Failed to fetch categories" });
      return [];
    }
  },

  addCategory: async (cat) => {
    try {
      set({ loading: true, error: null });

      await addDoc(collection(db, "categories"), {
        name: cat,
      });

      const newCategory = cat;
      set((state) => ({
        categories: [...state.categories, newCategory],
        loading: false,
      }));
    } catch (error) {
      set({ loading: false, error: "Failed to add category" });
    }
  },

  deleteCategory: async (cat) => {
    try {
      set({ loading: true, error: null });
      const catId = (await getDocs(collection(db, "categories"))).docs.find(
        (doc) => doc.data().cat === cat
      )?.id;

      if (!catId) {
        set({ loading: false, error: "Category not found" });
        return;
      }
      await deleteDoc(doc(db, "categories", catId));
      set((state) => ({
        categories: state.categories.filter((category) => category !== cat),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false, error: "Failed to delete category" });
    }
  },
}));
