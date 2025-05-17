"use client";

import { useState, useEffect } from "react";
import { MenuItem } from "@/components/bulkMenuUpload/EditItemModal";
import { MenuItem as MenuItemStore } from "@/store/menuStore_hasura";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useMenuStore } from "@/store/menuStore_hasura";
import { getImageSource } from "@/lib/getImageSource";
import axios from "axios";

export const useBulkUpload = () => {
  const [loading, setLoading] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const { userData } = useAuthStore();
  const {
    addItem,
    items: menu,
    fetchMenu,
    fetchCategorieImages,
  } = useMenuStore();
  const [editingItem, setEditingItem] = useState<{
    index: number;
    item: MenuItem;
  } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  const validateMenuItem = (item: MenuItem) => {
    if (!item.name || typeof item.name !== "string") {
      throw new Error("Name is required and must be a string");
    }
    if (
      !item.price ||
      typeof Number(item.price) !== "number" ||
      isNaN(Number(item.price))
    ) {
      throw new Error("Price is required and must be a number");
    }

    return {
      ...item,
      price: Number(item.price),
    };
  };

  useEffect(() => {
    if (userData?.role === "partner") {
      fetchMenu();
    }
  }, [fetchMenu, userData?.role]);

  useEffect(() => {
    const savedItems = localStorage.getItem("bulkMenuItems");
    const savedJsonInput = localStorage.getItem("jsonInput");
    if (savedJsonInput) {
      setJsonInput(savedJsonInput);
    }
    if (savedItems) {
      const items = JSON.parse(savedItems);
      const updatedItems = items.map((item: MenuItem) => ({
        ...item,
        isAdded: menu.some(
          (menuItem) =>
            menuItem.name === item.name &&
            menuItem.price === item.price &&
            menuItem.description === item.description
        ),
      }));
      setMenuItems(updatedItems);
    }
  }, [menu]);

  // const delay = (ms: number) =>
  //   new Promise((resolve) => setTimeout(resolve, ms));

  const handleJsonSubmit = async () => {
    try {
      const parsedItems = JSON.parse(jsonInput);
      localStorage.setItem("jsonInput", jsonInput);
      const items = Array.isArray(parsedItems) ? parsedItems : [parsedItems];

      items.forEach(validateMenuItem);

      const initialItems = items.map((item) => ({
        ...validateMenuItem(item),
        image: item.image || "",
        isSelected: false,
        isAdded: false,
        category: {
          name: item.category,
          id: item.category,
          priority: 0,
        },
      }));

      setMenuItems(initialItems);
      localStorage.setItem("bulkMenuItems", JSON.stringify(initialItems));

      toast.success("All items processed successfully!");
    } catch (error) {
      console.error("Error processing JSON:", error);
      toast.error(
        error instanceof Error ? error.message : "Invalid JSON format"
      );
    }
  };

  const handleClear = () => {
    setMenuItems([]);
    setJsonInput("");
    localStorage.removeItem("bulkMenuItems");
    localStorage.removeItem("jsonInput");
  };

  const handleHotelSelect = async (hotelId: string) => {
    await fetchMenu(hotelId);
  };

  const handleAddToMenu = async (
    item: MenuItem,
    index: number,
    hotelId?: string
  ) => {
    if (!item.category) {
      toast.error("Please select a category first");
      return;
    }

    setIsUploading((prev) => ({ ...prev, [index]: true }));
    try {
      const convertImageToLocalBlob = async (url: string) => {
        const response = await fetch(url);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      };

      let image_url = item.image;

      if (image_url.length > 0) {
        image_url = await convertImageToLocalBlob(item.image);
      }

      const newItem = {
        name: item.name,
        price: item.price,
        image_url: image_url,
        image_source: getImageSource(item.image),
        description: item.description,
        category: item.category,
      } as Omit<MenuItemStore, "id">;

      await addItem(newItem);

      const updatedItems = [...menuItems];
      updatedItems[index] = { ...updatedItems[index], isAdded: true };
      setMenuItems(updatedItems);
      localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
      fetchMenu(hotelId);
      toast.success("Item added to menu successfully!");
    } catch (error) {
      console.error("Error adding item to menu:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add item to menu"
      );
    } finally {
      setIsUploading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleDelete = (index: number) => {
    const updatedItems = menuItems.filter((_, i) => i !== index);
    setMenuItems(updatedItems);
    localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    const updatedItems = menuItems.map((item) => ({
      ...item,
      isSelected: newSelectAll,
    }));
    setMenuItems(updatedItems);
    localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
  };

  const handleSelectItem = (index: number) => {
    if (!menuItems[index].category) {
      toast.error("Please select a category first");
      return;
    }
    const updatedItems = [...menuItems];
    updatedItems[index] = {
      ...updatedItems[index],
      isSelected: !updatedItems[index].isSelected,
    };
    setMenuItems(updatedItems);
    localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
  };

  const handleUploadSelected = async (hotelId?: string) => {
    if (!hotelId && userData?.role === "superadmin") {
      toast.error("Please select a hotel first");
      return;
    }

    const selectedItems = menuItems.filter(
      (item) => item.isSelected && !item.isAdded
    );

    if (selectedItems.length === 0) {
      toast.error("Please select items to upload");
      return;
    }

    const itemsWithoutCategory = selectedItems.filter((item) => !item.category);
    if (itemsWithoutCategory.length > 0) {
      toast.error("All selected items must have a category");
      return;
    }

    setIsBulkUploading(true);
    try {
      for (const item of selectedItems) {
        const index = menuItems.indexOf(item);
        await handleAddToMenu(item, index, hotelId);
      }

      toast.success("All selected items uploaded successfully!");
    } catch (error) {
      console.error("Error uploading items:", error);
      toast.error("Failed to upload some items");
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleEdit = (index: number, item: MenuItem) => {
    console.log("item", item);
    setEditingItem({ index, item });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editingItem) {
      try {
        const validatedItem = validateMenuItem(editingItem.item);
        const updatedItems = [...menuItems];

        if (!validatedItem.image) {
          // const urls = await getMenuItemImage(
          //   validatedItem.category,
          //   validatedItem.name
          // );
          const urls: string[] = [];
          if (urls && urls.length > 0) {
            validatedItem.image = urls[0];
          } else {
            validatedItem.image = "/image_placeholder.webp";
          }
        }

        updatedItems[editingItem.index] = validatedItem;
        setMenuItems(updatedItems);
        localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
        setEditingItem(null);
        setIsEditModalOpen(false);
      } catch (err) {
        console.error("Error saving edit:", err);
        toast.error(err instanceof Error ? err.message : "Invalid item data");
      }
    }
  };

  const handleMenuItemClick = async (
    item: MenuItem,
    index: number,
    hotelId?: string
  ) => {
    if (!hotelId && userData?.role === "superadmin") {
      toast.error("Please select a hotel first");
      return;
    }
    await handleAddToMenu(item, index, hotelId);
  };

  const handleCategoryChange = async (
    index: number,
    category: { name: string; id: string; priority: number }
  ) => {
    const updatedItems = [...menuItems];
    updatedItems[index] = {
      ...updatedItems[index],
      category,
      image: "/loading-image.gif",
    };

    setMenuItems(updatedItems);

    try {
      const urls = (await fetchCategorieImages(category.name)).map(
        (img) => img.image_url
      );
      if (urls && urls.length > 0) {
        updatedItems[index].image = urls[0];
        setMenuItems([...updatedItems]);
        localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
      }
    } catch (error) {
      console.error("Error fetching image:", error);
      toast.error("Failed to fetch image for the new category");
    }
  };

  const handleImageClick = async (index: number, newImage?: string) => {
    if (newImage) {
      const updatedItems = [...menuItems];
      updatedItems[index] = {
        ...updatedItems[index],
        image: newImage,
      };
      setMenuItems(updatedItems);
      localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
    }
  };

  const handleGenerateImages = async () => {
    if (!menuItems) return;
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/fullImages", menuItems, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data && Array.isArray(response.data)) {
        setMenuItems(response.data);
        localStorage.setItem("bulkMenuItems", JSON.stringify(response.data));
        toast.success("Full images generated successfully!");
      } else {
        throw new Error("Invalid response from image generation server");
      }
    } catch (err) {
      console.error(`Image generation error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      toast.error("Failed to generate full images");
    } finally {
      setLoading(false);
    }
  };

  const handlePartialImageGeneration = async () => {
    if (!menuItems) return;
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/partialImages", menuItems, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data && Array.isArray(response.data)) {
        setMenuItems(response.data);
        localStorage.setItem("bulkMenuItems", JSON.stringify(response.data));
        toast.success("Partial images generated successfully!");
      } else {
        throw new Error("Invalid response from partial image generation server");
      }
    } catch (err) {
      console.error(`Partial image generation error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      toast.error("Failed to generate partial images");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAIImages = async () => {
    if (!menuItems) return;
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/generateAIImages", menuItems, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data && Array.isArray(response.data)) {
        console.log("response.data", response.data);
        setMenuItems(response.data);
        localStorage.setItem("bulkMenuItems", JSON.stringify(response.data));
        toast.success("AI images generated successfully!");
      } else {
        throw new Error("Invalid response from AI image generation server");
      }
    } catch (err) {
      console.error(`AI Image generation error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      toast.error("Failed to generate AI images");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    setLoading,
    jsonInput,
    setJsonInput,
    menuItems,
    selectAll,
    editingItem,
    setEditingItem,
    isEditModalOpen,
    setIsEditModalOpen,
    isUploading,
    isBulkUploading,
    handleJsonSubmit,
    handleClear,
    handleAddToMenu: handleMenuItemClick,
    handleDelete,
    handleSelectAll,
    handleSelectItem,
    handleUploadSelected,
    handleEdit,
    handleSaveEdit,
    handleImageClick,
    handleHotelSelect,
    handleCategoryChange,
    handleGenerateImages,
    handlePartialImageGeneration,
    handleGenerateAIImages,
  };
};
