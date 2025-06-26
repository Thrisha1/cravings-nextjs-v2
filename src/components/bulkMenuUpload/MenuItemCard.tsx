import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash, Upload, Loader2 } from "lucide-react";
import { MenuItem } from "@/components/bulkMenuUpload/EditItemModal";
import { useState } from "react";
import { Input } from "../ui/input";
import Image from "next/image";
import Img from "../Img";

// Debug logging function
const debugLog = (context: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[MenuItemCard][${timestamp}][${context}] ${message}`);
  if (data !== undefined) {
    console.log(`[MenuItemCard][${timestamp}][${context}] Data:`, data);
  }
};

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
}: MenuItemCardProps) => {
  debugLog("Render", `Rendering item ${index}`, { 
    name: item.name, 
    price: item.price, 
    isAdded: item.isAdded, 
    isSelected: item.isSelected,
    hasCategory: !!item.category,
    isUploading
  });
  
  const [itemCategory, setItemCategory] = useState(item.category.name);
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debugLog("CategoryChange", `Category changed for item ${index}`, { 
      oldValue: itemCategory,
      newValue: e.target.value
    });
    setItemCategory(e.target.value);
    item.category.name = e.target.value;
  };
  
  return (
    <Card className="relative grid">
      {item.isAdded && (
        <div className="absolute top-2 right-1/2 translate-x-1/2 bg-green-500 text-white px-2 py-1 rounded-md">
          Added
        </div>
      )}

      <div className="flex justify-between items-center gap-2 px-5 py-6 ">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={item.isSelected}
            onCheckedChange={() => {
              debugLog("Checkbox", `Selection toggled for item ${index}`, {
                name: item.name,
                currentSelection: item.isSelected
              });
              onSelect();
            }}
            disabled={!item.category || item.isAdded}
          />
          <div className="font-bold text-lg">{item.name}</div>
        </div>
        <p className="font-bold text-2xl text-right">₹{item.price}</p>
      </div>

      <CardContent className="space-y-3 ">
        {item.image.length > 9 && (
          <div className="relative w-40 h-40 overflow-hidden rounded-md ">
            <Img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <p className="text-gray-600">{item.description}</p>
        <div className="flex gap-2 items-center ">
          <label htmlFor="category" className="text-sm">
            Category :
          </label>
          <Input
            id="category"
            className="flex-1"
            placeholder="Enter category name"
            value={itemCategory}
            onChange={handleCategoryChange}
          />
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button
            onClick={() => {
              debugLog("Button", `Add to menu clicked for item ${index}`, {
                name: item.name,
                isAdded: item.isAdded,
                isUploading,
                hasCategory: !!item.category
              });
              onAddToMenu();
            }}
            disabled={item.isAdded || isUploading || !item.category}
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
          <Button 
            variant="outline" 
            onClick={() => {
              debugLog("Button", `Edit clicked for item ${index}`, {
                name: item.name
              });
              onEdit();
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
        <Button 
          variant="destructive" 
          onClick={() => {
            debugLog("Button", `Delete clicked for item ${index}`, {
              name: item.name
            });
            onDelete();
          }}
        >
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
