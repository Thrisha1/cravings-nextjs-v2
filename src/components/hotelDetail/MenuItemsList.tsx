import { useCategoryStore } from "@/store/categoryStore";
import { useMenuStore } from "@/store/menuStore";
import React, { useEffect } from "react";

const MenuItemsList = ({ hotelId }: { hotelId: string }) => {
  const { items, fetchMenu } = useMenuStore();
  const { getCategoryById } = useCategoryStore();
  const [categorisedItems, setCategorisedItems] = React.useState<{
    [key: string]: any[];
  }>({});

  useEffect(() => {
    const fetchData = async () => {
      await fetchMenu(hotelId);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchGroupedItems = async() => {
      const groupedItems: { [key: string]: any[] } = {};
      for (const item of items) {
        const category = await getCategoryById(item.category) || "Uncategorized";
        if (!groupedItems[category]) {
          groupedItems[category] = [];
        }
        groupedItems[category].push(item);
      }

      console.log("Grouped Items:", groupedItems);
      
      setCategorisedItems(groupedItems);
    };

    if (items) {
      fetchGroupedItems();
    }

    console.log(items, "Items");
    
  }, [items]);

  return <div>MenuItemsList</div>;
};

export default MenuItemsList;
