import { useEffect, useState, useMemo } from "react";
import { Pen, Plus, Search, Upload, Save, X } from "lucide-react";
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
import { CategoryManagementModal } from "./CategoryManagementModal";
import Image from "next/image";
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
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const [tempItems, setTempItems] = useState<Record<string, MenuItem[]>>({});
  const { updateItemsAsBatch } = useMenuStore();
  const [currenctCat , setCurrentCat] = useState("");

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
    setTempItems(filtered); // Initialize temp items for drag and drop
    setTimeout(() => {
      setIsMenuItemsFetching(false);
    }, 2000);
  }, [groupedItems, searchQuery, searchParams]);

  const handleAddItem = (item: {
    name: string;
    price: string;
    image: string;
    description: string;
    category: string;
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
      },
      image_source: "local",
      is_top: false,
      is_available: true,
      priority: 0,
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

  const getCategoryPriority = (category: string) => {
    const categoryItem = menu.find((item) => item.category.name === category);
    return categoryItem?.category.priority || 0;
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === destination.droppableId) {
      // Reordering within the same category
      const category = source.droppableId;
      const items = [...tempItems[category]];
      const [removed] = items.splice(source.index, 1);
      items.splice(destination.index, 0, removed);

      // Update priorities for all items in the category
      const updatedItems = items.map((item, index) => ({
        ...item,
        priority: index, // Update priority to match new position
      }));

      setTempItems((prev) => ({
        ...prev,
        [category]: updatedItems,
      }));
    }
  };

  const saveItemOrder = async () => {
    try {
      const allItems = Object.values(tempItems).flat().filter((items) => items.category.name === currenctCat);

      const updates = allItems.map((item) => ({
        id: item.id as string,
        priority: item.priority,
      }));

      await updateItemsAsBatch(updates);

      toast.success("Item order saved successfully");
      setIsEditingPriority(false);
      fetchMenu(); // Refresh the menu to get the new order
    } catch (error) {
      toast.error("Failed to save item order");
      console.error(error);
    }
  };

  const cancelEditing = () => {
    setIsEditingPriority(false);
    setTempItems(filteredGroupedItems); // Reset to original order
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

      <div className="flex justify-end gap-2 mb-4">
        {isEditingPriority ? (
          <>
            <Button onClick={saveItemOrder} className="flex gap-2">
              <Save className="h-4 w-4" />
              <span>Save Order</span>
            </Button>
            <Button
              variant="outline"
              onClick={cancelEditing}
              className="flex gap-2"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={() => setIsEditingPriority(true)}
              variant="outline"
              className="flex gap-2"
            >
              <Pen className="h-4 w-4" />
              <span>Edit Item Order</span>
            </Button>
            <Button
              onClick={() => setIsCategoryEditing(true)}
              variant="outline"
              className="flex gap-2"
            >
              <Pen className="h-4 w-4" />
              <span>Category Update</span>
            </Button>
          </>
        )}
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
        <CategoryManagementModal
          open={isCategoryEditing}
          categories={Object.entries(groupedItems).map(([category, items]) => ({
            id: items[0].category.id,
            name: category,
            priority: items[0].category.priority,
          }))}
          onOpenChange={setIsCategoryEditing}
        />
      )}

      {/* Menu Items */}
      <>
        {Object.entries(tempItems).length > 0 ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <Accordion onValueChange={(value : string) => setCurrentCat(value)} type="single" className="grid gap-4" collapsible>
              {Object.entries(tempItems)
                .sort(([categoryA], [categoryB]) => {
                  const priorityA = getCategoryPriority(categoryA);
                  const priorityB = getCategoryPriority(categoryB);
                  return priorityA - priorityB;
                })
                .map(([category, items], index) => (
                  <AccordionItem value={category} key={category + index}>
                    <AccordionTrigger className="flex items-center gap-2 group max-w-fit">
                      <h1 className="text-xl lg:text-3xl font-bold my-2 lg:my-5 capitalize w-100 bg-transparent flex items-center gap-2">
                        <div className="left-marker">▶</div> {category}
                      </h1>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Droppable droppableId={category}>
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                          >
                            {items
                              .sort((a, b) => a.priority - b.priority)
                              .map((item, itemIndex) => (
                                <Draggable
                                  key={item.id}
                                  draggableId={item.id as string}
                                  index={itemIndex}
                                  isDragDisabled={!isEditingPriority}
                                >
                                  {(provided) => (
                                    <Card
                                      {...provided.draggableProps}
                                      ref={provided.innerRef}
                                      className={`rounded-xl overflow-hidden grid ${
                                        isEditingPriority ? "cursor-grab" : ""
                                      }`}
                                    >
                                      <CardHeader className="flex flex-row justify-between gap-4 relative">
                                        {!item.is_available && (
                                          <div className="absolute saturate-200 top-0 text-xl px-2 rounded-br-xl py-3 z-[40] left-0 bg-red-500 text-white font-bold">
                                            Unavailable
                                          </div>
                                        )}
                                        <div>
                                          {item.image_url.length > 0 && (
                                            <div className="relative w-32 h-32 overflow-hidden">
                                              <Img
                                                src={item.image_url}
                                                alt={item.name}
                                                className={`w-full h-full object-cover rounded-lg ${
                                                  item.is_available
                                                    ? ""
                                                    : " saturate-0"
                                                }`}
                                              />
                                            </div>
                                          )}
                                        </div>
                                        <CardTitle className="flex items-center justify-between w-full">
                                          {item.name}
                                          {isEditingPriority && (
                                            <div
                                              {...provided.dragHandleProps}
                                              className="p-2 rounded-md hover:bg-gray-100"
                                            >
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="h-6 w-6"
                                              >
                                                <polyline points="18 8 22 12 18 16"></polyline>
                                                <polyline points="6 8 2 12 6 16"></polyline>
                                                <line
                                                  x1="2"
                                                  y1="12"
                                                  x2="22"
                                                  y2="12"
                                                ></line>
                                              </svg>
                                            </div>
                                          )}
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="relative">
                                        <p className="text-2xl font-bold">
                                          ₹{item.price.toFixed(2)}
                                        </p>
                                        {item.description && (
                                          <p className="text-gray-600 mt-2">
                                            {item.description}
                                          </p>
                                        )}
                                        <div className="flex items-center mt-2">
                                          <label className="mr-2">
                                            Mark as Popular:
                                          </label>
                                          <Switch
                                            checked={item.is_top}
                                            onCheckedChange={async () => {
                                              try {
                                                if (item.is_top) {
                                                  await updateItem(
                                                    item.id as string,
                                                    {
                                                      is_top: false,
                                                    }
                                                  );
                                                } else {
                                                  await updateItem(
                                                    item.id as string,
                                                    {
                                                      is_top: true,
                                                    }
                                                  );
                                                }
                                              } catch (error) {
                                                toast.error(
                                                  "Failed to update item status"
                                                );
                                                console.error(error);
                                              }
                                            }}
                                          />
                                        </div>
                                        <div className="flex items-center mt-3">
                                          <label className="mr-2">
                                            Is Available:
                                          </label>
                                          <Switch
                                            checked={item.is_available}
                                            onCheckedChange={async () => {
                                              try {
                                                await updateItem(
                                                  item.id as string,
                                                  {
                                                    is_available:
                                                      !item.is_available,
                                                  }
                                                );
                                              } catch (error) {
                                                toast.error(
                                                  "Failed to mark item as " +
                                                    (item.is_available
                                                      ? "Unavailable"
                                                      : "Available")
                                                );
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
                                              description:
                                                item.description || "",
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
                                            e.currentTarget.innerText =
                                              "Deleting...";
                                            const isOfferActive =
                                              adminOffers.some(
                                                (offer) =>
                                                  offer.menuItemId === item.id
                                              );
                                            if (isOfferActive) {
                                              alert(
                                                `Cannot delete the menu item "${item.name}" because it has an active offer. Please delete the offer first.`
                                              );
                                              return;
                                            }
                                            await deleteItem(item.id as string);
                                            if (item.image_url)
                                              await deleteFileFromS3(
                                                item.image_url
                                              );
                                          }}
                                        >
                                          Delete
                                        </Button>
                                      </CardFooter>
                                    </Card>
                                  )}
                                </Draggable>
                              ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </DragDropContext>
        ) : (
          <div className="text-center">
            {isMenuItemsFetching ? "Loading Menu...." : "No Menu Items Added!"}
          </div>
        )}
      </>
    </div>
  );
}
