import { use, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import CategoryDropdown from "@/components/ui/CategoryDropdown";
import { ImageGridModal } from "../bulkMenuUpload/ImageGridModal";
import { useCategoryStore } from "@/store/categoryStore";
import { useAuthStore } from "@/store/authStore";

interface EditMenuItemModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: string;
    name: string;
    price: string;
    image: string;
    description: string;
    category: string;
  };
  onSubmit: (item: {
    id: string;
    name: string;
    price: string;
    image: string;
    description: string;
    category: string;
  }) => void;
  children?: React.ReactNode;
}

export function EditMenuItemModal({
  isOpen,
  onOpenChange,
  item,
  onSubmit,
  children,
}: EditMenuItemModalProps) {
  const [editingItem, setEditingItem] = useState(item );
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const { getCategoryById, getCategoryId } = useCategoryStore();
  const [categoryName, setCategoryName] = useState("");
  const { user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.name || !editingItem.price || !categoryName) {
      alert("Please fill all the fields");
      return;
    }

    let catId = await getCategoryId(editingItem.category, user?.uid || "");
    if (!catId) {
      catId = item.category;
    }

    const updatedItem = {
      ...editingItem,
      category: catId,
    };

    onSubmit(updatedItem);
    onOpenChange(false);
  };

  useEffect(() => {
    const fetchCatName = async () => {
      const catName = await getCategoryById(item.category);

      if (catName) {
        setCategoryName(catName);
      } else {
        setCategoryName("Unknown Category");
      }
    };

    fetchCatName();


  }, [item, isOpen, editingItem, isImageModalOpen]);

 

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%] sm:max-w-4xl rounded-xl">
        <DialogHeader>
          <DialogTitle>Edit Menu Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Preview and Selection */}
          <div className="space-y-2">
            {editingItem.image ? (
              <div
                className="relative h-[200px] w-full cursor-pointer"
                onClick={() => setIsImageModalOpen(true)}
              >
                <Image
                  src={editingItem.image}
                  alt="Selected item"
                  width={200}
                  height={200}
                  className="object-cover rounded-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-white">Click to change image</p>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-[200px]"
                onClick={() => setIsImageModalOpen(true)}
              >
                Select Image
              </Button>
            )}
          </div>

          <ImageGridModal
            isOpen={isImageModalOpen}
            onOpenChange={setIsImageModalOpen}
            itemName={editingItem.name}
            category={categoryName}
            currentImage={editingItem.image}
            onSelectImage={(newImageUrl: string) => {
              setEditingItem((prev) => ({ ...prev, image: newImageUrl }));
              setIsImageModalOpen(false);
            }}
          />

          {/* Rest of the form fields */}
          <Input
            required
            placeholder="Product Name"
            value={editingItem.name}
            onChange={(e) =>
              setEditingItem({ ...editingItem, name: e.target.value })
            }
          />
          <Input
            required
            type="number"
            placeholder="Price in ₹"
            value={editingItem.price}
            onChange={(e) =>
              setEditingItem({ ...editingItem, price: e.target.value })
            }
          />
          <Textarea
            placeholder="Product Description"
            value={editingItem.description}
            onChange={(e) =>
              setEditingItem({ ...editingItem, description: e.target.value })
            }
          />
          <CategoryDropdown
            value={categoryName}
            onChange={(value) => {
              setEditingItem({ ...editingItem, category: value });
              setCategoryName(value);
            }}
          />
          {children}
          <Button type="submit" className="w-full">
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
