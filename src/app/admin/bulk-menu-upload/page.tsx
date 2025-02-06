"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMenuStore } from "@/store/menuStore";
import { MenuItemCard } from "@/components/bulkMenuUpload/MenuItemCard";
import {
  EditItemModal,
  MenuItem,
} from "@/components/bulkMenuUpload/EditItemModal";
import Link from "next/link";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

const BulkUploadPage = () => {
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const { addItem, items: menu, fetchMenu } = useMenuStore();
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
    fetchMenu();
  }, [fetchMenu]);

  useEffect(() => {
    const savedItems = localStorage.getItem("bulkMenuItems");
    const savedJsonInput = localStorage.getItem("jsonInput");
    if (savedJsonInput) {
      setJsonInput(savedJsonInput);
    }
    if (savedItems) {
      const items = JSON.parse(savedItems);
      // Check each item against menu to set isAdded flag
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
      // Pollinations.ai endpoint for stable diffusion
      const response = await fetch('https://image.pollinations.ai/prompt/' + encodeURIComponent(query), {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      // Pollinations.ai returns the image directly
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
      localStorage.setItem("jsonInput", JSON.stringify(jsonInput));
      const items = Array.isArray(parsedItems) ? parsedItems : [parsedItems];

      // Validate each item
      items.forEach(validateMenuItem);

      // Process items in batches with delay
      const batchSize = 3; // Process 3 items at a time
      const itemsWithImages = [];
      
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchPromises = batch.map(async (item) => {
          const validatedItem = validateMenuItem(item);
          const isAlreadyInMenu = menu.some(
            (menuItem) =>
              menuItem.name === validatedItem.name &&
              menuItem.price === validatedItem.price &&
              menuItem.description === validatedItem.description
          );

          if (!validatedItem.image) {
            const prompt = `professional food photography of ${validatedItem.description}`;
            const imageUrl = await generateMenuImage(prompt);
            return {
              ...validatedItem,
              image: imageUrl,
              isSelected: false,
              isAdded: isAlreadyInMenu,
            };
          }
          return { ...validatedItem, isSelected: false, isAdded: isAlreadyInMenu };
        });

        // Process batch
        const batchResults = await Promise.all(batchPromises);
        itemsWithImages.push(...batchResults);

        // Add delay between batches
        if (i + batchSize < items.length) {
          await delay(2000); // 2 second delay between batches
          toast.info(`Processing items ${i + batchSize + 1} to ${Math.min(i + batchSize * 2, items.length)} of ${items.length}`);
        }
      }

      setMenuItems(itemsWithImages);
      localStorage.setItem("bulkMenuItems", JSON.stringify(itemsWithImages));
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

  const uploadImageToS3 = async (imageUrl: string, fileName: string) => {
    try {
      // Fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }

      const blob = await response.blob();
      
      // Convert blob to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Upload to S3
      const uploadResponse = await fetch('/api/upload-s3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
          fileName,
          contentType: blob.type,
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload image to S3');
      }

      const { url } = await uploadResponse.json();
      if (!url) {
        throw new Error('No URL returned from upload');
      }

      return url;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      toast.error('Failed to upload image. Using original URL.');
      return imageUrl; // Fallback to original URL if upload fails
    }
  };

  const handleAddToMenu = async (item: MenuItem, index: number) => {
    setIsUploading((prev) => ({ ...prev, [index]: true }));
    try {
      const validatedItem = validateMenuItem(item);
      
      // If the image is from Pollinations, upload it to S3
      let finalImageUrl = validatedItem.image;
      if (validatedItem.image.includes('pollinations.ai')) {
        const fileName = `${uuidv4()}-${validatedItem.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
        finalImageUrl = await uploadImageToS3(validatedItem.image, fileName);
      }

      // Add item with S3 image URL
      await addItem({
        name: validatedItem.name,
        price: validatedItem.price,
        image: finalImageUrl,
        description: validatedItem.description,
      });

      // Update all matching items as added with new image URL
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
      fetchMenu();
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

  const handleUploadSelected = async () => {
    setIsBulkUploading(true);
    try {
      const selectedItems = menuItems.filter(
        (item) => item.isSelected && !item.isAdded
      );
      for (const item of selectedItems) {
        const index = menuItems.indexOf(item);
        await handleAddToMenu(item, index);
      }
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
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Invalid item data");
      }
    }
  };

  const handleImageClick = async (index: number) => {
    try {
      const item = menuItems[index];
      const prompt = `professional food photography of ${item.description}`;
      const imageUrl = await generateMenuImage(prompt);
      
      const updatedItems = [...menuItems];
      updatedItems[index] = {
        ...updatedItems[index],
        image: imageUrl,
      };
      setMenuItems(updatedItems);
      localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
      toast.success("New image generated successfully!");
    } catch (error) {
      toast.error("Failed to generate new image");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Menu Upload</h1>
        </div>

        <div className="mb-8">
          <Link target="_blank" className="underline text-sm py-2 text-blue-500 hover:text-blue-600 block text-right" href={"https://kimi.moonshot.cn/chat"}>Go to KIMI.ai {"->"}</Link>

          <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your JSON menu items here..."
            className="min-h-[200px] mb-4"
          />
          <div className="flex gap-2">
            <Button className="text-[13px] w-full" onClick={handleJsonSubmit}>
              {menuItems.length > 0 ? "Update JSON" : "Convert JSON"}
            </Button>

            {menuItems.length > 0 && (
              <>
                <Button
                  className="text-[13px] w-full"
                  variant="destructive"
                  onClick={handleClear}
                >
                  Clear All
                </Button>

                <Button
                  className="text-[13px] w-full"
                  onClick={handleUploadSelected}
                  disabled={isBulkUploading}
                >
                  {isBulkUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Selected"
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {menuItems.length > 0 && (
          <div className="mb-4 flex items-center">
            <Checkbox
              checked={selectAll}
              onCheckedChange={handleSelectAll}
              id="selectAll"
            />
            <label htmlFor="selectAll" className="ml-2">
              Select All
            </label>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <MenuItemCard
              key={index}
              item={item}
              index={index}
              isUploading={isUploading[index]}
              onSelect={() => handleSelectItem(index)}
              onAddToMenu={() => handleAddToMenu(item, index)}
              onEdit={() => handleEdit(index, item)}
              onDelete={() => handleDelete(index)}
              onImageClick={() => handleImageClick(index)}
            />
          ))}
        </div>
      </div>

      <EditItemModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        editingItem={editingItem}
        onSave={handleSaveEdit}
        onEdit={(field, value) =>
          setEditingItem(
            editingItem
              ? {
                  ...editingItem,
                  item: { ...editingItem.item, [field]: value },
                }
              : null
          )
        }
      />
    </div>
  );
};

export default BulkUploadPage
