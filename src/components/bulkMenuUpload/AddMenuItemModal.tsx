import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";
import CategoryDropdown from "@/components/ui/CategoryDropdown";
import { getMenuItemImage } from "@/store/menuStore";
import { Loader2 } from "lucide-react";
import { ImageGridModal } from "./ImageGridModal";

interface AddMenuItemModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (item: { name: string; price: string; image: string; description: string; category: string }) => void;
}

export function AddMenuItemModal({ isOpen, onOpenChange, onSubmit }: AddMenuItemModalProps) {
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    image: "",
    description: "",
    category: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Add effect to fetch image when category changes
  useEffect(() => {
    const fetchImage = async () => {
      if (newItem.name && newItem.category) {
        try {
          const urls = await getMenuItemImage(newItem.category, newItem.name);
          if (urls && urls.length > 0) {
            setNewItem(prev => ({ ...prev, image: urls[0] }));
          }
        } catch (error) {
          console.error("Error fetching image:", error);
          toast.error("Failed to fetch image");
        }
      }
    };

    fetchImage();
  }, [newItem.name, newItem.category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.image || !newItem.category) {
      toast.error("Please fill all the fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(newItem);
      setNewItem({ name: "", price: "", image: "", description: "", category: "" });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%] sm:max-w-4xl rounded-xl">
        <DialogHeader>
          <DialogTitle>Add New Menu Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selected Image Preview */}
          {newItem.image && (
            <div className="relative h-[200px] w-full cursor-pointer" onClick={() => setIsImageModalOpen(true)}>
              <Image 
                src={newItem.image} 
                alt="Selected item" 
                fill
                className="object-cover rounded-lg"
              />
            </div>
          )}

          {/* Image Grid Modal */}
          <ImageGridModal
            isOpen={isImageModalOpen}
            onOpenChange={setIsImageModalOpen}
            itemName={newItem.name}
            category={newItem.category}
            currentImage={newItem.image}
            onSelectImage={(newImageUrl: string) => {
              setNewItem(prev => ({ ...prev, image: newImageUrl }))
              setIsImageModalOpen(false)
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
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
          />
          <CategoryDropdown
            value={newItem.category}
            onChange={(value) => setNewItem({ ...newItem, category: value })}
          />
          <Button
            disabled={!newItem.name || !newItem.price || !newItem.category || !newItem.image || isSubmitting}
            type="submit"
            className="w-full disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Add Item"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}