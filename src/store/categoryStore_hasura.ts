import { addCategory, getCategory, getPartnerCategories } from "@/api/category";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { create } from "zustand";
import { useAuthStore } from "@/store/authStore";
import { update_category } from "@/api/menu";
import { useMenuStore } from "./menuStore_hasura";
import { revalidateTag } from "@/app/actions/revalidate";

export interface Category {
  id: string;
  name: string;
  partner_id?: string;
  priority?: number;
  is_active?: boolean;
}

// Helper function to format category name for display
export const formatDisplayName = (name: string): string => {
  return name.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Helper function to format category name for storage
export const formatStorageName = (name: string): string => {
  return name.toLowerCase().trim().replace(/ /g, "_");
};

interface CategoryState {
  categories: Category[];
  fetchCategories: (addedBy: string) => Promise<Category[] | void>;
  addCategory: (cat: string , userId?: string | null) => Promise<Category | void>;
  updateCategory: (cat: Category) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],

  fetchCategories: async (addedBy: string) => {
    try {
      console.log('[CategoryStore] fetchCategories called with partner_id:', addedBy);
      
      if (get().categories.length > 0) {
        console.log('[CategoryStore] Returning cached categories:', get().categories);
        return get().categories as Category[];
      }

      console.log('[CategoryStore] Fetching categories from Hasura with query:', getPartnerCategories);
      console.log('[CategoryStore] Query parameters:', { partner_id: addedBy });
      
      const allCategories = await fetchFromHasura(getPartnerCategories, {
        partner_id: addedBy,
      }).then((res) => {
        console.log('[CategoryStore] Raw category response:', res);
        return res.category.map((cat: Category) => ({
          ...cat,
          name: cat.name,
          is_active: cat.is_active !== false, // Ensure boolean value
        }))
      });

      console.log('[CategoryStore] Processed raw categories:', allCategories);
      
      const formattedCategories = allCategories.map((cat : Category) => ({
        ...cat,
        name: formatDisplayName(cat.name),
        is_active: cat.is_active !== false, // Ensure boolean value is preserved
      }));
      
      console.log('[CategoryStore] Setting formatted categories in store:', formattedCategories);
      set({ categories: formattedCategories });
      return allCategories as Category[];
    } catch (error: unknown) {
      console.error(
        "[CategoryStore] Fetch categories error:",
        error instanceof Error ? error.message : String(error)
      );
      return [];
    }
  },

  addCategory: async (cat , userId) => {
    try {
      if (!cat) throw new Error("Category name is required");

      const userData = useAuthStore.getState().userData;
      console.log('[CategoryStore] Adding category:', cat, 'for user:', userId || userData?.id);

      const formattedName = formatStorageName(cat);

      console.log('[CategoryStore] Checking if category exists:', {
        name: cat,
        name_with_space: formattedName.replace(/_/g, " "),
        name_with_underscore: formattedName.replace(/ /g, "_"),
        partner_id: userId || userData?.id,
      });

      const existingCategories = await fetchFromHasura(getCategory, {
        name: cat,
        name_with_space: formattedName.replace(/_/g, " "),
        name_with_underscore: formattedName.replace(/ /g, "_"),
        partner_id: userId || userData?.id,
      }).then((res) => {
        console.log('[CategoryStore] Existing category check response:', res);
        return res.category;
      });

      const existingCategory = existingCategories[0];

      if (existingCategory) {
        console.log('[CategoryStore] Found existing category:', existingCategory);

        const isAlredyInCategories = get().categories.some(
          (category) => category.id === existingCategory.id
        );

        if (!isAlredyInCategories) {
          console.log('[CategoryStore] Adding existing category to local state:', existingCategory);
          set({
            categories: [
              ...get().categories,
              { name: formatDisplayName(existingCategory.name), id: existingCategory.id },
            ],
          });
        }

        return existingCategory as Category;
      } else {
        console.log('[CategoryStore] Creating new category:', {
          name: formattedName,
          partner_id: userId || userData?.id,
        });
        
        const addedCat = await fetchFromHasura(addCategory, {
          category: {
            name: formattedName,
            partner_id: userId || userData?.id,
          },
        }).then((res) => {
          console.log('[CategoryStore] Category creation response:', res);
          return res.insert_category.returning[0];
        });

        console.log('[CategoryStore] Adding new category to store:', addedCat);
        set({
          categories: [
            ...get().categories,
            { name: formatDisplayName(formattedName), id: addedCat.id },
          ],
        });

        return addedCat as Category;
      }
    } catch (error: unknown) {
      console.error('[CategoryStore] Error adding category:', error);
    }
  },

  updateCategory: async (cat: Category) => {
    try {
      console.log('[CategoryStore] Updating category:', cat);
      const updatedCategories = useMenuStore.getState().updatedCategories;
      const user = useAuthStore.getState().userData;

      const updatedCat = {
        id: cat.id,
        name: formatStorageName(cat.name),
        priority: cat.priority,
        is_active: cat.is_active !== false, // Ensure boolean value
      };
      
      console.log('[CategoryStore] Sending update request with data:', updatedCat);
      console.log('[CategoryStore] Using update query:', update_category);

      const updatedCategory = await fetchFromHasura(update_category, {
        ...updatedCat,
      }).then((res) => {
        console.log('[CategoryStore] Update category response:', res);
        return res.update_category_by_pk;
      });

      // Format the updated category
      const formattedUpdatedCategory = {
        ...updatedCategory,
        name: formatDisplayName(updatedCategory.name),
        is_active: updatedCategory.is_active !== false // Ensure boolean value
      };
      
      console.log('[CategoryStore] Formatted updated category:', formattedUpdatedCategory);

      // Get the updated categories list
      const newCategories = get().categories.map((category) =>
        category.id === updatedCategory.id
          ? formattedUpdatedCategory
          : category
      );
      
      console.log('[CategoryStore] New categories list after update:', newCategories);

      // Update the store with the updated categories
      set({
        categories: newCategories,
      });

      // Update categories of menu items
      console.log('[CategoryStore] Revalidating tag for user:', user?.id);
      revalidateTag(user?.id as string);
      
      console.log('[CategoryStore] Calling updatedCategories in menuStore');
      updatedCategories(newCategories);
      
      // Return the formatted updated category
      return formattedUpdatedCategory;
    } catch (error) {
      console.error('[CategoryStore] Error updating category:', error);
      throw error; // Re-throw to handle in the component
    }
  },
}))
