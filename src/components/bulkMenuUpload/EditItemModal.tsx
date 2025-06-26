import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageGridModal } from "./ImageGridModal";
import { useState } from "react";
import Img from "../Img";

// Debug logging function
const debugLog = (context: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[EditItemModal][${timestamp}][${context}] ${message}`);
  if (data !== undefined) {
    console.log(`[EditItemModal][${timestamp}][${context}] Data:`, data);
  }
};

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
  debugLog("Initialize", "EditItemModal component rendering", {
    isOpen,
    hasEditingItem: !!editingItem,
    itemIndex: editingItem?.index,
    itemName: editingItem?.item?.name
  });
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  if (!editingItem || !isOpen) {
    debugLog("Render", "Not rendering modal - invalid state", { 
      hasEditingItem: !!editingItem, 
      isOpen 
    });
    return null;
  }

  const handleClose = () => {
    debugLog("Action", "Modal close requested");
    onOpenChange(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    debugLog("Action", "Save changes form submitted", {
      itemName: editingItem.item.name,
      itemPrice: editingItem.item.price,
      itemDescription: editingItem.item.description?.length || 0
    });
    onSave();
  };

  const handleEditField = (field: keyof MenuItem, value: string | number) => {
    debugLog("Edit", `Field '${field}' changed`, {
      oldValue: editingItem.item[field],
      newValue: value
    });
    onEdit(field, value);
  };

  const handleOpenImageModal = () => {
    debugLog("Action", "Image selection modal opened", {
      currentImage: editingItem.item.image
    });
    setIsImageModalOpen(true);
  };

  const handleSelectImage = (newImageUrl: string) => {
    debugLog("Action", "New image selected", {
      oldImage: editingItem.item.image,
      newImage: newImageUrl
    });
    onEdit("image", newImageUrl);
    setIsImageModalOpen(false);
  };
  
  debugLog("Render", "Rendering EditItemModal");

  return (
    <>
      {/* Inline Edit Form */}
      <div className="bg-white p-5 rounded-lg border shadow-md w-full animate-in fade-in-0 duration-150">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit Menu Item</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            type="button"
            onClick={handleClose}
          >
            ×
          </Button>
        </div>
        
        <form onSubmit={handleSave} className="space-y-4">
          {/* Image Selection */}
          <div className="w-full flex justify-center mb-2">
            {editingItem.item.image ? (
              <div
                className="relative h-[160px] w-[160px] cursor-pointer overflow-hidden rounded-lg"
                onClick={handleOpenImageModal}
              >
                <Img
                  src={editingItem.item.image}
                  alt="Selected item"
                  className="object-contain h-full w-full rounded-lg"
                  sizes="160px"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm">Change image</p>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-[160px] h-[160px]"
                onClick={handleOpenImageModal}
              >
                Select Image
              </Button>
            )}
          </div>
          
          {/* Form Fields */}
          <div>
            <label htmlFor="name" className="text-sm font-medium mb-1 block">Name</label>
            <Input
              id="name"
              value={editingItem.item.name}
              onChange={(e) => handleEditField("name", e.target.value)}
              placeholder="Item name"
              autoFocus
            />
          </div>
          
          <div>
            <label htmlFor="description" className="text-sm font-medium mb-1 block">Description</label>
            <Textarea
              id="description"
              value={editingItem.item.description}
              onChange={(e) => handleEditField("description", e.target.value)}
              className="min-h-[80px]"
              placeholder="Item description"
            />
          </div>
          
          <div>
            <label htmlFor="price" className="text-sm font-medium mb-1 block">Price</label>
            <Input
              id="price"
              value={editingItem.item.price}
              type="number"
              step="0.01"
              min="0"
              onChange={(e) => handleEditField("price", parseFloat(e.target.value))}
              placeholder="0.00"
            />
          </div>
          
          <div className="flex justify-center gap-4 pt-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>

      {/* Image Selection Modal */}
      <ImageGridModal
        isOpen={isImageModalOpen}
        onOpenChange={(open) => {
          debugLog("Action", `Image modal visibility changed to ${open}`);
          setIsImageModalOpen(open);
        }}
        itemName={editingItem.item.name}
        category={editingItem.item.category.name.toLowerCase()}
        currentImage={editingItem.item.image}
        onSelectImage={handleSelectImage}
      />
    </>
  );
};
