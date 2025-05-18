import { create } from "zustand";
import { fetchFromHasura } from "@/lib/hasuraClient";
import {
  addMenu,
  delCategoryAndItems,
  deleteMenu,
  getCategoryImages,
  getMenu,
  updateMenu,
} from "@/api/menu";
import { AuthUser, Partner, useAuthStore } from "./authStore";
import { Category, useCategoryStore } from "./categoryStore_hasura";
import { processImage } from "@/lib/processImage";
import { uploadFileToS3 } from "@/app/actions/aws-s3";
import { revalidateTag } from "@/app/actions/revalidate";
import { toast } from "sonner";

export interface MenuItem {
  id?: string;
  name: string;
  category: {
    id: string;
    name: string;
    priority: number;
  };
  category_id?: string;
  image_url: string;
  image_source?: string;
  partner_id?: string;
  price: number;
  description: string;
  is_top: boolean;
  is_available: boolean;
  priority: number;
  stocks: {
    stock_quantity: number;
    stock_type: string;
    show_stock: boolean;
    id?: string;
  }[];
}

interface CategoryImages {
  image_url: string;
  image_source: string;
  category: {
    id: string;
    name: string;
    priority: number;
  };
  name: string;
}

export interface GroupedItems {
  [key: string]: MenuItem[];
}

const getBatchUpdateMutation = (updates: Category[]) => `
  mutation UpdateCategoriesBatch {
    ${updates
      .map(
        (update, index) => `
      update_${index}: update_category_by_pk(
        pk_columns: { id: "${update.id}" }
        _set: {
          ${update.name ? `name: "${update.name.replace(/"/g, '\\"')}"` : ""}
          ${update.priority !== undefined ? `priority: ${update.priority}` : ""}
        }
      ) {
        id
        name
        priority
      }
    `
      )
      .join("\n")}
  }
`;

