import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CategoryDropdown from "@/components/ui/CategoryDropdown";
import { ImageGridModal } from "./ImageGridModal";
import Img from "../Img";

interface AddMenuItemFormProps {
  onSubmit: (item: {
    name: string;
    price: string;
    image: string;
    description: string;
    category: string;
  }) => void;
  onCancel: () => void;
}

export function AddMenuItemForm({
  onSubmit,
  onCancel,
}: AddMenuItemFormProps) {
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    image: "",
    description: "",
    category: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.category) {
      toast.error("Please fill all the fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(newItem);
      setNewItem({
        name: "",
        price: "",
        image: "",
        description: "",
        category: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setNewItem({
      name: "",
      price: "",
      image: "",
      description: "",
      category: "",
    });
    onCancel();
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 mt-8">
      <h2 className="text-xl font-bold mb-4">Add New Menu Item</h2>
      <form id="add-menu-item-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Image Preview and Selection */}
        {newItem.category && newItem.name && (
          <div className="space-y-2">
            {newItem.image ? (
              <div
                className="relative h-[200px] w-[200px] cursor-pointer"
                onClick={() => setIsImageModalOpen(true)}
              >
                <Img
                  src={newItem.image}
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
        )}

        <ImageGridModal
          isOpen={isImageModalOpen}
          onOpenChange={setIsImageModalOpen}
          itemName={newItem.name}
          category={newItem.category}
          currentImage={newItem.image}
          onSelectImage={(newImageUrl: string) => {
            setNewItem((prev) => ({ ...prev, image: newImageUrl }));
            setIsImageModalOpen(false);
          }}
        />

        <Input
          required
          placeholder="Product Name"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
        />
        <Input
          required
          type="number"
          placeholder="Price in ₹"
          value={newItem.price}
          onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
        />
        <Textarea
          placeholder="Product Description"
          value={newItem.description}
          onChange={(e) =>
            setNewItem({ ...newItem, description: e.target.value })
          }
        />
        <CategoryDropdown
          value={newItem.category}
          onChange={(value) => setNewItem({ ...newItem, category: value })}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            type="button"
          >
            Cancel
          </Button>
          <Button
            disabled={
              !newItem.name ||
              !newItem.price ||
              !newItem.category ||
              isSubmitting
            }
            form="add-menu-item-form"
            type="submit"
          >
            {isSubmitting ? "Submitting..." : "Add Item"}
          </Button>
        </div>
      </form>
    </div>
  );
}
