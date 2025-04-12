"use client";

import { useState, useEffect } from "react";
import { useMenuStore, getMenuItemImage } from "@/store/menuStore";
import { MenuItem } from "@/components/bulkMenuUpload/EditItemModal";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useCategoryStore } from "@/store/categoryStore";
import { uploadFileToS3 } from "@/app/actions/aws-s3";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const useBulkUpload = () => {
  const { addCategory } = useCategoryStore();
  const [jsonInput, setJsonInput] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const { user } = useAuthStore();
  const {
    addItem,
    items: menu,
    fetchMenu,
    setSelectedHotelId,
  } = useMenuStore();
  const { userData } = useAuthStore();
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
    if (!item.description || typeof item.description !== "string") {
      throw new Error("Description is required and must be a string");
    }
    return {
      ...item,
      price: Number(item.price),
    };
  };

  useEffect(() => {
    if (userData?.role === "hotel") {
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
        category: item.category || "",
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
    setSelectedHotelId(hotelId);
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
      const categoryId = await addCategory(item.category);

      let imageUrl = item.image;

      if (!item.image.includes("cravingsbucket.s3")) {
        // Load original base64 image into <img>
        const img = document.createElement("img");
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        await new Promise((resolve) => (img.onload = resolve));

        const MAX_HEIGHT = 300;
        const aspectRatio = img.width / img.height;

        const canvas = document.createElement("canvas");
        canvas.height = Math.min(img.height, MAX_HEIGHT);
        canvas.width = canvas.height * aspectRatio;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Failed to get canvas context");

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const webpBase64WithPrefix: string = await new Promise(
          (resolve, reject) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) return reject(new Error("Canvas toBlob failed"));

                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              },
              "image/webp",
              0.8
            );
          }
        );

        const fileName = `${user?.uid}/${item.category}/${
          item.name
        }-${Date.now()}.webp`;
        console.log(fileName);

        const url = await uploadFileToS3(webpBase64WithPrefix, fileName);
        await addDoc(collection(db, "dishes"), {
          name: item.name,
          category: item.category.toLowerCase(),
          url: url,
          createdAt: new Date(),
        });

        imageUrl = url;
      }

      await addItem({
        name: item.name,
        price: Number(item.price),
        image: imageUrl || "",
        description: item.description || "",
        category: categoryId || "",
        hotelId: hotelId || userData?.id || "",
      });

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
    setEditingItem({ index, item });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editingItem) {
      try {
        const validatedItem = validateMenuItem(editingItem.item);
        const updatedItems = [...menuItems];

        if (!validatedItem.image) {
          const urls = await getMenuItemImage(
            validatedItem.category,
            validatedItem.name
          );
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

  const handleCategoryChange = async (index: number, category: string) => {
    const updatedItems = [...menuItems];
    updatedItems[index] = {
      ...updatedItems[index],
      category,
      image: "/loading-image.gif",
    };

    setMenuItems(updatedItems);

    try {
      const urls = await getMenuItemImage(category, updatedItems[index].name);
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
    handleCategoryChange,
  };
};
