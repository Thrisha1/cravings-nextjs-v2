"use client";

import { useState, useEffect } from "react";
import { MenuItem } from "@/components/bulkMenuUpload/EditItemModal";
import { MenuItem as MenuItemStore } from "@/store/menuStore_hasura";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useMenuStore } from "@/store/menuStore_hasura";
import { getImageSource } from "@/lib/getImageSource";
import axios from "axios";

// Debug logging function
const debugLog = (context: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[BulkUpload][${timestamp}][${context}] ${message}`);
  if (data !== undefined) {
    console.log(`[BulkUpload][${timestamp}][${context}] Data:`, data);
  }
};

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

  debugLog("Hook Initialization", "useBulkUpload hook initialized", { 
    userId: userData?.id,
    userRole: userData?.role 
  });

  const validateMenuItem = (item: MenuItem) => {
    debugLog("validateMenuItem", "Validating menu item", { item });
    
    if (!item.name || typeof item.name !== "string") {
      debugLog("validateMenuItem", "Validation failed: Name is required and must be a string", { itemName: item.name });
      throw new Error("Name is required and must be a string");
    }
    if (
      !item.price ||
      typeof Number(item.price) !== "number" ||
      isNaN(Number(item.price))
    ) {
      debugLog("validateMenuItem", "Validation failed: Price is required and must be a number", { itemPrice: item.price });
      throw new Error("Price is required and must be a number");
    }

    const validatedItem = {
      ...item,
      price: Number(item.price),
    };
    debugLog("validateMenuItem", "Item validated successfully", { validatedItem });
    return validatedItem;
  };

  useEffect(() => {
    debugLog("useEffect[fetchMenu]", "Checking if menu should be fetched", { userRole: userData?.role });
    if (userData?.role === "partner") {
      debugLog("useEffect[fetchMenu]", "Fetching menu for partner", { partnerId: userData?.id });
      fetchMenu();
    }
  }, [fetchMenu, userData?.role]);

  useEffect(() => {
    debugLog("useEffect[localStorage]", "Loading saved items from localStorage");
    
    const savedItems = localStorage.getItem("bulkMenuItems");
    const savedJsonInput = localStorage.getItem("jsonInput");
    
    if (savedJsonInput) {
      debugLog("useEffect[localStorage]", "Found saved JSON input in localStorage");
      setJsonInput(savedJsonInput);
    }
    
    if (savedItems) {
      debugLog("useEffect[localStorage]", "Found saved menu items in localStorage");
      const items = JSON.parse(savedItems);
      debugLog("useEffect[localStorage]", "Parsed saved items", { itemCount: items.length });
      
      const updatedItems = items.map((item: MenuItem) => {
        const isAdded = menu.some(
          (menuItem) =>
            menuItem.name === item.name &&
            menuItem.price === item.price &&
            menuItem.description === item.description
        );
        
        return {
          ...item,
          isAdded
        };
      });
      
      debugLog("useEffect[localStorage]", "Updated items with isAdded status", { 
        updatedItemCount: updatedItems.length,
        addedItemsCount: updatedItems.filter((i: MenuItem) => i.isAdded).length
      });
      
      setMenuItems(updatedItems);
    }
  }, [menu]);

  // const delay = (ms: number) =>
  //   new Promise((resolve) => setTimeout(resolve, ms));

  const handleJsonSubmit = async () => {
    debugLog("handleJsonSubmit", "Starting JSON processing", { inputLength: jsonInput.length });
    
    try {
      debugLog("handleJsonSubmit", "Attempting to parse JSON");
      const parsedItems = JSON.parse(jsonInput);
      localStorage.setItem("jsonInput", jsonInput);
      debugLog("handleJsonSubmit", "JSON parsed successfully", { 
        isArray: Array.isArray(parsedItems),
        itemCount: Array.isArray(parsedItems) ? parsedItems.length : 1
      });
      
      const items = Array.isArray(parsedItems) ? parsedItems : [parsedItems];
      debugLog("handleJsonSubmit", "Items array prepared", { itemCount: items.length });

      // Validate each item
      items.forEach((item, idx) => {
        debugLog("handleJsonSubmit", `Validating item #${idx + 1}`, { item });
        validateMenuItem(item);
      });

      const initialItems = items.map((item) => {
        const validItem = validateMenuItem(item);
        return {
          ...validItem,
          image: item.image || "",
          isSelected: false,
          isAdded: false,
          category: {
            name: item.category,
            id: item.category,
            priority: 0,
          },
        };
      });
      
      debugLog("handleJsonSubmit", "All items processed", { initialItemCount: initialItems.length });

      setMenuItems(initialItems);
      localStorage.setItem("bulkMenuItems", JSON.stringify(initialItems));
      debugLog("handleJsonSubmit", "Items saved to state and localStorage");

      toast.success("All items processed successfully!");
    } catch (error) {
      debugLog("handleJsonSubmit", "Error processing JSON", { error });
      console.error("Error processing JSON:", error);
      toast.error(
        error instanceof Error ? error.message : "Invalid JSON format"
      );
    }
  };

  const handleClear = () => {
    debugLog("handleClear", "Clearing all menu items and JSON input");
    setMenuItems([]);
    setJsonInput("");
    localStorage.removeItem("bulkMenuItems");
    localStorage.removeItem("jsonInput");
    debugLog("handleClear", "State and localStorage cleared");
  };

  const handleHotelSelect = async (hotelId: string) => {
    debugLog("handleHotelSelect", "Hotel selected, fetching menu", { hotelId });
    await fetchMenu(hotelId);
    debugLog("handleHotelSelect", "Menu fetched successfully");
  };

  const handleAddToMenu = async (
    item: MenuItem,
    index: number,
    hotelId?: string
  ) => {
    debugLog("handleAddToMenu", "Starting add to menu operation", { index, item, hotelId });
    
    if (!item.category) {
      debugLog("handleAddToMenu", "Error: No category selected");
      toast.error("Please select a category first");
      return;
    }

    setIsUploading((prev) => ({ ...prev, [index]: true }));
    debugLog("handleAddToMenu", "Set uploading state for item", { index, isUploading: true });
    
    try {
      debugLog("handleAddToMenu", "Converting remote image to local blob", { imageUrl: item.image });
      const convertImageToLocalBlob = async (url: string) => {
        debugLog("convertImageToLocalBlob", "Fetching image", { url });
        const response = await fetch(url);
        debugLog("convertImageToLocalBlob", "Image fetch response", { 
          status: response.status,
          ok: response.ok,
          contentType: response.headers.get("content-type")
        });
        
        const blob = await response.blob();
        debugLog("convertImageToLocalBlob", "Blob created", { 
          size: blob.size,
          type: blob.type
        });
        
        const objectUrl = URL.createObjectURL(blob);
        debugLog("convertImageToLocalBlob", "Object URL created", { objectUrl });
        return objectUrl;
      };

      let image_url = item.image;

      if (image_url.length > 0) {
        debugLog("handleAddToMenu", "Processing image URL", { originalUrl: image_url });
        image_url = await convertImageToLocalBlob(item.image);
        debugLog("handleAddToMenu", "Image converted to local blob", { localBlobUrl: image_url });
      }

      const newItem = {
        name: item.name,
        price: item.price,
        image_url: image_url,
        image_source: getImageSource(item.image),
        description: item.description,
        category: item.category,
      } as Omit<MenuItemStore, "id">;
      
      debugLog("handleAddToMenu", "Prepared item for adding to menu", { newItem });

      await addItem(newItem);
      debugLog("handleAddToMenu", "Item added to menu successfully");

      const updatedItems = [...menuItems];
      updatedItems[index] = { ...updatedItems[index], isAdded: true };
      setMenuItems(updatedItems);
      debugLog("handleAddToMenu", "Updated menu items state with isAdded=true", { index });
      
      localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
      debugLog("handleAddToMenu", "Saved updated items to localStorage");
      
      fetchMenu(hotelId);
      debugLog("handleAddToMenu", "Refreshing menu after item addition", { hotelId });
      
      toast.success("Item added to menu successfully!");
    } catch (error) {
      debugLog("handleAddToMenu", "Error adding item to menu", { error });
      console.error("Error adding item to menu:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add item to menu"
      );
    } finally {
      setIsUploading((prev) => ({ ...prev, [index]: false }));
      debugLog("handleAddToMenu", "Set uploading state for item", { index, isUploading: false });
    }
  };

  const handleDelete = (index: number) => {
    debugLog("handleDelete", "Deleting item", { index });
    const updatedItems = menuItems.filter((_, i) => i !== index);
    debugLog("handleDelete", "Updated items after deletion", { 
      originalCount: menuItems.length,
      newCount: updatedItems.length
    });
    
    setMenuItems(updatedItems);
    localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
    debugLog("handleDelete", "Item deleted and localStorage updated");
  };

  const handleSelectAll = () => {
    debugLog("handleSelectAll", "Toggling select all", { currentValue: selectAll });
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    const updatedItems = menuItems.map((item) => ({
      ...item,
      isSelected: newSelectAll,
    }));
    
    debugLog("handleSelectAll", "Updated all items selection status", { 
      newSelectAll,
      itemCount: updatedItems.length,
      selectedCount: newSelectAll ? updatedItems.length : 0
    });
    
    setMenuItems(updatedItems);
    localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
    debugLog("handleSelectAll", "Selection updated in state and localStorage");
  };

  const handleSelectItem = (index: number) => {
    debugLog("handleSelectItem", "Selecting individual item", { index });
    
    if (!menuItems[index].category) {
      debugLog("handleSelectItem", "Error: No category selected", { index });
      toast.error("Please select a category first");
      return;
    }
    
    const updatedItems = [...menuItems];
    const newSelectedState = !updatedItems[index].isSelected;
    updatedItems[index] = {
      ...updatedItems[index],
      isSelected: newSelectedState,
    };
    
    debugLog("handleSelectItem", "Updated item selection status", { 
      index, 
      newSelectedState
    });
    
    setMenuItems(updatedItems);
    localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
    debugLog("handleSelectItem", "Selection updated in state and localStorage");
  };

  const handleUploadSelected = async (hotelId?: string) => {
    debugLog("handleUploadSelected", "Starting bulk upload", { hotelId });
    
    if (!hotelId && userData?.role === "superadmin") {
      debugLog("handleUploadSelected", "Error: No hotel selected for superadmin");
      toast.error("Please select a hotel first");
      return;
    }

    const selectedItems = menuItems.filter(
      (item) => item.isSelected && !item.isAdded
    );
    
    debugLog("handleUploadSelected", "Filtered items for upload", { 
      selectedCount: selectedItems.length,
      totalItems: menuItems.length
    });

    if (selectedItems.length === 0) {
      debugLog("handleUploadSelected", "Error: No items selected");
      toast.error("Please select items to upload");
      return;
    }

    const itemsWithoutCategory = selectedItems.filter((item) => !item.category);
    if (itemsWithoutCategory.length > 0) {
      debugLog("handleUploadSelected", "Error: Some items missing category", { 
        itemsWithoutCategoryCount: itemsWithoutCategory.length,
        itemsWithoutCategory
      });
      toast.error("All selected items must have a category");
      return;
    }

    setIsBulkUploading(true);
    debugLog("handleUploadSelected", "Set bulk uploading state to true");
    
    try {
      debugLog("handleUploadSelected", "Starting to process items batch", { 
        itemCount: selectedItems.length 
      });
      
      for (const item of selectedItems) {
        const index = menuItems.indexOf(item);
        debugLog("handleUploadSelected", `Processing item ${index + 1}/${selectedItems.length}`, {
          item,
          index
        });
        
        await handleAddToMenu(item, index, hotelId);
        debugLog("handleUploadSelected", `Item ${index + 1}/${selectedItems.length} processed`);
      }

      debugLog("handleUploadSelected", "All items uploaded successfully");
      toast.success("All selected items uploaded successfully!");
    } catch (error) {
      debugLog("handleUploadSelected", "Error uploading items", { error });
      console.error("Error uploading items:", error);
      toast.error("Failed to upload some items");
    } finally {
      setIsBulkUploading(false);
      debugLog("handleUploadSelected", "Set bulk uploading state to false");
    }
  };

  const handleEdit = (index: number, item: MenuItem) => {
    debugLog("handleEdit", "Opening item edit", { index, item });
    console.log("item", item);
    setEditingItem({ index, item });
    setIsEditModalOpen(true);
    debugLog("handleEdit", "Edit modal opened");
  };

  const handleSaveEdit = async () => {
    debugLog("handleSaveEdit", "Saving edited item", { editingItem });
    
    if (editingItem) {
      try {
        debugLog("handleSaveEdit", "Validating edited item", { item: editingItem.item });
        const validatedItem = validateMenuItem(editingItem.item);
        const updatedItems = [...menuItems];

        if (!validatedItem.image) {
          debugLog("handleSaveEdit", "Item has no image, looking for images");
          // const urls = await getMenuItemImage(
          //   validatedItem.category,
          //   validatedItem.name
          // );
          const urls: string[] = [];
          if (urls && urls.length > 0) {
            debugLog("handleSaveEdit", "Images found, using first image", { imageUrl: urls[0] });
            validatedItem.image = urls[0];
          } else {
            debugLog("handleSaveEdit", "No images found, using placeholder");
            validatedItem.image = "/image_placeholder.webp";
          }
        }

        updatedItems[editingItem.index] = validatedItem;
        debugLog("handleSaveEdit", "Updating items with edited item", { 
          index: editingItem.index,
          updatedItem: validatedItem
        });
        
        setMenuItems(updatedItems);
        localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
        debugLog("handleSaveEdit", "Updated items saved to state and localStorage");
        
        setEditingItem(null);
        setIsEditModalOpen(false);
        debugLog("handleSaveEdit", "Edit modal closed");
      } catch (err) {
        debugLog("handleSaveEdit", "Error saving edit", { error: err });
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
    debugLog("handleMenuItemClick", "Menu item clicked", { item, index, hotelId });
    
    if (!hotelId && userData?.role === "superadmin") {
      debugLog("handleMenuItemClick", "Error: No hotel selected for superadmin");
      toast.error("Please select a hotel first");
      return;
    }
    
    await handleAddToMenu(item, index, hotelId);
  };

  const handleCategoryChange = async (
    index: number,
    category: { name: string; id: string; priority: number }
  ) => {
    debugLog("handleCategoryChange", "Category change", { index, category });
    
    const updatedItems = [...menuItems];
    updatedItems[index] = {
      ...updatedItems[index],
      category,
      image: "/loading-image.gif",
    };

    debugLog("handleCategoryChange", "Updated item with new category", { 
      index,
      updatedItem: updatedItems[index]
    });
    
    setMenuItems(updatedItems);
    debugLog("handleCategoryChange", "Updated state with loading image");

    try {
      debugLog("handleCategoryChange", "Fetching category images", { categoryName: category.name });
      const urls = (await fetchCategorieImages(category.name)).map(
        (img) => img.image_url
      );
      
      debugLog("handleCategoryChange", "Category images fetched", { 
        categoryName: category.name,
        imagesFound: urls.length,
        urls
      });
      
      if (urls && urls.length > 0) {
        updatedItems[index].image = urls[0];
        debugLog("handleCategoryChange", "Updated item with category image", { 
          index,
          imageUrl: urls[0]
        });
        
        setMenuItems([...updatedItems]);
        localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
        debugLog("handleCategoryChange", "Updated state and localStorage with new image");
      }
    } catch (error) {
      debugLog("handleCategoryChange", "Error fetching image", { error });
      console.error("Error fetching image:", error);
      toast.error("Failed to fetch image for the new category");
    }
  };

  const handleImageClick = async (index: number, newImage?: string) => {
    debugLog("handleImageClick", "Image clicked", { index, newImage });
    
    if (newImage) {
      const updatedItems = [...menuItems];
      updatedItems[index] = {
        ...updatedItems[index],
        image: newImage,
      };
      
      debugLog("handleImageClick", "Updated item with new image", { 
        index,
        imageUrl: newImage
      });
      
      setMenuItems(updatedItems);
      localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
      debugLog("handleImageClick", "Updated state and localStorage with new image");
    }
  };

  const BATCH_SIZE = 20;

  const processBatch = async (
    endpoint: string,
    items: any[],
    successMessage: string
  ) => {
    debugLog("processBatch", `Processing batch for ${endpoint}`, { 
      itemCount: items.length,
      endpoint 
    });
    
    try {
      // Ensure the server URL has a protocol
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || '';
      const baseUrl = serverUrl.startsWith('http') ? serverUrl : `http://${serverUrl}`;
      const apiUrl = `${baseUrl}/api/image-gen/${endpoint}`;
      
      debugLog("processBatch", "Making API request", { 
        originalUrl: process.env.NEXT_PUBLIC_SERVER_URL,
        normalizedUrl: baseUrl,
        fullUrl: apiUrl,
        itemCount: items.length
      });
      
      const response = await axios.post(
        apiUrl,
        items,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      debugLog("processBatch", "API response received", { 
        status: response.status,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : null
      });

      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      debugLog("processBatch", "Invalid API response", { response: response.data });
      throw new Error(`Invalid response from ${endpoint} server`);
    } catch (err) {
      debugLog("processBatch", `Error in ${endpoint}`, { 
        error: err,
        message: err instanceof Error ? err.message : "Unknown error"
      });
      
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
    debugLog("handleBatchImageGeneration", `Starting batch image generation for ${endpoint}`, {
      menuItemsLength: menuItems?.length || 0,
      endpoint,
      successMessage
    });
    
    if (!menuItems) return;

    setLoading(true);
    debugLog("handleBatchImageGeneration", "Set loading state to true");
    
    const totalItems = menuItems.length;
    let updatedItems = [...menuItems];
    let processedCount = 0;

    try {
      // Process in batches
      for (let i = 0; i < totalItems; i += BATCH_SIZE) {
        const batch = menuItems.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(totalItems / BATCH_SIZE);
        
        debugLog("handleBatchImageGeneration", `Processing batch ${batchNumber}/${totalBatches}`, {
          batchSize: batch.length,
          startIndex: i,
          endIndex: Math.min(i + BATCH_SIZE - 1, totalItems - 1)
        });

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
        
        debugLog("handleBatchImageGeneration", `Batch ${batchNumber} results received`, {
          resultsCount: batchResults.length
        });
        
        updatedItems = updatedItems.map((item, index) => {
          if (index >= i && index < i + BATCH_SIZE) {
            const batchResultItem = batchResults[index - i];
            debugLog("handleBatchImageGeneration", `Updating item ${index} with batch result`, {
              originalImage: item.image,
              newImage: batchResultItem?.image || "No image returned"
            });
            return batchResults[index - i];
          }
          return item;
        });

        processedCount += batch.length;
        debugLog("handleBatchImageGeneration", `Updated state after batch ${batchNumber}`, {
          processedCount,
          totalItems
        });
        
        setMenuItems([...updatedItems]);
        localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
      }

      debugLog("handleBatchImageGeneration", "All batches processed successfully", { 
        totalProcessed: processedCount 
      });
      
      toast.success(successMessage);
    } catch (err) {
      debugLog("handleBatchImageGeneration", "Batch processing error", {
        error: err,
        message: err instanceof Error ? err.message : "Unknown error",
        processedCount,
        totalItems
      });
      
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
      debugLog("handleBatchImageGeneration", "Set loading state to false");
    }
  };

  // Updated handlers
  const handleGenerateImages = () => {
    debugLog("handleGenerateImages", "Generate full images initiated");
    return handleBatchImageGeneration(
      "partialImages",
      "Full images generated successfully!"
    );
  };
  
  const handlePartialImageGeneration = () => {
    debugLog("handlePartialImageGeneration", "Generate partial images initiated");
    return handleBatchImageGeneration(
      "partialImages",
      "Partial images generated successfully!"
    );
  };
  
  const handleGenerateAIImages = () => {
    debugLog("handleGenerateAIImages", "Generate AI images initiated");
    return handleBatchImageGeneration(
      "generateAIImages",
      "AI images generated successfully!"
    );
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
