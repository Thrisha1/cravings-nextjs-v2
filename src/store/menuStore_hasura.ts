import { create } from "zustand";
import { fetchFromHasura } from "@/lib/hasuraClient";
import {
  addMenu,
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

interface GroupedItems {
  [key: string]: MenuItem[];
}

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

      const category = await addCategory(item.category.name);
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
          `${userData.id}/menu/${item.name}_${item.category.name}_${Date.now()}.webp`
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
      allCats = await fetchCategories(user.id) || [];
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
}));
