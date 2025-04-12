import { create } from "zustand";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { addMenu } from "@/api/menu";

export interface MenuItem {
  id?: string;
  name: string;
  category_id: string;
  image_url: string;
  image_source?: string;
  partner_id: string;
  price: number;
}

interface MenuState {
  items: MenuItem[];
  addItem: (item: Omit<MenuItem, "id">) => Promise<void>;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  items: [],

  addItem: async (item) => {
    try {
      console.log("Adding item: ", item);
      const menu = {
        name: item.name,
        category_id: item.category_id,
        image_url: item.image_url,
        image_source: item.image_source || "",
        partner_id: item.partner_id,
        price: item.price,
      } as MenuItem;

      const itemRes = await fetchFromHasura(addMenu, {
        menu: [menu],
      });

      console.log("Item added: ", itemRes);

      set({ items: [...get().items, item] });
    } catch (error) {
      console.error(error);
    }
  },

  
}));
