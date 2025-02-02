import { useState, ChangeEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { uploadFileToS3, deleteFileFromS3 } from "@/app/actions/aws-s3";

interface EditMenuItemModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: string;
    name: string;
    price: string;
    image: string;
    description: string;
  };
  onSubmit: (item: {
    id: string;
    name: string;
    price: string;
    image: string;
    description: string;
  }) => void;
}

export function EditMenuItemModal({ isOpen, onOpenChange, item, onSubmit }: EditMenuItemModalProps) {
  const [imageUrl, setImageUrl] = useState(item.image);
  const [editingItem, setEditingItem] = useState(item);
  const [isImageUploaded, setImageUploaded] = useState(true);

  const handleImageInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    const url = await uploadFileToS3(file);
    if (url) {
      setEditingItem({ ...editingItem, image: url });
      setImageUploaded(true);
    }
  };

  const handleImageRemove = async () => {
    await deleteFileFromS3(editingItem.image);
    setImageUrl("");
    setEditingItem({ ...editingItem, image: "" });
    setImageUploaded(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.name || !editingItem.price || !editingItem.image) {
      alert("Please fill all the fields");
      return;
    }
    onSubmit(editingItem);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%] sm:max-w-4xl rounded-xl">
        <DialogHeader>
          <DialogTitle>Edit Menu Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 grid justify-items-center">
            {imageUrl && (
              <Image src={imageUrl} alt="upload-image" height={300} width={300} />
            )}
            <div className="flex items-center gap-2 w-full">
              {!imageUrl && (
                <Input
                  className="w-full flex-1"
                  required
                  placeholder="Image URL"
                  value={editingItem.image}
                  onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                />
              )}
              <label
                onClick={imageUrl ? handleImageRemove : () => {}}
                htmlFor={!imageUrl ? "imageEdit" : ""}
                className={`cursor-pointer text-center transition-all text-white font-medium px-3 py-2 rounded-lg text-sm ${
                  imageUrl ? "bg-red-600 hover:bg-red-500 w-full" : "bg-black hover:bg-black/50"
                }`}
              >
                {imageUrl ? (isImageUploaded ? "Change Image" : "Uploading....") : "Upload Image"}
              </label>
              <input
                onChange={handleImageInput}
                className="hidden"
                type="file"
                id="imageEdit"
              />
            </div>
          </div>
          <Input
            required
            placeholder="Product Name"
            value={editingItem.name}
            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
          />
          <Input
            required
            type="number"
            placeholder="Price in ₹"
            value={editingItem.price}
            onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
          />
          <Textarea
            placeholder="Product Description"
            value={editingItem.description}
            onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
          />
          <Button
            disabled={!editingItem.image || !isImageUploaded}
            type="submit"
            className="w-full"
          >
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}