import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash, Upload, Loader2 } from "lucide-react";
import Image from "next/image";
import { MenuItem } from "@/components/bulkMenuUpload/EditItemModal";

interface MenuItemCardProps {
  item: MenuItem;
  index: number;
  isUploading: boolean;
  onSelect: () => void;
  onAddToMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onImageClick: () => void;
}

export const MenuItemCard = ({
  item,
  isUploading,
  onSelect,
  onAddToMenu,
  onEdit,
  onDelete,
  onImageClick,
}: MenuItemCardProps) => {
  const isImageLoading = item.image === "/loading-image.gif";

  return (
    <Card className="relative">
      {item.isAdded && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md">
          Added
        </div>
      )}

      <div className="flex flex-row items-center gap-2 px-5 py-6">
        <Checkbox checked={item.isSelected} onCheckedChange={onSelect} />
        <div className="font-bold text-lg">{item.name}</div>
      </div>
      <CardContent>
        <div
          className="relative overflow-hidden w-full h-48 mb-10  "
          onClick={onImageClick}
        >
          {isImageLoading ? (
            <div className="absolute inset-0 flex items-center justify-center w-full h-full bg-gray-100 animate-pulse">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Generating image...</p>
              </div>
            </div>
          ) : (
            <>
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover rounded-md w-full h-full z-10"
                onError={(e) => {
                  e.currentTarget.src = item.image;
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center w-full h-full bg-gray-100 animate-pulse">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading image...</p>
                </div>
              </div>
            </>
          )}
        </div>
        <p className="text-gray-600 mb-2">{item.description}</p>
        <p className="font-bold">₹{item.price}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button onClick={onAddToMenu} disabled={item.isAdded || isUploading}>
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
    </Card>
  );
};
