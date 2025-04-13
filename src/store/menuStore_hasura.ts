import { create } from "zustand";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { addMenu, getMenu } from "@/api/menu";
import { AuthUser, useAuthStore } from "./authStore";
import { useCategoryStore } from "./categoryStore_hasura";

export interface MenuItem {
  id?: string;
  name: string;
  category: string;
  image_url: string;
  image_source?: string;
  partner_id: string;
  price: number;
}

interface MenuState {
  items: MenuItem[];
  addItem: (item: Omit<MenuItem, "id">) => Promise<void>;
  fetchMenu: (hotelId?: string) => Promise<MenuItem[] | []>;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  items: [],

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
          res.menu.map(
            (mi: {
              id: string;
              name: string;
              category: { name: string };
              image_url: string;
              image_source: string;
              partner_id: string;
              price: number;
            }) => {
              return {
                ...mi,
                category: mi.category.name,
              };
            }
          )
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

      const newMenu = {
        name: item.name,
        category_id: category_id,
        image_url: item.image_url,
        image_source: item.image_source || "",
        partner_id: userData.id,
        price: item.price,
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
}));