interface MenuState {
  items: MenuItem[];
  groupedItems: GroupedItems;
  categoryImages: CategoryImages[];
  addItem: (item: Omit<MenuItem, "id">) => Promise<void>;
  fetchMenu: (hotelId?: string) => Promise<MenuItem[] | []>;
  updateItem: (id: string, updatedItem: Partial<MenuItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  fetchCategorieImages: (category: string) => Promise<CategoryImages[]>;
  groupItems: () => void;
  updatedCategories: (categories: Category[]) => void;
  updateCategoriesAsBatch: (categories: Category[]) => Promise<Category[]>;
  deleteCategoryAndItems: (categoryId: string) => Promise<void>;
  updateItemsAsBatch: (
    items: { id: string; priority: number }[]
  ) => Promise<void>;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  items: [],
  categoryImages: [],
  groupedItems: {},

  fetchMenu: async (hotelId?: string) => {
    const userData = useAuthStore.getState().userData as AuthUser;

    if (!userData && !hotelId) throw new Error("User data not found");

    const targetId = hotelId || userData.id;

    if (get().items.length > 0 && get().items[0].partner_id === targetId) {
      return get().items as MenuItem[];
    }

    try {
      const items =
        (await fetchFromHasura(getMenu, {
          partner_id: targetId,
        }).then((res) =>
          res.menu.map((mi: any) => {
            return {
              ...mi,
              price: (mi.offers[0]?.offer_price || mi.price) ?? 0,
              category: {
                id: mi.category.id,
                name: mi.category.name,
                priority: mi.category.priority,
              },
            };
          })
        )) || [];
      set({ items });
      get().groupItems();
      return items;
    } catch (error) {
      console.error("Error fetching menu: ", error);
      set({ items: [] });
      return [];
    }
  },

  addItem: async (item) => {
    try {
      toast.loading("Adding item...");
      const userData = useAuthStore.getState().userData as AuthUser;
      const addCategory = useCategoryStore.getState().addCategory;

      if (!userData) throw new Error("User data not found");

      const category = await addCategory(
        item.category.name.trim().toLowerCase()
      );
      const category_id = category?.id;

      if (!category_id) throw new Error("Category ID not found");

      let s3Url = "";

      if (item.image_url) {
        const getProcessedBase64Url = await processImage(
          item.image_url,
          item.image_source || ""
        );

        s3Url = await uploadFileToS3(
          getProcessedBase64Url,
          `${userData.id}/menu/${item.name}_${
            item.category.name
          }_${Date.now()}.webp`
        );
      }

      const newMenu = {
        name: item.name,
        category_id: category_id,
        image_url: s3Url || "",
        image_source: item.image_source || "",
        partner_id: userData.id,
        price: item.price,
        description: item.description || "",
      };

      const { insert_menu } = await fetchFromHasura(addMenu, {
        menu: [newMenu],
      });

      set({
        items: [...get().items, insert_menu.returning[0]],
      });
      revalidateTag(userData?.id);
      get().groupItems();
      toast.dismiss();
      toast.success("Item added successfully");
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("Failed to add item");
    }
  },

  updateItem: async (id, updatedItem) => {
    try {
      toast.loading("Updating item...");
      const categories = useCategoryStore.getState().categories;
      const { category, ...otherItems } = updatedItem;
      const userData = useAuthStore.getState().userData as AuthUser;

      let catid;
      let changedItem = { ...otherItems };

      if (category?.id !== undefined) {
        const cat = categories.find(
          (cat) =>
            cat.name.toLowerCase().trim() === category.name.toLowerCase().trim()
        );
        catid = cat?.id;
        changedItem = { ...changedItem, category_id: catid };
      }

      if (updatedItem.image_url) {
        const getProcessedBase64Url = await processImage(
          updatedItem.image_url,
          updatedItem.image_source || ""
        );

        const s3Url = await uploadFileToS3(
          getProcessedBase64Url,
          `${userData.id}/menu/${updatedItem.name}_${
            updatedItem.category
          }_${Date.now()}.webp`
        );

        changedItem = { ...changedItem, image_url: s3Url || "" };
        updatedItem = {
          ...updatedItem,
          image_url: s3Url || "",
          image_source: updatedItem.image_source || "",
        };
      }

      await fetchFromHasura(updateMenu, {
        id,
        menu: changedItem,
      });

      const items = get().items.map((item) =>
        item.id === id ? { ...item, ...updatedItem } : item
      );
      set({ items });
      revalidateTag(userData?.id);
      get().groupItems();
      toast.dismiss();
      toast.success("Item updated successfully");
    } catch (error) {
      console.error("Error ", error);
      toast.dismiss();
      toast.error("Failed to update item");
    }
  },

  deleteItem: async (id) => {
    try {
      toast.loading("Deleting item...");
      await fetchFromHasura(deleteMenu, {
        id,
      });
      const items = get().items.filter((item) => item.id !== id);
      set({ items });
      get().groupItems();
      toast.dismiss();
      toast.success("Item deleted successfully");
    } catch (error) {
      console.error("Error ", error);
      toast.dismiss();
      toast.error("Failed to delete item");
    }
  },

  fetchCategorieImages: async (category: string) => {
    try {
      const userData = useAuthStore.getState().userData as AuthUser;
      if (!userData) throw new Error("User data not found");

      if (get().categoryImages.length > 0) {
        const hasImagesOfSameCat = get().categoryImages.some(
          (img) => img?.category?.name === category
        );
        if (hasImagesOfSameCat) {
          return get().categoryImages;
        }
      }

      const images = await fetchFromHasura(getCategoryImages, {
        partner_id: userData.id,
        category,
      });

      set({ categoryImages: images.menu });
      revalidateTag(userData?.id);
      return images.menu as CategoryImages[];
    } catch (error) {
      console.error("Error ", error);
      set({ categoryImages: [] });
      return [];
    }
  },

  groupItems: () => {
    const items = get().items;

    // 1. Group items by category name (case-insensitive)
    const groupedByName: GroupedItems = items.reduce((acc, item) => {
      const categoryName = item.category.name.toLowerCase();
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(item);
      return acc;
    }, {} as GroupedItems);

    // 2. Extract categories with their priority and original name
    const categories = Object.entries(groupedByName).map(
      ([lowerCaseName, items]) => {
        // Get the original case name from the first item
        const originalName = items[0].category.name;
        const priority = items[0]?.category?.priority || 0;
        return {
          displayName: originalName, // Preserve original capitalization
          lowerCaseName,
          priority,
          items,
        };
      }
    );

    // 3. Sort categories by priority (ascending)
    categories.sort((a, b) => a.priority - b.priority);

    // 4. Create the final grouped object with original names
    const groupedByPriority: GroupedItems = {};
    categories.forEach((category) => {
      groupedByPriority[category.displayName] = category.items;
    });
    set({ groupedItems: groupedByPriority });
  },

  updatedCategories: async (categories: Category[]) => {
    toast.loading("Updating categories...");
    const fetchCategories = useCategoryStore.getState().fetchCategories;
    const user = useAuthStore.getState().userData as Partner;

    let allCats = categories;

    if (!categories || categories.length === 0) {
      allCats = (await fetchCategories(user.id)) || [];
    }

    const updatedItems = get().items.map((item: MenuItem) => {
      const category = allCats?.find((cat) => cat.id === item.category.id);

      return {
        ...item,
        category_id: category?.id || item.category_id,
        category: {
          ...item.category,
          name: category?.name || item.category.name,
          priority: category?.priority || item.category.priority,
        },
      };
    });
    set({ items: updatedItems });
    get().groupItems();
    toast.dismiss();
    toast.success("Categories updated successfully");
  },

  updateCategoriesAsBatch: async (categories: Category[]) => {
    try {
      toast.loading("Updating categories..");

      if (!categories || categories.length === 0) {
        throw new Error("No categories provided for update");
      }

      const updates = categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        priority: cat.priority ?? 0,
      }));

