import { addCategory, getCategory, getPartnerCategories } from "@/api/category";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { create } from "zustand";
import { useAuthStore } from "@/store/authStore";
import { update_category } from "@/api/menu";
import { useMenuStore } from "./menuStore_hasura";

export interface Category {
  id: string;
  name: string;
  partner_id?: string;
  priority?: number;
}

interface CategoryState {
  categories: Category[];
  fetchCategories: (addedBy: string) => Promise<Category[] | void>;
  addCategory: (cat: string) => Promise<Category | void>;
  updateCategory: (cat: Category) => Promise<void>;
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
      if (!cat) throw new Error("Category name is required");

      const userData = useAuthStore.getState().userData;

      const category = await fetchFromHasura(getCategory, {
        name: cat.toLowerCase().trim(),
        partner_id: userData?.id,
      }).then((res) => res.category[0]);

      if (category) {
        return category;
      }

      const addedCat = await fetchFromHasura(addCategory, {
        category: {
          name: cat?.toLowerCase().trim(),
          partner_id: userData?.id,
        },
      }).then((res) => res.insert_category.returning[0]);

      set({
        categories: [
          ...get().categories,
          { name: cat.toLowerCase().trim(), id: addedCat.id },
        ],
      });

      return addedCat as Category;
    } catch (error: unknown) {
      console.error(error);
    }
  },

  updateCategory: async (cat: Category) => {
    try {
      const updatedCategories = useMenuStore.getState().updatedCategories;

      const updatedCat = {
        id: cat.id,
        name: cat.name.toLowerCase().trim(),
        priority: cat.priority,
      };

      const updatedCategory = await fetchFromHasura(update_category, {
        ...updatedCat,
      }).then((res) => res.update_category_by_pk);

      set({
        categories: get().categories.map((category) =>
          category.id === updatedCategory.id
            ? {
                ...category,
                name: updatedCategory.name,
                priority: updatedCategory.priority,
              }
            : category
        ),
      });

      // to update categorys of menu items
      updatedCategories(get().categories);

    } catch (error) {
      console.error(error);
    }
  },
}));
