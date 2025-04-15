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
// import CategoryUpdateModal from "./CategoryUpdateModal";
import Image from "next/image";
import { MenuItem, useMenuStore } from "@/store/menuStore_hasura";
import { Switch } from "../ui/switch";
import { toast } from "sonner";
import { deleteFileFromS3 } from "@/app/actions/aws-s3";
import { useParams, usePathname, useSearchParams } from "next/navigation";

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
  const [editingCategory, seteditingCategory] = useState({
    id: "",
    name: "",
  });
  const { adminOffers, fetchAdminOffers } = useAdminOfferStore();
  const { userData } = useAuthStore();
  const [catUpated, setCatUpdated] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = useSearchParams();
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
  }, [userData, fetchAdminOffers]);

  useEffect(() => {
    if (!isEditModalOpen) {
      setEditingItem(null);
    }
  }, [isEditModalOpen]);

  useEffect(() => {
    console.log("pathname:", pathname);
    
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
  }, [groupedItems, searchQuery , pathname]);

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
      category: item.category,
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
    updateItem(item.id, {
      name: item.name,
      price: parseFloat(item.price),
      image_url: item.image,
      description: item.description,
      category: item.category,
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

  const handleCategoryUpdate = async (cat: string, catId: string) => {
    setIsCategoryEditing(true);
    seteditingCategory({
      id: catId,
      name: cat,
    });
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

      {/* {isCategoryEditing && (
        <CategoryUpdateModal
          catId={editingCategory?.id || ""}
          cat={editingCategory?.name || ""}
          isOpen={isCategoryEditing}
          setCatUpdated={setCatUpdated}
          catUpdated={catUpated}
          onOpenChange={() => setIsCategoryEditing(false)}
        />
      )} */}

      <div className="grid gap-4 divide-y-2 divide-gray-300 ">
        {Object.entries(filteredGroupedItems)
          .sort()
          .map(([category, items], index) => {
            return (
              <div key={category + index} className="pb-10">
                <div className="flex items-center gap-2 group max-w-fit">
                  <h1 className="text-2xl lg:text-4xl font-bold my-2 lg:my-5 capitalize w-100 bg-transparent">
                    {category}
                  </h1>
                  <button
                    onClick={() => {
                      handleCategoryUpdate(category, items[0].category);
                    }}
                    className="group-hover:opacity-100 opacity-0 transition-opacity duration-300"
                  >
                    <Pen />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ">
                  {items.map((item) => (
                    <Card
                      className="rounded-xl overflow-hidden grid"
                      key={item.id}
                    >
                      <CardHeader className="flex flex-row justify-between">
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
                              category: item.category,
                            })
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={async () => {
                            const isOfferActive = adminOffers.some(
                              (offer) => offer.menuItemId === item.id
                            );
                            if (isOfferActive) {
                              alert(
                                `Cannot delete the menu item "${item.name}" because it has an active offer. Please delete the offer first.`
                              );
                              return;
                            }
                            deleteItem(item.id as string);
                            await deleteFileFromS3(item.image_url);
                          }}
                        >
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
