"use client";

import { useState, useEffect } from "react";
import { MenuItem } from "@/components/bulkMenuUpload/EditItemModal";
import { MenuItem as MenuItemStore } from "@/store/menuStore_hasura";
import { toast } from "sonner";
import { useMenuStore } from "@/store/menuStore_hasura";
import { getImageSource } from "@/lib/getImageSource";
import axios from "axios";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { addCategory, getCategory } from "@/api/category";
import { addMenu } from "@/api/menu";
import { processImage } from "@/lib/processImage";
import { uploadFileToS3 } from "@/app/actions/aws-s3";

export const useSuperAdminBulkUpload = () => {
  const [loading, setLoading] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const {
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
    const savedItems = localStorage.getItem("superAdminBulkMenuItems");
    const savedJsonInput = localStorage.getItem("superAdminJsonInput");
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

  const handleJsonSubmit = async () => {
    try {
      const parsedItems = JSON.parse(jsonInput);
      localStorage.setItem("superAdminJsonInput", jsonInput);
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
      localStorage.setItem("superAdminBulkMenuItems", JSON.stringify(initialItems));

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
    localStorage.removeItem("superAdminBulkMenuItems");
    localStorage.removeItem("superAdminJsonInput");
  };

  const handleHotelSelect = async (hotelId: string) => {
    await fetchMenu(hotelId);
  };

  // Helper function to format category name for storage
  const formatStorageName = (name: string): string => {
    return name.toLowerCase().trim().replace(/ /g, "_");
  };

  // Helper function to format category name for display
  const formatDisplayName = (name: string): string => {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Superadmin-specific category creation
  const addCategoryForPartner = async (categoryName: string, partnerId: string) => {
    try {
      if (!categoryName) throw new Error("Category name is required");
      if (!partnerId) throw new Error("Partner ID is required");

      const formattedName = formatStorageName(categoryName);

      // Check if category already exists for this partner
      const existingCategories = await fetchFromHasura(getCategory, {
        name: categoryName,
        name_with_space: formattedName.replace(/_/g, " "),
        name_with_underscore: formattedName.replace(/ /g, "_"),
        partner_id: partnerId,
      }).then((res) => res.category);

      const existingCategory = existingCategories[0];

      if (existingCategory) {
        return existingCategory;
      } else {
        // Create new category for the partner
        const addedCat = await fetchFromHasura(addCategory, {
          category: {
            name: formattedName,
            partner_id: partnerId,
          },
        }).then((res) => res.insert_category.returning[0]);

        return addedCat;
      }
    } catch (error) {
      console.error("Error adding category for partner:", error);
      throw error;
    }
  };

  // Superadmin-specific menu item addition
  const addItemForPartner = async (item: Omit<MenuItemStore, "id">, partnerId: string) => {
    try {
      if (!partnerId) throw new Error("Partner ID is required");

      // Add category for the partner
      const category = await addCategoryForPartner(
        item.category.name.trim().toLowerCase(),
        partnerId
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
          `${partnerId}/menu/${item.name}_${
            item.category.name
          }_${Date.now()}.webp`
        );
      }

      const newMenu = {
        name: item.name,
        category_id: category_id,
        image_url: s3Url || "",
        image_source: item.image_source || "",
        partner_id: partnerId,
        price: item.price,
        description: item.description || "",
      };

      const { insert_menu } = await fetchFromHasura(addMenu, {
        menu: [newMenu],
      });

      return insert_menu.returning[0];
    } catch (error) {
      console.error("Error adding item for partner:", error);
      throw error;
    }
  };

  const handleAddToMenu = async (
    item: MenuItem,
    index: number,
    partnerId?: string
  ) => {
    if (!item.category) {
      toast.error("Please select a category first");
      return;
    }

    if (!partnerId) {
      toast.error("Partner ID is required");
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

      await addItemForPartner(newItem, partnerId);

      const updatedItems = [...menuItems];
      updatedItems[index] = { ...updatedItems[index], isAdded: true };
      setMenuItems(updatedItems);
      localStorage.setItem("superAdminBulkMenuItems", JSON.stringify(updatedItems));
      
      // Refresh the menu for the partner
      await fetchMenu(partnerId);
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
    localStorage.setItem("superAdminBulkMenuItems", JSON.stringify(updatedItems));
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    const updatedItems = menuItems.map((item) => ({
      ...item,
      isSelected: newSelectAll,
    }));
    setMenuItems(updatedItems);
    localStorage.setItem("superAdminBulkMenuItems", JSON.stringify(updatedItems));
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
    localStorage.setItem("superAdminBulkMenuItems", JSON.stringify(updatedItems));
  };

  const handleUploadSelected = async (partnerId?: string) => {
    if (!partnerId) {
      toast.error("Partner ID is required");
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
        await handleAddToMenu(item, index, partnerId);
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
          const urls: string[] = [];
          if (urls && urls.length > 0) {
            validatedItem.image = urls[0];
          } else {
            validatedItem.image = "/image_placeholder.webp";
          }
        }

        updatedItems[editingItem.index] = validatedItem;
        setMenuItems(updatedItems);
        localStorage.setItem("superAdminBulkMenuItems", JSON.stringify(updatedItems));
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
    partnerId?: string
  ) => {
    if (!partnerId) {
      toast.error("Partner ID is required");
      return;
    }
    await handleAddToMenu(item, index, partnerId);
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
        localStorage.setItem("superAdminBulkMenuItems", JSON.stringify(updatedItems));
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
      localStorage.setItem("superAdminBulkMenuItems", JSON.stringify(updatedItems));
    }
  };

  const BATCH_SIZE = 20;

  const processBatch = async (
    endpoint: string,
    items: any[],
    successMessage: string
  ) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/image-gen/${endpoint}`,
        items,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      throw new Error(`Invalid response from ${endpoint} server`);
    } catch (err) {
      console.error(
        `${endpoint} error: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      throw err;
    }
  };

  const handleBatchImageGeneration = async (
    endpoint: string,
    successMessage: string
  ) => {
    if (!menuItems) return;

    setLoading(true);
    const totalItems = menuItems.length;
    let updatedItems = [...menuItems];
    let processedCount = 0;

    try {
      // Process in batches
      for (let i = 0; i < totalItems; i += BATCH_SIZE) {
        const batch = menuItems.slice(i, i + BATCH_SIZE);

        toast.info(
          `Processing items ${i + 1}-${Math.min(
            i + BATCH_SIZE,
            totalItems
          )} of ${totalItems}...`
        );

        const batchResults = await processBatch(
          endpoint,
          batch,
          successMessage
        );
        updatedItems = updatedItems.map((item, index) =>
          index >= i && index < i + BATCH_SIZE ? batchResults[index - i] : item
        );

        processedCount += batch.length;
        setMenuItems([...updatedItems]);
        localStorage.setItem("superAdminBulkMenuItems", JSON.stringify(updatedItems));
      }

      toast.success(successMessage);
    } catch (err) {
      console.error(
        `Batch processing error: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      toast.error(
        `Failed to generate images. Processed ${processedCount} of ${totalItems} items.`
      );
    } finally {
      setLoading(false);
    }
  };

  // Updated handlers
  const handleGenerateImages = () =>
    handleBatchImageGeneration(
      "fullImages",
      "Full images generated successfully!"
    );
  const handlePartialImageGeneration = () =>
    handleBatchImageGeneration(
      "partialImages",
      "Partial images generated successfully!"
    );
  const handleGenerateAIImages = () =>
    handleBatchImageGeneration(
      "generateAIImages",
      "AI images generated successfully!"
    );

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