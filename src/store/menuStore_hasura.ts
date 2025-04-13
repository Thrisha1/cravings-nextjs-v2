import { create } from "zustand";
import { fetchFromHasura } from "@/lib/hasuraClient";
import {
  addMenu,
  deleteMenu,
  getCategoryImages,
  getMenu,
  updateMenu,
} from "@/api/menu";
import { AuthUser, useAuthStore } from "./authStore";
import { useCategoryStore } from "./categoryStore_hasura";
import { processImage } from "@/lib/processImage";
import { uploadFileToS3 } from "@/app/actions/aws-s3";

export interface MenuItem {
  id?: string;
  name: string;
  category: string;
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
    name: string;
  };
  name: string;
}

interface MenuState {
  items: MenuItem[];
  categoryImages: CategoryImages[];
  addItem: (item: Omit<MenuItem, "id">) => Promise<void>;
  fetchMenu: (hotelId?: string) => Promise<MenuItem[] | []>;
  updateItem: (id: string, updatedItem: Partial<MenuItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  fetchCategorieImages: (category: string) => Promise<CategoryImages[]>;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  items: [],
  categoryImages: [],

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
              category: mi.category.name,
            };
          })
        )) || [];
      set({ items });
      return items;
    } catch (error) {
      console.error("Error fetching menu: ", error);
      set({ items: [] });
      return [];
    }
  },

  addItem: async (item) => {
    try {
      console.log("Adding item: ", item);
      const userData = useAuthStore.getState().userData as AuthUser;
      const addCategory = useCategoryStore.getState().addCategory;

      if (!userData) throw new Error("User data not found");

      const category = await addCategory(item.category);
      const category_id = category?.id;

      if (!category_id) throw new Error("Category ID not found");

      const getProcessedBase64Url = await processImage(item.image_url);

      const s3Url = await uploadFileToS3(
        getProcessedBase64Url,
        `${userData.id}/menu/${item.name}.webp`
      );

      const newMenu = {
        name: item.name,
        category_id: category_id,
        image_url: s3Url || "",
        image_source: item.image_source || "",
        partner_id: userData.id,
        price: item.price,
        description: item.description || "",
      };

      const itemRes = await fetchFromHasura(addMenu, {
        menu: [newMenu],
      });

      console.log("Item added: ", itemRes);

      set({ items: [...get().items, item] });
    } catch (error) {
      console.error(error);
    }
  },

  updateItem: async (id, updatedItem) => {
    try {
      const categories = useCategoryStore.getState().categories;
      const { category, ...otherItems } = updatedItem;
      const userData = useAuthStore.getState().userData as AuthUser;

      let catid;
      let changedItem = { ...otherItems };

      if (category) {
        const cat = categories.find((cat) => cat.name === category);
        catid = cat?.id;
        changedItem = { ...changedItem, category_id: catid };
      }


      if(updatedItem.image_url) {
        const getProcessedBase64Url = await processImage(updatedItem.image_url);
        console.log("Processed image URL: ", getProcessedBase64Url);
        
        const s3Url = await uploadFileToS3(
          getProcessedBase64Url,
          `${userData.id}/menu/${updatedItem.name}.webp`
        );

        changedItem = { ...changedItem, image_url: s3Url || "" };
      }

      await fetchFromHasura(updateMenu, {
        id,
        menu: changedItem,
      });

      const items = get().items.map((item) =>
        item.id === id ? { ...item, ...updatedItem } : item
      );
      set({ items });
    } catch (error) {
      console.error("Error ", error);
    }
  },

  deleteItem: async (id) => {
    try {
      await fetchFromHasura(deleteMenu, {
        id,
      });
      const items = get().items.filter((item) => item.id !== id);
      set({ items });
    } catch (error) {
      console.error("Error ", error);
    }
  },

  fetchCategorieImages: async (category: string) => {
    try {
      const userData = useAuthStore.getState().userData as AuthUser;
      if (!userData) throw new Error("User data not found");

      if (get().categoryImages.length > 0) {
        const hasImagesOfSameCat = get().categoryImages.some(
          (img) => img.category.name === category
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
      return images.menu as CategoryImages[];
    } catch (error) {
      console.error("Error ", error);
      set({ categoryImages: [] });
      return [];
    }
  },
}));
