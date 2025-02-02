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
  ImageSearchModal,
  UnsplashImage,
} from "@/components/admin/ImageSearchModal";
import {
  EditItemModal,
  MenuItem,
} from "@/components/bulkMenuUpload/EditItemModal";
import Link from "next/link";
import { toast } from "sonner";
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
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(
    null
  );
  const [imageSearchQuery, setImageSearchQuery] = useState("");
  const [searchedImages, setSearchedImages] = useState<UnsplashImage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isUploading, setIsUploading] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  useEffect(() => {
    const savedItems = localStorage.getItem("bulkMenuItems");
    const savedJsonInput = localStorage.getItem("jsonInput") as string;
    setJsonInput(JSON.parse(savedJsonInput));
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

  const searchUnsplashImages = async (query: string, page = 1) => {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&client_id=${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}&per_page=9&page=${page}`
      );
      const data = await response.json();
      setSearchedImages(data.results);
      setTotalPages(Math.ceil(data.total / 9));
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedItemIndex(index);
    setImageSearchQuery(menuItems[index].name + " food");
    searchUnsplashImages(menuItems[index].name + " food");
    setIsImageModalOpen(true);
  };

  const handleSelectImage = (imageUrl: string) => {
    if (selectedItemIndex !== null) {
      const updatedItems = [...menuItems];
      updatedItems[selectedItemIndex] = {
        ...updatedItems[selectedItemIndex],
        image: imageUrl,
      };
      setMenuItems(updatedItems);
      localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
      setIsImageModalOpen(false);
    }
  };

  const fetchUnsplashImage = async (query: string) => {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&client_id=${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].urls.regular;
      }
      return null;
    } catch (error) {
      console.error("Error fetching image:", error);
      return null;
    }
  };

  const handleJsonSubmit = async () => {
    try {
      const parsedItems = JSON.parse(jsonInput);
      localStorage.setItem("jsonInput", JSON.stringify(jsonInput));
      const items = Array.isArray(parsedItems) ? parsedItems : [parsedItems];

      const itemsWithImages = await Promise.all(
        items.map(async (item) => {
          const isAlreadyInMenu = menu.some(
            (menuItem) =>
              menuItem.name === item.name &&
              menuItem.price === item.price &&
              menuItem.description === item.description
          );

          if (!item.image) {
            const searchQuery = `${item.name} food`;
            const imageUrl = await fetchUnsplashImage(searchQuery);
            return {
              ...item,
              image: imageUrl || "/image_placeholder.webp",
              isSelected: false,
              isAdded: isAlreadyInMenu,
            };
          }
          return { ...item, isSelected: false, isAdded: isAlreadyInMenu };
        })
      );

      setMenuItems(itemsWithImages);
      localStorage.setItem("bulkMenuItems", JSON.stringify(itemsWithImages));
    } catch {
      toast.error("Invalid JSON format");
    }
  };

  const handleClear = () => {
    setMenuItems([]);
    setJsonInput("");
    localStorage.removeItem("bulkMenuItems");
  };

  const handleAddToMenu = async (item: MenuItem, index: number) => {
    setIsUploading((prev) => ({ ...prev, [index]: true }));
    try {
      await addItem({
        name: item.name,
        price: item.price,
        image: item.image,
        description: item.description,
      });

      // Update all matching items as added
      const updatedItems = menuItems.map((menuItem) => {
        if (
          menuItem.name === item.name &&
          menuItem.price === item.price &&
          menuItem.description === item.description
        ) {
          return { ...menuItem, isAdded: true };
        }
        return menuItem;
      });

      setMenuItems(updatedItems);
      localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
      fetchMenu();
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
      const updatedItems = [...menuItems];

      if (!editingItem.item.image) {
        const searchQuery = `${editingItem.item.name} food`;
        const imageUrl = await fetchUnsplashImage(searchQuery);
        editingItem.item.image = imageUrl || "/image_placeholder.webp";
      }

      updatedItems[editingItem.index] = editingItem.item;
      setMenuItems(updatedItems);
      localStorage.setItem("bulkMenuItems", JSON.stringify(updatedItems));
      setEditingItem(null);
      setIsEditModalOpen(false);
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

      <ImageSearchModal
        isOpen={isImageModalOpen}
        onOpenChange={setIsImageModalOpen}
        imageSearchQuery={imageSearchQuery}
        setImageSearchQuery={setImageSearchQuery}
        searchedImages={searchedImages}
        currentPage={currentPage}
        totalPages={totalPages}
        onSearch={searchUnsplashImages}
        onSelectImage={handleSelectImage}
        onPageChange={(page) => searchUnsplashImages(imageSearchQuery, page)}
      />

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

export default BulkUploadPage;
