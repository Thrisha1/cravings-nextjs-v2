"use client";

import { useState, useEffect } from "react";
import { useMenuStore } from "@/store/menuStore";
import { MenuItem } from "@/components/bulkMenuUpload/EditItemModal";
import { toast } from "sonner";
import { useAuthStore } from '@/store/authStore';
import { uploadFileToS3 } from "@/app/actions/aws-s3";

export const useBulkUpload = () => {
  const [jsonInput, setJsonInput] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const { addItem, items: menu, fetchMenu, setSelectedHotelId } = useMenuStore();
  const { userData } = useAuthStore();
  const [editingItem, setEditingItem] = useState<{
    index: number;
    item: MenuItem;
  } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState<{ [key: number]: boolean }>({});
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  const validateMenuItem = (item: MenuItem) => {
    if (!item.name || typeof item.name !== 'string') {
      throw new Error('Name is required and must be a string');
    }
    if (!item.price || typeof Number(item.price) !== 'number' || isNaN(Number(item.price))) {
      throw new Error('Price is required and must be a number');
    }
    if (!item.description || typeof item.description !== 'string') {
      throw new Error('Description is required and must be a string');
    }
    return {
      ...item,
      price: Number(item.price)
    };
  };

  useEffect(() => {
    if (userData?.role === 'hotel') {
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

  const generateMenuImage = async (query: string) => {
    try {
      const response = await fetch('https://image.pollinations.ai/prompt/' + encodeURIComponent(query), {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      return response.url;
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image");
      return "/image_placeholder.webp";
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleJsonSubmit = async () => {
    try {
      const parsedItems = JSON.parse(jsonInput);
      localStorage.setItem("jsonInput", jsonInput);
      const items = Array.isArray(parsedItems) ? parsedItems : [parsedItems];

      items.forEach(validateMenuItem);

      // First create menu items without images
      const initialItems = items.map(item => ({
        ...validateMenuItem(item),
        image: "/loading-image.gif", // or any loading image placeholder
        isSelected: false,
        isAdded: false,
      }));

      setMenuItems(initialItems);
      localStorage.setItem("bulkMenuItems", JSON.stringify(initialItems));

      // Then generate images in batches
      const batchSize = 3;
      const updatedItems = [...initialItems];
      
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchPromises = batch.map(async (item, batchIndex) => {
          const index = i + batchIndex;
          const validatedItem = validateMenuItem(item);
          
          if (!validatedItem.image) {
            const prompt = `professional food photography of ${validatedItem.description}`;
            const imageUrl = await generateMenuImage(prompt);
            updatedItems[index] = {
              ...updatedItems[index],
              image: imageUrl,
            };
            // Update UI after each image is generated
            setMenuItems([...updatedItems]);
            localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
          }
        });

        await Promise.all(batchPromises);

        if (i + batchSize < items.length) {
          await delay(2000);
          toast.info(`Generating images ${i + batchSize + 1} to ${Math.min(i + batchSize * 2, items.length)} of ${items.length}`);
        }
      }

      toast.success("All items processed successfully!");
    } catch (error) {
      console.error("Error processing JSON:", error);
      toast.error(error instanceof Error ? error.message : "Invalid JSON format");
    }
  };

  const handleClear = () => {
    setMenuItems([]);
    setJsonInput("");
    localStorage.removeItem("bulkMenuItems");
    localStorage.removeItem("jsonInput");
  };

  const uploadImageToS3 = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }

      const blob = await response.blob();
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const url = await uploadFileToS3(base64 as string);
      if (!url) {
        throw new Error('No URL returned from upload');
      }

      return url;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      toast.error('Failed to upload image. Using original URL.');
      return imageUrl;
    }
  };

  const handleHotelSelect = async (hotelId: string) => {
    setSelectedHotelId(hotelId);
    await fetchMenu(hotelId);
  };

  const handleAddToMenu = async (item: MenuItem, index: number, hotelId?: string) => {
    setIsUploading((prev) => ({ ...prev, [index]: true }));
    try {
      const validatedItem = validateMenuItem(item);
      
      let finalImageUrl = validatedItem.image;
      if (validatedItem.image.includes('pollinations.ai')) {
        finalImageUrl = await uploadImageToS3(validatedItem.image);
      }

      await addItem({
        name: validatedItem.name,
        price: validatedItem.price,
        image: finalImageUrl,
        description: validatedItem.description,
      }, hotelId);

      const updatedItems = menuItems.map((menuItem) => {
        if (
          menuItem.name === validatedItem.name &&
          menuItem.price === validatedItem.price &&
          menuItem.description === validatedItem.description
        ) {
          return { ...menuItem, isAdded: true, image: finalImageUrl };
        }
        return menuItem;
      });

      setMenuItems(updatedItems);
      localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
      fetchMenu(hotelId);
      toast.success("Item added to menu successfully!");
    } catch (error) {
      console.error("Error adding item to menu:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add item to menu");
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
    const updatedItems = [...menuItems];
    updatedItems[index] = {
      ...updatedItems[index],
      isSelected: !updatedItems[index].isSelected,
    };
    setMenuItems(updatedItems);
    localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
  };

  const handleUploadSelected = async (hotelId?: string) => {
    if (!hotelId && userData?.role === 'superadmin') {
      toast.error("Please select a hotel first");
      return;
    }

    setIsBulkUploading(true);
    try {
      const selectedItems = menuItems.filter(
        (item) => item.isSelected && !item.isAdded
      );

      if (selectedItems.length === 0) {
        toast.error("No items selected for upload");
        return;
      }

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
    setEditingItem({ index, item });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editingItem) {
      try {
        const validatedItem = validateMenuItem(editingItem.item);
        const updatedItems = [...menuItems];

        if (!validatedItem.image) {
          const searchQuery = `${validatedItem.name} food`;
          const imageUrl = await generateMenuImage(searchQuery);
          validatedItem.image = imageUrl || "/image_placeholder.webp";
        }

        updatedItems[editingItem.index] = validatedItem;
        setMenuItems(updatedItems);
        localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
        setEditingItem(null);
        setIsEditModalOpen(false);
      } catch (err) {
        console.error('Error saving edit:', err);
        toast.error(err instanceof Error ? err.message : "Invalid item data");
      }
    }
  };

  const handleImageClick = async (index: number) => {
    try {
      const randomNumber = Math.floor(Math.random() * 100);
      const item = menuItems[index];
      const prompt = `professional food photography of ${item.description}?seed=${randomNumber}`;
      const imageUrl = await generateMenuImage(prompt);
      
      const updatedItems = [...menuItems];
      updatedItems[index] = {
        ...updatedItems[index],
        image: imageUrl,
      };
      setMenuItems(updatedItems);
      localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
      toast.success("New image generated successfully!");
    } catch (err) {
      console.error("Error generating new image:", err);
      toast.error(err instanceof Error ? err.message : "Failed to generate new image");
    }
  };

  const handleMenuItemClick = async (item: MenuItem, index: number, hotelId?: string) => {
    if (!hotelId && userData?.role === 'superadmin') {
      toast.error("Please select a hotel first");
      return;
    }
    await handleAddToMenu(item, index, hotelId);
  };

  return {
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
  };
};
