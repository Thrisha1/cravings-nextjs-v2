import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash, Upload, Loader2 } from "lucide-react";
import { MenuItem } from "@/components/bulkMenuUpload/EditItemModal";
import { useEffect, useState } from "react";
import { useCategoryStore } from "@/store/categoryStore";
import { Input } from "../ui/input";

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
  isUploading,
  onSelect,
  onAddToMenu,
  onEdit,
  onDelete,
}: MenuItemCardProps) => {
  const [itemCategory, setItemCategory] = useState(item.category);
  return (
    <Card className="relative">
      {item.isAdded && (
        <div className="absolute top-2 right-1/2 translate-x-1/2 bg-green-500 text-white px-2 py-1 rounded-md">
          Added
        </div>
      )}

      <div className="flex justify-between items-center gap-2 px-5 py-6 ">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={item.isSelected}
            onCheckedChange={onSelect}
            disabled={!item.category || item.isAdded }
          />
          <div className="font-bold text-lg">{item.name}</div>
        </div>
        <p className="font-bold text-2xl text-right">₹{item.price}</p>
      </div>

      <CardContent className="space-y-3">
        <p className="text-gray-600">{item.description}</p>
        <div className="flex gap-2 items-center">
          <label htmlFor="category" className="text-sm">
            Category :
          </label>
          <Input
            id="category"
            className="flex-1"
            placeholder="Enter category name"
            value={itemCategory}
            onChange={(e) => {
              setItemCategory(e.target.value);
              item.category = e.target.value;
            }}
          />
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button
            onClick={onAddToMenu}
            disabled={
              item.isAdded || isUploading || !item.category 
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

      {/* <ImageGridModal
        isOpen={isImageModalOpen}
        onOpenChange={setIsImageModalOpen}
        itemName={item.name}
        category={item.category}
        currentImage={item.image}
        onSelectImage={handleSelectImage}
      /> */}
    </Card>
  );
};
