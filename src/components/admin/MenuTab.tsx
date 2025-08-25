"use client";

import { useEffect, useState } from "react";
import {
  Pen,
  Plus,
  Search,
  Upload,
  Save,
  X,
  Menu,
  ListOrdered,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminOfferStore } from "@/store/useAdminOfferStore";
import { Partner, useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { AddMenuItemForm } from "../bulkMenuUpload/AddMenuItemModal";
import { EditMenuItemForm, EditMenuItemModal } from "./EditMenuItemModal";
import {
  CategoryManagementModal,
  CategoryManagementForm,
} from "./CategoryManagementModal";
import { ItemOrderingModal } from "./ItemOrderingModal";
import { MenuItem, useMenuStore } from "@/store/menuStore_hasura";
import { Switch } from "../ui/switch";
import { toast } from "sonner";
import { deleteFileFromS3 } from "@/app/actions/aws-s3";
import { useSearchParams } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem } from "../ui/accordion";
import { AccordionTrigger } from "@radix-ui/react-accordion";
import Img from "../Img";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { formatDisplayName } from "@/store/categoryStore_hasura";
import { ItemOrderingForm } from "./ItemOrderingModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


export function MenuTab() {
  const {
    items: menu,
    addItem,
    fetchMenu,
    updateItem,
    deleteItem,
    groupedItems,
    updateCategoriesAsBatch,
  } = useMenuStore();
  const [isCategoryEditing, setIsCategoryEditing] = useState(false);
  const { adminOffers, fetchAdminOffers } = useAdminOfferStore();
  const { userData } = useAuthStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();
  const [isMenuItemsFetching, setIsMenuItemsFetching] = useState(true);
  const [filteredGroupedItems, setFilteredGroupedItems] = useState(
    {} as Record<string, MenuItem[]>
  );
  const [editingItem, setEditingItem] = useState<{
    id: string;
    name: string;
    price: string;
    image: string;
    description: string;
    category: string;
    variants:
      | {
          name: string;
          price: number;
        }[]
      | [];
  } | null>(null);
  const [isInlineItemOrdering, setIsInlineItemOrdering] = useState(false);
  const [tempItems, setTempItems] = useState<Record<string, MenuItem[]>>({});
  const { updateItemsAsBatch } = useMenuStore();
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    if (userData?.id) {
      fetchAdminOffers(userData?.id);
      fetchMenu();
    }
  }, [userData, fetchAdminOffers, fetchMenu]);

  useEffect(() => {
    if (!isEditModalOpen) {
      setEditingItem(null);
    }
  }, [isEditModalOpen]);

  useEffect(() => {
    if (!groupedItems) return;

    const filtered: Record<string, MenuItem[]> = {};
    const newOpenCategories: Record<string, boolean> = {};

    Object.entries(groupedItems).forEach(([category, categoryItems]) => {
      const filteredCategoryItems = categoryItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (filteredCategoryItems.length > 0) {
        filtered[category] = filteredCategoryItems;
        // Preserve existing open state or default to false
        newOpenCategories[category] = openCategories[category] ?? false;
      }
    });

    setFilteredGroupedItems(filtered);
    setTempItems(filtered);
    setOpenCategories(newOpenCategories);
    setIsMenuItemsFetching(false);
  }, [groupedItems, searchQuery, searchParams]);

  const handleCopyMenu = async () => {
    try {
      if (!menu || menu.length === 0) {
        toast.error("No menu items to copy");
        return;
      }

      const menuForCopy = menu.map((item) => ({
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        description: item.description,
        category: item.category.name,
        is_top: item.is_top,
        is_available: item.is_available,
        priority: item.priority,
        image_source: item.image_source || "local",
      }));

      const menuJson = JSON.stringify(menuForCopy, null, 2);

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(menuJson);
        toast.success(
          "Menu copied to clipboard! You can now paste it in the bulk upload page."
        );
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = menuJson;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand("copy");
          toast.success(
            "Menu copied to clipboard! You can now paste it in the bulk upload page."
          );
        } catch (err) {
          console.error("Fallback: Oops, unable to copy", err);
          toast.error(
            "Failed to copy menu to clipboard. Please try selecting and copying manually."
          );
        }

        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error("Error copying menu:", error);
      toast.error("Failed to copy menu to clipboard");
    }
  };

  const handleAddItem = (item: {
    name: string;
    price: string;
    image: string;
    description: string;
    category: string;
    variants?:
      | {
          name: string;
          price: number;
        }[]
      | [];
  }) => {
    addItem({
      name: item.name,
      price: parseFloat(item.price),
      image_url: item.image,
      description: item.description,
      category: {
        id: "temp-id-" + Math.random().toString(36).substring(2, 9),
        name: item.category,
        priority: 0,
        is_active: true,
      },
      image_source: "local",
      is_top: false,
      is_available: true,
      priority: 0,
      variants: item.variants,
    });
  };

  const handleEditItem = async (item: {
    id: string;
    name: string;
    price: string;
    image: string;
    description: string;
    category: string;
    variants?:
      | {
          name: string;
          price: number;
        }[]
      | [];
  }) => {
    const existingItem = menu.find((menuItem) => menuItem.id === item.id);

    if (!existingItem) {
      throw new Error("Item not found");
    }

    // Keep the category open during update
    setOpenCategories((prev) => ({
      ...prev,
      [typeof item.category === "object" && item.category !== null && (item.category as { name: string }).name !== undefined
        ? (item.category as { name: string }).name
        : item.category]: true,
    }));

    await updateItem(item.id, {
      name: item.name,
      price: parseFloat(item.price),
      image_url: item.image,
      description: item.description,
      category: {
        id: existingItem.category.id,
        name: item.category,
        priority: existingItem.category.priority,
        is_active: existingItem.category.is_active !== false ? true : false,
      },
      variants: item.variants,
    });

    // Refresh menu while preserving open state
    await fetchMenu();
  };

  const openEditModal = (item: {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
    category: string | { name: string };
    variants?: {
      name: string;
      price: number;
    }[];
  }) => {
    // Ensure the category is open when editing an item
    setOpenCategories((prev) => ({
      ...prev,
      [typeof item.category === "object" && item.category !== null && "name" in item.category ? item.category.name : item.category]: true,
    }));

    setEditingItem({
      id: item.id,
      name: item.name,
      price: item.price.toString(),
      image: item.image,
      description: item.description || "",
      category:
        typeof item.category === "object" && item.category !== null && "name" in item.category
          ? item.category.name
          : item.category,
      variants: item.variants || [],
    });
    setIsEditModalOpen(true);
  };

  const getCategoryPriority = (category: string) => {
    const categoryItem = menu.find((item) => item.category.name === category);
    return categoryItem?.category.priority || 0;
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === destination.droppableId) {
      const category = source.droppableId;
      const items = [...tempItems[category]];
      const [removed] = items.splice(source.index, 1);
      items.splice(destination.index, 0, removed);

      const updatedItems = items.map((item, index) => ({
        ...item,
        priority: index,
      }));

      setTempItems((prev) => ({
        ...prev,
        [category]: updatedItems,
      }));
    }
  };

 return (<div>Hello world</div>)
}
