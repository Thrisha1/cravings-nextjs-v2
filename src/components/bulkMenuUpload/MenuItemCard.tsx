import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash, Upload, Loader2, ImageOff } from "lucide-react";
import Image from "next/image";
import { MenuItem } from "@/components/bulkMenuUpload/EditItemModal";
import { CategoryDropdown } from "@/components/ui/CategoryDropdown";
import { ImageGridModal } from "./ImageGridModal";
import { useEffect, useState } from "react";
import { useCategoryStore } from "@/store/categoryStore";
import { toast } from "sonner";

interface MenuItemCardProps {
  item: MenuItem;
  index: number;
  isUploading: boolean;
  onSelect: () => void;
  onAddToMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onImageClick: (index: number, url: string) => void;
  onCategoryChange: (category: string) => void;
}

export const MenuItemCard = ({
  item,
  index,
  isUploading,
  onSelect,
  onAddToMenu,
  onEdit,
  onDelete,
  onImageClick,
  onCategoryChange,
}: MenuItemCardProps) => {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { categories, fetchCategories } = useCategoryStore();
  const [isValidCategory, setIsValidCategory] = useState(false);

  useEffect(() => {
    if (item.category) {
      const isValid = categories.includes(item.category);
      setIsValidCategory(isValid);
      setImageError(!isValid);
    }
    console.log(item);
    
  }, [item.category, categories]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleImageClick = () => {
    if (item.category) {
      setIsImageModalOpen(true);
    }
  };

  const handleSelectImage = (newImageUrl: string) => {
    onImageClick(index, newImageUrl);
    setIsImageModalOpen(false);
    setImageError(false); // Reset error state when new image is selected
  };

  return (
    <Card className="relative">
      {item.isAdded && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md">
          Added
        </div>
      )}

      <div className="flex flex-row items-center gap-2 px-5 py-6">
        <Checkbox
          checked={item.isSelected}
          onCheckedChange={onSelect}
          disabled={!item.category || item.isAdded || !isValidCategory}
        />
        <div className="font-bold text-lg">{item.name}</div>
      </div>

      <CardContent className="space-y-4">
        <div
          className="relative overflow-hidden w-full h-48 cursor-pointer"
          onClick={
            isValidCategory
              ? handleImageClick
              : () => toast.error("Select a valid category")
          }
        >
          {imageError ? (
            <div className="absolute inset-0 flex items-center justify-center w-full h-full bg-gray-100">
              <div className="text-center">
                <ImageOff className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {" "}
                  {!isValidCategory
                    ? "Not Valid Category"
                    : "No image found"}{" "}
                </p>
                <p className="text-xs text-gray-400">Click to try again</p>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {/* loadign  */}
              <div className={`absolute inset-0 flex items-center justify-center w-full h-full bg-gray-100 animate-pulse ${isImageLoading ? "z-10" : "z-0"}`}>
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading image...</p>
                </div>
              </div>

              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover rounded-md"
                onLoad={() => {
                  console.log("Image loading started");
                  setIsImageLoading(true);
                }}
                onLoadingComplete={() => {
                  console.log("Image loaded");
                  setIsImageLoading(false);
                  setImageError(false);
                }}
                onError={() => {
                  setImageError(true);
                }}
              />
            </div>
          )}
        </div>

        <CategoryDropdown
          value={item.category || ""}
          onChange={onCategoryChange}
        />

        <p className="text-gray-600">{item.description}</p>
        <p className="font-bold">₹{item.price}</p>
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button
            onClick={onAddToMenu}
            disabled={
              item.isAdded ||
              isUploading ||
              !item.category ||
              !isValidCategory
            }
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {item.isAdded ? "Added to Menu" : "Add to Menu"}
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="destructive" onClick={onDelete}>
          <Trash className="w-4 h-4" />
        </Button>
      </CardFooter>

      <ImageGridModal
        isOpen={isImageModalOpen}
        onOpenChange={setIsImageModalOpen}
        itemName={item.name}
        category={item.category}
        currentImage={item.image}
        onSelectImage={handleSelectImage}
      />
    </Card>
  );
};
