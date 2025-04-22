import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageGridModal } from "./ImageGridModal";
import Image from "next/image";
import { useState } from "react";

export interface MenuItem {
  id?: string;
  name: string;
  price: number;
  image: string;
  description: string;
  isAdded?: boolean;
  isSelected?: boolean;
  category: {
    name: string;
    id: string;
    priority: number;
  };
}

interface EditItemModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: { index: number; item: MenuItem } | null;
  onSave: () => void;
  onEdit: (field: keyof MenuItem, value: string | number) => void;
}

export const EditItemModal = ({
  isOpen,
  onOpenChange,
  editingItem,
  onSave,
  onEdit,
}: EditItemModalProps) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  if (!editingItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%] sm:max-w-4xl rounded-xl">
        <DialogHeader>
          <DialogTitle>Edit Menu Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Image Preview and Selection */}
          <div className="space-y-2">
            {editingItem.item.image ? (
              <div
              className="relative h-[200px] w-full cursor-pointer overflow-hidden"
              onClick={() => setIsImageModalOpen(true)}
            >
              <Image
                src={editingItem.item.image}
                alt="Selected item"
                fill
                className="object-contain rounded-lg"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                <p className="text-white">Click to change images</p>
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
            itemName={editingItem.item.name}
            category={editingItem.item.category.name.toLowerCase()}
            currentImage={editingItem.item.image}
            onSelectImage={(newImageUrl: string) => {
              onEdit("image", newImageUrl);
              setIsImageModalOpen(false);
            }}
          />

          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={editingItem.item.name}
              onChange={(e) => onEdit("name", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={editingItem.item.description}
              onChange={(e) => onEdit("description", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Price</label>
            <Input
              value={editingItem.item.price}
              type="number"
              onChange={(e) => onEdit("price", parseFloat(e.target.value))}
            />
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
