import { useEffect, useState } from "react";
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
import { useAuthStore } from "@/store/authStore";
import { useCategoryStore } from "@/store/categoryStore_hasura";
import Img from "../Img";

interface EditMenuItemFormProps {
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
  onCancel: () => void;
}

export function EditMenuItemForm({
  item,
  onSubmit,
  onCancel,
}: EditMenuItemFormProps) {
  const [editingItem, setEditingItem] = useState(item);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.name || !editingItem.price || !editingItem.category) {
      alert("Please fill all the fields");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(editingItem);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 mt-8">
      <h2 className="text-xl font-bold mb-4">Edit Menu Item</h2>
      <form id="edit-menu-item-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Image Preview and Selection */}
        <div className="space-y-2">
          {editingItem.image ? (
            <div
              className="relative h-[200px] w-[200px] cursor-pointer mx-auto"
              onClick={() => setIsImageModalOpen(true)}
            >
              <Img
                src={editingItem.image}
                alt="Selected item"
                className="object-cover rounded-lg w-full h-full"
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
          category={editingItem.category}
          currentImage={editingItem.image}
          onSelectImage={(newImageUrl: string) => {
            setEditingItem((prev) => ({ ...prev, image: newImageUrl }));
            setIsImageModalOpen(false);
          }}
        />

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
          value={editingItem.category}
          onChange={(value) => {
            setEditingItem({ ...editingItem, category: value });
          }}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={onCancel}
            type="button"
          >
            Cancel
          </Button>
          <Button
            disabled={
              !editingItem.name ||
              !editingItem.price ||
              !editingItem.category ||
              isSubmitting
            }
            form="edit-menu-item-form"
            type="submit"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

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
  // We keep this for backwards compatibility, but the component is no longer used directly
  return null;
}
