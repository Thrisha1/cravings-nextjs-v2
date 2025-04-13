import { addCategory, getCategory, getPartnerCategories } from "@/api/category";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { create } from "zustand";
import { useAuthStore } from "@/store/authStore";

export interface Category {
  id: string;
  name: string;
  partner_id?: string;
}

interface CategoryState {
  categories: Category[];
  fetchCategories: (addedBy: string) => Promise<Category[] | void>;
  addCategory: (cat: string) => Promise<Category | void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],

  fetchCategories: async (addedBy: string) => {
    try {
      if (get().categories.length > 0) {
        return get().categories as Category[];
      }

      const categories = await fetchFromHasura(getPartnerCategories, {
        partner_id: addedBy,
      }).then((res) => res.category);

      set({ categories });
      return categories as Category[];
    } catch (error: unknown) {
      console.error(
        "Fetch categories error:",
        error instanceof Error ? error.message : String(error)
      );
      return [];
    }
  },

  addCategory: async (cat) => {
    try {

      if(!cat) throw new Error("Category name is required");

      const userData = useAuthStore.getState().userData;

      const category = await fetchFromHasura(getCategory, {
        name: cat.toLowerCase(),
        partner_id: userData?.id,
      }).then((res) => res.category[0]);

      console.log("Category fetched: ", category);

      if (category) {
        return category;
      }

      const addedCat = await fetchFromHasura(addCategory, {
        category: {
          name: cat?.toLowerCase(),
          partner_id: userData?.id,
        },
      }).then((res) => res.insert_category.returning[0]);

      set({
        categories: [...get().categories, { name: cat, id: addedCat.id }],
      });

      return addedCat as Category;
    } catch (error: unknown) {
      console.error(error);
    }
  },
}));
