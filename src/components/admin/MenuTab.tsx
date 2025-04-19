import { useEffect, useState, useMemo } from "react";
import { Pen, Plus, Search, Upload } from "lucide-react";
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
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { AddMenuItemModal } from "../bulkMenuUpload/AddMenuItemModal";
import { EditMenuItemModal } from "./EditMenuItemModal";
import { CategoryUpdateModal } from "./CategoryUpdateModal";
import Image from "next/image";
import { MenuItem, useMenuStore } from "@/store/menuStore_hasura";
import { Switch } from "../ui/switch";
import { toast } from "sonner";
import { deleteFileFromS3 } from "@/app/actions/aws-s3";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { set } from "firebase/database";
import { Accordion, AccordionContent, AccordionItem } from "../ui/accordion";
import { AccordionTrigger } from "@radix-ui/react-accordion";

export function MenuTab() {
  const {
    items: menu,
    addItem,
    fetchMenu,
    updateItem,
    deleteItem,
    groupedItems,
  } = useMenuStore();
  const [isCategoryEditing, setIsCategoryEditing] = useState(false);
  const [editingCategory, setEditingCategory] = useState({
    id: "",
    name: "",
    priority: 0,
  });
  const { adminOffers, fetchAdminOffers } = useAdminOfferStore();
  const { userData } = useAuthStore();
  const [catUpdated, setCatUpdated] = useState(false);
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
  } | null>(null);

  useEffect(() => {
    if (userData?.id) {
      fetchAdminOffers(userData?.id);
      fetchMenu();
    }
  }, [userData, fetchAdminOffers, fetchMenu, catUpdated]);

  useEffect(() => {
    if (!isEditModalOpen) {
      setEditingItem(null);
    }
  }, [isEditModalOpen]);

  useEffect(() => {
    if (!groupedItems) return;

    const filtered: Record<string, MenuItem[]> = {};

    Object.entries(groupedItems).forEach(([category, categoryItems]) => {
      const filteredCategoryItems = categoryItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (filteredCategoryItems.length > 0) {
        filtered[category] = filteredCategoryItems;
      }
    });

    setFilteredGroupedItems(filtered);
    setTimeout(() => {
      setIsMenuItemsFetching(false);
    }, 2000);
  }, [groupedItems, searchQuery, searchParams]);

  const handleAddItem = (item: {
    name: string;
    price: string;
    image: string;
    description: string;
    category: string; // Form input is string
  }) => {
    addItem({
      name: item.name,
      price: parseFloat(item.price),
      image_url: item.image,
      description: item.description,
      category: {
        id: "temp-id-" + Math.random().toString(36).substring(2, 9), // Temporary ID
        name: item.category,
        priority: 0, // Default priority
      },
      image_source: "local",
      is_top: false,
    });
  };

  const handleEditItem = (item: {
    id: string;
    name: string;
    price: string;
    image: string;
    description: string;
    category: string;
  }) => {
    const existingItem = menu.find((menuItem) => menuItem.id === item.id);

    if (!existingItem) {
      throw new Error("Item not found");
    }

    updateItem(item.id, {
      name: item.name,
      price: parseFloat(item.price),
      image_url: item.image,
      description: item.description,
      category: {
        id: existingItem.category.id,
        name: item.category,
        priority: existingItem.category.priority,
      },
    });
  };

  const openEditModal = (item: {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
    category: string;
  }) => {
    setEditingItem({
      id: item.id,
      name: item.name,
      price: item.price.toString(),
      image: item.image,
      description: item.description || "",
      category: item.category,
    });
    setIsEditModalOpen(true);
  };

  const handleCategoryUpdate = (
    category: string,
    categoryItems: MenuItem[]
  ) => {
    if (categoryItems.length === 0) {
      toast.error("No items in this category to update");
      return;
    }

    // Find first item that has a category ID (if any)
    const categoryWithId = categoryItems.find((item) => item.id);
    // console.log("Category with ID:", categoryWithId);

    setIsCategoryEditing(true);
    setEditingCategory({
      id: categoryWithId?.category.id!, // We've verified this exists
      name: category,
      priority: categoryWithId?.category.priority || 0,
    });
  };

  const getCategoryPriority = (category: string) => {
    const categoryItem = menu.find((item) => item.category.name === category);
    return categoryItem?.category.priority || 0;
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Menu Items</h2>
        <div className="flex gap-2">
          <Link href="/admin/bulk-menu-upload">
            <Button variant="outline" size="icon">
              <Upload className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <AddMenuItemModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleAddItem}
      />

      {editingItem && (
        <EditMenuItemModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          item={editingItem}
          onSubmit={handleEditItem}
        />
      )}

      {isCategoryEditing && (
        <CategoryUpdateModal
          catId={editingCategory.id}
          cat={editingCategory.name}
          priority={editingCategory.priority}
          isOpen={isCategoryEditing}
          setCatUpdated={setCatUpdated}
          catUpdated={catUpdated}
          onOpenChange={() => setIsCategoryEditing(false)}
        />
      )}

      {/* Menu Items */}
      <>
        {Object.entries(filteredGroupedItems).length > 0 ? (
          <Accordion type="single" className="grid gap-4" collapsible>
            {Object.entries(filteredGroupedItems)
              .sort(([categoryA], [categoryB]) => {
                const priorityA = getCategoryPriority(categoryA);
                const priorityB = getCategoryPriority(categoryB);
                return priorityA - priorityB;
              })
              .map(([category, items], index) => (
                <AccordionItem value={category} key={category + index} >
                  <AccordionTrigger className="flex items-center gap-2 group max-w-fit">
                    <h1 className="text-xl lg:text-3xl font-bold my-2 lg:my-5 capitalize w-100 bg-transparent flex items-center gap-2"><div className="left-marker">▶</div> {category}</h1>
                    <button
                      onClick={() => handleCategoryUpdate(category, items)}
                      className="group-hover:opacity-100 opacity-0 transition-opacity duration-300"
                    >
                      <Pen />
                    </button>
                  </AccordionTrigger>
                  <AccordionContent>


                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                      <Card
                        className="rounded-xl overflow-hidden grid"
                        key={item.id}
                      >
                        <CardHeader className="flex flex-row justify-between gap-4">
                          <div>
                            {item.image_url.length > 0 && (
                              <div className="relative w-32 h-32 overflow-hidden">
                                <Image
                                  src={item.image_url}
                                  alt={item.name}
                                  fill
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>
                            )}
                          </div>
                          <CardTitle>{item.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">
                            ₹{item.price.toFixed(2)}
                          </p>
                          {item.description && (
                            <p className="text-gray-600 mt-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center mt-2">
                            <label className="mr-2">Mark as Top 3:</label>
                            <Switch
                              checked={item.is_top}
                              onCheckedChange={async () => {
                                try {
                                  const currentTopItems = menu.filter(
                                    (i) => i.is_top === true
                                  );

                                  const topItemsCount = currentTopItems.length;

                                  if (item.is_top) {
                                    await updateItem(item.id as string, {
                                      is_top: false,
                                    });
                                  } else if (topItemsCount < 3) {
                                    await updateItem(item.id as string, {
                                      is_top: true,
                                    });
                                  } else {
                                    toast.error(
                                      "You can only mark up to 3 items as Top 3."
                                    );
                                    return;
                                  }
                                } catch (error) {
                                  toast.error("Failed to update item status");
                                  console.error(error);
                                }
                              }}
                            />
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              openEditModal({
                                id: item.id as string,
                                name: item.name,
                                price: item.price,
                                image: item.image_url,
                                description: item.description || "",
                                category: item.category.name,
                              })
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={async (e) => {
                              e.currentTarget.disabled = true;
                              e.currentTarget.innerText = "Deleting...";
                              const isOfferActive = adminOffers.some(
                                (offer) => offer.menuItemId === item.id
                              );
                              if (isOfferActive) {
                                alert(
                                  `Cannot delete the menu item "${item.name}" because it has an active offer. Please delete the offer first.`
                                );
                                return;
                              }
                              await deleteItem(item.id as string);
                              if(item.image_url) await deleteFileFromS3(item.image_url);
                            }}
                          >
                            Delete
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        ) : (
          <div className="text-center">
            {isMenuItemsFetching ? "Loading Menu...." : "No Menu Items Added!"}
          </div>
        )}
      </>
    </div>
  );
}
