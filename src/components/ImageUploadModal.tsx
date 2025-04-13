import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { uploadFileToS3 } from "@/app/actions/aws-s3";
import { Input } from "./ui/input";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "./ui/button";
import { useAuthStore } from "@/store/authStore";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ImageUploadModal = ({
  isOpen,
  onOpenChange,
  addNewImage,
  category,
  itemName,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  addNewImage: (url: string) => void;
  category: string;
  itemName: string;
}) => {
  const [image, setImage] = useState("");
  const { userData } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0];

    if (!file) {
      toast.error("Please select a file");
      return;
    }

    //check if file is an image
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    //convert to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64String = reader.result as string;

      setImage(base64String);
    };
  };

  const handleUploadImage = async () => {
    toast.loading("Uploading image...");
    setLoading(true);

    try {
      if (!image) {
        toast.dismiss();
        toast.error("Please select an image");
        return;
      }

      // Load original base64 image into <img>
      const img = document.createElement("img");
      img.src = image;
      await new Promise((resolve) => (img.onload = resolve));

      // Draw to canvas and convert to WebP
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");

      ctx.drawImage(img, 0, 0);

      const webpBase64WithPrefix: string = await new Promise(
        (resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error("Canvas toBlob failed"));

              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            },
            "image/webp",
            0.8
          );
        }
      );

      const fileName = `${
        user?.uid
      }/${category}/${itemName}-${Date.now()}.webp`;
      console.log(fileName);

      const url = await uploadFileToS3(webpBase64WithPrefix, fileName);
      await addDoc(collection(db, "dishes"), {
        name: itemName,
        category: category,
        url: url,
        createdAt: new Date(),
        addedBy: user?.uid,
        imageSource: "user-upload",
      });
      console.log("Uploaded to:", url);
      addNewImage(url); // uncomment if needed

      toast.dismiss();
      toast.success("Image uploaded successfully!");
      setImage("");
      onOpenChange(false);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.dismiss();
      toast.error("Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {image && (
            <Image
              src={image}
              width={200}
              height={200}
              alt="Preview"
              className="w-full h-auto object-cover"
            />
          )}

          <Input type="file" accept="image/*" onChange={handleFileUpload} />
        </div>

        <Button disabled={loading} onClick={handleUploadImage}>
          {loading ? "Uploading...." : "Upload"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploadModal;