      const CHUNK_SIZE = 20;

      for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
        const chunk = updates.slice(i, i + CHUNK_SIZE);

        const mutation = getBatchUpdateMutation(chunk);

        const { data, errors } = await fetchFromHasura(mutation, {});

        if (errors) {
          throw new Error(`Failed to update chunk starting at index ${i}`);
        }
      }

      const updatedItems = get().items.map((item: MenuItem) => {
        const category = updates.find((cat) => cat.id === item.category.id);

        return category
          ? {
              ...item,
              category_id: category.id,
              category: {
                ...item.category,
                name: category.name,
                priority: category.priority ?? 0,
              },
            }
          : item;
      });

      set({ items: updatedItems });
      get().groupItems();
      const user = useAuthStore.getState().userData as Partner;
      revalidateTag(user?.id);

      toast.dismiss();
      toast.success(`Successfully updated categories`);
      return updates;
    } catch (error) {
      console.error("Batch update error:", error);
      toast.dismiss();
      toast.error("Failed to update categories");
      throw error;
    }
  },

  deleteCategoryAndItems: async (categoryId: string) => {
    try {
      toast.loading("Deleting category and its items...");
      const userData = useAuthStore.getState().userData as AuthUser;

      if (!userData) throw new Error("User data not found");

      // Execute the deletion
      await fetchFromHasura(delCategoryAndItems, {
        categoryId,
        partnerId: userData.id,
      });

      // Update local state
      const items = get().items.filter(
        (item) => item.category.id !== categoryId
      );
      set({ items });

      // Also update categories in category store
      const { categories, fetchCategories } = useCategoryStore.getState();
      const updatedCategories = categories.filter(
        (cat) => cat.id !== categoryId
      );
      useCategoryStore.setState({ categories: updatedCategories });

      // Re-fetch to ensure consistency
      await fetchCategories(userData.id);

      // Re-group items
      get().groupItems();
      revalidateTag(userData.id);

      toast.dismiss();
      toast.success("Category and its items deleted successfully");
    } catch (error) {
      console.error("Error deleting category and items:", error);
      toast.dismiss();
      toast.error("Failed to delete category and items");
      throw error;
    }
  },
  updateItemsAsBatch: async (
    items: {
      id: string;
      priority: number;
    }[]
  ) => {
    try {
      toast.loading("Updating item priorities...");
      const user = useAuthStore.getState().userData as Partner;

      if (!user) throw new Error("User data not found");

      // Create the batch mutation
      const mutation = `
        mutation UpdateItemsPriorityBatch {
          ${items
            .map(
              (item, index) => `
            update_${index}: update_menu_by_pk(
              pk_columns: { id: "${item.id}" }
              _set: {
                priority: ${item.priority}
              }
            ) {
              id
              priority
            }
          `
            )
            .join("\n")}
        }
      `;

      // Execute in chunks to avoid hitting Hasura limits
      const CHUNK_SIZE = 20;
      for (let i = 0; i < items.length; i += CHUNK_SIZE) {
        const chunk = items.slice(i, i + CHUNK_SIZE);
        const chunkMutation = `
          mutation UpdateItemsPriorityBatch {
            ${chunk
              .map(
                (item, index) => `
              update_${index}: update_menu_by_pk(
                pk_columns: { id: "${item.id}" }
                _set: {
                  priority: ${item.priority}
                }
              ) {
                id
                priority
              }
            `
              )
              .join("\n")}
          }
        `;

        await fetchFromHasura(chunkMutation, {});
      }

      // Update local state
      const updatedItems = get().items.map((currentItem) => {
        const updatedItem = items.find((item) => item.id === currentItem.id);
        return updatedItem
          ? { ...currentItem, priority: updatedItem.priority }
          : currentItem;
      });

      set({ items: updatedItems });
      get().groupItems();
      revalidateTag(user?.id);

      toast.dismiss();
      toast.success("Item priorities updated successfully");
    } catch (error) {
      console.error("Batch update error:", error);
      toast.dismiss();
      toast.error("Failed to update item priorities");
      throw error;
    }
  },
}));
