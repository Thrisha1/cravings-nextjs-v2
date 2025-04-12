
import { getPartnerCategories } from "@/api/category";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { create } from "zustand";

interface CategoryState {
  categories: string[];
  loading: boolean;
  error: string | null;
  fetchCategories: (addedBy?: string) => Promise<string[]>;
  addCategory: (cat: string) => Promise<string | void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async (addedBy?: string) => {
    try {
      set({ loading: true, error: null });

      if (get().categories.length > 0) {
        set({ loading: false });
        return get().categories as string[];
      }

      let categories: string[] = [];

      if (!addedBy) {
        categories = (await getDocs(collection(db, "categories"))).docs.map(
          (doc) => doc.data().name
        );
      } else {
        categories = (
          await getDocs(
            query(collection(db, "categories"), where("addedBy", "==", addedBy))
          )
        ).docs.map((doc) => doc.data().name);
      }

      set({ categories, loading: false });
      return categories as string[];
    } catch (error: unknown) {
      set({ loading: false, error: "Failed to fetch categories" });
      console.error(
        "Fetch categories error:",
        error instanceof Error ? error.message : String(error)
      );
      return [];
    }
  },

  addCategory: async (cat) => {
    try {
      set({ loading: true, error: null });

      const allCategories = fetchFromHasura(
        getPartnerCategories,
        { partner_id: auth.currentUser?.uid }
      );

      const isCategoryExists = allCategories.find(
        (category) =>
          category.name.toLowerCase() === cat.toLowerCase() &&
          category.addedBy === auth.currentUser?.uid
      );

      if (isCategoryExists) {
        set({ loading: false, error: "Category already exists" });
        return isCategoryExists.id;
      }

      const addedCat = await addDoc(collection(db, "categories"), {
        name: cat.toLowerCase(),
        addedBy: auth.currentUser?.uid,
      });

      set((state) => ({
        categories: [...state.categories, cat.toLowerCase()],
        loading: false,
      }));

      return addedCat.id;
    } catch (error: unknown) {
      console.error(error);
      set({ loading: false, error: "Failed to add category" });
    }
  }

}));
