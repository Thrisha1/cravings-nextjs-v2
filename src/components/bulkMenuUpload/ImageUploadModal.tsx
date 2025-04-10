"use client";

import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadFileToS3 } from "@/app/actions/aws-s3";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useMenuStore } from "@/store/menuStore";

interface ImageUploadModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  category: string;
  addNewImage: (url: string) => void;
}

export function ImageUploadModal({
  isOpen,
  onOpenChange,
  itemName, 
  category,
  addNewImage,
}: ImageUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const { clearDishCache } = useMenuStore();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      setUploading(true);
      try {
        const sanitizedCategory = category.replace(/\s/g, "_").replace(/&/g, "_");
        const sanitizedItemName = itemName.replace(/\s/g, "_") + "_" + Date.now();
        const fileName = `dishes/${sanitizedCategory}/${sanitizedItemName}.jpg`;

        // Convert File to URL and then to blob
        const objectUrl = URL.createObjectURL(file);
        console.log("Uploading image URL:", objectUrl);
        
        const response = await fetch(objectUrl);
        const blob = await response.blob();
        URL.revokeObjectURL(objectUrl); // Clean up the URL

        // Convert blob to URL for upload
        const imgUrl = await uploadFileToS3(objectUrl, fileName);

        console.log("Uploaded image URL:", imgUrl); // Log the image ur

        if (!imgUrl) {
          throw new Error("Failed to upload image to S3");
        }

        const dishesRef = collection(db, "dishes");
        await addDoc(dishesRef, {
          name: itemName,
          category: category,
          url: imgUrl,
          createdAt: new Date(),
        });

        clearDishCache();
        addNewImage(imgUrl);
        toast.success("Image uploaded successfully!");
        onOpenChange(false);
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error("Failed to upload image. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [category, itemName, addNewImage, onOpenChange, clearDishCache]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    multiple: false,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
        </DialogHeader>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          {isDragActive ? (
            <p>Drop the image here...</p>
          ) : (
            <p>Drag & drop an image here, or click to select</p>
          )}
        </div>
        {uploading && <p className="text-center mt-4">Uploading...</p>}
      </DialogContent>
    </Dialog>
  );
}