"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { PlusCircle, Trash2, ArrowLeft, ArrowRight, Image as ImageIcon } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import { MenuItem } from "../page";

interface MenuUploadFormProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  onNext: () => void;
  onPrevious: () => void;
}

export default function MenuUploadForm({
  menuItems,
  setMenuItems,
  onNext,
  onPrevious,
}: MenuUploadFormProps) {
  const [newItem, setNewItem] = useState<Omit<MenuItem, "id">>({
    name: "",
    price: 0,
    description: "",
    image: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddItem = async () => {
    try {
      setError(null);
      
      // Validate required fields
      if (!newItem.name || !newItem.price) {
        setError("Name and price are required");
        return;
      }

      // Check if we have reached the maximum number of items
      if (menuItems.length >= 5) {
        setError("You can only add up to 5 menu items");
        return;
      }

      // Instead of uploading to S3, we'll just store the image preview URL locally
      // This will be a base64 string that can be displayed in the UI
      let imageUrl = imagePreview || "";

      // Add new item with unique ID
      const newMenuItem: MenuItem = {
        id: uuidv4(),
        name: newItem.name,
        price: newItem.price,
        description: newItem.description,
        image: imageUrl,
      };

      setMenuItems((prev) => [...prev, newMenuItem]);

      // Reset form
      setNewItem({
        name: "",
        price: 0,
        description: "",
        image: "",
      });
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error adding menu item:", error);
      setError("An error occurred. Please try again.");
    }
  };

  const handleRemoveItem = (id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleNextStep = () => {
    if (menuItems.length === 0) {
      setError("Please add at least one menu item");
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Menu Upload</h2>
      <p className="text-gray-500">
        Add up to 5 of your best menu items to showcase your business.
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md">
          {error}
        </div>
      )}

      <Card className="p-4 border border-dashed">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                placeholder="Enter item name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                placeholder="Enter price"
                value={newItem.price || ""}
                onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter item description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">Item Image</Label>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6 h-[200px] relative">
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <ImageIcon className="w-12 h-12 mb-2" />
                    <p className="text-sm">Click to upload an image</p>
                  </div>
                )}
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  className="absolute inset-0 w-0 h-0 opacity-0"
                  onChange={handleImageChange}
                />
                <label 
                  htmlFor="image" 
                  className="absolute inset-0 cursor-pointer"
                  aria-label="Upload image"
                />
              </div>
            </div>

            <Button 
              onClick={handleAddItem} 
              className="w-full"
            >
              Add Item
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Added Items ({menuItems.length}/5)</h3>
        
        {menuItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No items added yet. Add your first menu item above.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {menuItems.map((item) => (
              <Card key={item.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {item.image ? (
                    <div className="relative w-16 h-16 rounded-md overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-500">₹{item.price.toFixed(2)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button onClick={handleNextStep}>
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 