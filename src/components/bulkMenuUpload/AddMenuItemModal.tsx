import { useState, ChangeEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";
import { uploadFileToS3, deleteFileFromS3 } from "@/app/actions/aws-s3";

interface AddMenuItemModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (item: { name: string; price: string; image: string; description: string }) => void;
}

export function AddMenuItemModal({ isOpen, onOpenChange, onSubmit }: AddMenuItemModalProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    image: "",
    description: "",
  });
  const [isImageUploaded, setImageUploaded] = useState(false);

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
      setNewItem({ ...newItem, image: url });
      setImageUploaded(true);
    }
  };

  const handleImageRemove = async () => {
    await deleteFileFromS3(newItem.image);
    setImageUrl("");
    setNewItem({ ...newItem, image: "" });
    setImageUploaded(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.image) {
      toast.error("Please fill all the fields");
      return;
    }
    onSubmit(newItem);
    setNewItem({ name: "", price: "", image: "", description: "" });
    setImageUrl("");
    setImageUploaded(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%] sm:max-w-4xl rounded-xl">
        <DialogHeader>
          <DialogTitle>Add New Menu Item</DialogTitle>
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
                  value={newItem.image}
                  onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                />
              )}
              <label
                onClick={imageUrl ? handleImageRemove : () => {}}
                htmlFor={!imageUrl ? "imageUpload" : ""}
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
                id="imageUpload"
              />
            </div>
          </div>
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
          <Button
            disabled={!isImageUploaded || !newItem.name || !newItem.price}
            type="submit"
            className="w-full disabled:opacity-50"
          >
            Add Item
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}