"use client";

import React, { useEffect, useState } from "react";
import { useMenuStore } from "@/store/menuStore_hasura"; // Assuming this is your store path
import { getAuthCookie } from "@/app/auth/actions";
import { CategoryManagementForm } from "@/components/admin/CategoryManagementModal";
import { ItemOrderingForm } from "@/components/admin/ItemOrderingModal";
import { MenuItem } from "@/screens/HotelMenuPage_v2";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatDisplayName } from "@/store/categoryStore_hasura";
import { Card, CardHeader } from "@/components/ui/card";
import Img from "@/components/Img";

const MenuDisplay = () => {
  // 1. Get the state and the fetch function from your Zustand store
  const { groupedItems, fetchMenu } = useMenuStore();
    const [tempItems, setTempItems] = useState<Record<string, MenuItem[]>>({});
      const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
        {}
      );
  

  const fetchMenus = async () => {
    // const cookies = await getAuthCookie();

    // if (!cookies) {
    //   console.log("No auth cookie found.");
    //   return;
    // }

    // await fetchMenu(cookies?.id as string, true);
  };

  // 2. Use useEffect to fetch data when the component mounts
  useEffect(() => {
    // This function will be called once after the initial render
    fetchMenus();
  }, []); // Dependency array ensures this runs only when fetchMenus changes (typically only once)

  // 3. Add a loading state for when data is not yet available
  if (!groupedItems) {
    return (
      <div className="text-center p-10">
        <p className="text-gray-500">Loading menu...</p>
      </div>
    );
  }

    useEffect(() => {
      if (!groupedItems) return;
  
      const filtered: Record<string, MenuItem[]> = {};
      const newOpenCategories: Record<string, boolean> = {};
  
  
      setTempItems(filtered);
       setOpenCategories(newOpenCategories);
    }, [groupedItems]);

  // 4. Once data is loaded, use Object.entries to map and render it
  return (
    <div className="p-8">
      <CategoryManagementForm
        categories={Object.entries(groupedItems).map(([category, items]) => ({
          id: items[0].category.id,
          name: category,
          priority: items[0].category.priority || 0,
          is_active: items[0].category.is_active !== false ? true : false,
        }))}
        onSubmit={async (updatedCategories) => {
          // try {
          //   await updateCategoriesAsBatch(updatedCategories);
          //   setIsCategoryEditing(false);
          //   fetchMenu();
          // } catch (error) {
          //   console.error("Failed to update categories:", error);
          //   toast.error("Failed to update categories");
          // }
        }}
        onCancel={() => {}}
      />

      <div className="mb-6 border rounded-lg shadow-sm">
        <ItemOrderingForm
          categories={Object.entries(groupedItems).map(([category, items]) => ({
            id: items[0].category.id,
            name: category,
            priority: items[0].category.priority || 0,
          }))}
          items={Object.values(groupedItems).flat()}
          onSubmit={async (updatedItems) => {
            try {
              // const updates = updatedItems
              //   .filter(
              //     (item) => typeof item.id === "string" && item.id.length > 0
              //   )
              //   .map((item) => ({
              //     id: item.id as string,
              //     priority: item.priority != null ? item.priority : 0, // Ensure number
              //   }));
              // await updateItemsAsBatch(updates);
              // setIsInlineItemOrdering(false);
              // fetchMenu();
              // toast.success("Item order updated successfully");
            } catch (error) {
              // console.error("Failed to update item order:", error);
              // toast.error("Failed to update item order");
            }
          }}
          onCancel={() => {}}
        />
      </div>



   
    </div>
  );
};

export default MenuDisplay;
