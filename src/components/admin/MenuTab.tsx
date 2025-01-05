import { useState, useMemo, useEffect, ChangeEvent } from "react";
import { Plus, Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMenuStore } from "@/store/menuStore";
import Image from "next/image";
import { useOfferStore } from "@/store/offerStore";
import { deleteFileFromS3, uploadFileToS3 } from "@/app/actions/aws-s3";

export function MenuTab() {
  const { items, addItem, updateItem, deleteItem } = useMenuStore();
  const { offers } = useOfferStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    image: "",
    description: "",
  });
  const [editingItem, setEditingItem] = useState<{
    id: string;
    name: string;
    price: string;
    image: string;
    description: string;
  } | null>(null);
  const [isImageUploaded, setImageUploaded] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newItem.name || !newItem.price || !newItem.image) {
      alert("Please fill all the fields");
      return;
    }

    addItem({
      name: newItem.name,
      price: parseFloat(newItem.price),
      image: newItem.image,
      description: newItem.description,
    });
    setNewItem({ name: "", price: "", image: "", description: "" });
    setImageUrl("");
    setImageUploaded(false);
    setIsOpen(false);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateItem(editingItem.id, {
        name: editingItem.name,
        price: parseFloat(editingItem.price),
        image: editingItem.image,
        description: editingItem.description,
      });
      setEditingItem(null);
      setIsEditOpen(false);
      setImageUploaded(false);
      setImageUrl("");
    }
  };

  const openEditModal = (item: {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
  }) => {
    setEditingItem({
      id: item.id,
      name: item.name,
      price: item.price.toString(),
      image: item.image,
      description: item.description || "",
    });
    setIsEditOpen(true);
  };

  const handleImageInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      if (isEditOpen) {
        setEditingItem({ ...editingItem!, image: reader.result as string });
      } else {
        setImageUrl(reader.result as string);
      }
    };

    if (file) reader.readAsDataURL(file);

    const url = await uploadFileToS3(file);

    if (url) {
      if (isEditOpen) {
        setEditingItem({ ...editingItem!, image: url });
      } else {
        setNewItem({ ...newItem, image: url });
      }

      setImageUploaded(true);
    }
  };

  const handleImageRemove = async () => {
    if (isEditOpen) {
      await deleteFileFromS3(editingItem!.image);
    } else {
      await deleteFileFromS3(newItem.image);
    }

    setTimeout(() => {
      setImageUrl("");
      setNewItem({ ...newItem, image: "" });
      if (isEditOpen) {
        setEditingItem({ ...editingItem!, image: "" });
      }
      setImageUploaded(false);
    }, 500);
  };

  useEffect(() => {
    if (!newItem || !newItem.image) {
      return;
    }

    const urlregex = /^https:\/\//;

    if (!urlregex.test(newItem.image)) {
      setNewItem({ ...newItem, image: "" });
      alert("Please provide a valid URL or upload it as an image");
      setImageUploaded(false);
      return;
    } else {
      setImageUrl(newItem.image);
      setImageUploaded(true);
    }
  }, [newItem.image]);

  useEffect(() => {
    if (!editingItem || !editingItem.image) {
      return;
    }

    const urlregex = /^https:\/\//;

    if (!urlregex.test(editingItem.image)) {
      setEditingItem({ ...editingItem, image: "" });
      alert("Please provide a valid URL or upload it as an image");
      setImageUploaded(false);
      return;
    }

    setImageUrl(editingItem!.image);
    setImageUploaded(true);
  }, [editingItem?.image]);

  useEffect(() => {
    if (isEditOpen) {
      setImageUploaded(true);
    }
  }, [isEditOpen]);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Menu Items</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 grid justify-items-center">
                {imageUrl != "" && (
                  <Image
                    src={imageUrl}
                    alt="upload-image"
                    height={300}
                    width={300}
                  />
                )}

                <div className="flex items-center gap-2 w-full">
                  {imageUrl == "" && (
                    <Input
                      className="w-full flex-1"
                      required
                      placeholder="Image URL"
                      value={newItem.image}
                      onChange={(e) =>
                        setNewItem({ ...newItem, image: e.target.value })
                      }
                    />
                  )}

                  <label
                    onClick={imageUrl != "" ? handleImageRemove : () => {}}
                    htmlFor={imageUrl == "" ? "imageUpload" : ""}
                    className={`cursor-pointer text-center transition-all text-white font-medium px-3 py-2 rounded-lg text-sm ${
                      imageUrl != ""
                        ? "bg-red-600 hover:bg-red-500 w-full"
                        : " bg-black hover:bg-black/50 "
                    }`}
                  >
                    {imageUrl == ""
                      ? "Upload Image"
                      : isImageUploaded
                      ? "Change Image"
                      : "Uploading...."}
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
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
              />
              <Input
                required
                type="number"
                placeholder="Price in ₹"
                value={newItem.price}
                onChange={(e) =>
                  setNewItem({ ...newItem, price: e.target.value })
                }
              />
              <Textarea
                placeholder="Product Description"
                value={newItem.description}
                onChange={(e) =>
                  setNewItem({ ...newItem, description: e.target.value })
                }
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
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2 grid justify-items-center">
                {editingItem.image != "" && (
                  <Image
                    src={editingItem.image}
                    alt="upload-image"
                    height={300}
                    width={300}
                  />
                )}

                <div className="flex items-center gap-2 w-full">
                  {editingItem.image == "" && (
                    <Input
                      className="w-full flex-1"
                      required
                      placeholder="Image URL"
                      value={editingItem.image}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          image: e.target.value,
                        })
                      }
                    />
                  )}

                  <label
                    onClick={
                      editingItem.image != "" ? handleImageRemove : () => {}
                    }
                    htmlFor={editingItem.image == "" ? "imageEdit" : ""}
                    className={`cursor-pointer text-center transition-all text-white font-medium px-3 py-2 rounded-lg text-sm ${
                      editingItem.image != ""
                        ? "bg-red-600 hover:bg-red-500 w-full"
                        : " bg-black hover:bg-black/50 "
                    }`}
                  >
                    {editingItem.image == ""
                      ? "Upload Image"
                      : isImageUploaded
                      ? "Change Image"
                      : "Uploading...."}
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
                onChange={(e) =>
                  setEditingItem({ ...editingItem, name: e.target.value })
                }
              />
              <Input
                required
                type="number"
                placeholder="Price in ₹"
                value={editingItem.price}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, price: e.target.value })
                }
              />
              <Textarea
                placeholder="Product Description"
                value={editingItem.description}
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    description: e.target.value,
                  })
                }
              />
              <Button
                disabled={!editingItem.image || !isImageUploaded}
                type="submit"
                className="w-full"
              >
                Save Changes
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id}>
            <Image
              src={item.image}
              alt={item.name}
              width={300}
              height={300}
              className="w-full h-48 object-cover"
            />
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₹{item.price.toFixed(2)}</p>
              {item.description && (
                <p className="text-gray-600 mt-2">{item.description}</p>
              )}
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() =>
                  openEditModal({
                    ...item,
                    description: item.description || "",
                  })
                }
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  // Check if there are any active offers associated with the menu item
                  const isOfferActive = offers.some(
                    (offer) => offer.menuItemId === item.id
                  );

                  if (isOfferActive) {
                    alert(
                      `Cannot delete the menu item "${item.name}" because it has an active offer. Please delete the offer first.`
                    );
                    return;
                  }

                  setEditingItem(null);

                  // If no active offers, proceed with item deletion
                  deleteItem(item.id);
                  await deleteFileFromS3(item.image);
                }}
              >
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
