import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch"; // Import the Switch component
import { useMenuStore } from "@/store/menuStore";
import { useAdminOfferStore } from "@/store/useAdminOfferStore";
import { useAuthStore } from "@/store/authStore";
import Image from "next/image";
import Link from "next/link";
import { AddMenuItemModal } from "../bulkMenuUpload/AddMenuItemModal";
import { EditMenuItemModal } from "./EditMenuItemModal";
import { deleteFileFromS3 } from "@/app/actions/aws-s3";
import { toast } from "sonner";

export function MenuTab() {
  const { items, addItem, updateItem, deleteItem } = useMenuStore();
  const { adminOffers, fetchAdminOffers } = useAdminOfferStore();
  const { user } = useAuthStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<{
    id: string;
    name: string;
    price: string;
    image: string;
    description: string;
    category: string;
  } | null>(null);

  useEffect(() => {
    if (user?.uid) {
      fetchAdminOffers(user.uid);
    }
  }, [user, fetchAdminOffers]);

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const handleAddItem = (item: { name: string; price: string; image: string; description: string; category: string }) => {
    addItem({
      name: item.name,
      price: parseFloat(item.price),
      image: item.image,
      description: item.description,
      category: item.category,
      hotelId: user?.uid || "",
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
      image: item.image,
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
          <Button variant="outline" size="icon" onClick={() => setIsAddModalOpen(true)}>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <Card className="rounded-xl overflow-hidden" key={item.id}>
            <Image
              src={item.image}
              alt={item.name}
              width={300}
              height={300}
              className="w-full h-48 object-cover"
            />
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₹{item.price.toFixed(2)}</p>
              {item.description && (
                <p className="text-gray-600 mt-2">{item.description}</p>
              )}
              <div className="flex items-center mt-2">
                <label className="mr-2">Mark as Top 3:</label>
                <Switch
                  checked={item.isTop}
                  onCheckedChange={() => {
                    const topItemsCount = filteredItems.filter(i => i.isTop).length;
                    if (item.isTop) {
                      updateItem(item.id, { isTop: false });
                    } else if (topItemsCount < 3) {
                      updateItem(item.id, { isTop: true });
                    } else {
                      toast.error("You can only mark up to 3 items as Top 3.");
                    }
                  }}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => openEditModal({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                description: item.description || '',
                category: item.category,
              })}>
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
                  deleteItem(item.id);
                  await deleteFileFromS3(item.image);
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
}